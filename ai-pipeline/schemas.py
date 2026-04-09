"""
Pydantic v2 schemas — strict typing for the entire pipeline.

Covers:
  - Plaid transaction input (personal_finance_category block included)
  - Bedrock classification output (Tool Use / structured JSON)
  - Behavioral analysis output
"""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# Plaid input schemas
# ─────────────────────────────────────────────────────────────

class PlaidPersonalFinanceCategory(BaseModel):
    """Maps Plaid's `personal_finance_category` block."""
    primary: str = Field(..., examples=["TRANSPORTATION"])
    detailed: str = Field(..., examples=["TRANSPORTATION_TAXIS_AND_RIDE_SHARES"])
    confidence_level: Optional[str] = Field(None, examples=["VERY_HIGH"])


class PlaidCounterparty(BaseModel):
    name: str
    type: str = "merchant"
    confidence_level: Optional[str] = None
    entity_id: Optional[str] = None
    website: Optional[str] = None


class PlaidTransaction(BaseModel):
    """Subset of Plaid's transaction schema relevant to classification."""
    transaction_id: Optional[str] = Field(None, alias="transaction_id")
    account_id: Optional[str] = None
    amount: float = Field(..., description="Positive = debit, negative = credit in Plaid")
    name: str = Field(..., description="Raw transaction name from bank")
    merchant_name: Optional[str] = None
    date: str
    datetime: Optional[str] = Field(None, description="ISO 8601 datetime with timezone, if available")
    authorized_datetime: Optional[str] = Field(None, description="Authorization datetime, usually more accurate")
    iso_currency_code: Optional[str] = "MXN"
    payment_channel: Optional[str] = None
    personal_finance_category: Optional[PlaidPersonalFinanceCategory] = None
    counterparties: list[PlaidCounterparty] = Field(default_factory=list)
    pending: bool = False

    class Config:
        populate_by_name = True


# ─────────────────────────────────────────────────────────────
# Internal / Bedrock output schemas
# ─────────────────────────────────────────────────────────────

class FinexaCategory(str, Enum):
    SUSCRIPCION = "suscripcion"
    FIJO = "fijo"
    HORMIGA = "hormiga"
    VARIABLE = "variable"
    INGRESO = "ingreso"
    TRANSPORTE = "transporte"
    ALIMENTACION = "alimentacion"
    SALUD = "salud"
    ENTRETENIMIENTO = "entretenimiento"
    TRANSFERENCIA = "transferencia"
    DESCONOCIDO = "desconocido"


class TransactionClassification(BaseModel):
    """Schema that Bedrock MUST return per transaction (Tool Use response)."""
    transaction_id: str
    category: FinexaCategory
    confidence: float = Field(..., ge=0.0, le=1.0)
    is_ant_expense: bool = Field(
        False,
        description="True if this is a 'gasto hormiga' — small, frequent, avoidable",
    )
    reasoning: Optional[str] = Field(
        None, max_length=2000,
        description="Brief justification for the classification",
    )


class ClassificationBatchResult(BaseModel):
    """Wrapper for the full batch response from Bedrock Step A."""
    classifications: list[TransactionClassification]


class SpendingInsight(BaseModel):
    """One actionable insight from the behavioral analysis (Step B)."""
    title: str = Field(..., max_length=80)
    description: str = Field(..., max_length=3000)
    priority: str = Field(..., pattern=r"^(alta|media|baja)$")
    potential_monthly_saving: float = Field(0.0, ge=0.0)
    affected_category: FinexaCategory


class BehavioralAnalysisResult(BaseModel):
    """Schema for Bedrock Step B output."""
    ant_expense_total: float = Field(
        ..., description="Sum of all detected gastos hormiga in the period",
    )
    ant_expense_percentage: float = Field(
        ..., description="Gastos hormiga as % of total spending",
    )
    risk_level: str = Field(..., pattern=r"^(bajo|medio|alto|critico)$")
    insights: list[SpendingInsight] = Field(..., max_items=5)
    summary: str = Field(
        ..., max_length=5000,
        description="Plain-language summary of the user's spending behavior",
    )


# ─────────────────────────────────────────────────────────────
# User profile (RF1 — El Escudo)
# ─────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    """Perfil financiero del usuario para el Score de Resiliencia."""
    edad: int = Field(..., ge=18, le=100, description="Edad del usuario")
    ocupacion: str = Field(..., max_length=100, description="Ocupación o profesión")
    ingresos_mensuales: float = Field(..., gt=0, description="Ingreso mensual declarado")
    metas: list[str] = Field(default_factory=list, description="Metas financieras (ej. fondo de emergencia, retiro)")
    dependientes: int = Field(0, ge=0, le=20, description="Número de dependientes económicos")


# ─────────────────────────────────────────────────────────────
# Resilience score (RF2 — El Escudo)
# ─────────────────────────────────────────────────────────────

class ResilienceFactorDetail(BaseModel):
    """Detalle de un factor individual del score de resiliencia."""
    nombre: str = Field(..., description="Identificador del factor")
    peso: float = Field(..., description="Peso del factor en la fórmula (0-1)")
    score_raw: float = Field(..., ge=0.0, le=100.0, description="Puntaje sin ponderar (0-100)")
    score_ponderado: float = Field(..., description="Contribución real al score total (score_raw × peso)")
    descripcion: str = Field(..., description="Explicación del valor calculado para este factor")


