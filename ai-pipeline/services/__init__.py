"""
Services layer — orchestrates domain modules for the API.

Each service is a pure async/sync function (no classes, no state).
Routes call services; services call domain + infrastructure.
"""

from pipeline.services.classification_service import classify_transactions
from pipeline.services.cashflow_service import compute_cashflow
from pipeline.services.pipeline_service import run_pipeline
from pipeline.services.whatif_service import run_whatif

__all__ = [
    "classify_transactions",
    "compute_cashflow",
    "run_pipeline",
    "run_whatif",
]
