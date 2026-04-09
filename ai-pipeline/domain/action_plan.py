"""
Step E — Plan de accion por insight.

Toma un SpendingInsight especifico (seleccionado por el usuario en la UI)
y genera un plan de 2-4 pasos estructurados via Bedrock Tool Use.
"""

from __future__ import annotations

import json

from pipeline.core.config import settings
from pipeline.core.logger import get_logger
from pipeline.domain.models import InsightActionPlan, SpendingInsight
from pipeline.domain.models.action_plan import ActionStep
from pipeline.infrastructure.bedrock import invoke_action_plan
from pipeline.infrastructure.prompts import ACTION_PLAN_SYSTEM_PROMPT

logger = get_logger(__name__)


async def generate_action_plan(
    insight: SpendingInsight,
    model_id: str | None = None,
) -> InsightActionPlan:
    """
    Step E — Genera un plan de 2-4 pasos para que el usuario actue sobre un insight.

    Si Bedrock no esta disponible, retorna el plan de respaldo basado en
    los `action_steps` que ya trae el insight.
    """
    model_id = model_id or settings.bedrock_model_sonnet

    context = {
        "insight": {
            "titulo": insight.title,
            "descripcion": insight.description,
            "categoria": insight.affected_category.value,
            "prioridad": insight.priority,
            "ahorro_mensual_estimado": insight.potential_monthly_saving,
            "es_accion_inmediata": insight.is_immediate_action,
            "pasos_previos": insight.action_steps or [],
            "url_conocida": insight.action_url,
        },
    }

    user_prompt = (
        "Genera el plan de accion paso a paso para este insight:\n"
        f"{json.dumps(context, ensure_ascii=False, indent=2)}"
    )

    try:
        plan = await invoke_action_plan(
            system_prompt=ACTION_PLAN_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            model_id=model_id,
        )
        logger.info(
            "action_plan_generated",
            extra={
                "insight_title": insight.title,
                "pasos": len(plan.pasos),
                "es_accion_inmediata": plan.es_accion_inmediata,
                "step": "action_plan",
            },
        )
        return plan

    except Exception as exc:
        logger.error(
            "action_plan_failed_using_fallback",
            extra={"error": str(exc), "insight": insight.title, "step": "action_plan"},
        )
        return _fallback_plan(insight)


def _fallback_plan(insight: SpendingInsight) -> InsightActionPlan:
    """Plan de respaldo cuando Bedrock no esta disponible."""
    pasos: list[ActionStep] = []

    if insight.action_steps:
        for i, step_text in enumerate(insight.action_steps[:4], start=1):
            pasos.append(ActionStep(
                numero=i,
                titulo=f"Paso {i}",
                instruccion=step_text,
                tipo="otro",
                url=insight.action_url if i == 1 else None,
            ))
    else:
        pasos.append(ActionStep(
            numero=1,
            titulo="Revisa el insight",
            instruccion=(
                f"Analiza tu situacion con '{insight.title}' y decide "
                "si quieres tomar accion ahora o en los proximos dias."
            ),
            tipo="revisar",
        ))
        pasos.append(ActionStep(
            numero=2,
            titulo="Define tu meta",
            instruccion=(
                "Escribe en tu telefono o agenda un compromiso concreto: "
                "que haras diferente esta semana relacionado con este gasto."
            ),
            tipo="habito",
        ))

    return InsightActionPlan(
        insight_titulo=insight.title,
        objetivo=(
            f"Actuar sobre: {insight.title}."
            + (
                f" Ahorro potencial: ${insight.potential_monthly_saving:.0f}/mes."
                if insight.potential_monthly_saving > 0
                else ""
            )
        ),
        pasos=pasos,
        ahorro_mensual_estimado=insight.potential_monthly_saving,
        tiempo_total_minutos=len(pasos) * 5,
        es_accion_inmediata=insight.is_immediate_action,
        nota_final="Plan generado con datos locales porque el servicio de IA no estaba disponible.",
    )
