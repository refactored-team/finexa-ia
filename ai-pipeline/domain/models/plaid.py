"""Plaid transaction input schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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

    model_config = ConfigDict(populate_by_name=True)
