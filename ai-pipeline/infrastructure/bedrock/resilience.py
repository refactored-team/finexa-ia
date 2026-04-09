"""Bedrock invocation — RF2 Resilience score explanation (structured via Tool Use)."""

from __future__ import annotations

from pipeline.core.config import settings
from pipeline.domain.models import ResilienceExplanation
from pipeline.infrastructure.bedrock.client import invoke_raw

_EXPLAIN_TOOL = {
    "name": "submit_resilience_explanation",
    "description": (
        "Submit the personalized, structured explanation of the user's "
        "Financial Resilience Score. Each section must correspond to one "
        "of the most impactful factors."
    ),
    "input_schema": ResilienceExplanation.model_json_schema(),
}


async def invoke_resilience_explanation(
    system_prompt: str,
    user_prompt: str,
    model_id: str | None = None,
) -> ResilienceExplanation:
    """
    RF2 — Genera una explicación estructurada del Score de Resiliencia.

    Usa Tool Use para forzar un JSON con `headline`, `resumen` y `secciones`,
    alineado al schema `ResilienceExplanation`.
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "temperature": 0.4,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
        "tools": [_EXPLAIN_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_resilience_explanation"},
    }

    result = await invoke_raw(body, model_id or settings.bedrock_model_sonnet)

    for block in result.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "submit_resilience_explanation":
            return ResilienceExplanation.model_validate(block["input"])

    raise ValueError("Bedrock no retornó el tool_use block esperado para la explicación de resiliencia")
