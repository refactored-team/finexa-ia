"""
Structured JSON logging for CloudWatch.

Usage:
    from pipeline.logger import get_logger
    logger = get_logger(__name__)
    logger.info("msg", extra={"user_id": "usr_123", "tx_count": 5})
"""

import json
import logging
import sys
from datetime import datetime, timezone


class CloudWatchJsonFormatter(logging.Formatter):
    """Emits one JSON object per log line — CloudWatch Logs Insights compatible."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Merge any extra fields passed via `extra={...}`
        for key in (
            # pipeline context
            "user_id", "tx_count", "merchant", "category",
            "source", "error", "step", "cache_hit", "batch_size",
            # bedrock timing
            "operation", "model_id", "attempt",
            "attempt_ms", "total_ms", "elapsed_ms",
            # legacy (kept for backwards compat)
            "latency_ms", "delay_s",
        ):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False, default=str)


def get_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CloudWatchJsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(level)
        logger.propagate = False
    return logger
