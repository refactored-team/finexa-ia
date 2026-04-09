"""Post-validation rules for enriched transactions."""

from __future__ import annotations

from pipeline.domain.models import EnrichedTransaction


def apply_post_validation(tx: EnrichedTransaction) -> EnrichedTransaction:
    """Apply business post-validation rules to a classified transaction."""
    # 1. Gastos hormiga no pueden ser mayores a $500 MXN
    if tx.is_ant_expense and tx.amount > 500.0:
        tx.is_ant_expense = False
        note = "[Post-validación: eliminado flag de hormiga por monto > $500 MXN]"
        tx.reasoning = f"{tx.reasoning} {note}" if tx.reasoning else note

    # 2. Cap confidence at 0.95 (models tend to overstate at 1.0)
    if tx.confidence > 0.95:
        tx.confidence = 0.95

    return tx


def post_validate_batch(transactions: list[EnrichedTransaction]) -> list[EnrichedTransaction]:
    """Apply post-validation rules to a batch of enriched transactions."""
    for tx in transactions:
        apply_post_validation(tx)
    return transactions
