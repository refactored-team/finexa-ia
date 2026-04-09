"""
Pipeline service — full async orchestration.

Flow: parse → classify → [analyze ‖ resilience] → guardrails → cash flow.

Steps B (behavioral analysis) and C (resilience score + LLM explanation)
run in parallel via asyncio.gather to minimize end-to-end latency.
"""

from __future__ import annotations

import asyncio
import time

from pydantic import ValidationError

from pipeline.core.logger import get_logger
from pipeline.domain.analyzer import analyze_behavior
from pipeline.domain.classifier import classify_batch
from pipeline.domain.forecaster import run_cash_flow_analysis
from pipeline.domain.guardrails import (
    build_fact_pool,
    sanitize_analysis,
    sanitize_explanation,
)
from pipeline.domain.models import (
    BehavioralAnalysisResult,
    CashFlowResult,
    EnrichedTransaction,
    PlaidTransaction,
    ResilienceScore,
    UserProfile,
)
from pipeline.domain.resilience import (
    compute_resilience_score,
    generate_resilience_explanation,
)

logger = get_logger(__name__)


async def run_pipeline(
    raw_transactions: list[dict],
    run_analysis: bool = True,
    user_profile: UserProfile | None = None,
    saldo_actual: float | None = None,
    liquidez_threshold: float | None = None,
) -> dict:
    """
    Complete pipeline: parse → classify → [analyze ‖ resilience] → guardrails → cash flow.

    Args:
        raw_transactions:   Plaid transaction dicts from the API.
        run_analysis:       Whether to execute Step B (behavioral analysis).
        user_profile:       User profile for RF2. When provided, computes the
                            resilience score + LLM explanation.
        saldo_actual:       Current balance for liquidity projection (RF3).
        liquidez_threshold: Liquidity alert threshold (auto when None).

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

    # ── Parse Plaid transactions with Pydantic ───────────────
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
            "resilience": None,
            "cash_flow": None,
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

    # ── Step A: Classification (async — parallel batches) ───
    classified: list[EnrichedTransaction] = await classify_batch(transactions)

    # ── Steps B + C: concurrent via asyncio.gather ──────────
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

    # ── Guardrails: verify LLM numbers against source data ──
    if classified:
        fact_pool = build_fact_pool(classified, score=resilience)
        if analysis:
            analysis = sanitize_analysis(analysis, fact_pool)
        if resilience and resilience.explicacion_llm:
            resilience.explicacion_llm = sanitize_explanation(
                resilience.explicacion_llm, fact_pool, context="resilience_explanation"
            )

    # ── Step D: Cash flow + alerts (sync, no Bedrock) ───────
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
