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
    for route in ("/", "/classify", "/analyze", "/cashflow", "/whatif", "/test-bedrock", "/insights/action-plan", "/survival-mode"):
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


def test_action_plan_endpoint(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    from pipeline.domain.models.action_plan import ActionStep, InsightActionPlan

    fake_plan = InsightActionPlan(
        insight_titulo="Cancela tu suscripcion a Netflix",
        objetivo="Cancelar Netflix y liberar $179/mes.",
        pasos=[
            ActionStep(
                numero=1,
                titulo="Ir a la configuracion de cuenta",
                instruccion="Entra a netflix.com/youraccount en tu navegador.",
                tipo="cancelar",
                url="https://www.netflix.com/youraccount",
                duracion_minutos=1,
            ),
            ActionStep(
                numero=2,
                titulo="Confirmar cancelacion",
                instruccion="Click en 'Cancelar membresia' y confirma. Tu acceso sigue hasta fin de ciclo.",
                tipo="cancelar",
                duracion_minutos=2,
            ),
        ],
        ahorro_mensual_estimado=179.0,
        tiempo_total_minutos=3,
        es_accion_inmediata=True,
        nota_final="Revisa tu proximo estado de cuenta para confirmar que no hay cargo.",
    )

    async def _fake_run(insight):
        return fake_plan

    monkeypatch.setattr("pipeline.services.action_plan_service.run_action_plan", _fake_run)
    monkeypatch.setattr("pipeline.api.routes.action_plan.run_action_plan", _fake_run)

    payload = {
        "insight": {
            "title": "Cancela tu suscripcion a Netflix",
            "description": "Tienes un cargo de $179 al mes.",
            "priority": "alta",
            "potential_monthly_saving": 179.0,
            "affected_category": "suscripcion",
            "is_immediate_action": True,
        }
    }
    response = client.post("/insights/action-plan", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert len(body["data"]["plan"]["pasos"]) == 2
    assert body["data"]["plan"]["es_accion_inmediata"] is True


def test_survival_mode_endpoint(client: TestClient, patched_classify):
    payload = {
        "transactions": [
            {"transaction_id": "tx_001", "amount": 179.0, "name": "NETFLIX.COM", "merchant_name": "Netflix", "date": "2026-03-01"},
            {"transaction_id": "tx_002", "amount": 85.0, "name": "OXXO INSURGENTES", "merchant_name": "OXXO", "date": "2026-03-08"},
            {"transaction_id": "tx_003", "amount": 9200.0, "name": "RENTA DEPTO", "date": "2026-03-02"},
            {"transaction_id": "tx_004", "amount": -28500.0, "name": "NOMINA ACME CORP", "date": "2026-03-01"},
        ]
    }
    response = client.post("/survival-mode", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    survival = body["data"]["survival"]
    assert "ahorro_mensual_proyectado" in survival
    assert "runway_supervivencia_meses" in survival
    assert "categorias" in survival
    assert survival["ahorro_total_periodo"] >= 0


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
