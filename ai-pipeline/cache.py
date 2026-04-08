"""
Merchant classification cache — avoids redundant Bedrock calls.

In production, swap InMemoryCache for RedisCache (same interface).
Both implement the same get/set contract.
"""

from __future__ import annotations

import hashlib
import json
import time
from typing import Optional, Protocol

from pipeline.logger import get_logger
from pipeline.schemas import FinexaCategory

logger = get_logger(__name__)


class CacheEntry:
    __slots__ = ("category", "confidence", "is_ant_expense", "timestamp")

    def __init__(
        self,
        category: FinexaCategory,
        confidence: float,
        is_ant_expense: bool,
        timestamp: float | None = None,
    ):
        self.category = category
        self.confidence = confidence
        self.is_ant_expense = is_ant_expense
        self.timestamp = timestamp or time.time()

    def is_expired(self, ttl_seconds: int) -> bool:
        return (time.time() - self.timestamp) > ttl_seconds

    def to_dict(self) -> dict:
        return {
            "category": self.category.value,
            "confidence": self.confidence,
            "is_ant_expense": self.is_ant_expense,
            "timestamp": self.timestamp,
        }


class ClassificationCache(Protocol):
    def get(self, key: str) -> Optional[CacheEntry]: ...
    def set(self, key: str, entry: CacheEntry) -> None: ...


# ─────────────────────────────────────────────────────────────
# In-memory cache (Lambda warm starts / ECS container lifetime)
# ─────────────────────────────────────────────────────────────

class InMemoryCache:
    """Dict-backed cache. Persists across warm Lambda invocations."""

    def __init__(self, ttl_seconds: int = 86_400):
        self._store: dict[str, CacheEntry] = {}
        self._ttl = ttl_seconds

    def get(self, key: str) -> Optional[CacheEntry]:
        entry = self._store.get(key)
        if entry is None:
            return None
        if entry.is_expired(self._ttl):
            del self._store[key]
            return None
        return entry

    def set(self, key: str, entry: CacheEntry) -> None:
        self._store[key] = entry

    @property
    def size(self) -> int:
        return len(self._store)


# ─────────────────────────────────────────────────────────────
# Redis cache stub (production replacement)
# ─────────────────────────────────────────────────────────────

class RedisCache:
    """
    Redis-backed cache for ECS / multi-container deployments.
    Requires `redis` package: pip install redis

    Usage:
        import redis
        pool = redis.ConnectionPool(host="your-elasticache-endpoint", port=6379)
        cache = RedisCache(redis.Redis(connection_pool=pool))
    """

    def __init__(self, client: "redis.Redis", ttl_seconds: int = 86_400, prefix: str = "finexa:merchant:"):
        self._client = client
        self._ttl = ttl_seconds
        self._prefix = prefix

    def get(self, key: str) -> Optional[CacheEntry]:
        raw = self._client.get(f"{self._prefix}{key}")
        if raw is None:
            return None
        data = json.loads(raw)
        return CacheEntry(
            category=FinexaCategory(data["category"]),
            confidence=data["confidence"],
            is_ant_expense=data["is_ant_expense"],
            timestamp=data.get("timestamp", 0),
        )

    def set(self, key: str, entry: CacheEntry) -> None:
        self._client.setex(
            f"{self._prefix}{key}",
            self._ttl,
            json.dumps(entry.to_dict()),
        )


# ─────────────────────────────────────────────────────────────
# Key generation
# ─────────────────────────────────────────────────────────────

def make_cache_key(merchant_name: str | None, plaid_category: str | None = None) -> str | None:
    """
    Build a deterministic cache key from merchant + Plaid primary category.
    Returns None if there's not enough info to cache.
    """
    if not merchant_name:
        return None
    raw = merchant_name.strip().lower()
    if plaid_category:
        raw += f"|{plaid_category.strip().lower()}"
    return hashlib.md5(raw.encode()).hexdigest()


# Module-level default cache (warm across Lambda invocations)
default_cache: ClassificationCache = InMemoryCache(ttl_seconds=86_400)
