"""What-If simulator schemas — RF El Simulador."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


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
    escenario: "WhatIfScenario"
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
