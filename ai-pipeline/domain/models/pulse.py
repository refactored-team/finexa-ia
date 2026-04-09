"""Daily pulse schema — RF3 presupuesto libre del día."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


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
