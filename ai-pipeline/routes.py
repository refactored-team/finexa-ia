"""
Route handlers del AI Pipeline.
Todos los endpoints se registran en `router` y se montan en api.py.
"""

from __future__ import annotations

import time
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from pipeline.bedrock import MODEL_SONNET, _invoke_with_retry
from pipeline.classifier import classify_batch
from pipeline.forecaster import run_cash_flow_analysis
from pipeline.handler import run_pipeline
from pipeline.pulse import compute_daily_pulse
from pipeline.schemas import PlaidTransaction, UserProfile, WhatIfScenario
from pipeline.whatif import simulate_whatif

from pipeline.api_models import (
    AnalyzeData,
    AnalyzeMeta,
    AnalyzeRequest,
    AnalyzeResponse,
    CashFlowData,
    CashFlowRequest,
    CashFlowResponse,
    ClassifyData,
    ClassifyMeta,
    ClassifyRequest,
    ClassifyResponse,
    ErrorResponse,
    HealthResponse,
    SimpleMeta,
    WhatIfData,
    WhatIfRequest,
    WhatIfResponse,
)

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _parse_transactions(raw_list: list[dict]) -> tuple[list[PlaidTransaction], int]:
    """Parsea dicts Plaid → PlaidTransaction. Retorna (parsed, n_errors)."""
    parsed: list[PlaidTransaction] = []
    errors = 0
    for i, raw in enumerate(raw_list):
        try:
            tx = PlaidTransaction.model_validate(raw)
            if not tx.transaction_id:
                tx.transaction_id = raw.get("transaction_id", f"tx_{i:04d}")
            parsed.append(tx)
        except ValidationError:
            errors += 1
    return parsed, errors


# ─────────────────────────────────────────────────────────────
# GET /
# ─────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=HealthResponse,
    tags=["Sistema"],
    summary="Health check",
)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="finexa-ai-pipeline", version="1.0.0")


# ─────────────────────────────────────────────────────────────
# POST /classify
# ─────────────────────────────────────────────────────────────

@router.post(
    "/classify",
    response_model=ClassifyResponse,
    response_model_exclude_none=True,
    tags=["Clasificación"],
    summary="Clasificar transacciones",
    description=(
        "Categoriza cada transacción con el pipeline **caché → heurísticas → Bedrock** "
        "(solo las ambiguas llegan a Bedrock).\n\n"
        "### Categorías disponibles (`FinexaCategory`)\n"
        "| Valor | Ejemplos |\n"
        "|---|---|\n"
        "| `suscripcion` | Netflix, Spotify, Adobe, iCloud, ChatGPT |\n"
        "| `fijo` | Renta, CFE, Telmex, seguros, gimnasio |\n"
        "| `hormiga` | Café, OXXO, Rappi pequeños (frecuentes y evitables) |\n"
        "| `variable` | Compras discrecionales sin patrón fijo |\n"
        "| `ingreso` | Salario, depósitos, reembolsos |\n"
        "| `transporte` | Uber, Didi, gasolineras, CDMX |\n"
        "| `alimentacion` | Restaurantes, supermercados, delivery |\n"
        "| `salud` | Farmacias, médicos, laboratorios |\n"
        "| `entretenimiento` | Cine, eventos, videojuegos |\n"
        "| `transferencia` | SPEI entre cuentas propias |\n"
        "| `desconocido` | No clasificable con confianza suficiente |\n\n"
        "### Campo `source`\n"
        "| Valor | Significado |\n"
        "|---|---|\n"
        "| `heuristic` | Regla de texto/categoría Plaid — sin costo |\n"
        "| `cache` | Resultado de clasificación previa en memoria |\n"
        "| `bedrock` | Clasificado por Claude via AWS Bedrock |\n"
        "| `fallback` | Bedrock no disponible — clasificación de respaldo |\n"
    ),
    responses={500: {"model": ErrorResponse, "description": "Error interno de clasificación"}},
)
async def classify(req: ClassifyRequest) -> ClassifyResponse:
    t0 = time.monotonic()
    try:
        parsed, parse_errors = _parse_transactions(req.transactions)
        classified = await classify_batch(parsed)
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return ClassifyResponse(
            data=ClassifyData(transactions=classified),
            meta=ClassifyMeta(
                elapsed_ms=elapsed_ms,
                total=len(req.transactions),
                parsed=len(parsed),
                classified=len(classified),
                parse_errors=parse_errors,
                from_cache=sum(1 for c in classified if c.source == "cache"),
                from_heuristic=sum(1 for c in classified if c.source == "heuristic"),
                from_bedrock=sum(1 for c in classified if c.source == "bedrock"),
                from_fallback=sum(1 for c in classified if c.source == "fallback"),
            ),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="classification_failed", detail=str(e)).model_dump(),
        )


# ─────────────────────────────────────────────────────────────
# POST /analyze
# ─────────────────────────────────────────────────────────────

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


# ─────────────────────────────────────────────────────────────
# POST /cashflow
# ─────────────────────────────────────────────────────────────

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
        parsed, _ = _parse_transactions(req.transactions)
        classified = await classify_batch(parsed)
        cash_flow = run_cash_flow_analysis(
            classified,
            saldo_actual=req.saldo_actual,
            threshold=req.liquidez_threshold,
            ingresos_mensuales=req.ingresos_mensuales,
        )
        pulse = None
        if req.ingresos_mensuales is not None:
            pulse = compute_daily_pulse(
                classified,
                saldo_actual=req.saldo_actual,
                ingresos_mensuales=req.ingresos_mensuales,
            )
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return CashFlowResponse(
            data=CashFlowData(cash_flow=cash_flow, pulse=pulse),
            meta=SimpleMeta(elapsed_ms=elapsed_ms, classified=len(classified)),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="cashflow_failed", detail=str(e)).model_dump(),
        )


# ─────────────────────────────────────────────────────────────
# POST /whatif
# ─────────────────────────────────────────────────────────────

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
        parsed, _ = _parse_transactions(req.transactions)
        classified = await classify_batch(parsed)
        result = await simulate_whatif(
            transactions=classified,
            profile=profile,
            scenario=scenario,
            saldo_actual=req.saldo_actual,
        )
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return WhatIfResponse(
            data=WhatIfData(result=result),
            meta=SimpleMeta(elapsed_ms=elapsed_ms, classified=len(classified)),
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(error="whatif_failed", detail=str(e)).model_dump(),
        )


# ─────────────────────────────────────────────────────────────
# POST /test-bedrock
# ─────────────────────────────────────────────────────────────

@router.post(
    "/test-bedrock",
    tags=["Sistema"],
    summary="Prueba de conectividad con AWS Bedrock",
    description="Envía un mensaje simple a Claude y verifica que la respuesta llega correctamente.",
)
async def test_bedrock() -> dict:
    try:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 50,
            "temperature": 0.0,
            "messages": [{"role": "user", "content": "Reply only with: Bedrock OK"}],
        }
        result = await _invoke_with_retry(body, MODEL_SONNET)
        text = "".join(
            block["text"]
            for block in result.get("content", [])
            if block.get("type") == "text"
        )
        return {"status": "ok", "message": text}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e)},
        )
