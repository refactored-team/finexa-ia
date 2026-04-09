"""
POST /cashflow — Cash flow forecast + daily pulse (no behavioral analysis).
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pipeline.api.models import (
    CashFlowData,
    CashFlowRequest,
    CashFlowResponse,
    ErrorResponse,
    SimpleMeta,
)
from pipeline.services.cashflow_service import compute_cashflow

router = APIRouter()


@router.post(
    "/cashflow",
    response_model=CashFlowResponse,
    response_model_exclude_none=True,
    tags=["Cash Flow"],
    summary="Cash flow forecast + presupuesto libre del día",
    description=(
        "Más rápido que `/analyze` cuando solo necesitas información de liquidez.\n\n"
        "**Incluye:**\n"
        "- Gastos recurrentes detectados (GROUP BY comercio, monto ±15%)\n"
        "- Liquidez proyectada a 30 días: `saldo_actual − recurrentes_pendientes`\n"
        "- Alerta de Día de Riesgo si la liquidez cae bajo el umbral\n"
        "- Alertas de gasto impulsivo (3+ gastos discrecionales en ventana de 4h)\n"
        "- Daily pulse (solo si se envía `ingresos_mensuales`)\n\n"
        "### Tipos de alerta de liquidez\n"
        "| `alert_type` | Condición |\n"
        "|---|---|\n"
        "| `liquidez_baja` | Proyección < umbral pero > 0 |\n"
        "| `liquidez_critica` | Proyección negativa |\n"
    ),
    responses={500: {"model": ErrorResponse}},
)
async def cashflow(req: CashFlowRequest) -> CashFlowResponse:
    t0 = time.monotonic()
    try:
        cash_flow, pulse, n_classified = await compute_cashflow(
            req.transactions,
            saldo_actual=req.saldo_actual,
            ingresos_mensuales=req.ingresos_mensuales,
            liquidez_threshold=req.liquidez_threshold,
        )
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return CashFlowResponse(
            data=CashFlowData(cash_flow=cash_flow, pulse=pulse),
            meta=SimpleMeta(elapsed_ms=elapsed_ms, classified=n_classified),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="cashflow_failed", detail=str(e)).model_dump(),
        )
