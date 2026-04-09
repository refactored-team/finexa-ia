"""
Finexa AI Pipeline — FastAPI entry point.

Swagger UI : /docs
ReDoc      : /redoc

Success response shape:
  { "ok": true, "data": { ... }, "meta": { "elapsed_ms": int, ... } }

Error response shape:
  { "ok": false, "error": "codigo", "detail": "mensaje" }
"""

from fastapi import FastAPI

from pipeline.api.routes import router
from pipeline.core.config import settings

_TAGS: list[dict] = [
    {
        "name": "Clasificación",
        "description": (
            "**Step A** — Categoriza transacciones con caché → heurísticas → Bedrock. "
            "Sin análisis conductual ni score de resiliencia."
        ),
    },
    {
        "name": "Análisis completo",
        "description": (
            "**Pipeline completo** (Steps A → B → C → D en paralelo): "
            "clasificación + insights + resiliencia + cash flow + daily pulse."
        ),
    },
    {
        "name": "Cash Flow",
        "description": (
            "**Radar financiero** — Gastos recurrentes, proyección de liquidez 30 días, "
            "alertas de Día de Riesgo y detección de gastos impulsivos. Más rápido que `/analyze`."
        ),
    },
    {
        "name": "Simulador",
        "description": (
            "**What-If** — Simula cómo cambia el Score de Resiliencia al modificar "
            "hábitos de gasto o ingresos."
        ),
    },
    {
        "name": "Sistema",
        "description": "Health check y prueba de conectividad con AWS Bedrock.",
    },
]

app = FastAPI(
    title="Finexa AI Pipeline",
    description=(
        "API de inteligencia artificial para análisis financiero personal.\n\n"
        "Acepta transacciones en **formato Plaid** y produce:\n"
        "- Clasificación por categoría Finexa\n"
        "- Análisis conductual e insights accionables\n"
        "- Score de Resiliencia Financiera (0–100) con explicación LLM\n"
        "- Proyección de cash flow y alertas de liquidez\n"
        "- Simulaciones hipotéticas (What-If)\n\n"
        "**Formato de respuesta estándar:**\n"
        "```json\n"
        '{ "ok": true, "data": { ... }, "meta": { "elapsed_ms": 450 } }\n'
        "```"
    ),
    version=settings.app_version,
    openapi_tags=_TAGS,
)

app.include_router(router)
