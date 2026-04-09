"""
POST /analyze — Full pipeline (Steps A + B + C + D + daily pulse).
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pipeline.api.models import (
    AnalyzeData,
    AnalyzeMeta,
    AnalyzeRequest,
    AnalyzeResponse,
    ErrorResponse,
)
from pipeline.domain.models import UserProfile
from pipeline.domain.pulse import compute_daily_pulse
from pipeline.services.pipeline_service import run_pipeline

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    response_model_exclude_none=True,
    tags=["Análisis completo"],
    summary="Pipeline completo de análisis financiero",
    description=(
        "Ejecuta los 4 steps del pipeline **en paralelo** (Steps B, C y D con `asyncio.gather`):\n\n"
        "| Step | Componente | Requiere |\n"
        "|---|---|---|\n"
        "| A | Clasificación | `transactions` |\n"
        "| B | Análisis conductual (insights, risk_level) | `transactions` |\n"
        "| C | Score de Resiliencia (5 factores + LLM) | `user_profile` |\n"
        "| D | Cash flow forecast (recurrentes, liquidez) | `saldo_actual` |\n"
        "| + | Daily pulse (presupuesto libre del día) | `user_profile` + `saldo_actual` |\n\n"
        "### Score de Resiliencia — 5 factores\n"
        "| Factor | Peso | Qué mide | Ideal |\n"
        "|---|---|---|---|\n"
        "| `ratio_ahorro_ingreso` | 30% | Ahorro / ingreso | ≥ 20% |\n"
        "| `control_fijos` | 25% | Gastos fijos / ingreso | ≤ 40% |\n"
        "| `frecuencia_hormiga` | 20% | Gastos hormiga / total | ≤ 5% |\n"
        "| `variabilidad_ingresos` | 15% | Estabilidad del ingreso | ≤ 5% delta |\n"
        "| `runway` | 10% | Meses cubiertos por ahorro | ≥ 3 |\n"
    ),
    responses={500: {"model": ErrorResponse}},
)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    t0 = time.monotonic()
    try:
        profile = UserProfile.model_validate(req.user_profile) if req.user_profile else None
        result = await run_pipeline(
            req.transactions,
            run_analysis=True,
            user_profile=profile,
            saldo_actual=req.saldo_actual,
            liquidez_threshold=req.liquidez_threshold,
        )
        pulse = None
        if req.saldo_actual is not None and profile and result["classified"]:
            pulse = compute_daily_pulse(
                result["classified"],
                saldo_actual=req.saldo_actual,
                ingresos_mensuales=profile.ingresos_mensuales,
            )
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        s = result["stats"]
        return AnalyzeResponse(
            data=AnalyzeData(
                classified=result["classified"],
                analysis=result["analysis"],
                resilience=result["resilience"],
                cash_flow=result["cash_flow"],
                pulse=pulse,
            ),
            meta=AnalyzeMeta(
                elapsed_ms=elapsed_ms,
                total_transactions=s["total_transactions"],
                parsed=s["parsed"],
                classified=s["classified"],
                parse_errors=s["parse_errors"],
                from_cache=s["from_cache"],
                from_heuristic=s["from_heuristic"],
                from_bedrock=s["from_bedrock"],
                from_fallback=s["from_fallback"],
                ant_expenses_detected=s["ant_expenses_detected"],
            ),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="pipeline_failed", detail=str(e)).model_dump(),
        )
