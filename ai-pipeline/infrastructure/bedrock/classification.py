"""Bedrock invocation — Step A (transaction classification via Tool Use)."""

from __future__ import annotations

from pipeline.core.config import settings
from pipeline.domain.models import ClassificationBatchResult
from pipeline.infrastructure.bedrock.client import invoke_raw

# Tool Use schema — forces Claude to emit structured JSON matching our Pydantic model
_CLASSIFY_TOOL = {
    "name": "submit_classifications",
    "description": (
        "Submit the classification results for a batch of financial transactions. "
        "Each transaction must be classified into exactly one category."
    ),
    "input_schema": ClassificationBatchResult.model_json_schema(),
}


async def invoke_classification(
    system_prompt: str,
    user_prompt: str,
    model_id: str | None = None,
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
        "tools": [_CLASSIFY_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_classifications"},
    }

    result = await invoke_raw(body, model_id or settings.bedrock_model_sonnet)

    for block in result.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "submit_classifications":
            return ClassificationBatchResult.model_validate(block["input"])

    raise ValueError("Bedrock no retornó el tool_use block esperado para clasificación")
