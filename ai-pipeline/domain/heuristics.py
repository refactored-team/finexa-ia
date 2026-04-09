"""
Heuristic classification rules — fast, zero-cost fallback.

Used in two scenarios:
  1. Pre-filter before Bedrock (high-confidence matches skip AI)
  2. Fallback when Bedrock is unavailable (resilience)
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from pipeline.domain.models import FinexaCategory, PlaidTransaction


@dataclass(frozen=True, slots=True)
class HeuristicResult:
    category: FinexaCategory
    confidence: float
    is_ant_expense: bool
    reasoning: str


# ─────────────────────────────────────────────────────────────
# Pattern rules: (regex, category, is_ant_expense)
# ─────────────────────────────────────────────────────────────

_RULES: list[tuple[str, FinexaCategory, bool]] = [

    (r"netflix|spotify|disney\+?|hbo|max|amazon prime|youtube premium|apple\s?(music|tv)|"
     r"crunchyroll|paramount|vix|claro\s?video|meli\+|chatgpt|notion|icloud|google one|"
     r"dropbox|adobe|canva|apple\.com/bill",
     FinexaCategory.SUSCRIPCION, False),

    (r"renta|alquiler|hipoteca|luz|cfe|agua|sacmex|gas natural|naturgy|engie|internet|"
     r"telmex|izzi|totalplay|megacable|telcel|movistar|at&t|bait|seguro|gnp|axa|gym|"
     r"gimnasio|smart\s?fit|colegiatura|mensualidad",
     FinexaCategory.FIJO, False),

    (r"uber(?!\s*eat)|didi(?!\s*food)|indrive|taxi|cabify|metro|metrobus|mexibus|suburbano|"
     r"ecobici|gasolina|pemex|oxxo\s?gas|g500|petro-?7|shell|mobil|bp|tag|pase|televia",
     FinexaCategory.TRANSPORTE, False),

    (r"oxxo|7.?eleven|circulo\s?k|tiendas\s?extra|kiosko|bara|starbucks|cielito\s?querido|"
     r"punta\s?del\s?cielo|cafe|cafetería|snack|nutrisa|michoacana|dominos|mcdonalds|"
     r"burger\s?king|subway|kfc|carls\s?jr|little\s?caesars|cinemex|cinepolis",
     FinexaCategory.HORMIGA, True),

    (r"uber\s*eats|didi\s*food|rappi|cornershop",
     FinexaCategory.HORMIGA, True),

    (r"walmart|bodega\s?aurrera|soriana|chedraui|costco|sams|heb|la\s?comer|fresko|"
     r"city\s?market|superama|smart|calimax",
     FinexaCategory.ALIMENTACION, False),

    (r"farmacia|hospital|doctor|médico|medico|laboratorio|dental|clínica|clinica|"
     r"ahorro|guadalajara|san\s?pablo|benavides|yza|chopo|salud\s?digna",
     FinexaCategory.SALUD, False),

    (r"nomina|nómina|salario|transferencia\s?recibida|spei|stp|deposito|depósito|"
     r"ingreso|sueldo|honorarios",
     FinexaCategory.INGRESO, False),
]

# Plaid primary category → Finexa category mapping (for high-confidence Plaid categories)
_PLAID_CATEGORY_MAP: dict[str, FinexaCategory] = {
    "INCOME": FinexaCategory.INGRESO,
    "TRANSFER_IN": FinexaCategory.INGRESO,
    "TRANSPORTATION": FinexaCategory.TRANSPORTE,
    "FOOD_AND_DRINK": FinexaCategory.ALIMENTACION,
    "ENTERTAINMENT": FinexaCategory.ENTRETENIMIENTO,
    "MEDICAL": FinexaCategory.SALUD,
    "RENT_AND_UTILITIES": FinexaCategory.FIJO,
    "LOAN_PAYMENTS": FinexaCategory.FIJO,
}

# Ant-expense ceiling in MXN (≈ $250 MXN / ~$15 USD at ~17 MXN/USD)
_ANT_EXPENSE_THRESHOLD = 250.0


def classify_heuristic(tx: PlaidTransaction) -> HeuristicResult | None:
    """
    Try to classify a Plaid transaction using rules.

    Returns HeuristicResult if confident, None if the transaction
    should be escalated to Bedrock.
    """
    search_text = " ".join(filter(None, [tx.merchant_name, tx.name])).lower()

    # 1. Regex rules FIRST — they override Plaid categories for known merchants
    #    (e.g., Starbucks/McDonald's should be "hormiga", not generic "alimentacion")
    for pattern, category, is_ant in _RULES:
        if re.search(pattern, search_text):
            return HeuristicResult(
                category=category,
                confidence=0.93,
                is_ant_expense=is_ant,
                reasoning=f"Heuristic rule match: {pattern[:40]}...",
            )

    # 2. Fall back to Plaid's own high-confidence category
    pfc = tx.personal_finance_category
    if pfc and pfc.confidence_level == "VERY_HIGH" and pfc.primary in _PLAID_CATEGORY_MAP:
        mapped = _PLAID_CATEGORY_MAP[pfc.primary]
        is_ant = (
            mapped in (FinexaCategory.HORMIGA, FinexaCategory.ALIMENTACION)
            and tx.amount > 0
            and tx.amount < _ANT_EXPENSE_THRESHOLD
        )
        return HeuristicResult(
            category=mapped,
            confidence=0.92,
            is_ant_expense=is_ant,
            reasoning=f"Plaid high-confidence: {pfc.primary}/{pfc.detailed}",
        )

    # 3. Plaid category with non-VERY_HIGH confidence — still useful
    if pfc and pfc.primary in _PLAID_CATEGORY_MAP:
        mapped = _PLAID_CATEGORY_MAP[pfc.primary]
        return HeuristicResult(
            category=mapped,
            confidence=0.70,
            is_ant_expense=False,
            reasoning=f"Plaid category: {pfc.primary}/{pfc.detailed} ({pfc.confidence_level})",
        )

    # 4. Low-amount heuristic — likely ant expense but low confidence → don't resolve, send to AI
    if tx.amount > 0 and tx.amount < _ANT_EXPENSE_THRESHOLD:
        return None  # let Bedrock decide

    return None


def fallback_classify(tx: PlaidTransaction) -> HeuristicResult:
    """
    Emergency fallback when Bedrock is completely unavailable.
    Always returns a result — never None. Lower confidence.
    """
    search_text = " ".join(filter(None, [tx.merchant_name, tx.name])).lower()

    for pattern, category, is_ant in _RULES:
        if re.search(pattern, search_text):
            return HeuristicResult(
                category=category,
                confidence=0.60,
                is_ant_expense=is_ant,
                reasoning="Fallback heuristic (Bedrock unavailable)",
            )

    pfc = tx.personal_finance_category
    if pfc and pfc.primary in _PLAID_CATEGORY_MAP:
        return HeuristicResult(
            category=_PLAID_CATEGORY_MAP[pfc.primary],
            confidence=0.50,
            is_ant_expense=False,
            reasoning=f"Fallback from Plaid category: {pfc.primary}",
        )

    return HeuristicResult(
        category=FinexaCategory.VARIABLE if tx.amount > 0 else FinexaCategory.INGRESO,
        confidence=0.20,
        is_ant_expense=False,
        reasoning="No heuristic match — default assignment",
    )
