"""
Step B — Behavioral Analysis & Insight Generation.

Takes classified transactions and produces:
  - Ant expense aggregation
  - Risk assessment
  - Actionable financial insights (via Bedrock Tool Use)
"""

from __future__ import annotations

import json
from collections import defaultdict

from pipeline.bedrock import invoke_behavioral_analysis, MODEL_SONNET
from pipeline.logger import get_logger
from pipeline.prompts import ANALYSIS_SYSTEM_PROMPT
from pipeline.schemas import (
    BehavioralAnalysisResult,
    EnrichedTransaction,
    FinexaCategory,
    SpendingInsight,
)

logger = get_logger(__name__)


def _build_spending_summary(transactions: list[EnrichedTransaction]) -> dict:
    """Agrega transacciones en un resumen de gasto para el prompt de análisis."""
    by_category: dict[str, dict] = defaultdict(lambda: {
        "total": 0.0,
        "count": 0,
        "ant_expenses": 0.0,
        "ant_count": 0,
        "top_merchants": [],
    })

    total_income = 0.0
    total_expense = 0.0

    for tx in transactions:
        cat = tx.category.value
        bucket = by_category[cat]

        if tx.amount < 0:
            if tx.category == FinexaCategory.INGRESO:
                total_income += abs(tx.amount)
            else:
                total_expense -= abs(tx.amount)
        else:
            total_expense += tx.amount

        bucket["total"] += abs(tx.amount)
        bucket["count"] += 1

        if tx.is_ant_expense and tx.amount > 0:
            bucket["ant_expenses"] += tx.amount
            bucket["ant_count"] += 1

        merchant = tx.merchant_name or tx.name
        if merchant and len(bucket["top_merchants"]) < 5:
            bucket["top_merchants"].append(f"{merchant}: ${abs(tx.amount):.2f}")

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "categories": dict(by_category),
        "transaction_count": len(transactions),
    }


async def analyze_behavior(
    transactions: list[EnrichedTransaction],
    model_id: str = MODEL_SONNET,
) -> BehavioralAnalysisResult:
    """
    Step B — Análisis de comportamiento sobre transacciones clasificadas via Bedrock.

    Si Bedrock no está disponible, regresa al análisis basado en reglas.
    """
    summary = _build_spending_summary(transactions)

    prompt = (
        "Analyze this user's spending behavior and generate insights:\n"
        f"{json.dumps(summary, ensure_ascii=False, indent=2)}"
    )

    try:
        result = await invoke_behavioral_analysis(
            system_prompt=ANALYSIS_SYSTEM_PROMPT,
            user_prompt=prompt,
            model_id=model_id,
        )
        logger.info(
            "behavioral_analysis_complete",
            extra={"step": "analysis", "risk_level": result.risk_level},
        )
        return result

    except Exception as exc:
        logger.error(
            "behavioral_analysis_failed_using_fallback",
            extra={"error": str(exc), "step": "analysis"},
        )
        return _fallback_analysis(transactions, summary)


def _fallback_analysis(
    transactions: list[EnrichedTransaction],
    summary: dict,
) -> BehavioralAnalysisResult:
    """Análisis basado en reglas cuando Bedrock no está disponible."""
    ant_total = sum(
        abs(tx.amount) for tx in transactions if tx.is_ant_expense
    )
    total_expense = summary.get("total_expense", 1.0) or 1.0
    ant_pct = (ant_total / total_expense) * 100 if total_expense > 0 else 0.0

    if ant_pct > 20:
        risk = "alto"
    elif ant_pct > 10:
        risk = "medio"
    else:
        risk = "bajo"

    insights = []
    if ant_total > 0:
        insights.append(SpendingInsight(
            title="Gastos hormiga detectados",
            description=(
                f"Tienes ${ant_total:.2f} en gastos pequeños y frecuentes este periodo. "
                "Reducir la mitad te ahorraría significativamente al mes."
            ),
            priority="alta" if ant_pct > 15 else "media",
            potential_monthly_saving=ant_total * 0.5,
            affected_category=FinexaCategory.HORMIGA,
        ))

    subs = summary.get("categories", {}).get("suscripcion", {})
    if subs.get("count", 0) >= 3:
        insights.append(SpendingInsight(
            title="Múltiples suscripciones activas",
            description=(
                f"Tienes {subs['count']} suscripciones por ${subs['total']:.2f}. "
                "Revisa si realmente usas todas."
            ),
            priority="media",
            potential_monthly_saving=subs["total"] * 0.3,
            affected_category=FinexaCategory.SUSCRIPCION,
        ))

    if not insights:
        insights.append(SpendingInsight(
            title="Análisis limitado",
            description="No se pudo conectar con el servicio de IA. Revisa tu resumen manualmente.",
            priority="baja",
            potential_monthly_saving=0.0,
            affected_category=FinexaCategory.VARIABLE,
        ))

    return BehavioralAnalysisResult(
        ant_expense_total=ant_total,
        ant_expense_percentage=round(ant_pct, 1),
        risk_level=risk,
        insights=insights,
        summary=f"Análisis generado con reglas de respaldo. Gastos hormiga: ${ant_total:.2f} ({ant_pct:.1f}% del gasto total).",
    )
