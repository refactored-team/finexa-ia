"""
POST /survival-mode — Calcula el impacto de recortar todos los gastos no esenciales.
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pipeline.api.models import (
    ErrorResponse,
    SimpleMeta,
    SurvivalModeData,
    SurvivalModeRequest,
    SurvivalModeResponse,
)
from pipeline.services.survival_service import run_survival_mode

router = APIRouter()


@router.post(
    "/survival-mode",
    response_model=SurvivalModeResponse,
    response_model_exclude_none=True,
    tags=["Supervivencia"],
    summary="Modo Supervivencia — impacto de recortar todo lo no esencial",
    description=(
        "Simula que pasaria si el usuario eliminara **bruscamente** todos los gastos "
        "discrecionales y se quedara solo con lo indispensable.\n\n"
        "### Que se elimina\n"
        "| Categoria | Ejemplos |\n"
        "|---|---|\n"
        "| `hormiga` | Cafe, OXXO, snacks, delivery |\n"
        "| `suscripcion` | Netflix, Spotify, iCloud, ChatGPT |\n"
        "| `entretenimiento` | Bares, cine, eventos, videojuegos |\n"
        "| `variable` | Ropa, electronica, regalos, gastos discrecionales |\n\n"
        "### Que se conserva\n"
        "| Categoria | Ejemplos |\n"
        "|---|---|\n"
        "| `fijo` | Renta, CFE, agua, internet, gym, seguro |\n"
        "| `alimentacion` | Walmart, Soriana, HEB |\n"
        "| `salud` | Farmacia, medico, hospital |\n"
        "| `transporte` | Uber, DiDi, gasolina, metro |\n\n"
        "### Metricas devueltas\n"
        "- **Ahorro total** del periodo y **proyeccion mensual** (normalizado a 30 dias)\n"
        "- **% de reduccion** del gasto total\n"
        "- **Runway actual vs supervivencia** (meses de gastos cubiertos)\n"
        "- **Balance** antes y despues del recorte\n"
        "- **Gasto hormiga promedio diario** (para que impacte ver el numero)\n"
        "- **Desglose por categoria** ordenado por ahorro generado\n"
        "- **Categoria de mayor impacto** y monto ahorrado\n\n"
        "No requiere Bedrock — calculo puro sobre las transacciones clasificadas."
    ),
    responses={500: {"model": ErrorResponse}},
)
async def survival_mode(req: SurvivalModeRequest) -> SurvivalModeResponse:
    t0 = time.monotonic()
    try:
        result, n_classified, _ = await run_survival_mode(req.transactions)
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return SurvivalModeResponse(
            data=SurvivalModeData(survival=result),
            meta=SimpleMeta(elapsed_ms=elapsed_ms, classified=n_classified),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="survival_mode_failed", detail=str(e)).model_dump(),
        )
