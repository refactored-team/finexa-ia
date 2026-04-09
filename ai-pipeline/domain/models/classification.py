"""Classification schemas — FinexaCategory enum + enriched transaction output."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


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
