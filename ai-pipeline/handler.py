"""
Lambda handler & pipeline orchestrator.

Soporta dos modos de invocación:
  1. AWS Lambda (SQS trigger con batches de transacciones Plaid)
  2. Llamada directa desde ECS / testing local

El pipeline es completamente async:
  - classify_batch: batches de Bedrock en paralelo
  - run_pipeline:   Step B (analyze) y Step C (resilience) en paralelo
  - lambda_handler: registros SQS en paralelo
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any

from pydantic import ValidationError

from pipeline.analyzer import analyze_behavior
from pipeline.cache import InMemoryCache, default_cache
from pipeline.classifier import classify_batch
from pipeline.forecaster import run_cash_flow_analysis
from pipeline.guardrails import build_fact_pool, sanitize_analysis, sanitize_explanation
from pipeline.logger import get_logger
from pipeline.resilience import compute_resilience_score, generate_resilience_explanation
from pipeline.schemas import (
    BehavioralAnalysisResult,
    CashFlowResult,
    EnrichedTransaction,
    PlaidTransaction,
    ResilienceScore,
    UserProfile,
)

logger = get_logger(__name__)


# ─────────────────────────────────────────────────────────────
# Core pipeline  (async)
# ─────────────────────────────────────────────────────────────

async def run_pipeline(
    raw_transactions: list[dict],
    run_analysis: bool = True,
    user_profile: UserProfile | None = None,
    saldo_actual: float | None = None,
    liquidez_threshold: float | None = None,
) -> dict:
    """
    Pipeline completo: parse → classify → [analyze ‖ resilience] → guardrails → cash flow.

    Step B (behavioral analysis) y Step C (resilience score + LLM explanation) se ejecutan
    en paralelo con asyncio.gather(), reduciendo la latencia total cuando ambos están activos.

    Args:
        raw_transactions:   Lista de dicts de transacciones Plaid (raw de la API)
        run_analysis:       Si ejecutar el Step B (análisis de comportamiento)
        user_profile:       Perfil del usuario para RF2. Si se provee, calcula
                            score de resiliencia + explicación LLM.
        saldo_actual:       Saldo actual para proyección de liquidez (RF3).
        liquidez_threshold: Umbral de alerta de liquidez (auto si None).

    Returns:
        {
            "classified":   [EnrichedTransaction, ...],
            "analysis":     BehavioralAnalysisResult | None,
            "resilience":   ResilienceScore | None,
            "cash_flow":    CashFlowResult | None,
            "stats":        {...}
        }
    """
    t0 = time.monotonic()

    # ── Parse transacciones Plaid con Pydantic ───────────────
    transactions: list[PlaidTransaction] = []
    parse_errors: list[dict] = []

    for i, raw in enumerate(raw_transactions):
        try:
            tx = PlaidTransaction.model_validate(raw)
            if not tx.transaction_id:
                tx.transaction_id = raw.get("transaction_id", f"tx_{i:04d}")
            transactions.append(tx)
        except ValidationError as exc:
            parse_errors.append({
                "index": i,
                "name": raw.get("name", "unknown"),
                "errors": exc.error_count(),
            })
            logger.warning(
                "plaid_parse_error",
                extra={"error": str(exc), "tx_index": i},
            )

    if not transactions:
        return {
            "classified": [],
            "analysis": None,
            "stats": {"parse_errors": len(parse_errors), "total": len(raw_transactions)},
        }

    logger.info(
        "pipeline_start",
        extra={
            "tx_count": len(transactions),
            "parse_errors": len(parse_errors),
            "step": "pipeline",
        },
    )

    # ── Step A: Clasificación (async — batches en paralelo) ──
    classified: list[EnrichedTransaction] = await classify_batch(transactions)

    # ── Steps B + C: en paralelo con asyncio.gather() ────────
    #
    # B: analyze_behavior  → una llamada Bedrock (Tool Use)
    # C: compute_resilience_score (CPU) + generate_resilience_explanation (Bedrock)
    #
    # Ambas ramas son independientes entre sí → corren concurrentemente.
    # El tiempo total es max(latencia_B, latencia_C) en vez de la suma.

    async def _run_analysis_branch() -> BehavioralAnalysisResult | None:
        if run_analysis and classified:
            return await analyze_behavior(classified)
        return None

    async def _run_resilience_branch() -> ResilienceScore | None:
        if user_profile and classified:
            score = compute_resilience_score(classified, user_profile)
            score.explicacion_llm = await generate_resilience_explanation(score, user_profile)
            return score
        return None

    analysis, resilience = await asyncio.gather(
        _run_analysis_branch(),
        _run_resilience_branch(),
    )

    # ── Guardrails: verifica números LLM contra datos fuente ─
    if classified:
        fact_pool = build_fact_pool(classified, score=resilience)
        if analysis:
            analysis = sanitize_analysis(analysis, fact_pool)
        if resilience and resilience.explicacion_llm:
            resilience.explicacion_llm = sanitize_explanation(
                resilience.explicacion_llm, fact_pool, context="resilience_explanation"
            )

    # ── Step D: Cash Flow Forecast + Alertas (síncrono, no usa Bedrock) ──
    cash_flow: CashFlowResult | None = None
    if saldo_actual is not None and classified:
        ingresos = user_profile.ingresos_mensuales if user_profile else None
        cash_flow = run_cash_flow_analysis(
            classified,
            saldo_actual=saldo_actual,
            threshold=liquidez_threshold,
            ingresos_mensuales=ingresos,
        )

    elapsed_ms = int((time.monotonic() - t0) * 1000)

    stats = {
        "total_transactions": len(raw_transactions),
        "parsed": len(transactions),
        "parse_errors": len(parse_errors),
        "classified": len(classified),
        "from_cache": sum(1 for c in classified if c.source == "cache"),
        "from_heuristic": sum(1 for c in classified if c.source == "heuristic"),
        "from_bedrock": sum(1 for c in classified if c.source == "bedrock"),
        "from_fallback": sum(1 for c in classified if c.source == "fallback"),
        "ant_expenses_detected": sum(1 for c in classified if c.is_ant_expense),
        "elapsed_ms": elapsed_ms,
    }

    logger.info("pipeline_complete", extra={**stats, "step": "pipeline"})

    return {
        "classified": classified,
        "analysis": analysis,
        "resilience": resilience,
        "cash_flow": cash_flow,
        "stats": stats,
    }


# ─────────────────────────────────────────────────────────────
# Lambda handler (SQS trigger)
# ─────────────────────────────────────────────────────────────

async def _process_sqs_record(record: dict) -> dict | None:
    """
    Procesa un registro SQS individual.
    Retorna None en éxito; el messageId si falla (para batchItemFailures).
    """
    message_id = record.get("messageId", "unknown")

    try:
        body = json.loads(record["body"])
        user_id = body.get("user_id", "anonymous")
        raw_transactions = body.get("transactions", [])

        profile: UserProfile | None = None
        if raw_profile := body.get("user_profile"):
            try:
                profile = UserProfile.model_validate(raw_profile)
            except Exception as exc:
                logger.warning(
                    "lambda_user_profile_invalid",
                    extra={"error": str(exc), "user_id": user_id, "step": "lambda"},
                )

        saldo: float | None = body.get("saldo_actual")

        logger.info(
            "lambda_processing_message",
            extra={
                "user_id": user_id,
                "tx_count": len(raw_transactions),
                "has_profile": profile is not None,
                "has_saldo": saldo is not None,
                "step": "lambda",
            },
        )

        result = await run_pipeline(
            raw_transactions,
            run_analysis=True,
            user_profile=profile,
            saldo_actual=saldo,
        )

        # ── Aquí persistir resultados ─────────────────────────
        # e.g., write to RDS/DynamoDB, push to SNS, etc.
        # await save_to_rds(user_id, result["classified"])
        # await publish_insights(user_id, result["analysis"])

        logger.info(
            "lambda_message_processed",
            extra={"user_id": user_id, **result["stats"], "step": "lambda"},
        )
        return None  # éxito

    except Exception as exc:
        logger.error(
            "lambda_message_failed",
            extra={"error": str(exc), "message_id": message_id, "step": "lambda"},
        )
        return message_id  # marcar para reintento SQS


async def _handle_event(event: dict) -> dict:
    """
    Procesa todos los registros SQS del evento en paralelo.
    asyncio.gather() permite que múltiples mensajes avancen concurrentemente.
    """
    records = event.get("Records", [])

    # Todos los registros se procesan en paralelo
    failed_ids = await asyncio.gather(*[
        _process_sqs_record(record) for record in records
    ])

    batch_item_failures = [
        {"itemIdentifier": msg_id}
        for msg_id in failed_ids
        if msg_id is not None
    ]

    return {"batchItemFailures": batch_item_failures}


def lambda_handler(event: dict, context: Any) -> dict:
    """
    AWS Lambda entry point. Espera mensajes SQS con forma:

    {
        "Records": [
            {
                "messageId": "...",
                "body": "{\"user_id\": \"usr_123\", \"transactions\": [<plaid tx>...]}"
            }
        ]
    }

    El runtime de Lambda (Python) es síncrono; asyncio.run() crea y ejecuta
    el event loop para todo el batch de registros.
    """
    return asyncio.run(_handle_event(event))


# ─────────────────────────────────────────────────────────────
# Local testing entry point
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            data = json.load(f)
        if "added" in data:
            raw_txs = data["added"]
        elif isinstance(data, list):
            raw_txs = data
        else:
            raw_txs = data.get("transactions", [])
    else:
        raw_txs = [
            {
                "transaction_id": "tx_demo_001",
                "amount": 107.00,
                "name": "Uber viaje CDMX",
                "merchant_name": "Uber",
                "date": "2026-03-28",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "TRANSPORTATION",
                    "detailed": "TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
                    "confidence_level": "VERY_HIGH",
                },
            },
            {
                "transaction_id": "tx_demo_002",
                "amount": 92.00,
                "name": "Starbucks Reforma",
                "merchant_name": "Starbucks",
                "date": "2026-03-27",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "FOOD_AND_DRINK",
                    "detailed": "FOOD_AND_DRINK_COFFEE",
                    "confidence_level": "VERY_HIGH",
                },
            },
            {
                "transaction_id": "tx_demo_003",
                "amount": 179.00,
                "name": "NETFLIX.COM",
                "merchant_name": "Netflix",
                "date": "2026-03-01",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "ENTERTAINMENT",
                    "detailed": "ENTERTAINMENT_TV_AND_MOVIES",
                    "confidence_level": "VERY_HIGH",
                },
            },
            {
                "transaction_id": "tx_demo_004",
                "amount": 4250.00,
                "name": "SPEI ENVIADO MARIA LOPEZ",
                "merchant_name": None,
                "date": "2026-03-15",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "TRANSFER_OUT",
                    "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER",
                    "confidence_level": "HIGH",
                },
            },
            {
                "transaction_id": "tx_demo_005",
                "amount": -35000.00,
                "name": "NOMINA ACME CORP SA DE CV",
                "merchant_name": None,
                "date": "2026-03-15",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "INCOME",
                    "detailed": "INCOME_WAGES",
                    "confidence_level": "VERY_HIGH",
                },
            },
            {
                "transaction_id": "tx_demo_006",
                "amount": 85.00,
                "name": "OXXO INSURGENTES 482",
                "merchant_name": "OXXO",
                "date": "2026-03-26",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "FOOD_AND_DRINK",
                    "detailed": "FOOD_AND_DRINK_CONVENIENCE_STORES",
                    "confidence_level": "VERY_HIGH",
                },
            },
            {
                "transaction_id": "tx_demo_007",
                "amount": 219.00,
                "name": "Spotify Mexico",
                "merchant_name": "Spotify",
                "date": "2026-03-05",
                "iso_currency_code": "MXN",
                "personal_finance_category": {
                    "primary": "ENTERTAINMENT",
                    "detailed": "ENTERTAINMENT_MUSIC",
                    "confidence_level": "VERY_HIGH",
                },
            },
        ]

    sample_profile = UserProfile(
        edad=30,
        ocupacion="Ingeniero de software",
        ingresos_mensuales=35_000.0,
        metas=["fondo de emergencia", "viaje a Europa"],
        dependientes=0,
    )

    print("=" * 70)
    print("FINEXA AI — Pipeline de Clasificación + Score de Resiliencia")
    print("=" * 70)

    # asyncio.run() crea y gestiona el event loop para el testing local
    result = asyncio.run(run_pipeline(
        raw_txs,
        run_analysis=True,
        user_profile=sample_profile,
        saldo_actual=12_000.0,
    ))

    print(f"\n{'─' * 70}")
    print("CLASIFICACIONES:")
    print(f"{'─' * 70}")
    for tx in result["classified"]:
        ant = " [HORMIGA]" if tx.is_ant_expense else ""
        print(
            f"  [{tx.source:9s}] {(tx.merchant_name or tx.name)[:30]:30s} "
            f"${tx.amount:>10.2f}  → {tx.category.value:15s} "
            f"({tx.confidence:.0%}){ant}"
        )

    if result["analysis"]:
        a = result["analysis"]
        print(f"\n{'─' * 70}")
        print("ANÁLISIS DE COMPORTAMIENTO:")
        print(f"{'─' * 70}")
        print(f"  Gastos hormiga: ${a.ant_expense_total:.2f} ({a.ant_expense_percentage:.1f}%)")
        print(f"  Nivel de riesgo: {a.risk_level}")
        print(f"  Resumen: {a.summary}")
        for i, insight in enumerate(a.insights, 1):
            print(f"\n  {i}. [{insight.priority.upper()}] {insight.title}")
            print(f"     {insight.description}")
            if insight.potential_monthly_saving > 0:
                print(f"     Ahorro potencial: ${insight.potential_monthly_saving:.2f}/mes")

    if result.get("resilience"):
        r = result["resilience"]
        print(f"\n{'─' * 70}")
        print("SCORE DE RESILIENCIA FINANCIERA:")
        print(f"{'─' * 70}")
        print(f"  Score total: {r.score_total:.1f}/100  →  {r.nivel.upper()}")
        print(f"\n  Factores:")
        for f in r.factores:
            bar_filled = int(f.score_raw / 10)
            bar = "█" * bar_filled + "░" * (10 - bar_filled)
            print(
                f"    {f.nombre:25s}  [{bar}] {f.score_raw:5.1f}  "
                f"(×{f.peso:.2f} = {f.score_ponderado:.1f} pts)"
            )
        if r.explicacion_llm:
            print(f"\n  Explicación:")
            for line in r.explicacion_llm.splitlines():
                print(f"    {line}")

    if result.get("cash_flow"):
        cf = result["cash_flow"]
        print(f"\n{'─' * 70}")
        print("CASH FLOW FORECAST (RF3 + RF7):")
        print(f"{'─' * 70}")
        print(f"  Liquidez proyectada ({cf.forecast_horizon_days}d): ${cf.projected_liquidity:.2f}")

        if cf.recurring_expenses:
            print(f"\n  Gastos recurrentes detectados ({len(cf.recurring_expenses)}):")
            for r in cf.recurring_expenses:
                pending_flag = " [PENDIENTE]" if r.is_pending else ""
                print(
                    f"    {r.merchant[:28]:28s}  ${r.avg_amount:>8.2f}  "
                    f"{r.periodicity_label:10s}  próximo: {r.next_expected_date}{pending_flag}"
                )

        if cf.liquidity_alert:
            la = cf.liquidity_alert
            print(f"\n  ALERTA LIQUIDEZ [{la.alert_type.upper()}]")
            print(f"    {la.message}")

        if cf.impulse_alerts:
            print(f"\n  Alertas de impulso ({len(cf.impulse_alerts)}):")
            for ia in cf.impulse_alerts:
                print(f"    {ia.message}")

    print(f"\n{'─' * 70}")
    print("STATS:")
    print(f"{'─' * 70}")
    for k, v in result["stats"].items():
        print(f"  {k}: {v}")
