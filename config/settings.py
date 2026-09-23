"""
Configuration settings for the Market Intelligence Engine (MIE).

Uses Environment variables and Pydantic Settings for runtime dynamic thresholds
and system parameters.
"""

from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings managing dynamic engine thresholds,
    database connection strings, LLM API keys, and Telegram credentials.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Engine Operational Settings
    PROJECT_NAME: str = "CortexFi Market Intelligence Engine"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # CMIS Threshold Parameters
    CMIS_EMISSION_THRESHOLD: float = Field(
        default=70.0,
        description="Minimum Composite Market Impact Score (0-100) required to emit signal to agentic layer",
    )
    WHALE_TRANSFER_MIN_USD: float = Field(
        default=1_000_000.0,
        description="Base USD threshold for whale transfer consideration ($1M USD)",
    )
    FUNDING_RATE_EXTREME_THRESHOLD: float = Field(
        default=0.0003,
        description="Absolute funding rate threshold (0.03% per 8h)",
    )
    OI_SPIKE_PERCENT_THRESHOLD: float = Field(
        default=5.0,
        description="Open Interest percentage spike threshold within sample window",
    )

    # Database Configuration
    POSTGRES_URI: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cortexfi",
        description="Async PostgreSQL connection string",
    )
    REDIS_URI: str = Field(
        default="redis://localhost:6379/0",
        description="Async Redis connection string",
    )

    # LLM Provider Keys
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API Key")
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API Key")
    GEMINI_API_KEY: Optional[str] = Field(default=None, description="Google Gemini API Key")

    # Delivery & Alerting
    WEBHOOK_URL: Optional[str] = Field(
        default=None, description="Target Webhook URL for high-priority signal broadcasts"
    )
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(
        default=None, description="Telegram Bot API Token (e.g. 123456789:ABCdef...)"
    )
    TELEGRAM_CHANNEL_ID: Optional[str] = Field(
        default=None, description="Telegram Channel ID or username (e.g. @CortexFiSignals or -100123456789)"
    )


settings = Settings()
