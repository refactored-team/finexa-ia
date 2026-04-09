"""Cash-flow schemas — RF3 El Radar + RF7 El Filtro."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

from pipeline.domain.models.classification import FinexaCategory


class RecurringExpense(BaseModel):
    """Gasto recurrente detectado: mismo comercio, monto ±15%, periodicidad consistente."""
    merchant: str = Field(..., description="Nombre canónico del comercio")
    avg_amount: float = Field(..., gt=0, description="Monto promedio de las ocurrencias")
    amount_variance: float = Field(
        ..., ge=0,
        description="Máxima desviación del monto como fracción del promedio (0.15 = 15%)",
    )
    periodicity_days: int = Field(..., gt=0, description="Periodicidad detectada en días")
    periodicity_label: str = Field(
        ...,
        pattern=r"^(semanal|quincenal|mensual|irregular)$",
        description="Etiqueta legible de la periodicidad",
    )
    last_seen_date: str = Field(..., description="Fecha de la última ocurrencia (YYYY-MM-DD)")
    next_expected_date: str = Field(..., description="Fecha estimada del próximo cobro (YYYY-MM-DD)")
    occurrences: int = Field(..., ge=2, description="Número de veces observado en el periodo")
    category: FinexaCategory
    is_pending: bool = Field(
        ...,
        description="True si el próximo cobro cae dentro del horizonte de proyección y no ha ocurrido",
    )


class LiquidityAlert(BaseModel):
    """Alerta de Día de Riesgo: liquidez proyectada cae bajo el umbral de seguridad."""
    alert_type: Literal["liquidez_critica", "liquidez_baja"]
    saldo_actual: float = Field(..., description="Saldo actual de la cuenta")
    liquidez_estimada: float = Field(..., description="saldo_actual − Σ(recurrentes pendientes)")
    gastos_pendientes: float = Field(..., ge=0, description="Suma de recurrentes pendientes en el horizonte")
    threshold: float = Field(..., ge=0, description="Umbral que disparó la alerta")
    dias_riesgo: int = Field(..., ge=0, description="Días estimados hasta que la liquidez sea crítica")
    pending_expenses: list[RecurringExpense] = Field(..., description="Gastos recurrentes que generan el riesgo")
    message: str = Field(..., max_length=500)


class ImpulseSpendingAlert(BaseModel):
    """Alerta de gasto impulsivo: 3+ gastos discrecionales en ventana de 2-4 horas."""
    window_start: str = Field(..., description="Inicio de la ventana (ISO datetime o fecha)")
    window_end: str = Field(..., description="Fin de la ventana")
    transaction_ids: list[str] = Field(..., description="IDs o nombres de las transacciones involucradas")
    transaction_names: list[str] = Field(..., description="Nombres de comercios en la ventana")
    total_amount: float = Field(..., gt=0, description="Suma de los gastos en la ventana")
    count: int = Field(..., ge=3, description="Número de gastos discrecionales detectados")
    message: str = Field(..., max_length=500)


class CashFlowResult(BaseModel):
    """Resultado completo del análisis de cash flow: recurrentes + liquidez + alertas."""
    recurring_expenses: list[RecurringExpense] = Field(
        default_factory=list,
        description="Gastos recurrentes detectados en el periodo",
    )
    projected_liquidity: float = Field(
        ...,
        description="Liquidez estimada: saldo_actual − recurrentes pendientes",
    )
    liquidity_alert: Optional[LiquidityAlert] = Field(
        None,
        description="Alerta de liquidez si projected_liquidity < threshold",
    )
    impulse_alerts: list[ImpulseSpendingAlert] = Field(
        default_factory=list,
        description="Alertas de gasto impulsivo detectadas",
    )
    forecast_horizon_days: int = Field(30, gt=0, description="Horizonte de proyección en días")
