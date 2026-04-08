"""
RF2 — Score de Resiliencia Financiera (El Escudo).

Fórmula de 5 factores:
  1. Ratio ahorro/ingreso      30%  — ¿Cuánto ahorra del ingreso?
  2. Control de gastos fijos   25%  — ¿Los fijos consumen demasiado?
  3. Frecuencia hormiga         20%  — ¿Cuánto se pierde en gastos pequeños?
  4. Variabilidad de ingresos  15%  — ¿Qué tan estable es el ingreso?
  5. Runway financiero          10%  — ¿Cuántos meses de gastos puede cubrir?

Score final: 0-100
  ≥ 75 → resiliente
  50-74 → estable
  25-49 → vulnerable
   < 25 → frágil
"""

from __future__ import annotations

import json
from typing import Optional

from pipeline.bedrock import invoke_resilience_explanation, MODEL_SONNET
from pipeline.logger import get_logger
from pipeline.prompts import RESILIENCE_SYSTEM_PROMPT
from pipeline.schemas import (
    EnrichedTransaction,
    FinexaCategory,
    ResilienceFactorDetail,
    ResilienceScore,
    UserProfile,
)

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────

_FIXED_CATEGORIES = {FinexaCategory.FIJO, FinexaCategory.SUSCRIPCION}

_FACTOR_WEIGHTS = {
    "ratio_ahorro_ingreso": 0.30,
    "control_fijos": 0.25,
    "frecuencia_hormiga": 0.20,
    "variabilidad_ingresos": 0.15,
    "runway": 0.10,
}

_NIVELES = [
    (75.0, "resiliente"),
    (50.0, "estable"),
    (25.0, "vulnerable"),
    (0.0,  "fragil"),
]


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _nivel(score: float) -> str:
    for threshold, label in _NIVELES:
        if score >= threshold:
            return label
    return "fragil"


# ─────────────────────────────────────────────────────────────
# Factor scorers (cada uno retorna score 0-100 y descripción)
# ─────────────────────────────────────────────────────────────

def _score_ratio_ahorro(
    total_income: float,
    total_expense: float,
    ingresos_mensuales: float,
) -> tuple[float, str]:
    """
    Mide qué porcentaje del ingreso se ahorra.
    Referencia: ≥20% = score 100, 0% = score 0, negativo = 0.
    """
    ingreso_ref = max(total_income, ingresos_mensuales, 1.0)
    ahorro = ingreso_ref - total_expense
    ratio = ahorro / ingreso_ref
    score = _clamp(ratio / 0.20 * 100)
    porcentaje = max(0.0, ratio * 100)
    desc = (
        f"Ahorro estimado: {porcentaje:.1f}% del ingreso "
        f"(${max(0, ahorro):.0f} de ${ingreso_ref:.0f}). "
        "Referencia ideal: >= 20%."
    )
    return score, desc


def _score_control_fijos(
    total_fijos: float,
    ingresos_mensuales: float,
    total_income: float,
) -> tuple[float, str]:
    """
    Mide si los gastos fijos (renta, suscripciones) consumen demasiado del ingreso.
    Referencia: ≤40% = muy bien, ≥70% = score 0.
    """
    ingreso_ref = max(total_income, ingresos_mensuales, 1.0)
    ratio = total_fijos / ingreso_ref
    score = _clamp((0.70 - ratio) / 0.70 * 100)
    desc = (
        f"Gastos fijos: {ratio * 100:.1f}% del ingreso (${total_fijos:.0f}). "
        "Referencia ideal: <= 40%."
    )
    return score, desc


def _score_frecuencia_hormiga(
    total_hormiga: float,
    total_expense: float,
) -> tuple[float, str]:
    """
    Mide qué parte del gasto total son gastos hormiga.
    Referencia: ≤5% = excelente, ≥30% = score 0.
    """
    if total_expense <= 0:
        return 100.0, "Sin gastos registrados en el periodo."
    ratio = total_hormiga / total_expense
    score = _clamp((0.30 - ratio) / 0.25 * 100)
    desc = (
        f"Gastos hormiga: {ratio * 100:.1f}% del gasto total (${total_hormiga:.0f}). "
        "Referencia ideal: <= 5%."
    )
    return score, desc


