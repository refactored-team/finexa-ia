"""
Step A — Transaction Classification Pipeline.

Flow: Plaid transactions → cache check → heuristic filter → Bedrock Tool Use → enriched output.

Los batches de Bedrock corren en paralelo con asyncio.gather() para reducir
la latencia total cuando hay múltiples transacciones ambiguas.
"""

from __future__ import annotations

import asyncio
import json

from pipeline.core.config import settings
from pipeline.core.logger import get_logger
from pipeline.domain.heuristics import classify_heuristic, fallback_classify
from pipeline.domain.models import (
    EnrichedTransaction,
    PlaidTransaction,
    TransactionClassification,
)
from pipeline.domain.validators import post_validate_batch
from pipeline.infrastructure.bedrock import invoke_classification
from pipeline.infrastructure.cache import (
    CacheEntry,
    ClassificationCache,
    default_cache,
    make_cache_key,
)
from pipeline.infrastructure.prompts import CLASSIFICATION_SYSTEM_PROMPT

logger = get_logger(__name__)


def _build_classification_prompt(transactions: list[PlaidTransaction]) -> str:
    """
    Formatea transacciones para el prompt de clasificación.

    Usa índice posicional (0, 1, 2…) como transaction_id para Bedrock,
    inmune a truncaciones o variaciones de whitespace en el echo de IDs arbitrarios.
    """
    tx_data = []
    for i, tx in enumerate(transactions):
        entry = {
            "transaction_id": str(i),
            "name": tx.name,
            "amount": tx.amount,
            "date": tx.date,
        }
        if tx.merchant_name:
            entry["merchant_name"] = tx.merchant_name
        if tx.personal_finance_category:
            entry["plaid_category"] = tx.personal_finance_category.primary
        tx_data.append(entry)

    return f"Classify these transactions:\n{json.dumps(tx_data, ensure_ascii=False, indent=2)}"


async def _classify_single_batch(
    batch: list[PlaidTransaction],
    model_id: str,
    cache: ClassificationCache,
) -> list[EnrichedTransaction]:
    """
    Clasifica un solo batch contra Bedrock.
    Si Bedrock falla, todos los elementos caen al fallback heurístico.
    """
    try:
        prompt = _build_classification_prompt(batch)
        bedrock_result = await invoke_classification(
            system_prompt=CLASSIFICATION_SYSTEM_PROMPT,
            user_prompt=prompt,
            model_id=model_id,
        )

        ai_map: dict[str, TransactionClassification] = {
            c.transaction_id.strip(): c for c in bedrock_result.classifications
        }

        enriched_batch: list[EnrichedTransaction] = []
        for i, tx in enumerate(batch):
            ai_result = ai_map.get(str(i))
            if ai_result is None:
                logger.warning(
                    "bedrock_id_mismatch",
                    extra={
                        "expected_index": i,
                        "transaction_id": tx.transaction_id,
                        "name": tx.name,
                        "returned_ids": list(ai_map.keys()),
                    },
                )

            if ai_result:
                enriched = EnrichedTransaction(
                    transaction_id=tx.transaction_id,
                    name=tx.name,
                    merchant_name=tx.merchant_name,
                    amount=tx.amount,
                    date=tx.date,
                    datetime=tx.authorized_datetime or tx.datetime,
                    category=ai_result.category,
                    confidence=ai_result.confidence,
                    is_ant_expense=ai_result.is_ant_expense,
                    reasoning=ai_result.reasoning,
                    source="bedrock",
                )
                cache_key = make_cache_key(
                    tx.merchant_name,
                    tx.personal_finance_category.primary if tx.personal_finance_category else None,
                )
                if cache_key:
                    cache.set(cache_key, CacheEntry(
                        category=ai_result.category,
                        confidence=ai_result.confidence,
                        is_ant_expense=ai_result.is_ant_expense,
                    ))
            else:
                fb = fallback_classify(tx)
                enriched = EnrichedTransaction(
                    transaction_id=tx.transaction_id,
                    name=tx.name,
                    merchant_name=tx.merchant_name,
                    amount=tx.amount,
                    date=tx.date,
                    datetime=tx.authorized_datetime or tx.datetime,
                    category=fb.category,
                    confidence=fb.confidence,
                    is_ant_expense=fb.is_ant_expense,
                    reasoning=fb.reasoning,
                    source="fallback",
                )

            enriched_batch.append(enriched)

        return enriched_batch

    except Exception as exc:
        logger.error(
            "bedrock_failed_using_fallback",
            extra={"error": str(exc), "batch_size": len(batch), "step": "classification"},
        )
        return [
            EnrichedTransaction(
                transaction_id=tx.transaction_id,
                name=tx.name,
                merchant_name=tx.merchant_name,
                amount=tx.amount,
                date=tx.date,
                datetime=tx.authorized_datetime or tx.datetime,
                **{k: v for k, v in vars(fallback_classify(tx)).items()
                   if k in ("category", "confidence", "is_ant_expense", "reasoning")},
                source="fallback",
            )
            for tx in batch
        ]


