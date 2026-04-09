"""
Cash flow service — classify + cash flow forecast + daily pulse.
Used by the `/cashflow` endpoint.
"""

from __future__ import annotations

from typing import Optional

from pipeline.domain.forecaster import run_cash_flow_analysis
from pipeline.domain.models import CashFlowResult, DailyPulse
from pipeline.domain.pulse import compute_daily_pulse
from pipeline.services.classification_service import classify_transactions


async def compute_cashflow(
    raw_transactions: list[dict],
    saldo_actual: float,
    ingresos_mensuales: Optional[float] = None,
    liquidez_threshold: Optional[float] = None,
) -> tuple[CashFlowResult, Optional[DailyPulse], int]:
    """
    Classify transactions and compute the cash flow forecast + optional daily pulse.

    Returns:
        (cash_flow_result, pulse_or_none, n_classified)
    """
    classified, _, _ = await classify_transactions(raw_transactions)

    cash_flow = run_cash_flow_analysis(
        classified,
        saldo_actual=saldo_actual,
        threshold=liquidez_threshold,
        ingresos_mensuales=ingresos_mensuales,
    )

    pulse: Optional[DailyPulse] = None
    if ingresos_mensuales is not None and classified:
        pulse = compute_daily_pulse(
            classified,
            saldo_actual=saldo_actual,
            ingresos_mensuales=ingresos_mensuales,
        )

    return cash_flow, pulse, len(classified)