def _score_variabilidad_ingresos(
    total_income: float,
    ingresos_mensuales: float,
) -> tuple[float, str]:
    """
    Mide qué tan estable es el ingreso vs. lo declarado.
    Sin datos de ingreso observado, devuelve 50 (neutral).
    Referencia: ≤5% de variación = 100, ≥50% = 0.
    """
    if ingresos_mensuales <= 0 or total_income == 0:
        return 50.0, "Sin datos suficientes para medir variabilidad de ingreso."
    delta = abs(total_income - ingresos_mensuales) / ingresos_mensuales
    score = _clamp((0.50 - delta) / 0.45 * 100)
    desc = (
        f"Variación ingreso observado vs declarado: {delta * 100:.1f}% "
        f"(${total_income:.0f} observado vs ${ingresos_mensuales:.0f} declarado). "
        "Referencia ideal: <= 5%."
    )
    return score, desc


def _score_runway(
    total_income: float,
    total_expense: float,
    ingresos_mensuales: float,
) -> tuple[float, str]:
    """
    Mide cuantos meses de gastos puede cubrir con el ahorro mensual.
    Referencia: >= 3 meses = 100, 0 meses = 0.
    """
    ingreso_ref = max(total_income, ingresos_mensuales, 1.0)
    monthly_expense = max(total_expense, 0.01)
    ahorro_mensual = ingreso_ref - monthly_expense
    runway_months = ahorro_mensual / monthly_expense
    score = _clamp(runway_months / 3.0 * 100)
    runway_display = max(0.0, runway_months)
    desc = (
        f"Runway estimado: {runway_display:.1f} meses de gastos cubiertos por el ahorro. "
        "Referencia ideal: >= 3 meses."
    )
    return score, desc


# ─────────────────────────────────────────────────────────────
# Main scorer  (síncrono — solo matemáticas, sin Bedrock)
# ─────────────────────────────────────────────────────────────

def compute_resilience_score(
    transactions: list[EnrichedTransaction],
    profile: UserProfile,
) -> ResilienceScore:
    """
    Calcula el score de resiliencia financiera con la fórmula de 5 factores.

    Esta función es puramente matemática (sin llamadas a Bedrock).
    Para la explicación en lenguaje natural usa generate_resilience_explanation().

    Args:
        transactions: Lista de transacciones clasificadas del periodo.
        profile:      Perfil financiero declarado por el usuario.

    Returns:
        ResilienceScore con detalle de factores (sin explicación LLM).
    """
    total_income = sum(
        abs(tx.amount)
        for tx in transactions
        if tx.amount < 0 and tx.category == FinexaCategory.INGRESO
    )
    total_expense = sum(
        tx.amount
        for tx in transactions
        if tx.amount > 0 and tx.category != FinexaCategory.INGRESO
    )
    total_fijos = sum(
        tx.amount
        for tx in transactions
        if tx.amount > 0 and tx.category in _FIXED_CATEGORIES
    )
    total_hormiga = sum(
        tx.amount
        for tx in transactions
        if tx.is_ant_expense and tx.amount > 0
    )

    s1, d1 = _score_ratio_ahorro(total_income, total_expense, profile.ingresos_mensuales)
    s2, d2 = _score_control_fijos(total_fijos, profile.ingresos_mensuales, total_income)
    s3, d3 = _score_frecuencia_hormiga(total_hormiga, total_expense)
    s4, d4 = _score_variabilidad_ingresos(total_income, profile.ingresos_mensuales)
    s5, d5 = _score_runway(total_income, total_expense, profile.ingresos_mensuales)

    raw_factors = [
        ("ratio_ahorro_ingreso", 0.30, s1, d1),
        ("control_fijos",        0.25, s2, d2),
        ("frecuencia_hormiga",   0.20, s3, d3),
        ("variabilidad_ingresos",0.15, s4, d4),
        ("runway",               0.10, s5, d5),
    ]

    factores = [
        ResilienceFactorDetail(
            nombre=nombre,
            peso=peso,
            score_raw=round(score, 1),
            score_ponderado=round(score * peso, 1),
            descripcion=desc,
        )
        for nombre, peso, score, desc in raw_factors
    ]

    score_total = sum(f.score_raw * f.peso for f in factores)

    logger.info(
        "resilience_score_computed",
        extra={
            "score_total": round(score_total, 1),
            "nivel": _nivel(score_total),
            "step": "resilience",
        },
    )

    return ResilienceScore(
        score_total=round(score_total, 1),
        nivel=_nivel(score_total),
        factores=factores,
    )


