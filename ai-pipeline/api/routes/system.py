"""
System routes — health check + Bedrock connectivity test.
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pipeline.api.models import HealthResponse
from pipeline.core.config import settings
from pipeline.infrastructure.bedrock import invoke_raw

router = APIRouter()


@router.get(
    "/",
    response_model=HealthResponse,
    tags=["Sistema"],
    summary="Health check",
)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
    )


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
        result = await invoke_raw(body, settings.bedrock_model_sonnet)
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
