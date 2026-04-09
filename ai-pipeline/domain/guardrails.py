"""
Anti-hallucination guardrails for LLM text outputs.

Verifica que todos los valores monetarios y porcentajes mencionados en texto
generado por un LLM existan (o sean derivables) de los datos de entrada.
Si el LLM inventa un número, lo marca con [~valor] y lo registra.

Aplica a:
  - BehavioralAnalysisResult.summary e insights
  - ResilienceScore.explicacion_llm (headline, resumen, cada sección)
  - WhatIfResult.analisis_diferencial
"""

from __future__ import annotations

import re
from typing import Optional

from pipeline.core.logger import get_logger
from pipeline.domain.models import (
    BehavioralAnalysisResult,
    EnrichedTransaction,
    FinexaCategory,
    ResilienceExplanation,
    ResilienceScore,
)

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────
# Regex patterns
# ─────────────────────────────────────────────────────────────

# Matches: $1,234.56  $1234  MXN 1,234  1,234 pesos  1,234.56 MXN
_MONEY_RE = re.compile(
    r"\$\s?[\d,]+(?:\.\d{1,2})?"          # $1,234.56
    r"|[\d,]+(?:\.\d{1,2})?\s?MXN"        # 1,234 MXN
    r"|MXN\s?[\d,]+(?:\.\d{1,2})?"        # MXN 1,234
    r"|[\d,]+(?:\.\d{1,2})?\s?pesos?",    # 1,234 pesos
    re.IGNORECASE,
)

# Matches: 23.5%  15 %
_PCT_RE = re.compile(r"\d+(?:\.\d{1,2})?\s?%")


def _to_float(raw: str) -> float:
    """Strip currency symbols and commas, convert to float."""
    cleaned = re.sub(r"[^\d.]", "", raw.replace(",", ""))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


# ─────────────────────────────────────────────────────────────
# Fact-pool builder
# ─────────────────────────────────────────────────────────────

def build_fact_pool(
    transactions: list[EnrichedTransaction],
    score: Optional[ResilienceScore] = None,
) -> set[float]:
    """
    Construye el conjunto de valores numéricos 'verdaderos' a partir de los datos fuente.

    Incluye:
      - Montos individuales de transacciones
      - Totales y promedios por categoría
      - Porcentajes de cada categoría vs total
      - La mitad de cada total (LLMs sugieren frecuentemente 'ahorra la mitad')
      - Balance neto (ingreso - gasto) y su porcentaje sobre el ingreso
      - Ingreso total del periodo
      - Valores del score de resiliencia si están disponibles
    """
    pool: set[float] = set()

    category_totals: dict[str, float] = {}
    total_expense = 0.0
    total_income = 0.0

    for tx in transactions:
        amt = abs(tx.amount)
        if amt > 0:
            pool.add(round(amt, 2))
        if tx.amount < 0 and tx.category == FinexaCategory.INGRESO:
            total_income += abs(tx.amount)
        elif tx.amount > 0 and tx.category not in (FinexaCategory.INGRESO, FinexaCategory.TRANSFERENCIA):
            total_expense += tx.amount
            cat = tx.category.value
            category_totals[cat] = category_totals.get(cat, 0.0) + tx.amount

    if total_expense > 0:
        pool.add(round(total_expense, 2))
        pool.add(round(total_expense * 0.5, 2))

    if total_income > 0:
        pool.add(round(total_income, 2))
        # Balance neto y su % sobre el ingreso
        net = total_income - total_expense
        if net > 0:
            pool.add(round(net, 2))
            pool.add(round(net / total_income * 100, 1))
        # % de gasto sobre ingreso
        if total_expense > 0:
            pool.add(round(total_expense / total_income * 100, 1))

    for cat_total in category_totals.values():
        pool.add(round(cat_total, 2))
        pool.add(round(cat_total * 0.5, 2))
        if total_expense > 0:
            pool.add(round(cat_total / total_expense * 100, 1))
        if total_income > 0:
            pool.add(round(cat_total / total_income * 100, 1))

    if score:
        pool.add(round(score.score_total, 1))
        for f in score.factores:
            pool.add(round(f.score_raw, 1))
            pool.add(round(f.score_ponderado, 1))
        if score.raw_features:
            for v in score.raw_features.values():
                pool.add(round(v, 1))

    pool.discard(0.0)
    return pool


# ─────────────────────────────────────────────────────────────
# Verification helpers
# ─────────────────────────────────────────────────────────────

def _is_verified(value: float, pool: set[float], tolerance: float = 0.02) -> bool:
    """True if value is within tolerance of any value in the fact pool."""
    if value <= 0:
        return True
    for known in pool:
        if known <= 0:
            continue
        relative_diff = abs(value - known) / max(abs(known), abs(value))
        if relative_diff <= tolerance:
            return True
    return False


