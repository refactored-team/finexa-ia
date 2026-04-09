"""Bedrock invocation — RF2 Resilience score explanation (free text)."""

from __future__ import annotations

from pipeline.core.config import settings
from pipeline.infrastructure.bedrock.client import invoke_raw


async def invoke_resilience_explanation(
    system_prompt: str,
    user_prompt: str,
    model_id: str | None = None,
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

    result = await invoke_raw(body, model_id or settings.bedrock_model_sonnet)

    for block in result.get("content", []):
        if block.get("type") == "text":
            return block["text"].strip()

    raise ValueError("Bedrock no retornó texto para la explicación de resiliencia")
