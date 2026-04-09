"""Domain models — Pydantic schemas grouped by bounded context.

Importa todos los modelos desde este módulo:

    from pipeline.domain.models import PlaidTransaction, EnrichedTransaction, ...
"""

from pipeline.domain.models.action_plan import ActionStep, InsightActionPlan
from pipeline.domain.models.analysis import BehavioralAnalysisResult, SpendingInsight
from pipeline.domain.models.cashflow import (
    CashFlowResult,
    ImpulseSpendingAlert,
    LiquidityAlert,
    RecurringExpense,
)
from pipeline.domain.models.classification import (
    ClassificationBatchResult,
    EnrichedTransaction,
    FinexaCategory,
    TransactionClassification,
)
from pipeline.domain.models.plaid import (
    PlaidCounterparty,
    PlaidPersonalFinanceCategory,
    PlaidTransaction,
)
from pipeline.domain.models.pulse import DailyPulse
from pipeline.domain.models.resilience import (
    ResilienceExplanation,
    ResilienceExplanationSection,
    ResilienceFactorDetail,
    ResilienceScore,
    UserProfile,
)
from pipeline.domain.models.whatif import WhatIfDeltaFactor, WhatIfResult, WhatIfScenario

__all__ = [
    # plaid
    "PlaidCounterparty",
    "PlaidPersonalFinanceCategory",
    "PlaidTransaction",
    # classification
    "ClassificationBatchResult",
    "EnrichedTransaction",
    "FinexaCategory",
    "TransactionClassification",
    # action plan
    "ActionStep",
    "InsightActionPlan",
    # analysis
    "BehavioralAnalysisResult",
    "SpendingInsight",
    # resilience
    "ResilienceExplanation",
    "ResilienceExplanationSection",
    "ResilienceFactorDetail",
    "ResilienceScore",
    "UserProfile",
    # cashflow
    "CashFlowResult",
    "ImpulseSpendingAlert",
    "LiquidityAlert",
    "RecurringExpense",
    # pulse
    "DailyPulse",
    # whatif
    "WhatIfDeltaFactor",
    "WhatIfResult",
    "WhatIfScenario",
]
