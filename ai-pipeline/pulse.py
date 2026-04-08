"""
RF3 — Daily Pulse: Presupuesto libre del día.

Calcula cuánto puede gastar el usuario hoy sin poner en riesgo
sus compromisos financieros del resto del mes.

Fórmula:
  gasto_fijo_mensual     = Σ(fijo + suscripcion del periodo)
  dinero_disponible      = saldo_actual − gasto_fijo_mensual
  presupuesto_libre_diario = dinero_disponible / dias_restantes_mes

  gasto_promedio_diario  = Σ(gasto_variable) / días_únicos_con_gasto
  alerta si presupuesto_libre_diario < 50% del gasto_promedio_diario
"""

from __future__ import annotations

import calendar
from datetime import date
from typing import Optional

from pipeline.logger import get_logger
from pipeline.schemas import DailyPulse, EnrichedTransaction, FinexaCategory

logger = get_logger(__name__)

_FIXED_CATEGORIES = {FinexaCategory.FIJO, FinexaCategory.SUSCRIPCION}
_SKIP_CATEGORIES = {FinexaCategory.INGRESO, FinexaCategory.TRANSFERENCIA}


def compute_daily_pulse(
    transactions: list[EnrichedTransaction],
    saldo_actual: float,
    ingresos_mensuales: float,
    reference_date: Optional[date] = None,
) -> DailyPulse:
    """
    Calcula el presupuesto libre del día.

    Args:
        transactions:       Transacciones clasificadas del periodo.
        saldo_actual:       Saldo actual de la cuenta (MXN).
        ingresos_mensuales: Ingreso mensual declarado (MXN).
        reference_date:     Fecha de referencia (default: hoy).

    Returns:
        DailyPulse con presupuesto libre y alertas si aplica.
    """
    ref = reference_date or date.today()
    days_in_month = calendar.monthrange(ref.year, ref.month)[1]
    # Include today in remaining days so budget covers today's spending
    dias_restantes = max(1, days_in_month - ref.day + 1)

    gasto_fijo = 0.0
    gasto_variable_total = 0.0
    gasto_variable_hoy = 0.0
    gasto_total = 0.0
    dias_con_gasto: set[str] = set()

    for tx in transactions:
        if tx.amount <= 0:
            continue  # income / refunds
        if tx.category in _SKIP_CATEGORIES:
            continue

        gasto_total += tx.amount

        if tx.category in _FIXED_CATEGORIES:
            gasto_fijo += tx.amount
        else:
            gasto_variable_total += tx.amount
            dias_con_gasto.add(tx.date)
            if tx.date == ref.isoformat():
                gasto_variable_hoy += tx.amount

    dias_activos = max(len(dias_con_gasto), 1)
    gasto_promedio_diario = gasto_variable_total / dias_activos

    # Available money after honoring all fixed commitments already observed
    dinero_disponible = max(0.0, saldo_actual - gasto_fijo)
    presupuesto_libre_diario = dinero_disponible / dias_restantes

    porcentaje_consumido = (gasto_total / max(ingresos_mensuales, 1.0)) * 100

    alerta: Optional[str] = None
    if presupuesto_libre_diario <= 0:
        alerta = "presupuesto_agotado"
    elif gasto_promedio_diario > 0 and presupuesto_libre_diario < gasto_promedio_diario * 0.5:
        alerta = "presupuesto_bajo"

    pulse = DailyPulse(
        reference_date=ref.isoformat(),
        presupuesto_libre_diario=round(presupuesto_libre_diario, 2),
        saldo_actual=round(saldo_actual, 2),
        gasto_fijo_mensual=round(gasto_fijo, 2),
        gasto_variable_hoy=round(gasto_variable_hoy, 2),
        gasto_promedio_diario=round(gasto_promedio_diario, 2),
        dias_restantes_mes=dias_restantes,
        porcentaje_consumido_mes=round(porcentaje_consumido, 1),
        alerta=alerta,
    )

    logger.info(
        "daily_pulse_computed",
        extra={
            "presupuesto_libre_diario": pulse.presupuesto_libre_diario,
            "dias_restantes": dias_restantes,
            "alerta": alerta,
            "step": "pulse",
        },
    )
    return pulse
