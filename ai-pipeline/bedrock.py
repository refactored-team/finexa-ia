"""
Amazon Bedrock runtime client — boto3 con exponential backoff, timeouts,
y structured Tool Use invocation.

Todas las funciones públicas invoke_* son **async**. Las llamadas a boto3
(bloqueantes) se despachan en un thread-pool executor para nunca bloquear
el event loop de asyncio.  asyncio.sleep() se usa entre reintentos para
ceder control a otras corrutinas mientras se espera.
"""

from __future__ import annotations

import asyncio
import functools
import json
import time
from typing import Any

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from pipeline.logger import get_logger
from pipeline.prompts import WHATIF_SYSTEM_PROMPT
from pipeline.schemas import BehavioralAnalysisResult, ClassificationBatchResult, ResilienceScore

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────
# Client singleton
# ─────────────────────────────────────────────────────────────

_BEDROCK_CONFIG = BotoConfig(
    region_name="us-east-2",
    retries={"max_attempts": 0, "mode": "standard"},   # reintentos manuales
    read_timeout=60,
    connect_timeout=10,
)

_client: boto3.client | None = None


def get_bedrock_client() -> boto3.client:
    global _client
    if _client is None:
        _client = boto3.client("bedrock-runtime", config=_BEDROCK_CONFIG)
    return _client


# ─────────────────────────────────────────────────────────────
# Retry logic — exponential backoff para ThrottlingException
# ─────────────────────────────────────────────────────────────

_RETRYABLE_ERRORS = {
    "ThrottlingException",
    "ModelTimeoutException",
    "ServiceUnavailableException",
    "ModelNotReadyException",
}

MAX_RETRIES = 4
BASE_DELAY = 1.0   # segundos


async def _invoke_with_retry(body: dict, model_id: str) -> dict:
    """
    Invoca Bedrock con backoff exponencial manual.

    La llamada boto3 (bloqueante) corre en un thread-pool executor.
    asyncio.sleep() entre reintentos libera el event loop para que
    otras corrutinas puedan avanzar mientras se espera.
    """
    import os
    from datetime import datetime

    client = get_bedrock_client()
    payload = json.dumps(body)
    loop = asyncio.get_running_loop()
    
    # Preparar el directorio de logs
    base_dir = os.path.dirname(__file__)
    logs_dir = os.path.join(base_dir, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

    for attempt in range(MAX_RETRIES + 1):
        try:
            t0 = time.monotonic()
            # La llamada bloqueante se ejecuta en el thread pool de asyncio
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
            
            # Guardar el log en la carpeta de logs
            log_filename = os.path.join(logs_dir, f"call_{timestamp}.json")
            with open(log_filename, "w", encoding="utf-8") as f:
                json.dump({
                    "model_id": model_id,
                    "attempt": attempt + 1,
                    "latency_ms": latency,
                    "request": body,
                    "response": result
                }, f, ensure_ascii=False, indent=2)
                
            return result

        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code in _RETRYABLE_ERRORS and attempt < MAX_RETRIES:
                delay = BASE_DELAY * (2 ** attempt)
                logger.warning(
                    "bedrock_throttled_retrying",
                    extra={
                        "error": error_code,
                        "attempt": attempt + 1,
                        "delay_s": delay,
                        "model_id": model_id,
                    },
                )
                await asyncio.sleep(delay)  # no bloqueante — otras corrutinas avanzan
            else:
                logger.error(
                    "bedrock_invoke_failed",
                    extra={"error": str(exc), "model_id": model_id},
                )
                raise


# ─────────────────────────────────────────────────────────────
# Tool Use definitions para structured JSON output
# ─────────────────────────────────────────────────────────────

CLASSIFY_TOOL = {
    "name": "submit_classifications",
    "description": (
        "Submit the classification results for a batch of financial transactions. "
        "Each transaction must be classified into exactly one category."
    ),
    "input_schema": ClassificationBatchResult.model_json_schema(),
}

ANALYZE_TOOL = {
    "name": "submit_behavioral_analysis",
    "description": (
        "Submit the holistic behavioral spending analysis including "
        "ant-expense detection and actionable insights."
    ),
    "input_schema": BehavioralAnalysisResult.model_json_schema(),
}


# ─────────────────────────────────────────────────────────────
# Public API  (todas async)
# ─────────────────────────────────────────────────────────────

MODEL_SONNET = "us.anthropic.claude-sonnet-4-6"


async def invoke_classification(
    system_prompt: str,
    user_prompt: str,
    model_id: str = MODEL_SONNET,
) -> ClassificationBatchResult:
    """
    Step A — Clasifica transacciones via Tool Use.
    Fuerza a Claude a llamar `submit_classifications` con JSON tipado.
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.0,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
        "tools": [CLASSIFY_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_classifications"},
    }

    result = await _invoke_with_retry(body, model_id)

    for block in result.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "submit_classifications":
            return ClassificationBatchResult.model_validate(block["input"])

    raise ValueError("Bedrock no retornó el tool_use block esperado para clasificación")


async def invoke_behavioral_analysis(
    system_prompt: str,
    user_prompt: str,
    model_id: str = MODEL_SONNET,
) -> BehavioralAnalysisResult:
    """
    Step B — Análisis de comportamiento via Tool Use.
    Fuerza a Claude a llamar `submit_behavioral_analysis`.
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.4,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
        "tools": [ANALYZE_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_behavioral_analysis"},
    }

    result = await _invoke_with_retry(body, model_id)

    for block in result.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "submit_behavioral_analysis":
            return BehavioralAnalysisResult.model_validate(block["input"])

    raise ValueError("Bedrock no retornó el tool_use block esperado para análisis")


async def invoke_whatif_analysis(
    score_antes: ResilienceScore,
    score_despues: ResilienceScore,
    scenario: object,
    delta_factores: list,
    profile: object,
    model_id: str = MODEL_SONNET,
) -> str:
    """
    RF — Genera el análisis diferencial del simulador What-If via Bedrock (texto libre).
    """
    context = {
        "escenario": scenario.model_dump(),
        "score_antes": {"total": score_antes.score_total, "nivel": score_antes.nivel},
        "score_despues": {"total": score_despues.score_total, "nivel": score_despues.nivel},
        "delta_score": round(score_despues.score_total - score_antes.score_total, 1),
        "delta_factores": [d.model_dump() for d in delta_factores],
        "perfil": {"ocupacion": profile.ocupacion, "metas": profile.metas},
    }

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "temperature": 0.5,
        "system": WHATIF_SYSTEM_PROMPT,
        "messages": [{
            "role": "user",
            "content": (
                "Genera el análisis diferencial para este escenario:\n"
                f"{json.dumps(context, ensure_ascii=False, indent=2)}"
            ),
        }],
    }

    result = await _invoke_with_retry(body, model_id)

    for block in result.get("content", []):
        if block.get("type") == "text":
            return block["text"].strip()

    raise ValueError("Bedrock no retornó texto para el análisis what-if")


async def invoke_resilience_explanation(
    system_prompt: str,
    user_prompt: str,
    model_id: str = MODEL_SONNET,
) -> str:
    """
    RF2 — Genera una explicación en lenguaje natural del Score de Resiliencia.

    No usa Tool Use: respuesta libre en texto para máxima naturalidad.
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "temperature": 0.4,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    result = await _invoke_with_retry(body, model_id)

    for block in result.get("content", []):
        if block.get("type") == "text":
            return block["text"].strip()

    raise ValueError("Bedrock no retornó texto para la explicación de resiliencia")
