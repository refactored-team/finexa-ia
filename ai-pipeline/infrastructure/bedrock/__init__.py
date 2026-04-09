"""
Amazon Bedrock integration.

Uso típico:

    from pipeline.infrastructure.bedrock import (
        invoke_classification,
        invoke_behavioral_analysis,
        invoke_resilience_explanation,
        invoke_whatif_analysis,
        invoke_raw,
    )
"""

from pipeline.infrastructure.bedrock.analysis import invoke_behavioral_analysis
from pipeline.infrastructure.bedrock.classification import invoke_classification
from pipeline.infrastructure.bedrock.client import invoke_raw
from pipeline.infrastructure.bedrock.resilience import invoke_resilience_explanation
from pipeline.infrastructure.bedrock.whatif import invoke_whatif_analysis

__all__ = [
    "invoke_raw",
    "invoke_classification",
    "invoke_behavioral_analysis",
    "invoke_resilience_explanation",
    "invoke_whatif_analysis",
]