class ResilienceScore(BaseModel):
    """Score de resiliencia financiera calculado por el modelo XGBoost de SageMaker."""
    score_total: float = Field(..., ge=0.0, le=100.0, description="Puntaje final predicho por el modelo (0-100)")
    nivel: str = Field(
        ...,
        pattern=r"^(fragil|vulnerable|estable|resiliente)$",
        description="Categoría de resiliencia: fragil (<25), vulnerable (25-50), estable (50-75), resiliente (≥75)",
    )
    factores: list[ResilienceFactorDetail] = Field(..., description="Detalle de los 5 factores")
    raw_features: Optional[dict[str, float]] = Field(
        None,
        description=(
            "Features crudas enviadas al modelo XGBoost: "
            "ratio_ahorro (%), control_fijos (%), frec_hormiga (%), "
            "var_ingresos (%), runway (meses 0-12)"
        ),
    )
    explicacion_llm: Optional[str] = Field(
        None,
        description="Explicación en lenguaje natural generada por Bedrock sobre los 3 factores más impactantes",
    )


# ─────────────────────────────────────────────────────────────
# Enriched transaction (pipeline output)
# ─────────────────────────────────────────────────────────────

class EnrichedTransaction(BaseModel):
    """Final output: original Plaid data + classification metadata."""
    transaction_id: Optional[str] = None
    name: str
    merchant_name: Optional[str] = None
    amount: float
    date: str
    datetime: Optional[str] = Field(
        None,
        description="Best available ISO 8601 datetime (authorized_datetime > datetime > None). "
                    "Used for impulse-spending window detection.",
    )
    category: FinexaCategory
    confidence: float
    is_ant_expense: bool = False
    reasoning: Optional[str] = None
    source: str = Field(..., pattern=r"^(heuristic|bedrock|cache|fallback)$")


# ─────────────────────────────────────────────────────────────
# Cash-flow forecast (RF3 — El Radar / RF7 — El Filtro)
# ─────────────────────────────────────────────────────────────

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


# ─────────────────────────────────────────────────────────────
# Daily Pulse (RF3 — presupuesto libre del día)
# ─────────────────────────────────────────────────────────────

class DailyPulse(BaseModel):
    """Snapshot diario del presupuesto libre disponible."""
    reference_date: str = Field(..., description="Fecha de referencia (YYYY-MM-DD)")
    presupuesto_libre_diario: float = Field(
        ..., description="Dinero disponible para gastar hoy sin comprometer compromisos del mes",
    )
    saldo_actual: float
    gasto_fijo_mensual: float = Field(..., description="Total de gastos fijos + suscripciones del periodo")
    gasto_variable_hoy: float = Field(..., ge=0, description="Gasto variable registrado en la fecha de referencia")
    gasto_promedio_diario: float = Field(..., ge=0, description="Gasto variable promedio por día activo")
    dias_restantes_mes: int = Field(..., ge=1)
    porcentaje_consumido_mes: float = Field(..., ge=0, description="% del ingreso mensual ya gastado")
    alerta: Optional[Literal["presupuesto_agotado", "presupuesto_bajo"]] = None


# ─────────────────────────────────────────────────────────────
# What-If Simulator (RF — El Simulador)
# ─────────────────────────────────────────────────────────────

class WhatIfScenario(BaseModel):
    """Escenario hipotético para el simulador What-If."""
    reduce_hormiga_pct: float = Field(0.0, ge=0, le=100, description="% de reducción en gastos hormiga")
    reduce_variable_pct: float = Field(0.0, ge=0, le=100, description="% de reducción en gastos variables")
    reduce_entretenimiento_pct: float = Field(0.0, ge=0, le=100, description="% de reducción en entretenimiento")
    reduce_alimentacion_pct: float = Field(0.0, ge=0, le=100, description="% de reducción en alimentación")
    reduce_transporte_pct: float = Field(0.0, ge=0, le=100, description="% de reducción en transporte")
    reduce_suscripcion_pct: float = Field(0.0, ge=0, le=100, description="% de reducción en suscripciones")
    nueva_ingresos_mensuales: Optional[float] = Field(None, gt=0, description="Nuevo ingreso mensual hipotético (MXN)")
    extra_ahorro_mensual: float = Field(0.0, ge=0, description="Ahorro adicional mensual hipotético (MXN)")


class WhatIfDeltaFactor(BaseModel):
    """Delta de un factor individual entre escenario base y escenario hipotético."""
    factor: str
    score_antes: float = Field(..., ge=0, le=100)
    score_despues: float = Field(..., ge=0, le=100)
    delta: float = Field(..., description="score_despues − score_antes")


class WhatIfResult(BaseModel):
    """Resultado completo del simulador What-If."""
    escenario: WhatIfScenario
    score_antes: float = Field(..., ge=0, le=100)
    score_despues: float = Field(..., ge=0, le=100)
    nivel_antes: str = Field(..., pattern=r"^(fragil|vulnerable|estable|resiliente)$")
    nivel_despues: str = Field(..., pattern=r"^(fragil|vulnerable|estable|resiliente)$")
    delta_score: float = Field(..., description="score_despues − score_antes")
    delta_factores: list[WhatIfDeltaFactor]
    liquidez_antes: Optional[float] = None
    liquidez_despues: Optional[float] = None
    analisis_diferencial: str = Field(
        ..., max_length=2000,
        description="Análisis en lenguaje natural del impacto del escenario",
    )
