"""
Configuración centralizada vía pydantic-settings.

Las variables se leen de (en orden de prioridad):
  1. Variables de entorno reales
  2. Archivo `.env` en la raíz de `ai-pipeline/`
  3. Valores por defecto definidos aquí

Uso:
    from pipeline.core.config import settings
    settings.aws_region            # "us-east-2"
    settings.bedrock_model_sonnet  # "us.anthropic.claude-sonnet-4-6"
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings — backed by environment + .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── AWS ──────────────────────────────────────────────────
    aws_region: str = Field(default="us-east-2", description="Default AWS region")
    aws_access_key_id: str | None = Field(default=None, description="AWS access key (dev only)")
    aws_secret_access_key: str | None = Field(default=None, description="AWS secret (dev only)")

    # ── Bedrock ──────────────────────────────────────────────
    bedrock_region: str = Field(default="us-east-1", description="Bedrock runtime region")
    bedrock_model_sonnet: str = Field(
        default="us.anthropic.claude-sonnet-4-6",
        description="Claude Sonnet model ID on Bedrock",
    )
    bedrock_read_timeout: int = Field(default=60, description="Bedrock read timeout (seconds)")
    bedrock_connect_timeout: int = Field(default=10, description="Bedrock connect timeout (seconds)")
    bedrock_max_retries: int = Field(default=4, description="Retries on ThrottlingException")
    bedrock_base_retry_delay: float = Field(default=1.0, description="Base retry delay (seconds)")
    bedrock_mock: bool = Field(default=False, description="Return canned responses without hitting Bedrock")
    bedrock_log_calls: bool = Field(default=True, description="Dump every call to logs/call_<ts>.json")

    # ── SageMaker (resilience score) ─────────────────────────
    sagemaker_region: str = Field(default="us-east-1", description="SageMaker runtime region")
    sagemaker_resilience_endpoint: str = Field(
        default="sagemaker-xgboost-2026-04-08-22-22-57-077",
        description="XGBoost endpoint for resilience score",
    )

    # ── Cache ────────────────────────────────────────────────
    cache_ttl_seconds: int = Field(default=86_400, description="In-memory classification cache TTL")

    # ── Pipeline ─────────────────────────────────────────────
    classification_batch_size: int = Field(default=20, description="Max transactions per Bedrock batch")

    # ── App metadata ─────────────────────────────────────────
    app_name: str = Field(default="finexa-ai-pipeline")
    app_version: str = Field(default="1.0.0")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Singleton accessor — the settings object is built once and cached."""
    return Settings()


# Module-level singleton for ergonomic imports
settings = get_settings()
