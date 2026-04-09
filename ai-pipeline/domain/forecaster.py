"""
RF3 — Proyección de Cash Flow (El Radar).
RF7 — Alertas Tempranas (El Filtro).

Tres capacidades:
  1. detect_recurring_expenses  — GROUP BY comercio + periodicidad (monto ±15%)
  2. compute_liquidity_forecast — Día de Riesgo: saldo − recurrentes pendientes
  3. detect_impulse_spending    — 3+ gastos discrecionales en ventana de 2-4 horas
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional

from pipeline.core.logger import get_logger
from pipeline.domain.models import (
    CashFlowResult,
    EnrichedTransaction,
    FinexaCategory,
    ImpulseSpendingAlert,
    LiquidityAlert,
    RecurringExpense,
)

logger = get_logger(__name__)

_DISCRETIONARY = {
    FinexaCategory.HORMIGA,
    FinexaCategory.ENTRETENIMIENTO,
    FinexaCategory.VARIABLE,
    FinexaCategory.ALIMENTACION,
}

_NON_RECURRING = {FinexaCategory.INGRESO, FinexaCategory.TRANSFERENCIA}

# (min_gap_days, max_gap_days, canonical_days, label)
_PERIODICITY_BANDS = [
    (4,  9,  7,  "semanal"),
    (10, 18, 14, "quincenal"),
    (19, 45, 30, "mensual"),
]


# ─────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────

def _merchant_key(tx: EnrichedTransaction) -> str:
    """Normalized grouping key for recurring detection."""
    name = (tx.merchant_name or tx.name).strip().lower()
    for suffix in [" inc", " llc", " corp", " s.a.", " de c.v.", " sapi"]:
        if name.endswith(suffix):
            name = name[: -len(suffix)].rstrip()
    return name


def _parse_date(s: str) -> date:
    return date.fromisoformat(s[:10])


def _best_datetime(tx: EnrichedTransaction) -> Optional[datetime]:
    """Returns the best available datetime for a transaction."""
    if tx.datetime:
        try:
            return datetime.fromisoformat(tx.datetime.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            pass
    try:
        d = _parse_date(tx.date)
        return datetime(d.year, d.month, d.day)
    except ValueError:
        return None


def _has_intraday_time(tx: EnrichedTransaction) -> bool:
    return bool(tx.datetime and "T" in tx.datetime)


def _detect_periodicity(gaps: list[int]) -> tuple[int, str]:
    if not gaps:
        return 30, "mensual"
    median = statistics.median(gaps)
    for lo, hi, days, label in _PERIODICITY_BANDS:
        if lo <= median <= hi:
            return days, label
    return round(median), "irregular"


# ─────────────────────────────────────────────────────────────
# 1. Recurring expense detection
# ─────────────────────────────────────────────────────────────

def detect_recurring_expenses(
    transactions: list[EnrichedTransaction],
    today: Optional[date] = None,
    horizon_days: int = 30,
    min_occurrences: int = 2,
    amount_tolerance: float = 0.15,
) -> list[RecurringExpense]:
    """Detecta gastos recurrentes agrupando por comercio y verificando periodicidad + monto."""
    today = today or date.today()

    expenses = [
        tx for tx in transactions
        if tx.amount > 0 and tx.category not in _NON_RECURRING
    ]

    by_merchant: dict[str, list[EnrichedTransaction]] = defaultdict(list)
    for tx in expenses:
        by_merchant[_merchant_key(tx)].append(tx)

    recurring: list[RecurringExpense] = []

    for key, group in by_merchant.items():
        if len(group) < min_occurrences:
            continue

        group_sorted = sorted(group, key=lambda t: t.date)
        amounts = [t.amount for t in group_sorted]
        avg_amount = statistics.mean(amounts)

        if avg_amount <= 0:
            continue

        deviations = [abs(a - avg_amount) / avg_amount for a in amounts]
        if max(deviations) > amount_tolerance:
            continue

        dates = [_parse_date(t.date) for t in group_sorted]
        gaps = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
        periodicity_days, periodicity_label = _detect_periodicity(gaps)

        last_date = dates[-1]
        next_expected = last_date + timedelta(days=periodicity_days)
        days_until_next = (next_expected - today).days
        is_pending = 0 < days_until_next <= horizon_days

        display = (
            next((t.merchant_name for t in reversed(group_sorted) if t.merchant_name), None)
            or group_sorted[-1].name
        )

        recurring.append(RecurringExpense(
            merchant=display,
            avg_amount=round(avg_amount, 2),
            amount_variance=round(max(deviations), 3),
            periodicity_days=periodicity_days,
            periodicity_label=periodicity_label,
            last_seen_date=last_date.isoformat(),
            next_expected_date=next_expected.isoformat(),
            occurrences=len(group_sorted),
            category=group_sorted[-1].category,
            is_pending=is_pending,
        ))

    recurring.sort(key=lambda r: r.avg_amount, reverse=True)

    logger.info(
        "recurring_expenses_detected",
        extra={
            "total": len(recurring),
            "pending": sum(1 for r in recurring if r.is_pending),
            "step": "forecaster",
        },
    )
    return recurring


# ─────────────────────────────────────────────────────────────
# 2. Liquidity forecast — Día de Riesgo
# ─────────────────────────────────────────────────────────────

def compute_liquidity_forecast(
    recurring_expenses: list[RecurringExpense],
    saldo_actual: float,
    threshold: Optional[float] = None,
    ingresos_mensuales: Optional[float] = None,
    horizon_days: int = 30,
) -> tuple[float, Optional[LiquidityAlert]]:
    """Calcula liquidez proyectada y genera alerta si cae bajo el umbral."""
    pending = [r for r in recurring_expenses if r.is_pending]
    gastos_pendientes = sum(r.avg_amount for r in pending)
    liquidez_estimada = saldo_actual - gastos_pendientes

    if threshold is None:
        threshold = (ingresos_mensuales * 0.10) if ingresos_mensuales else 8_500.0

    if liquidez_estimada >= threshold:
        logger.info(
            "liquidity_ok",
            extra={
                "liquidez_estimada": round(liquidez_estimada, 2),
                "threshold": round(threshold, 2),
                "step": "forecaster",
            },
        )
        return liquidez_estimada, None

    if liquidez_estimada < 0:
        alert_type = "liquidez_critica"
        dias_riesgo = 0
    else:
        alert_type = "liquidez_baja"
        avg_daily_spend = gastos_pendientes / horizon_days if horizon_days > 0 else 1.0
        dias_riesgo = int(liquidez_estimada / avg_daily_spend) if avg_daily_spend > 0 else horizon_days

    message = (
        f"Tu liquidez estimada en {horizon_days} días es ${liquidez_estimada:.0f}, "
        f"por debajo del umbral de seguridad de ${threshold:.0f}. "
        f"Tienes {len(pending)} gasto(s) recurrente(s) pendiente(s) por ${gastos_pendientes:.0f}."
    )

    alert = LiquidityAlert(
        alert_type=alert_type,
        saldo_actual=round(saldo_actual, 2),
        liquidez_estimada=round(liquidez_estimada, 2),
        gastos_pendientes=round(gastos_pendientes, 2),
        threshold=round(threshold, 2),
        dias_riesgo=dias_riesgo,
        pending_expenses=pending,
        message=message,
    )

    logger.warning(
        "liquidity_alert_generated",
        extra={
            "alert_type": alert_type,
            "liquidez_estimada": round(liquidez_estimada, 2),
            "threshold": round(threshold, 2),
            "pending_count": len(pending),
            "step": "forecaster",
        },
    )
    return liquidez_estimada, alert


# ─────────────────────────────────────────────────────────────
# 3. Impulse spending detection
# ─────────────────────────────────────────────────────────────

def detect_impulse_spending(
    transactions: list[EnrichedTransaction],
    window_hours: int = 4,
    min_count: int = 3,
) -> list[ImpulseSpendingAlert]:
    """Detecta ráfagas de gasto impulsivo en una ventana temporal."""
    discretionary = [
        tx for tx in transactions
        if tx.amount > 0 and tx.category in _DISCRETIONARY
    ]

    if len(discretionary) < min_count:
        return []

    timed: list[tuple[EnrichedTransaction, datetime]] = []
    any_intraday = False

    for tx in discretionary:
        dt = _best_datetime(tx)
        if dt is None:
            continue
        if _has_intraday_time(tx):
            any_intraday = True
        timed.append((tx, dt))

    if len(timed) < min_count:
        return []

    timed.sort(key=lambda x: x[1])

    effective_window = timedelta(hours=window_hours if any_intraday else 24)

    alerts: list[ImpulseSpendingAlert] = []
    last_alert_end: Optional[datetime] = None

    i = 0
    while i < len(timed):
        anchor_tx, anchor_dt = timed[i]

        if last_alert_end is not None and anchor_dt <= last_alert_end:
            i += 1
            continue

        window_end_dt = anchor_dt + effective_window
        window_txs = [
            (tx, dt) for tx, dt in timed[i:]
            if dt <= window_end_dt
        ]

        if len(window_txs) >= min_count:
            total_amount = sum(tx.amount for tx, _ in window_txs)
            start_str = anchor_dt.isoformat()[:16]
            end_str = window_txs[-1][1].isoformat()[:16]

            message = (
                f"Detectados {len(window_txs)} gastos discrecionales seguidos "
                f"({start_str} – {end_str}) por ${total_amount:.2f}. "
                "Considera si todos eran necesarios."
            )

            alerts.append(ImpulseSpendingAlert(
                window_start=start_str,
                window_end=end_str,
                transaction_ids=[
                    tx.transaction_id or tx.name for tx, _ in window_txs
                ],
                transaction_names=[
                    tx.merchant_name or tx.name for tx, _ in window_txs
                ],
                total_amount=round(total_amount, 2),
                count=len(window_txs),
                message=message,
            ))

            last_alert_end = window_txs[-1][1]
            i += len(window_txs)
        else:
            i += 1

    logger.info(
        "impulse_alerts_generated",
        extra={"count": len(alerts), "step": "forecaster"},
    )
    return alerts


# ─────────────────────────────────────────────────────────────
# Orchestrator
# ─────────────────────────────────────────────────────────────

def run_cash_flow_analysis(
    transactions: list[EnrichedTransaction],
    saldo_actual: float,
    threshold: Optional[float] = None,
    ingresos_mensuales: Optional[float] = None,
    horizon_days: int = 30,
    impulse_window_hours: int = 4,
    today: Optional[date] = None,
) -> CashFlowResult:
    """RF3 + RF7 — Análisis completo de cash flow y alertas."""
    recurring = detect_recurring_expenses(
        transactions,
        today=today,
        horizon_days=horizon_days,
    )

    liquidez_estimada, liquidity_alert = compute_liquidity_forecast(
        recurring,
        saldo_actual=saldo_actual,
        threshold=threshold,
        ingresos_mensuales=ingresos_mensuales,
        horizon_days=horizon_days,
    )

    impulse_alerts = detect_impulse_spending(
        transactions,
        window_hours=impulse_window_hours,
    )

    return CashFlowResult(
        recurring_expenses=recurring,
        projected_liquidity=round(liquidez_estimada, 2),
        liquidity_alert=liquidity_alert,
        impulse_alerts=impulse_alerts,
        forecast_horizon_days=horizon_days,
    )
