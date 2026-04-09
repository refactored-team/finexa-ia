"""Resilience score schemas — RF1/RF2 El Escudo."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """Perfil financiero del usuario para el Score de Resiliencia."""
    edad: int = Field(..., ge=18, le=100, description="Edad del usuario")
    ocupacion: str = Field(..., max_length=100, description="Ocupación o profesión")
    ingresos_mensuales: float = Field(..., gt=0, description="Ingreso mensual declarado")
    metas: list[str] = Field(default_factory=list, description="Metas financieras (ej. fondo de emergencia, retiro)")
    dependientes: int = Field(0, ge=0, le=20, description="Número de dependientes económicos")


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
