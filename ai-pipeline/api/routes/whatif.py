"""
POST /whatif — Hypothetical scenario simulator.
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from pipeline.api.models import (
    ErrorResponse,
    SimpleMeta,
    WhatIfData,
    WhatIfRequest,
    WhatIfResponse,
)
from pipeline.domain.models import UserProfile, WhatIfScenario
from pipeline.services.whatif_service import run_whatif

router = APIRouter()


@router.post(
    "/whatif",
    response_model=WhatIfResponse,
    response_model_exclude_none=True,
    tags=["Simulador"],
    summary="Simulador de escenarios hipotéticos (What-If)",
    description=(
        "Responde: **¿Cómo cambia mi salud financiera si modifico mis hábitos?**\n\n"
        "**Flujo interno:**\n"
        "1. Clasifica las transacciones (Step A)\n"
        "2. Calcula el Score de Resiliencia base (`score_antes`)\n"
        "3. Aplica el escenario: escala los montos de cada categoría\n"
        "4. Recalcula el score con datos modificados (`score_despues`)\n"
        "5. Genera `analisis_diferencial` en lenguaje natural via Bedrock\n\n"
        "**`delta_score` positivo = mejora.**"
    ),
    responses={
        422: {"model": ErrorResponse, "description": "`user_profile` o `scenario` inválidos"},
        500: {"model": ErrorResponse},
    },
)
async def whatif(req: WhatIfRequest) -> WhatIfResponse:
    t0 = time.monotonic()
    try:
        profile = UserProfile.model_validate(req.user_profile)
        scenario = WhatIfScenario.model_validate(req.scenario)
    except ValidationError as e:
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(error="invalid_input", detail=str(e.errors())).model_dump(),
        )
    try:
        result, n_classified = await run_whatif(
            req.transactions,
            profile=profile,
            scenario=scenario,
            saldo_actual=req.saldo_actual,
        )
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return WhatIfResponse(
            data=WhatIfData(result=result),
            meta=SimpleMeta(elapsed_ms=elapsed_ms, classified=n_classified),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="whatif_failed", detail=str(e)).model_dump(),
        )
