"""
POST /insights/action-plan — Plan de accion paso a paso para un insight especifico.
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pipeline.api.models import (
    ActionPlanData,
    ActionPlanRequest,
    ActionPlanResponse,
    ErrorResponse,
    SimpleMeta,
)
from pipeline.services.action_plan_service import run_action_plan

router = APIRouter()


@router.post(
    "/insights/action-plan",
    response_model=ActionPlanResponse,
    response_model_exclude_none=True,
    tags=["Insights"],
    summary="Plan de accion paso a paso para un insight",
    description=(
        "Recibe un `SpendingInsight` (obtenido de `/analyze`) y genera un plan de **2 a 4 pasos "
        "estructurados** para que el usuario lo ejecute ahora mismo o en los proximos dias.\n\n"
        "### Tipos de plan segun el insight\n\n"
        "| Tipo de insight | Pasos generados | `es_accion_inmediata` |\n"
        "|---|---|---|\n"
        "| Suscripcion cancelable online | URL directa + navegacion + confirmacion | `true` |\n"
        "| Suscripcion con contrato fisico | Numero de contacto + guion + confirmacion escrita | `false` |\n"
        "| Gasto hormiga | Identificar + sustituir + meta semanal + registrar | `false` |\n"
        "| Gasto fijo alto | Listar + comparar + negociar o cambiar de plan | `false` |\n"
        "| Ahorro automatico | Definir monto + configurar transferencia + cuenta separada | `true` |\n\n"
        "Cada paso incluye `tipo`, `instruccion` especifica, `duracion_minutos` y opcionalmente "
        "una `url` directa al panel de accion.\n\n"
        "Si Bedrock no esta disponible, se retorna un plan de respaldo basado en los "
        "`action_steps` que ya trae el insight."
    ),
    responses={500: {"model": ErrorResponse}},
)
async def action_plan(req: ActionPlanRequest) -> ActionPlanResponse:
    t0 = time.monotonic()
    try:
        plan = await run_action_plan(req.insight)
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        classified_count = 0  # este endpoint no clasifica transacciones
        return ActionPlanResponse(
            data=ActionPlanData(plan=plan),
            meta=SimpleMeta(elapsed_ms=elapsed_ms, classified=classified_count),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="action_plan_failed", detail=str(e)).model_dump(),
        )
