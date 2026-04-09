"""
POST /classify — Step A only (classification).
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pipeline.api.models import (
    ClassifyData,
    ClassifyMeta,
    ClassifyRequest,
    ClassifyResponse,
    ErrorResponse,
)
from pipeline.services.classification_service import classify_transactions

router = APIRouter()


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
        classified, n_parsed, parse_errors = await classify_transactions(req.transactions)
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        return ClassifyResponse(
            data=ClassifyData(transactions=classified),
            meta=ClassifyMeta(
                elapsed_ms=elapsed_ms,
                total=len(req.transactions),
                parsed=n_parsed,
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