async def classify_batch(
    transactions: list[PlaidTransaction],
    cache: ClassificationCache | None = None,
    model_id: str | None = None,
) -> list[EnrichedTransaction]:
    """
    Pipeline de clasificación completo para un batch de transacciones Plaid.

    1. Verificar caché por merchant_name
    2. Filtro heurístico en los no cacheados
    3. Enviar los ambiguos a Bedrock (batches en paralelo con asyncio.gather)
    4. Fallback a heurísticas si Bedrock falla
    5. Actualizar caché con nuevas clasificaciones
    """
    cache = cache or default_cache
    model_id = model_id or settings.bedrock_model_sonnet
    batch_size = settings.classification_batch_size

    results: list[EnrichedTransaction] = []
    needs_bedrock: list[PlaidTransaction] = []

    # ── Fase 1: Caché + Heurísticas (secuencial, rápido) ────────
    for tx in transactions:
        cache_key = make_cache_key(
            tx.merchant_name,
            tx.personal_finance_category.primary if tx.personal_finance_category else None,
        )
        if cache_key:
            cached = cache.get(cache_key)
            if cached is not None:
                logger.info(
                    "cache_hit",
                    extra={"merchant": tx.merchant_name, "cache_hit": True},
                )
                results.append(EnrichedTransaction(
                    transaction_id=tx.transaction_id,
                    name=tx.name,
                    merchant_name=tx.merchant_name,
                    amount=tx.amount,
                    date=tx.date,
                    datetime=tx.authorized_datetime or tx.datetime,
                    category=cached.category,
                    confidence=cached.confidence,
                    is_ant_expense=cached.is_ant_expense,
                    reasoning="Cached classification",
                    source="cache",
                ))
                continue

        heuristic_result = classify_heuristic(tx)
        if heuristic_result is not None:
            logger.info(
                "heuristic_hit",
                extra={
                    "merchant": tx.merchant_name or tx.name,
                    "category": heuristic_result.category.value,
                    "source": "heuristic",
                },
            )
            enriched = EnrichedTransaction(
                transaction_id=tx.transaction_id,
                name=tx.name,
                merchant_name=tx.merchant_name,
                amount=tx.amount,
                date=tx.date,
                datetime=tx.authorized_datetime or tx.datetime,
                category=heuristic_result.category,
                confidence=heuristic_result.confidence,
                is_ant_expense=heuristic_result.is_ant_expense,
                reasoning=heuristic_result.reasoning,
                source="heuristic",
            )
            results.append(enriched)

            if cache_key:
                cache.set(cache_key, CacheEntry(
                    category=heuristic_result.category,
                    confidence=heuristic_result.confidence,
                    is_ant_expense=heuristic_result.is_ant_expense,
                ))
            continue

        needs_bedrock.append(tx)

    # ── Fase 2: Bedrock en paralelo (batches concurrentes) ──────
    if needs_bedrock:
        batches = [
            needs_bedrock[i: i + batch_size]
            for i in range(0, len(needs_bedrock), batch_size)
        ]

        logger.info(
            "bedrock_batch_start",
            extra={
                "total_to_classify": len(needs_bedrock),
                "num_batches": len(batches),
                "step": "classification",
            },
        )

        batch_results = await asyncio.gather(*[
            _classify_single_batch(batch, model_id, cache)
            for batch in batches
        ])

        for batch_enriched in batch_results:
            results.extend(batch_enriched)

    logger.info(
        "classification_complete",
        extra={
            "total": len(results),
            "tx_count": len(transactions),
            "from_cache": sum(1 for r in results if r.source == "cache"),
            "from_heuristic": sum(1 for r in results if r.source == "heuristic"),
            "from_bedrock": sum(1 for r in results if r.source == "bedrock"),
            "from_fallback": sum(1 for r in results if r.source == "fallback"),
        },
    )

    return post_validate_batch(results)
