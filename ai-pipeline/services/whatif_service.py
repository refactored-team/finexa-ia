"""
What-If service — classify + run hypothetical scenario simulation.
Used by the `/whatif` endpoint.
"""

from __future__ import annotations

from typing import Optional

from pipeline.domain.models import UserProfile, WhatIfResult, WhatIfScenario
from pipeline.domain.whatif import simulate_whatif
from pipeline.services.classification_service import classify_transactions


async def run_whatif(
    raw_transactions: list[dict],
    profile: UserProfile,
    scenario: WhatIfScenario,
    saldo_actual: Optional[float] = None,
) -> tuple[WhatIfResult, int]:
    """
    Classify transactions and run the what-if simulation.

    Returns:
        (whatif_result, n_classified)
    """
    classified, _, _ = await classify_transactions(raw_transactions)

    result = await simulate_whatif(
        transactions=classified,
        profile=profile,
        scenario=scenario,
        saldo_actual=saldo_actual,
    )

    return result, len(classified)
