"""
RF — Simulador What-If.

Recibe un escenario hipotético (reducción de categorías, nuevo ingreso) y:
  1. Aplica los cambios sobre las transacciones del periodo
  2. Recalcula el Score de Resiliencia con los datos modificados
  3. Compara liquidez proyectada antes vs después (si hay saldo_actual)
  4. Genera un análisis diferencial en lenguaje natural via Bedrock
"""

from __future__ import annotations

from typing import Optional

from pipeline.core.config import settings
from pipeline.core.logger import get_logger
from pipeline.domain.forecaster import run_cash_flow_analysis
from pipeline.domain.models import (
    EnrichedTransaction,
    FinexaCategory,
    UserProfile,
    WhatIfDeltaFactor,
    WhatIfResult,
    WhatIfScenario,
)
from pipeline.domain.resilience import compute_resilience_score
from pipeline.infrastructure.bedrock import invoke_whatif_analysis

logger = get_logger(__name__)

# Maps WhatIfScenario field prefix → FinexaCategory set
_CATEGORY_MAP: dict[str, set[FinexaCategory]] = {
    "hormiga":        {FinexaCategory.HORMIGA},
    "variable":       {FinexaCategory.VARIABLE},
    "entretenimiento":{FinexaCategory.ENTRETENIMIENTO},
    "alimentacion":   {FinexaCategory.ALIMENTACION},
    "transporte":     {FinexaCategory.TRANSPORTE},
    "suscripcion":    {FinexaCategory.SUSCRIPCION},
}


# ─────────────────────────────────────────────────────────────
# Scenario application  (síncrono — solo matemáticas)
# ─────────────────────────────────────────────────────────────

def _apply_scenario(
    transactions: list[EnrichedTransaction],
    scenario: WhatIfScenario,
) -> list[EnrichedTransaction]:
    """
    Escala los montos de gasto según el escenario hipotético.
    Solo modifica transacciones de egreso (amount > 0); ingresos no se tocan.
    """
    modified: list[EnrichedTransaction] = []

    for tx in transactions:
        new_amount = tx.amount

        if tx.amount > 0:
            for key, cats in _CATEGORY_MAP.items():
                reduction_pct: float = getattr(scenario, f"reduce_{key}_pct", 0.0)
                if reduction_pct > 0 and tx.category in cats:
                    new_amount = round(tx.amount * (1.0 - reduction_pct / 100.0), 2)
                    break

        modified.append(
            tx.model_copy(update={"amount": new_amount}) if new_amount != tx.amount else tx
        )

    return modified


# ─────────────────────────────────────────────────────────────
# Fallback narrative (cuando Bedrock no está disponible)
# ─────────────────────────────────────────────────────────────

def _fallback_analysis(
    score_antes: object,
    score_despues: object,
    delta_factores: list[WhatIfDeltaFactor],
    scenario: WhatIfScenario,
) -> str:
    delta = round(score_despues.score_total - score_antes.score_total, 1)
    sign = "+" if delta >= 0 else ""

    changes: list[str] = []
    for key in _CATEGORY_MAP:
        pct = getattr(scenario, f"reduce_{key}_pct", 0.0)
        if pct > 0:
            changes.append(f"reducir {key} {pct:.0f}%")
    if scenario.nueva_ingresos_mensuales:
        changes.append(f"nuevo ingreso ${scenario.nueva_ingresos_mensuales:,.0f} MXN")
    if scenario.extra_ahorro_mensual:
        changes.append(f"ahorro extra ${scenario.extra_ahorro_mensual:,.0f} MXN")

    desc = ", ".join(changes) if changes else "cambios hipotéticos"
    top = max(delta_factores, key=lambda d: abs(d.delta), default=None)

    lines = [
        f"Simulación: {desc}.",
        f"Impacto: {sign}{delta} pts en Score de Resiliencia "
        f"({score_antes.score_total:.0f} → {score_despues.score_total:.0f} — {score_despues.nivel}).",
    ]
    if top and abs(top.delta) > 0.5:
        lines.append(
            f"Factor más impactado: '{top.factor}' "
            f"({top.score_antes:.0f} → {top.score_despues:.0f} pts)."
        )
    return " ".join(lines)


