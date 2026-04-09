"""Bedrock invocation — What-If differential analysis (free text)."""

from __future__ import annotations

import json

from pipeline.core.config import settings
from pipeline.domain.models import ResilienceScore, UserProfile, WhatIfDeltaFactor, WhatIfScenario
from pipeline.infrastructure.bedrock.client import invoke_raw
from pipeline.infrastructure.prompts import WHATIF_SYSTEM_PROMPT


async def invoke_whatif_analysis(
    score_antes: ResilienceScore,
    score_despues: ResilienceScore,
    scenario: WhatIfScenario,
    delta_factores: list[WhatIfDeltaFactor],
    profile: UserProfile,
    model_id: str | None = None,
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

    result = await invoke_raw(body, model_id or settings.bedrock_model_sonnet)

    for block in result.get("content", []):
        if block.get("type") == "text":
            return block["text"].strip()

    raise ValueError("Bedrock no retornó texto para el análisis what-if")
