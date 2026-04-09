"""Action plan service — orchestrates Step E for the API layer."""

from __future__ import annotations

from pipeline.domain.action_plan import generate_action_plan
from pipeline.domain.models import InsightActionPlan, SpendingInsight


async def run_action_plan(insight: SpendingInsight) -> InsightActionPlan:
    """
    Genera el plan de accion para el insight recibido.

    Args:
        insight: SpendingInsight seleccionado por el usuario en la UI.

    Returns:
        InsightActionPlan con 2-4 pasos estructurados.
    """
    return await generate_action_plan(insight)
