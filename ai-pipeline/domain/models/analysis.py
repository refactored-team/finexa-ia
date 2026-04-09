"""Behavioral analysis schemas — Step B output."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from pipeline.domain.models.classification import FinexaCategory


class SpendingInsight(BaseModel):
    """One actionable insight from the behavioral analysis (Step B)."""

    title: str = Field(
        ...,
        max_length=80,
        description=(
            "Encabezado corto. Si es una acción inmediata debe empezar con un verbo "
            "imperativo claro (ej. 'Cancela tu suscripción a HBO Max')."
        ),
    )
    description: str = Field(
        ...,
        max_length=3000,
        description=(
            "Explicación breve del problema y por qué al usuario le conviene actuar. "
            "Los pasos concretos van en `action_steps`, no aquí."
        ),
    )
    priority: str = Field(..., pattern=r"^(alta|media|baja)$")
    potential_monthly_saving: float = Field(
        0.0,
        ge=0.0,
        description="Ahorro mensual estimado en MXN al ejecutar la acción.",
    )
    affected_category: FinexaCategory

    # ── Quick-win action fields ──────────────────────────────
    is_immediate_action: bool = Field(
        default=False,
        description=(
            "True cuando el usuario puede cerrar este mal hábito AHORA en menos de "
            "5 minutos (cancelar una suscripción online, dar de baja un servicio, etc.). "
            "La UI puede destacar estos insights con un botón de acción directa."
        ),
    )
    action_steps: Optional[list[str]] = Field(
        default=None,
        max_length=6,
        description=(
            "Pasos numerados para ejecutar la acción ahora mismo. Incluir URL/ruta "
            "exacta, nombres de menú/botones y qué confirmación aparece. Obligatorio "
            "cuando `is_immediate_action=true`."
        ),
    )
    action_url: Optional[str] = Field(
        default=None,
        max_length=300,
        description=(
            "URL directa al panel de cancelación o al sitio de gestión del servicio, "
            "cuando exista. Ejemplo: https://www.netflix.com/youraccount"
        ),
    )


class BehavioralAnalysisResult(BaseModel):
    """Schema for Bedrock Step B output."""
    ant_expense_total: float = Field(
        ..., description="Sum of all detected gastos hormiga in the period",
    )
    ant_expense_percentage: float = Field(
        ..., description="Gastos hormiga as % of total spending",
    )
    risk_level: str = Field(..., pattern=r"^(bajo|medio|alto|critico)$")
    insights: list[SpendingInsight] = Field(..., max_length=5)
    summary: str = Field(
        ..., max_length=5000,
        description="Plain-language summary of the user's spending behavior",
    )
