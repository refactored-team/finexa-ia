"""Bedrock invocation — Step B (behavioral analysis via Tool Use)."""

from __future__ import annotations

from pipeline.core.config import settings
from pipeline.domain.models import BehavioralAnalysisResult
from pipeline.infrastructure.bedrock.client import invoke_raw

_ANALYZE_TOOL = {
    "name": "submit_behavioral_analysis",
    "description": (
        "Submit the holistic behavioral spending analysis including "
        "ant-expense detection and actionable insights."
    ),
    "input_schema": BehavioralAnalysisResult.model_json_schema(),
}


async def invoke_behavioral_analysis(
    system_prompt: str,
    user_prompt: str,
    model_id: str | None = None,
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
        "tools": [_ANALYZE_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_behavioral_analysis"},
    }

    result = await invoke_raw(body, model_id or settings.bedrock_model_sonnet)

    for block in result.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "submit_behavioral_analysis":
            return BehavioralAnalysisResult.model_validate(block["input"])

    raise ValueError("Bedrock no retornó el tool_use block esperado para análisis")
