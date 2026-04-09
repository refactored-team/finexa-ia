"""
API layer — Pydantic request, response and meta models.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from pipeline.domain.models import (
    BehavioralAnalysisResult,
    CashFlowResult,
    DailyPulse,
    EnrichedTransaction,
    InsightActionPlan,
    ResilienceScore,
    SpendingInsight,
    SurvivalModeResult,
    WhatIfResult,
)

# ─────────────────────────────────────────────────────────────
# Example payloads (reused across models)
# ─────────────────────────────────────────────────────────────

_EX_TXS = [
    {
        "transaction_id": "tx_001",
        "amount": 179.0,
        "name": "NETFLIX.COM",
        "merchant_name": "Netflix",
        "date": "2026-04-01",
        "iso_currency_code": "MXN",
        "personal_finance_category": {
            "primary": "ENTERTAINMENT",
            "detailed": "ENTERTAINMENT_TV_AND_MOVIES",
            "confidence_level": "VERY_HIGH",
        },
    },
    {
        "transaction_id": "tx_002",
        "amount": 85.0,
        "name": "OXXO INSURGENTES 482",
        "merchant_name": "OXXO",
        "date": "2026-04-03",
        "iso_currency_code": "MXN",
        "personal_finance_category": {
            "primary": "FOOD_AND_DRINK",
            "detailed": "FOOD_AND_DRINK_CONVENIENCE_STORES",
            "confidence_level": "VERY_HIGH",
        },
    },
    {
        "transaction_id": "tx_003",
        "amount": -35000.0,
        "name": "NOMINA ACME CORP SA DE CV",
        "date": "2026-04-01",
        "iso_currency_code": "MXN",
        "personal_finance_category": {
            "primary": "INCOME",
            "detailed": "INCOME_WAGES",
            "confidence_level": "VERY_HIGH",
        },
    },
]

_EX_PROFILE = {
    "edad": 29,
    "ocupacion": "Ingeniera de software",
    "ingresos_mensuales": 35000.0,
    "metas": ["fondo de emergencia", "viaje a Europa"],
    "dependientes": 0,
}


# ─────────────────────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    """
    Campos **mínimos** por transacción: `name`, `amount` (float), `date` (YYYY-MM-DD).

    Campos opcionales que mejoran la precisión:
    `transaction_id`, `merchant_name`, `iso_currency_code`, `pending`,
    `personal_finance_category { primary, detailed, confidence_level }`,
    `counterparties [{ name, type }]`
    """

    transactions: list[dict] = Field(
        ...,
        description="Lista de transacciones en formato Plaid.",
        min_length=1,
    )
    model_config = ConfigDict(json_schema_extra={"example": {"transactions": _EX_TXS}})


class AnalyzeRequest(BaseModel):
    transactions: list[dict] = Field(
        ..., description="Lista de transacciones en formato Plaid.", min_length=1
    )
    user_profile: Optional[dict] = Field(
        None,
        description=(
            "Perfil financiero del usuario. **Requerido para calcular el Score de Resiliencia.**\n\n"
            "Campos: `edad` (int 18-100), `ocupacion` (str), `ingresos_mensuales` (float > 0), "
            "`metas` (list[str]), `dependientes` (int >= 0)"
        ),
    )
    saldo_actual: Optional[float] = Field(
        None,
        description="Saldo actual de la cuenta en MXN. **Requerido para cash flow y daily pulse.**",
        examples=[12000.0],
    )
    liquidez_threshold: Optional[float] = Field(
        None,
        description="Umbral de alerta de liquidez (MXN). Default: 10% de `ingresos_mensuales` o $8,500.",
    )
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transactions": _EX_TXS,
                "user_profile": _EX_PROFILE,
                "saldo_actual": 12000.0,
                "liquidez_threshold": None,
            }
        }
    )


class CashFlowRequest(BaseModel):
    transactions: list[dict] = Field(
        ..., description="Lista de transacciones en formato Plaid.", min_length=1
    )
    saldo_actual: float = Field(
        ..., description="Saldo actual de la cuenta en MXN.", examples=[12000.0]
    )
    ingresos_mensuales: Optional[float] = Field(
        None,
        description="Ingreso mensual declarado. **Requerido para daily pulse y threshold automático.**",
        examples=[35000.0],
    )
    liquidez_threshold: Optional[float] = Field(
        None, description="Umbral de alerta personalizado (MXN)."
    )
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transactions": _EX_TXS,
                "saldo_actual": 12000.0,
                "ingresos_mensuales": 35000.0,
            }
        }
    )


class WhatIfRequest(BaseModel):
    """
    `scenario` acepta cualquier combinación (todos los campos son opcionales, default 0):

    | Campo | Rango | Descripción |
    |---|---|---|
    | `reduce_hormiga_pct` | 0–100 | % de reducción en gastos hormiga |
    | `reduce_variable_pct` | 0–100 | % de reducción en gastos variables |
    | `reduce_entretenimiento_pct` | 0–100 | % de reducción en entretenimiento |
    | `reduce_alimentacion_pct` | 0–100 | % de reducción en alimentación |
    | `reduce_transporte_pct` | 0–100 | % de reducción en transporte |
    | `reduce_suscripcion_pct` | 0–100 | % de reducción en suscripciones |
    | `nueva_ingresos_mensuales` | float > 0 | Nuevo ingreso mensual hipotético |
    | `extra_ahorro_mensual` | float >= 0 | Ahorro adicional mensual hipotético |
    """

    transactions: list[dict] = Field(
        ..., description="Lista de transacciones en formato Plaid.", min_length=1
    )
    user_profile: dict = Field(..., description="Perfil financiero del usuario (ver `/analyze`).")
    scenario: dict = Field(..., description="Escenario hipotético a simular.")
    saldo_actual: Optional[float] = Field(
        None,
        description="Saldo actual (MXN). Activa la comparación de liquidez antes/después.",
        examples=[12000.0],
    )
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transactions": _EX_TXS,
                "user_profile": _EX_PROFILE,
                "scenario": {"reduce_hormiga_pct": 50.0, "reduce_suscripcion_pct": 30.0},
                "saldo_actual": 12000.0,
            }
        }
    )


# ─────────────────────────────────────────────────────────────
# Meta models
# ─────────────────────────────────────────────────────────────

class ClassifyMeta(BaseModel):
    elapsed_ms: int     = Field(..., description="Tiempo de ejecución en ms.")
    total: int          = Field(..., description="Transacciones recibidas.")
    parsed: int         = Field(..., description="Parseadas correctamente.")
    classified: int     = Field(..., description="Clasificadas con éxito.")
    parse_errors: int   = Field(..., description="Fallaron al parsear.")
    from_cache: int     = Field(..., description="Clasificadas desde caché en memoria.")
    from_heuristic: int = Field(..., description="Clasificadas por reglas heurísticas (sin Bedrock).")
    from_bedrock: int   = Field(..., description="Clasificadas por Claude via Bedrock.")
    from_fallback: int  = Field(..., description="Fallback cuando Bedrock no estaba disponible.")


class AnalyzeMeta(BaseModel):
    elapsed_ms: int            = Field(..., description="Tiempo total en ms (Steps A+B+C+D en paralelo).")
    total_transactions: int    = Field(..., description="Transacciones recibidas.")
    parsed: int                = Field(..., description="Parseadas correctamente.")
    classified: int            = Field(..., description="Clasificadas.")
    parse_errors: int          = Field(..., description="Fallaron al parsear.")
    from_cache: int            = Field(..., description="Clasificadas desde caché.")
    from_heuristic: int        = Field(..., description="Clasificadas por heurísticas.")
    from_bedrock: int          = Field(..., description="Clasificadas por Bedrock.")
    from_fallback: int         = Field(..., description="Clasificadas por fallback.")
    ant_expenses_detected: int = Field(..., description="Transacciones marcadas como gasto hormiga.")


class SimpleMeta(BaseModel):
    elapsed_ms: int = Field(..., description="Tiempo de ejecución en ms.")
    classified: int = Field(..., description="Transacciones clasificadas internamente.")


# ─────────────────────────────────────────────────────────────
# Data models
# ─────────────────────────────────────────────────────────────

class ClassifyData(BaseModel):
    transactions: list[EnrichedTransaction] = Field(
        ...,
        description="Transacciones enriquecidas con `category`, `confidence`, `is_ant_expense` y `source`.",
    )


class AnalyzeData(BaseModel):
    classified: list[EnrichedTransaction] = Field(
        ..., description="Transacciones enriquecidas (mismo schema que `/classify`)."
    )
    analysis: Optional[BehavioralAnalysisResult] = Field(
        None,
        description=(
            "Análisis conductual: insights, risk_level, gastos hormiga. "
            "Usa fallback heurístico si Bedrock falla — **nunca es `null`** cuando hay transacciones."
        ),
    )
    resilience: Optional[ResilienceScore] = Field(
        None,
        description="Score 0–100 con 5 factores y explicación LLM. **`null` si no se envió `user_profile`.**",
    )
    cash_flow: Optional[CashFlowResult] = Field(
        None,
        description="Recurrentes, liquidez proyectada y alertas. **`null` si no se envió `saldo_actual`.**",
    )
    pulse: Optional[DailyPulse] = Field(
        None,
        description="Presupuesto libre del día. **`null` si faltan `saldo_actual` o `user_profile`.**",
    )


class CashFlowData(BaseModel):
    cash_flow: CashFlowResult = Field(..., description="Proyección de cash flow.")
    pulse: Optional[DailyPulse] = Field(
        None, description="Presupuesto libre del día. **`null` si no se envió `ingresos_mensuales`.**"
    )


class WhatIfData(BaseModel):
    result: WhatIfResult = Field(..., description="Resultado completo de la simulación.")


# ─────────────────────────────────────────────────────────────
# Response wrappers
# ─────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str = Field(..., examples=["finexa-ai-pipeline"])
    version: str = Field(..., examples=["1.0.0"])


class ClassifyResponse(BaseModel):
    ok: Literal[True] = True
    data: ClassifyData
    meta: ClassifyMeta


class AnalyzeResponse(BaseModel):
    ok: Literal[True] = True
    data: AnalyzeData
    meta: AnalyzeMeta


class CashFlowResponse(BaseModel):
    ok: Literal[True] = True
    data: CashFlowData
    meta: SimpleMeta


class WhatIfResponse(BaseModel):
    ok: Literal[True] = True
    data: WhatIfData
    meta: SimpleMeta


class ErrorResponse(BaseModel):
    ok: Literal[False] = False
    error: str = Field(..., description="Código de error en snake_case.", examples=["pipeline_failed"])
    detail: Optional[str] = Field(None, description="Mensaje detallado.")


# ─────────────────────────────────────────────────────────────
# Action plan (Step E)
# ─────────────────────────────────────────────────────────────

class ActionPlanRequest(BaseModel):
    """Solicitud de plan de accion para un insight especifico."""

    insight: SpendingInsight = Field(
        ...,
        description=(
            "El insight especifico seleccionado por el usuario en la UI. "
            "Debe provenir de la respuesta de `/analyze`."
        ),
        examples=[
            {
                "title": "Cancela tu suscripcion a Netflix",
                "description": "Tienes un cargo mensual de $179 que puedes cancelar ahora mismo.",
                "priority": "alta",
                "potential_monthly_saving": 179.0,
                "affected_category": "suscripcion",
                "is_immediate_action": True,
                "action_steps": [
                    "Entra a netflix.com/youraccount",
                    "Click en 'Cancelar membresia'",
                    "Confirma la cancelacion.",
                ],
                "action_url": "https://www.netflix.com/youraccount",
            }
        ],
    )


class ActionPlanData(BaseModel):
    plan: InsightActionPlan = Field(
        ...,
        description="Plan de accion estructurado con 2-4 pasos para resolver el insight.",
    )


class ActionPlanResponse(BaseModel):
    ok: Literal[True] = True
    data: ActionPlanData
    meta: SimpleMeta


# ─────────────────────────────────────────────────────────────
# Survival mode
# ─────────────────────────────────────────────────────────────

class SurvivalModeRequest(BaseModel):
    """Solicitud de calculo de Modo Supervivencia."""

    transactions: list[dict] = Field(
        ...,
        description="Lista de transacciones Plaid crudas (mismo formato que `/classify`).",
    )


class SurvivalModeData(BaseModel):
    survival: SurvivalModeResult = Field(
        ...,
        description="Resultado completo del Modo Supervivencia con ahorros, runway y desglose por categoria.",
    )


class SurvivalModeResponse(BaseModel):
    ok: Literal[True] = True
    data: SurvivalModeData
    meta: SimpleMeta