def verify_text(
    text: str,
    fact_pool: set[float],
    tolerance: float = 0.02,
) -> tuple[str, list[float]]:
    """
    Escanea texto LLM en busca de valores monetarios y porcentajes.
    Los valores no verificables se marcan con [~X] en el texto sanitizado.

    Returns:
        (texto_sanitizado, lista_de_valores_no_verificados)
    """
    unverified: list[float] = []

    def _check_and_replace(m: re.Match) -> str:
        raw = m.group(0)
        val = _to_float(raw)
        if val > 0 and not _is_verified(val, fact_pool, tolerance):
            unverified.append(round(val, 2))
            return f"[~{raw.strip()}]"
        return raw

    sanitized = _MONEY_RE.sub(_check_and_replace, text)
    sanitized = _PCT_RE.sub(_check_and_replace, sanitized)

    return sanitized, unverified


# ─────────────────────────────────────────────────────────────
# High-level sanitizers
# ─────────────────────────────────────────────────────────────

def sanitize_analysis(
    result: BehavioralAnalysisResult,
    fact_pool: set[float],
) -> BehavioralAnalysisResult:
    """Aplica guardrails al resultado del análisis de comportamiento."""
    all_unverified: list[float] = []

    clean_summary, uv_summary = verify_text(result.summary, fact_pool)
    all_unverified.extend(uv_summary)

    clean_insights = []
    for insight in result.insights:
        clean_desc, uv_desc = verify_text(insight.description, fact_pool)
        all_unverified.extend(uv_desc)

        clean_steps: Optional[list[str]] = None
        if insight.action_steps:
            clean_steps = []
            for step in insight.action_steps:
                clean_step, uv_step = verify_text(step, fact_pool)
                all_unverified.extend(uv_step)
                clean_steps.append(clean_step)

        if insight.potential_monthly_saving > 0 and not _is_verified(
            insight.potential_monthly_saving, fact_pool
        ):
            logger.warning(
                "guardrail_saving_unverified",
                extra={
                    "field": "potential_monthly_saving",
                    "value": insight.potential_monthly_saving,
                    "title": insight.title,
                    "step": "guardrails",
                },
            )

        update_fields: dict = {"description": clean_desc}
        if clean_steps is not None:
            update_fields["action_steps"] = clean_steps
        clean_insights.append(insight.model_copy(update=update_fields))

    if all_unverified:
        logger.warning(
            "guardrail_hallucinations_detected",
            extra={
                "context": "behavioral_analysis",
                "count": len(all_unverified),
                "values": all_unverified[:10],
                "step": "guardrails",
            },
        )
    else:
        logger.info(
            "guardrail_all_values_verified",
            extra={"context": "behavioral_analysis", "step": "guardrails"},
        )

    return result.model_copy(update={
        "summary": clean_summary,
        "insights": clean_insights,
    })


def sanitize_explanation(
    text: str,
    fact_pool: set[float],
    context: str = "explanation",
) -> str:
    """Aplica guardrails a una explicación en texto libre (what-if)."""
    clean, unverified = verify_text(text, fact_pool)

    if unverified:
        logger.warning(
            "guardrail_hallucinations_detected",
            extra={
                "context": context,
                "count": len(unverified),
                "values": unverified[:5],
                "step": "guardrails",
            },
        )
    else:
        logger.info(
            "guardrail_all_values_verified",
            extra={"context": context, "step": "guardrails"},
        )

    return clean


def sanitize_resilience_explanation(
    explanation: ResilienceExplanation,
    fact_pool: set[float],
) -> ResilienceExplanation:
    """Aplica guardrails a la explicación estructurada del Score de Resiliencia."""
    all_unverified: list[float] = []

    clean_headline, uv = verify_text(explanation.headline, fact_pool)
    all_unverified.extend(uv)

    clean_resumen, uv = verify_text(explanation.resumen, fact_pool)
    all_unverified.extend(uv)

    clean_secciones = []
    for seccion in explanation.secciones:
        clean_titulo, uv_t = verify_text(seccion.titulo, fact_pool)
        clean_diag, uv_d = verify_text(seccion.diagnostico, fact_pool)
        clean_accion, uv_a = verify_text(seccion.accion, fact_pool)
        all_unverified.extend(uv_t + uv_d + uv_a)
        clean_secciones.append(seccion.model_copy(update={
            "titulo": clean_titulo,
            "diagnostico": clean_diag,
            "accion": clean_accion,
        }))

    if all_unverified:
        logger.warning(
            "guardrail_hallucinations_detected",
            extra={
                "context": "resilience_explanation",
                "count": len(all_unverified),
                "values": all_unverified[:10],
                "step": "guardrails",
            },
        )
    else:
        logger.info(
            "guardrail_all_values_verified",
            extra={"context": "resilience_explanation", "step": "guardrails"},
        )

    return explanation.model_copy(update={
        "headline": clean_headline,
        "resumen": clean_resumen,
        "secciones": clean_secciones,
    })