# ─────────────────────────────────────────────────────────────
# Main simulator  (async — llama a Bedrock para el análisis)
# ─────────────────────────────────────────────────────────────

async def simulate_whatif(
    transactions: list[EnrichedTransaction],
    profile: UserProfile,
    scenario: WhatIfScenario,
    saldo_actual: Optional[float] = None,
    model_id: str | None = None,
) -> WhatIfResult:
    """
    Simula el impacto de un escenario hipotético sobre las finanzas del usuario.

    Args:
        transactions:  Transacciones clasificadas del periodo actual.
        profile:       Perfil financiero del usuario.
        scenario:      Escenario a simular (reducciones + cambio de ingreso).
        saldo_actual:  Saldo actual para proyección de liquidez (opcional).
        model_id:      Modelo Bedrock para el análisis diferencial.

    Returns:
        WhatIfResult con scores, deltas y análisis diferencial.
    """
    model_id = model_id or settings.bedrock_model_sonnet

    # ── Score base (síncrono) ────────────────────────────────
    score_antes = compute_resilience_score(transactions, profile)

    # ── Score hipotético (síncrono) ──────────────────────────
    modified_txs = _apply_scenario(transactions, scenario)

    modified_profile = profile
    if scenario.nueva_ingresos_mensuales is not None:
        modified_profile = profile.model_copy(
            update={"ingresos_mensuales": scenario.nueva_ingresos_mensuales}
        )

    score_despues = compute_resilience_score(modified_txs, modified_profile)

    # ── Factor deltas ─────────────────────────────────────────
    delta_factores = [
        WhatIfDeltaFactor(
            factor=f_a.nombre,
            score_antes=f_a.score_raw,
            score_despues=f_d.score_raw,
            delta=round(f_d.score_raw - f_a.score_raw, 1),
        )
        for f_a, f_d in zip(score_antes.factores, score_despues.factores)
    ]

    # ── Proyección de liquidez (síncrono, opcional) ──────────
    liquidez_antes: Optional[float] = None
    liquidez_despues: Optional[float] = None

    if saldo_actual is not None:
        cf_antes = run_cash_flow_analysis(
            transactions, saldo_actual, ingresos_mensuales=profile.ingresos_mensuales
        )
        cf_despues = run_cash_flow_analysis(
            modified_txs, saldo_actual,
            ingresos_mensuales=modified_profile.ingresos_mensuales,
        )
        liquidez_antes = cf_antes.projected_liquidity
        liquidez_despues = cf_despues.projected_liquidity

    # ── Análisis diferencial LLM (async — única llamada Bedrock) ──
    try:
        analisis = await invoke_whatif_analysis(
            score_antes=score_antes,
            score_despues=score_despues,
            scenario=scenario,
            delta_factores=delta_factores,
            profile=profile,
            model_id=model_id,
        )
    except Exception as exc:
        logger.error(
            "whatif_llm_failed_using_fallback",
            extra={"error": str(exc), "step": "whatif"},
        )
        analisis = _fallback_analysis(score_antes, score_despues, delta_factores, scenario)

    logger.info(
        "whatif_simulation_complete",
        extra={
            "score_antes": score_antes.score_total,
            "score_despues": score_despues.score_total,
            "delta": round(score_despues.score_total - score_antes.score_total, 1),
            "step": "whatif",
        },
    )

    return WhatIfResult(
        escenario=scenario,
        score_antes=round(score_antes.score_total, 1),
        score_despues=round(score_despues.score_total, 1),
        nivel_antes=score_antes.nivel,
        nivel_despues=score_despues.nivel,
        delta_score=round(score_despues.score_total - score_antes.score_total, 1),
        delta_factores=delta_factores,
        liquidez_antes=round(liquidez_antes, 2) if liquidez_antes is not None else None,
        liquidez_despues=round(liquidez_despues, 2) if liquidez_despues is not None else None,
        analisis_diferencial=analisis,
    )
