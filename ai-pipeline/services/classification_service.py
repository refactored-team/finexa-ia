"""
Classification service — parses raw Plaid dicts and runs Step A only.
Used by the `/classify` endpoint.
"""

from __future__ import annotations

from pydantic import ValidationError

from pipeline.core.logger import get_logger
from pipeline.domain.classifier import classify_batch
from pipeline.domain.models import EnrichedTransaction, PlaidTransaction

logger = get_logger(__name__)


def parse_plaid_transactions(
    raw_list: list[dict],
) -> tuple[list[PlaidTransaction], int]:
    """Parse Plaid dicts → PlaidTransaction. Returns (parsed, n_errors)."""
    parsed: list[PlaidTransaction] = []
    errors = 0
    for i, raw in enumerate(raw_list):
        try:
            tx = PlaidTransaction.model_validate(raw)
            if not tx.transaction_id:
                tx.transaction_id = raw.get("transaction_id", f"tx_{i:04d}")
            parsed.append(tx)
        except ValidationError:
            errors += 1
    return parsed, errors


async def classify_transactions(
    raw_transactions: list[dict],
) -> tuple[list[EnrichedTransaction], int, int]:
    """
    Parse + classify a batch of Plaid transactions.

    Returns:
        (enriched_transactions, n_parsed, n_parse_errors)
    """
    parsed, parse_errors = parse_plaid_transactions(raw_transactions)
    classified = await classify_batch(parsed) if parsed else []
    return classified, len(parsed), parse_errors
