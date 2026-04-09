"""Bedrock invocation — Step E: insight action plan (structured via Tool Use)."""

from __future__ import annotations

from pipeline.core.config import settings
from pipeline.domain.models import InsightActionPlan
from pipeline.infrastructure.bedrock.client import invoke_raw

_ACTION_PLAN_TOOL = {
    "name": "submit_action_plan",
    "description": (
        "Submit a structured, step-by-step action plan that guides the user "
        "to act on a specific spending insight in 2 to 4 concrete steps."
    ),
    "input_schema": InsightActionPlan.model_json_schema(),
}


async def invoke_action_plan(
    system_prompt: str,
    user_prompt: str,
    model_id: str | None = None,
) -> InsightActionPlan:
    """
    Step E — Genera un plan de accion estructurado para un insight especifico via Tool Use.
    Fuerza a Claude a llamar `submit_action_plan`.
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "temperature": 0.3,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
        "tools": [_ACTION_PLAN_TOOL],
        "tool_choice": {"type": "tool", "name": "submit_action_plan"},
    }

    result = await invoke_raw(body, model_id or settings.bedrock_model_sonnet)

    for block in result.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == "submit_action_plan":
            return InsightActionPlan.model_validate(block["input"])

    raise ValueError("Bedrock no retorno el tool_use block esperado para el plan de accion")
