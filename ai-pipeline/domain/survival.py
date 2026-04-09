"""
Modo Supervivencia — calcula el impacto de recortar todos los gastos no esenciales.

Categorias eliminadas en supervivencia:
  - hormiga      — cafe, snacks, OXXO, delivery
  - suscripcion  — Netflix, Spotify, iCloud, etc.
  - entretenimiento — bares, cine, eventos
  - variable     — ropa, electronica, gastos discrecionales

Categorias conservadas (lo indispensable):
  - fijo         — renta, CFE, agua, internet
  - alimentacion — supermercado
  - salud        — farmacia, medico
  - transporte   — Uber, DiDi, gasolina, metro
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date

from pipeline.core.logger import get_logger
from pipeline.domain.models import EnrichedTransaction, FinexaCategory
from pipeline.domain.models.survival import SurvivalCategoryBreakdown, SurvivalModeResult

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────
# Clasificacion de categorias
# ─────────────────────────────────────────────────────────────

_ELIMINATE: frozenset[FinexaCategory] = frozenset({
    FinexaCategory.HORMIGA,
    FinexaCategory.SUSCRIPCION,
    FinexaCategory.ENTRETENIMIENTO,
    FinexaCategory.VARIABLE,
})

_KEEP: frozenset[FinexaCategory] = frozenset({
    FinexaCategory.FIJO,
    FinexaCategory.ALIMENTACION,
    FinexaCategory.SALUD,
    FinexaCategory.TRANSPORTE,
})

_LABELS: dict[str, str] = {
    "hormiga":        "Gastos hormiga",
    "suscripcion":    "Suscripciones",
    "entretenimiento":"Entretenimiento",
    "variable":       "Gastos variables",
    "fijo":           "Gastos fijos",
    "alimentacion":   "Alimentacion",
    "salud":          "Salud",
    "transporte":     "Transporte",
    "ingreso":        "Ingresos",
    "transferencia":  "Transferencias",
    "desconocido":    "Desconocido",
}


# ─────────────────────────────────────────────────────────────
# Calculo principal (sincrono, sin LLM)
# ─────────────────────────────────────────────────────────────

def compute_survival_mode(transactions: list[EnrichedTransaction]) -> SurvivalModeResult:
    """
    Calcula que pasaria si el usuario eliminara todos los gastos no esenciales.

    Sin llamadas a Bedrock — solo matematicas sobre las transacciones clasificadas.
    """
    # ── Periodo ─────────────────────────────────────────────
    dates: list[date] = []
    for tx in transactions:
        try:
            dates.append(date.fromisoformat(str(tx.date)))
        except Exception:
            pass

    if len(dates) >= 2:
        dias_del_periodo = max(1, (max(dates) - min(dates)).days + 1)
    else:
        dias_del_periodo = 30  # fallback a un mes

    # ── Acumular por categoria ───────────────────────────────
    cat_gasto: dict[str, float] = defaultdict(float)
    cat_txs: dict[str, int] = defaultdict(int)
    total_income = 0.0
    hormiga_total = 0.0

    for tx in transactions:
        cat = tx.category.value

        if tx.amount < 0 and tx.category == FinexaCategory.INGRESO:
            total_income += abs(tx.amount)
            continue

        if tx.category in (FinexaCategory.INGRESO, FinexaCategory.TRANSFERENCIA, FinexaCategory.DESCONOCIDO):
            continue

        if tx.amount > 0:
            cat_gasto[cat] += tx.amount
            cat_txs[cat] += 1
            if tx.category == FinexaCategory.HORMIGA:
                hormiga_total += tx.amount

    # ── Totales actual vs supervivencia ─────────────────────
    gasto_total_actual = sum(cat_gasto.values())
    gasto_total_supervivencia = sum(
        amt for cat, amt in cat_gasto.items()
        if FinexaCategory(cat) in _KEEP
    )
    ahorro_total = max(0.0, gasto_total_actual - gasto_total_supervivencia)

    # ── Proyeccion a 30 dias ─────────────────────────────────
    factor = 30.0 / dias_del_periodo
    gasto_mensual_actual = round(gasto_total_actual * factor, 2)
    gasto_mensual_supervivencia = round(gasto_total_supervivencia * factor, 2)
    ahorro_mensual = round(ahorro_total * factor, 2)

    # ── Balance y runway ────────────────────────────────────
    balance_actual = total_income - gasto_total_actual
    balance_supervivencia = total_income - gasto_total_supervivencia

    runway_actual = (
        round(balance_actual / max(gasto_mensual_actual, 0.01), 2)
        if balance_actual > 0 and gasto_mensual_actual > 0
        else 0.0
    )
    runway_supervivencia = (
        round(balance_supervivencia / max(gasto_mensual_supervivencia, 0.01), 2)
        if balance_supervivencia > 0 and gasto_mensual_supervivencia > 0
        else 0.0
    )

    # ── Stats rapidos ────────────────────────────────────────
    reduccion_pct = round(ahorro_total / max(gasto_total_actual, 0.01) * 100, 1)
    ahorro_diario = round(ahorro_total / dias_del_periodo, 2)
    hormiga_diario = round(hormiga_total / dias_del_periodo, 2)
    pct_ingreso_liberado = (
        round(ahorro_mensual / total_income * 100, 1) if total_income > 0 else 0.0
    )

    tx_eliminadas = sum(
        n for cat, n in cat_txs.items() if FinexaCategory(cat) in _ELIMINATE
    )
    tx_conservadas = sum(
        n for cat, n in cat_txs.items() if FinexaCategory(cat) in _KEEP
    )

    # ── Desglose por categoria ───────────────────────────────
    all_cats = set(cat_gasto.keys())
    breakdowns: list[SurvivalCategoryBreakdown] = []

    for cat_str in all_cats:
        try:
            cat_enum = FinexaCategory(cat_str)
        except ValueError:
            continue

        gasto = cat_gasto[cat_str]
        n_txs = cat_txs[cat_str]
        eliminado = cat_enum in _ELIMINATE

        breakdowns.append(SurvivalCategoryBreakdown(
            categoria=cat_str,
            label=_LABELS.get(cat_str, cat_str.capitalize()),
            estado="eliminado" if eliminado else "conservado",
            gasto_periodo=round(gasto, 2),
            ahorro_generado=round(gasto, 2) if eliminado else 0.0,
            transacciones=n_txs,
            gasto_promedio_por_tx=round(gasto / max(n_txs, 1), 2),
        ))

    breakdowns.sort(key=lambda b: b.ahorro_generado, reverse=True)

    top = next((b for b in breakdowns if b.estado == "eliminado" and b.ahorro_generado > 0), None)

    logger.info(
        "survival_mode_computed",
        extra={
            "dias_periodo": dias_del_periodo,
            "gasto_actual": gasto_total_actual,
            "gasto_supervivencia": gasto_total_supervivencia,
            "ahorro_mensual": ahorro_mensual,
            "reduccion_pct": reduccion_pct,
            "step": "survival",
        },
    )

    return SurvivalModeResult(
        dias_del_periodo=dias_del_periodo,
        gasto_total_actual=round(gasto_total_actual, 2),
        gasto_total_supervivencia=round(gasto_total_supervivencia, 2),
        ahorro_total_periodo=round(ahorro_total, 2),
        reduccion_gasto_pct=reduccion_pct,
        ahorro_mensual_proyectado=ahorro_mensual,
        gasto_mensual_actual_proyectado=gasto_mensual_actual,
        gasto_mensual_supervivencia_proyectado=gasto_mensual_supervivencia,
        ingreso_total_periodo=round(total_income, 2),
        balance_actual_periodo=round(balance_actual, 2),
        balance_supervivencia_periodo=round(balance_supervivencia, 2),
        runway_actual_meses=max(0.0, runway_actual),
        runway_supervivencia_meses=max(0.0, runway_supervivencia),
        ahorro_diario_promedio=ahorro_diario,
        gasto_hormiga_diario_promedio=hormiga_diario,
        transacciones_eliminadas=tx_eliminadas,
        transacciones_conservadas=tx_conservadas,
        categorias=breakdowns,
        categoria_mayor_ahorro=top.label if top else None,
        mayor_ahorro_monto=top.ahorro_generado if top else 0.0,
        porcentaje_ingreso_liberado=pct_ingreso_liberado,
    )
