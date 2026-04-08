"""
Anti-hallucination guardrails for LLM text outputs.

Verifica que todos los valores monetarios y porcentajes mencionados en texto
generado por un LLM existan (o sean derivables) de los datos de entrada.
Si el LLM inventa un número, lo marca con [~valor] y lo registra.

Aplica a:
  - BehavioralAnalysisResult.summary e insights
  - ResilienceScore.explicacion_llm
  - WhatIfResult.analisis_diferencial
"""

from __future__ import annotations

import re
from typing import Optional

from pipeline.logger import get_logger
from pipeline.schemas import BehavioralAnalysisResult, EnrichedTransaction, FinexaCategory, ResilienceScore

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
      - Valores del score de resiliencia si están disponibles
    """
    pool: set[float] = set()

    # Per-transaction amounts
    category_totals: dict[str, float] = {}
    total_expense = 0.0

    for tx in transactions:
        amt = abs(tx.amount)
        if amt > 0:
            pool.add(round(amt, 2))
        if tx.amount > 0 and tx.category not in (FinexaCategory.INGRESO, FinexaCategory.TRANSFERENCIA):
            total_expense += tx.amount
            cat = tx.category.value
            category_totals[cat] = category_totals.get(cat, 0.0) + tx.amount

    if total_expense > 0:
        pool.add(round(total_expense, 2))
        pool.add(round(total_expense * 0.5, 2))  # "save half"

    # Category totals, percentages, and half-values
    for cat_total in category_totals.values():
        pool.add(round(cat_total, 2))
        pool.add(round(cat_total * 0.5, 2))
        if total_expense > 0:
            pool.add(round(cat_total / total_expense * 100, 1))

    # Resilience score values
    if score:
        pool.add(round(score.score_total, 1))
        for f in score.factores:
            pool.add(round(f.score_raw, 1))
            pool.add(round(f.score_ponderado, 1))

    # Remove zero (always "valid") to keep pool clean
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

    Args:
        text:       Texto generado por el LLM.
        fact_pool:  Conjunto de valores numéricos verdaderos del fuente.
        tolerance:  Tolerancia relativa para coincidir valores (default 2%).

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

    # Scan monetary values first, then percentages
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
    """
    Aplica guardrails al resultado del análisis de comportamiento.
    Marca valores no verificados en summary e insights.descriptions.
    Registra cualquier anomalía en el logger.

    Returns:
        Copia del resultado con texto sanitizado.
    """
    all_unverified: list[float] = []

    # Sanitize summary
    clean_summary, uv_summary = verify_text(result.summary, fact_pool)
    all_unverified.extend(uv_summary)

    # Sanitize each insight description
    clean_insights = []
    for insight in result.insights:
        clean_desc, uv_desc = verify_text(insight.description, fact_pool)
        all_unverified.extend(uv_desc)

        # Cross-check potential_monthly_saving (structured field)
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

        clean_insights.append(insight.model_copy(update={"description": clean_desc}))

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
    """
    Aplica guardrails a una explicación en texto libre (resiliencia, what-if).
    Devuelve el texto sanitizado.
    """
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
