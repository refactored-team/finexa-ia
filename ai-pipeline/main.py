"""
Finexa AI Pipeline — FastAPI entry point.

Swagger UI : /docs
ReDoc      : /redoc
OpenAPI    : /openapi.json

Success response shape:
  { "ok": true, "data": { ... }, "meta": { "elapsed_ms": int, ... } }

Error response shape:
  { "ok": false, "error": "codigo", "detail": "mensaje" }
"""

from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html

from pipeline.api.routes import router
from pipeline.core.config import settings

# ─────────────────────────────────────────────────────────────
# OpenAPI tag groups — shown as sections in Swagger UI
# ─────────────────────────────────────────────────────────────

_TAGS: list[dict] = [
    {
        "name": "Sistema",
        "description": (
            "Endpoints de salud y diagnóstico de la API.\n\n"
            "- `GET /` — Health check ligero, no toca AWS.\n"
            "- `POST /test-bedrock` — Verifica conectividad con Claude vía Bedrock."
        ),
    },
    {
        "name": "Clasificación",
        "description": (
            "**Step A** del pipeline. Categoriza transacciones Plaid con la cadena "
            "**caché → heurísticas → Bedrock** — solo las transacciones ambiguas "
            "llegan al LLM, reduciendo costo y latencia.\n\n"
            "No ejecuta análisis conductual ni score de resiliencia."
        ),
    },
    {
        "name": "Análisis completo",
        "description": (
            "**Pipeline completo** (Steps A → B → C → D, con B+C en paralelo vía "
            "`asyncio.gather`): clasificación + insights conductuales + score de "
            "resiliencia con explicación LLM + cash flow forecast + daily pulse."
        ),
    },
    {
        "name": "Cash Flow",
        "description": (
            "**Radar financiero** — detección de gastos recurrentes, proyección de "
            "liquidez a 30 días, alertas de **Día de Riesgo** y detección de ráfagas "
            "de gasto impulsivo. Más rápido que `/analyze` porque omite los Steps "
            "B y C."
        ),
    },
    {
        "name": "Simulador",
        "description": (
            "**What-If** — Simula cómo cambia el Score de Resiliencia y la liquidez "
            "proyectada al modificar hábitos de gasto o ingresos. Útil para coaching "
            "financiero y onboarding."
        ),
    },
    {
        "name": "Insights",
        "description": (
            "**Step E** — Plan de acción detallado para un insight específico. "
            "El usuario selecciona un insight de `/analyze` y recibe una guía de "
            "**2 a 4 pasos concretos** para ejecutar ahora mismo o en los próximos días: "
            "cancelar una suscripción, sustituir un gasto hormiga, configurar ahorro automático, etc."
        ),
    },
]

# ─────────────────────────────────────────────────────────────
# FastAPI app with enriched OpenAPI metadata
# ─────────────────────────────────────────────────────────────

_DESCRIPTION = """
API de inteligencia artificial para análisis financiero personal.

Acepta transacciones en **formato Plaid** y produce:

- **Clasificación** por categoría Finexa (hormiga, fijo, suscripción, variable, …)
- **Análisis conductual** con insights accionables priorizados
- **Score de Resiliencia Financiera** (0–100) con explicación LLM
- **Proyección de cash flow** y alertas de liquidez
- **Simulaciones What-If** para evaluar cambios de hábitos

## Formato de respuesta

Todas las respuestas exitosas siguen la forma:

```json
{ "ok": true, "data": { ... }, "meta": { "elapsed_ms": 450 } }
```

Todos los errores siguen la forma:

```json
{ "ok": false, "error": "codigo_snake_case", "detail": "mensaje" }
```

## Stack interno

| Capa | Responsabilidad |
|---|---|
| `api/` | FastAPI routes y modelos Pydantic de request/response |
| `services/` | Orquestación entre dominios |
| `domain/` | Lógica pura (classifier, analyzer, resilience, forecaster, whatif) |
| `infrastructure/` | Integraciones externas (AWS Bedrock, SageMaker, caché) |

## Fuentes de clasificación (`source`)

| Valor | Significado |
|---|---|
| `heuristic` | Regla determinística — sin costo, sin latencia |
| `cache` | Resultado de clasificación previa en memoria |
| `bedrock` | Clasificado por Claude Sonnet vía AWS Bedrock |
| `fallback` | Bedrock no disponible — clasificación de respaldo |
"""

app = FastAPI(
    title="Finexa AI Pipeline",
    summary="Análisis financiero personal impulsado por Claude (AWS Bedrock) + XGBoost.",
    description=_DESCRIPTION,
    version=settings.app_version,
    openapi_tags=_TAGS,
    contact={
        "name": "Finexa AI Team",
        "url": "https://finexa.ai",
        "email": "engineering@finexa.ai",
    },
    license_info={
        "name": "Proprietary",
        "identifier": "LicenseRef-Finexa-Proprietary",
    },
    terms_of_service="https://finexa.ai/terms",
    servers=[
        {"url": "http://localhost:8000", "description": "Local development"},
        {"url": "https://api.finexa.ai", "description": "Producción"},
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": 1,
        "docExpansion": "list",
        "displayRequestDuration": True,
        "filter": True,
        "tryItOutEnabled": True,
    },
)

app.include_router(router)