# ─────────────────────────────────────────────────────────────
# LLM explainability  (async — llama a Bedrock)
# ─────────────────────────────────────────────────────────────

def _top_3_impacting_factors(score: ResilienceScore) -> list[ResilienceFactorDetail]:
    """
    Retorna los 3 factores con mayor impacto negativo (mayor pérdida de puntos).
    Impacto negativo = (100 - score_raw) * peso → puntos que se 'dejaron de ganar'.
    """
    sorted_factors = sorted(
        score.factores,
        key=lambda f: (100.0 - f.score_raw) * f.peso,
        reverse=True,
    )
    return sorted_factors[:3]


async def generate_resilience_explanation(
    score: ResilienceScore,
    profile: UserProfile,
    model_id: str = MODEL_SONNET,
) -> str:
    """
    Inyecta el UserProfile y el ResilienceScore en Bedrock para generar
    una explicación en lenguaje natural sobre los 3 factores más impactantes.

    Returns:
        Texto explicativo en español. Si Bedrock falla, retorna un fallback heurístico.
    """
    top_factors = _top_3_impacting_factors(score)

    context = {
        "perfil": {
            "edad": profile.edad,
            "ocupacion": profile.ocupacion,
            "ingresos_mensuales": profile.ingresos_mensuales,
            "metas": profile.metas,
            "dependientes": profile.dependientes,
        },
        "score_resiliencia": {
            "score_total": score.score_total,
            "nivel": score.nivel,
        },
        "factores_mas_impactantes": [
            {
                "nombre": f.nombre,
                "score_raw": f.score_raw,
                "peso": f.peso,
                "descripcion": f.descripcion,
            }
            for f in top_factors
        ],
    }

    user_prompt = (
        "Genera la explicación personalizada del Score de Resiliencia para este usuario:\n"
        f"{json.dumps(context, ensure_ascii=False, indent=2)}"
    )

    try:
        explanation = await invoke_resilience_explanation(
            system_prompt=RESILIENCE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            model_id=model_id,
        )
        logger.info(
            "resilience_explanation_generated",
            extra={"score": score.score_total, "nivel": score.nivel, "step": "resilience"},
        )
        return explanation

    except Exception as exc:
        logger.error(
            "resilience_explanation_failed_using_fallback",
            extra={"error": str(exc), "step": "resilience"},
        )
        return _fallback_explanation(score, profile, top_factors)


def _fallback_explanation(
    score: ResilienceScore,
    profile: UserProfile,
    top_factors: list[ResilienceFactorDetail],
) -> str:
    """Explicación heurística cuando Bedrock no está disponible."""
    lines = [
        f"Tu Score de Resiliencia es {score.score_total:.0f}/100 ({score.nivel}).",
        f"Hola, {profile.ocupacion}. Aquí están los 3 factores que más impactaron tu resultado:",
        "",
    ]
    for i, f in enumerate(top_factors, 1):
        lines.append(f"{i}. {f.nombre.replace('_', ' ').capitalize()}: {f.descripcion}")
    return "\n".join(lines)
