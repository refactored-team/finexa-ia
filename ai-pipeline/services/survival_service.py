"""Survival mode service — orchestrates classification + survival computation."""

from __future__ import annotations

from pipeline.domain.classifier import classify_batch
from pipeline.domain.models import PlaidTransaction
from pipeline.domain.models.survival import SurvivalModeResult
from pipeline.domain.survival import compute_survival_mode
from pydantic import ValidationError

from pipeline.core.logger import get_logger

logger = get_logger(__name__)


async def run_survival_mode(
    raw_transactions: list[dict],
) -> tuple[SurvivalModeResult, int, int]:
    """
    Clasifica las transacciones y calcula el modo supervivencia.

    Returns:
        (SurvivalModeResult, n_classified, n_parse_errors)
    """
    transactions = []
    parse_errors = 0

    for i, raw in enumerate(raw_transactions):
        try:
            tx = PlaidTransaction.model_validate(raw)
            if not tx.transaction_id:
                tx.transaction_id = raw.get("transaction_id", f"tx_{i:04d}")
            transactions.append(tx)
        except ValidationError as exc:
            parse_errors += 1
            logger.warning("plaid_parse_error", extra={"error": str(exc), "tx_index": i})

    classified = await classify_batch(transactions) if transactions else []
    result = compute_survival_mode(classified)

    return result, len(classified), parse_errors
