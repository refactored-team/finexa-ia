"""
RF2 — Score de Resiliencia Financiera (El Escudo).

5 features → endpoint XGBoost en SageMaker:
  1. ratio_ahorro      — % del ingreso que se ahorra (mayor = mejor)
  2. control_fijos     — % del ingreso en gastos fijos (menor = mejor)
  3. frec_hormiga      — % del gasto total en gastos hormiga (menor = mejor)
  4. var_ingresos      — variabilidad del ingreso vs declarado en % (menor = mejor)
  5. runway            — meses de gastos cubiertos por el ahorro (0-12, mayor = mejor)

Score final: 0-100
  ≥ 75 → resiliente
  50-74 → estable
  25-49 → vulnerable
   < 25 → frágil
"""

from __future__ import annotations

import json

import boto3

from pipeline.core.config import settings
from pipeline.core.logger import get_logger
from pipeline.domain.models import (
    EnrichedTransaction,
    FinexaCategory,
    ResilienceFactorDetail,
    ResilienceScore,
    UserProfile,
)
from pipeline.infrastructure.bedrock import invoke_resilience_explanation
from pipeline.infrastructure.prompts import RESILIENCE_SYSTEM_PROMPT

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────

_FIXED_CATEGORIES = {FinexaCategory.FIJO, FinexaCategory.SUSCRIPCION}

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
# SageMaker — features crudas e inferencia
# ─────────────────────────────────────────────────────────────

def _compute_raw_features(
    total_income: float,
    total_expense: float,
    total_fijos: float,
    total_hormiga: float,
    ingresos_mensuales: float,
) -> dict[str, float]:
    """
    Calcula los 5 features en la misma escala que los datos de entrenamiento:
      - ratio_ahorro  : % del ingreso ahorrado (0-100)
      - control_fijos : % del ingreso en gastos fijos (0-100)
      - frec_hormiga  : % del gasto total en hormiga (0-100)
      - var_ingresos  : variabilidad ingreso vs declarado en % (0-100)
      - runway        : meses de gastos cubiertos por ahorro (0-12)
    """
    ingreso_ref = max(total_income, ingresos_mensuales, 1.0)

    ratio_ahorro = _clamp(max(0.0, (ingreso_ref - total_expense) / ingreso_ref * 100))
    control_fijos = _clamp(total_fijos / ingreso_ref * 100)
    frec_hormiga = _clamp(total_hormiga / max(total_expense, 0.01) * 100)
    var_ingresos = (
        10.0  # valor neutral cuando no hay datos de ingreso observado
        if ingresos_mensuales <= 0 or total_income == 0
        else _clamp(abs(total_income - ingresos_mensuales) / ingresos_mensuales * 100)
    )
    ahorro_mensual = ingreso_ref - total_expense
    runway = _clamp(ahorro_mensual / max(total_expense, 0.01), 0.0, 12.0)

    return {
        "ratio_ahorro": round(ratio_ahorro, 4),
        "control_fijos": round(control_fijos, 4),
        "frec_hormiga": round(frec_hormiga, 4),
        "var_ingresos": round(var_ingresos, 4),
        "runway": round(runway, 4),
    }


def _predict_score_sagemaker(features: dict[str, float]) -> float:
    """
    Llama al endpoint XGBoost en SageMaker con los 5 features y retorna el score (0-100).

    CSV de entrada: ratio_ahorro, control_fijos, frec_hormiga, var_ingresos, runway
    """
    csv_body = (
        f"{features['ratio_ahorro']},"
        f"{features['control_fijos']},"
        f"{features['frec_hormiga']},"
        f"{features['var_ingresos']},"
        f"{features['runway']}"
    )
    runtime = boto3.client("sagemaker-runtime", region_name=settings.sagemaker_region)
    response = runtime.invoke_endpoint(
        EndpointName=settings.sagemaker_resilience_endpoint,
        ContentType="text/csv",
        Body=csv_body,
    )
    score = float(response["Body"].read().decode("utf-8"))
    return _clamp(score)


# ─────────────────────────────────────────────────────────────
# Factor scorers
# ─────────────────────────────────────────────────────────────

def _score_ratio_ahorro(
    total_income: float,
    total_expense: float,
    ingresos_mensuales: float,
) -> tuple[float, str]:
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
    Calcula el score de resiliencia enviando los 5 features al endpoint XGBoost
    de SageMaker. Si el endpoint no está disponible, cae al cálculo heurístico.

    Esta función es síncrona (sin llamadas a Bedrock).
    Para la explicación en lenguaje natural usa generate_resilience_explanation().
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

    raw_features = _compute_raw_features(
        total_income, total_expense, total_fijos, total_hormiga,
        profile.ingresos_mensuales,
    )

    s1, d1 = _score_ratio_ahorro(total_income, total_expense, profile.ingresos_mensuales)
    s2, d2 = _score_control_fijos(total_fijos, profile.ingresos_mensuales, total_income)
    s3, d3 = _score_frecuencia_hormiga(total_hormiga, total_expense)
    s4, d4 = _score_variabilidad_ingresos(total_income, profile.ingresos_mensuales)
    s5, d5 = _score_runway(total_income, total_expense, profile.ingresos_mensuales)

    try:
        score_total = _predict_score_sagemaker(raw_features)
        score_source = "sagemaker"
    except Exception as exc:
        logger.warning(
            "sagemaker_endpoint_unavailable_using_heuristic",
            extra={
                "error": str(exc),
                "endpoint": settings.sagemaker_resilience_endpoint,
                "step": "resilience",
            },
        )
        score_total = s1 * 0.30 + s2 * 0.25 + s3 * 0.20 + s4 * 0.15 + s5 * 0.10
        score_source = "heuristic"

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

    logger.info(
        "resilience_score_computed",
        extra={
            "score_total": round(score_total, 1),
            "nivel": _nivel(score_total),
            "score_source": score_source,
            "raw_features": raw_features,
            "step": "resilience",
        },
    )

    return ResilienceScore(
        score_total=round(score_total, 1),
        nivel=_nivel(score_total),
        factores=factores,
        raw_features=raw_features,
    )


# ─────────────────────────────────────────────────────────────
# LLM explainability  (async — llama a Bedrock)
# ─────────────────────────────────────────────────────────────

def _top_3_impacting_factors(score: ResilienceScore) -> list[ResilienceFactorDetail]:
    """Return the 3 factors with the largest negative impact on the score."""
    sorted_factors = sorted(
        score.factores,
        key=lambda f: (100.0 - f.score_raw) * f.peso,
        reverse=True,
    )
    return sorted_factors[:3]


async def generate_resilience_explanation(
    score: ResilienceScore,
    profile: UserProfile,
    model_id: str | None = None,
) -> str:
    """
    Inyecta el UserProfile y el ResilienceScore en Bedrock para generar
    una explicación en lenguaje natural sobre los 3 factores más impactantes.
    """
    model_id = model_id or settings.bedrock_model_sonnet
    top_factors = _top_3_impacting_factors(score)

    context: dict = {
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
        "valores_del_modelo": {
            "ratio_ahorro_pct": score.raw_features.get("ratio_ahorro") if score.raw_features else None,
            "control_fijos_pct": score.raw_features.get("control_fijos") if score.raw_features else None,
            "frec_hormiga_pct": score.raw_features.get("frec_hormiga") if score.raw_features else None,
            "var_ingresos_pct": score.raw_features.get("var_ingresos") if score.raw_features else None,
            "runway_meses": score.raw_features.get("runway") if score.raw_features else None,
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
