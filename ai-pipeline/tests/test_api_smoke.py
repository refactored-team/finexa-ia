"""
Basic smoke tests for the refactored FastAPI app.

These tests avoid hitting real AWS services by monkeypatching the
classification layer. They exist to catch import/wiring regressions.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from pipeline.domain.models import EnrichedTransaction, FinexaCategory
from pipeline.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _fake_enriched(name: str, amount: float, cat: FinexaCategory) -> EnrichedTransaction:
    return EnrichedTransaction(
        transaction_id=f"tx_{name}",
        name=name,
        merchant_name=name,
        amount=amount,
        date="2026-04-01",
        category=cat,
        confidence=0.95,
        is_ant_expense=cat == FinexaCategory.HORMIGA,
        reasoning="test",
        source="heuristic",
    )


@pytest.fixture
def patched_classify(monkeypatch: pytest.MonkeyPatch):
    """Bypass Bedrock: return deterministic enriched transactions."""

    async def _fake(transactions):
        return [
            _fake_enriched("Netflix", 179.0, FinexaCategory.SUSCRIPCION),
            _fake_enriched("OXXO", 85.0, FinexaCategory.HORMIGA),
        ]

    monkeypatch.setattr(
        "pipeline.services.classification_service.classify_batch",
        _fake,
    )


def test_app_imports():
    """App should import without raising."""
    assert app.title == "Finexa AI Pipeline"


def test_health_check(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "service" in body
    assert "version" in body


def test_openapi_schema_has_routes(client: TestClient):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    for route in ("/", "/classify", "/analyze", "/cashflow", "/whatif", "/test-bedrock"):
        assert route in paths, f"missing route {route}"


def test_classify_endpoint(client: TestClient, patched_classify):
    payload = {
        "transactions": [
            {
                "transaction_id": "tx_001",
                "amount": 179.0,
                "name": "NETFLIX.COM",
                "merchant_name": "Netflix",
                "date": "2026-04-01",
            },
            {
                "transaction_id": "tx_002",
                "amount": 85.0,
                "name": "OXXO INSURGENTES 482",
                "merchant_name": "OXXO",
                "date": "2026-04-03",
            },
        ]
    }
    response = client.post("/classify", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert len(body["data"]["transactions"]) == 2
    assert body["meta"]["classified"] == 2


def test_cashflow_endpoint(client: TestClient, patched_classify):
    payload = {
        "transactions": [
            {
                "transaction_id": "tx_001",
                "amount": 179.0,
                "name": "NETFLIX.COM",
                "merchant_name": "Netflix",
                "date": "2026-04-01",
            },
        ],
        "saldo_actual": 12000.0,
        "ingresos_mensuales": 35000.0,
    }
    response = client.post("/cashflow", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert "cash_flow" in body["data"]
    assert body["data"]["pulse"] is not None
