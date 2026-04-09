"""
Bedrock runtime client — boto3 con exponential backoff, timeouts y thread-pool offload.

Las funciones públicas:
  - `get_client()`        → singleton boto3 client
  - `invoke_raw(body, model_id)` → llamada cruda con retry/backoff, async

Los módulos `classification.py`, `analysis.py`, etc. construyen el `body` específico
de cada operación y delegan la IO aquí.
"""

from __future__ import annotations

import asyncio
import functools
import json
import os
import time
from datetime import datetime
from typing import Any

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from pipeline.core.config import settings
from pipeline.core.logger import get_logger

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────
# Client singleton
# ─────────────────────────────────────────────────────────────

_RETRYABLE_ERRORS = {
    "ThrottlingException",
    "ModelTimeoutException",
    "ServiceUnavailableException",
    "ModelNotReadyException",
}

_client: Any | None = None


def get_client() -> Any:
    """Singleton boto3 bedrock-runtime client."""
    global _client
    if _client is None:
        config = BotoConfig(
            region_name=settings.bedrock_region,
            retries={"max_attempts": 0, "mode": "standard"},  # manual retry
            read_timeout=settings.bedrock_read_timeout,
            connect_timeout=settings.bedrock_connect_timeout,
        )
        _client = boto3.client(
            "bedrock-runtime",
            region_name=settings.bedrock_region,
            config=config,
        )
    return _client


# ─────────────────────────────────────────────────────────────
# Mock mode (for offline dev)
# ─────────────────────────────────────────────────────────────

def _mock_response(body: dict) -> dict:
    """Return canned responses by inspecting tool_choice — used when BEDROCK_MOCK=true."""
    tool_name = body.get("tool_choice", {}).get("name", "")

    if tool_name == "submit_classifications":
        import re

        messages = body.get("messages", [])
        content = messages[0]["content"] if messages else ""
        ids = re.findall(r'"transaction_id"\s*:\s*"([^"]+)"', content) or ["0"]
        classifications = [
            {
                "transaction_id": tid,
                "category": "variable",
                "confidence": 0.75,
                "is_ant_expense": False,
                "reasoning": "Mock: clasificación genérica para pruebas locales",
            }
            for tid in ids
        ]
        return {
            "content": [{
                "type": "tool_use",
                "name": "submit_classifications",
                "input": {"classifications": classifications},
            }]
        }

    if tool_name == "submit_behavioral_analysis":
        return {
            "content": [{
                "type": "tool_use",
                "name": "submit_behavioral_analysis",
                "input": {
                    "ant_expense_total": 154.0,
                    "ant_expense_percentage": 5.2,
                    "risk_level": "medio",
                    "insights": [{
                        "title": "Gastos hormiga frecuentes",
                        "description": "Se detectaron compras pequeñas recurrentes en tiendas de conveniencia.",
                        "priority": "media",
                        "potential_monthly_saving": 450.0,
                        "affected_category": "hormiga",
                    }],
                    "summary": "[MOCK] Perfil de gasto moderado con oportunidad de optimización.",
                },
            }]
        }

    return {"content": [{"type": "text", "text": "Bedrock OK (mock)"}]}


# ─────────────────────────────────────────────────────────────
# Core invoke — async with retry
# ─────────────────────────────────────────────────────────────

async def invoke_raw(body: dict, model_id: str | None = None) -> dict:
    """
    Invoca Bedrock con retry/backoff. Retorna el JSON decodificado.

    La llamada boto3 (bloqueante) corre en un thread-pool executor.
    asyncio.sleep() entre reintentos libera el event loop.
    """
    model_id = model_id or settings.bedrock_model_sonnet

    if settings.bedrock_mock:
        logger.info("bedrock_mock", extra={"model_id": model_id})
        return _mock_response(body)

    client = get_client()
    payload = json.dumps(body)
    loop = asyncio.get_running_loop()

    # Optional: log request/response to logs/ for debugging
    log_handle = _prepare_log_handle() if settings.bedrock_log_calls else None

    for attempt in range(settings.bedrock_max_retries + 1):
        try:
            t0 = time.monotonic()
            response = await loop.run_in_executor(
                None,
                functools.partial(
                    client.invoke_model,
                    modelId=model_id,
                    body=payload,
                    accept="application/json",
                    contentType="application/json",
                ),
            )
            latency = int((time.monotonic() - t0) * 1000)
            result = json.loads(response["body"].read())

            logger.info(
                "bedrock_invoke_ok",
                extra={"model_id": model_id, "latency_ms": latency, "step": "invoke"},
            )

            if log_handle:
                _write_call_log(log_handle, model_id, attempt + 1, latency, body, result)

            return result

        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code in _RETRYABLE_ERRORS and attempt < settings.bedrock_max_retries:
                delay = settings.bedrock_base_retry_delay * (2 ** attempt)
                logger.warning(
                    "bedrock_throttled_retrying",
                    extra={
                        "error": error_code,
                        "attempt": attempt + 1,
                        "delay_s": delay,
                        "model_id": model_id,
                    },
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    "bedrock_invoke_failed",
                    extra={"error": str(exc), "model_id": model_id},
                )
                raise

    raise RuntimeError("bedrock retry loop exhausted without result")


# ─────────────────────────────────────────────────────────────
# Call log helpers
# ─────────────────────────────────────────────────────────────

def _prepare_log_handle() -> str:
    """Return the target filename for the next call log."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    logs_dir = os.path.join(base_dir, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    return os.path.join(logs_dir, f"call_{timestamp}.json")


def _write_call_log(
    path: str,
    model_id: str,
    attempt: int,
    latency_ms: int,
    request: dict,
    response: dict,
) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "model_id": model_id,
                "attempt": attempt,
                "latency_ms": latency_ms,
                "request": request,
                "response": response,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
