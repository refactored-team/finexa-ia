"""
AWS Lambda entry point — SQS trigger.

Expects events of the form:

    {
        "Records": [
            {
                "messageId": "...",
                "body": "{\"user_id\": \"usr_123\", \"transactions\": [...], ...}"
            }
        ]
    }

Records are processed concurrently with asyncio.gather; failures are reported
through `batchItemFailures` so SQS can retry only the failed messages.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from pipeline.core.logger import get_logger
from pipeline.domain.models import UserProfile
from pipeline.services.pipeline_service import run_pipeline

logger = get_logger(__name__)


async def _process_sqs_record(record: dict) -> str | None:
    """
    Processes a single SQS record.
    Returns None on success; the messageId when it fails (for batchItemFailures).
    """
    message_id = record.get("messageId", "unknown")

    try:
        body = json.loads(record["body"])
        user_id = body.get("user_id", "anonymous")
        raw_transactions = body.get("transactions", [])

        profile: UserProfile | None = None
        if raw_profile := body.get("user_profile"):
            try:
                profile = UserProfile.model_validate(raw_profile)
            except Exception as exc:
                logger.warning(
                    "lambda_user_profile_invalid",
                    extra={"error": str(exc), "user_id": user_id, "step": "lambda"},
                )

        saldo: float | None = body.get("saldo_actual")

        logger.info(
            "lambda_processing_message",
            extra={
                "user_id": user_id,
                "tx_count": len(raw_transactions),
                "has_profile": profile is not None,
                "has_saldo": saldo is not None,
                "step": "lambda",
            },
        )

        result = await run_pipeline(
            raw_transactions,
            run_analysis=True,
            user_profile=profile,
            saldo_actual=saldo,
        )

        # ── Persist results here ──────────────────────────────
        # e.g., write to RDS/DynamoDB, push to SNS, etc.

        logger.info(
            "lambda_message_processed",
            extra={"user_id": user_id, **result["stats"], "step": "lambda"},
        )
        return None  # success

    except Exception as exc:
        logger.error(
            "lambda_message_failed",
            extra={"error": str(exc), "message_id": message_id, "step": "lambda"},
        )
        return message_id  # mark for SQS retry


async def _handle_event(event: dict) -> dict:
    """
    Processes all SQS records in the event concurrently.
    """
    records = event.get("Records", [])

    failed_ids = await asyncio.gather(*[
        _process_sqs_record(record) for record in records
    ])

    batch_item_failures = [
        {"itemIdentifier": msg_id}
        for msg_id in failed_ids
        if msg_id is not None
    ]

    return {"batchItemFailures": batch_item_failures}


def lambda_handler(event: dict, context: Any) -> dict:
    """
    AWS Lambda sync entry point. Runs the async event handler via asyncio.run.
    """
    return asyncio.run(_handle_event(event))
