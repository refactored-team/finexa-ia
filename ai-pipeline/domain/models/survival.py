"""Survival mode schemas — what-if you cut all non-essential spending."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class SurvivalCategoryBreakdown(BaseModel):
    """Desglose de una categoria en modo supervivencia."""

    categoria: str = Field(..., description="Identificador de la categoria (ej. 'hormiga', 'fijo').")
    label: str = Field(..., description="Nombre legible para la UI (ej. 'Gastos hormiga').")
    estado: Literal["eliminado", "conservado"] = Field(
        ...,
        description=(
            "'eliminado': se recorta a cero en supervivencia. "
            "'conservado': se mantiene como gasto necesario."
        ),
    )
    gasto_periodo: float = Field(
        ..., ge=0.0,
        description="Gasto total en esta categoria durante el periodo analizado (MXN).",
    )
    ahorro_generado: float = Field(
        ..., ge=0.0,
        description="Cuanto se ahorra al aplicar supervivencia. 0 si la categoria se conserva.",
    )
    transacciones: int = Field(..., ge=0, description="Numero de transacciones en esta categoria.")
    gasto_promedio_por_tx: float = Field(
        ..., ge=0.0,
        description="Ticket promedio por transaccion en esta categoria.",
    )


class SurvivalModeResult(BaseModel):
    """Resultado completo del calculo de Modo Supervivencia."""

    # ── Periodo analizado ────────────────────────────────────
    dias_del_periodo: int = Field(
        ..., ge=1,
        description="Duracion del periodo analizado en dias (calculada desde la primera a la ultima tx).",
    )

    # ── Gasto actual vs supervivencia ───────────────────────
    gasto_total_actual: float = Field(
        ..., ge=0.0,
        description="Gasto total del periodo (todas las categorias de egreso).",
    )
    gasto_total_supervivencia: float = Field(
        ..., ge=0.0,
        description="Gasto total si solo se conservan las categorias necesarias.",
    )
    ahorro_total_periodo: float = Field(
        ..., ge=0.0,
        description="Diferencia entre gasto actual y gasto en supervivencia durante el periodo.",
    )
    reduccion_gasto_pct: float = Field(
        ..., ge=0.0, le=100.0,
        description="Porcentaje de reduccion del gasto total al activar supervivencia.",
    )

    # ── Proyeccion mensual (30 dias) ─────────────────────────
    ahorro_mensual_proyectado: float = Field(
        ..., ge=0.0,
        description="Ahorro proyectado a 30 dias normalizado por la duracion del periodo.",
    )
    gasto_mensual_actual_proyectado: float = Field(
        ..., ge=0.0,
        description="Gasto mensual actual proyectado a 30 dias.",
    )
    gasto_mensual_supervivencia_proyectado: float = Field(
        ..., ge=0.0,
        description="Gasto mensual en supervivencia proyectado a 30 dias.",
    )

    # ── Ingresos y balance ───────────────────────────────────
    ingreso_total_periodo: float = Field(
        ..., ge=0.0,
        description="Ingresos totales observados en el periodo.",
    )
    balance_actual_periodo: float = Field(
        ...,
        description="Balance neto actual: ingreso - gasto_actual.",
    )
    balance_supervivencia_periodo: float = Field(
        ...,
        description="Balance neto en supervivencia: ingreso - gasto_supervivencia.",
    )

    # ── Runway ───────────────────────────────────────────────
    runway_actual_meses: float = Field(
        ..., ge=0.0,
        description=(
            "Meses que podrias sostenerte con el ahorro actual si perdieras todos tus ingresos. "
            "Calculado como balance_actual / gasto_mensual_actual. 0 si el balance es negativo."
        ),
    )
    runway_supervivencia_meses: float = Field(
        ..., ge=0.0,
        description="Runway en supervivencia: cuanto tiempo aguantarias gastando solo lo necesario.",
    )

    # ── Stats rapidos ────────────────────────────────────────
    ahorro_diario_promedio: float = Field(
        ..., ge=0.0,
        description="Cuanto ahorras por dia al activar supervivencia (ahorro_total / dias).",
    )
    gasto_hormiga_diario_promedio: float = Field(
        ..., ge=0.0,
        description="Cuanto gastas en promedio por dia en gastos hormiga en el periodo actual.",
    )
    transacciones_eliminadas: int = Field(
        ..., ge=0,
        description="Numero de transacciones que desaparecen en modo supervivencia.",
    )
    transacciones_conservadas: int = Field(
        ..., ge=0,
        description="Numero de transacciones que se mantienen en modo supervivencia.",
    )

    # ── Desglose por categoria ───────────────────────────────
    categorias: list[SurvivalCategoryBreakdown] = Field(
        ...,
        description="Desglose por categoria ordenado por ahorro_generado descendente.",
    )

    # ── Top insight ──────────────────────────────────────────
    categoria_mayor_ahorro: Optional[str] = Field(
        None,
        description="Nombre de la categoria que genera el mayor ahorro al eliminarse.",
    )
    mayor_ahorro_monto: float = Field(
        0.0, ge=0.0,
        description="Monto ahorrado por la categoria de mayor impacto.",
    )
    porcentaje_ingreso_liberado: float = Field(
        ..., ge=0.0,
        description=(
            "Que porcentaje del ingreso total se libera al activar supervivencia. "
            "0 si no hay ingresos registrados."
        ),
    )
