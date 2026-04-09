"""Behavioral analysis schemas — Step B output."""

from __future__ import annotations

from pydantic import BaseModel, Field

from pipeline.domain.models.classification import FinexaCategory


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
    insights: list[SpendingInsight] = Field(..., max_length=5)
    summary: str = Field(
        ..., max_length=5000,
        description="Plain-language summary of the user's spending behavior",
    )
