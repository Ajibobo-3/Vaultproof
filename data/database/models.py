"""
Pydantic v2 data models for Market Intelligence Engine (MIE).

Defines strict types and schema definitions for RawMarketEvent, FilteredSignal,
and ScenarioForecast.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field, field_validator


class EventType(str, Enum):
    """Types of market events ingested by the system."""
    WHALE_TRANSFER = "WHALE_TRANSFER"
    FUNDING_SPIKE = "FUNDING_SPIKE"
    OPEN_INTEREST_SPIKE = "OPEN_INTEREST_SPIKE"
    NEWS_ITEM = "NEWS_ITEM"
    MACRO_EVENT = "MACRO_EVENT"


class SignalPriority(str, Enum):
    """Priority levels derived from CMIS score."""
    LOW = "LOW"        # CMIS < 70
    MED = "MED"        # 70 <= CMIS < 80
    HIGH = "HIGH"      # 80 <= CMIS < 90
    CRITICAL = "CRITICAL"  # CMIS >= 90


class OutcomeStatus(str, Enum):
    """Accuracy evaluation status against real price action."""
    PENDING = "PENDING"
    PRIMARY_HIT = "PRIMARY_HIT"
    SECONDARY_HIT = "SECONDARY_HIT"
    INVALIDATED = "INVALIDATED"


class RawMarketEvent(BaseModel):
    """
    Raw ingested market event before quantitative filtering.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique event identifier")
    asset: str = Field(..., description="Target asset ticker (e.g. BTC, ETH, SOL)")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: EventType = Field(..., description="Classification of event type")
    source: str = Field(..., description="Source feed (e.g., WhaleAlert, Binance_RPC, Deribit, Twitter_X, RSS_News)")
    raw_payload: Dict[str, Any] = Field(default_factory=dict, description="Raw feed JSON payload")
    
    # Normalized quantitative context fields for CMIS Filter evaluation
    usd_value: Optional[float] = Field(default=0.0, description="USD value associated with event")
    funding_rate: Optional[float] = Field(default=None, description="Coinciding 8h funding rate")
    open_interest_change_pct: Optional[float] = Field(default=None, description="Coinciding 1h/4h Open Interest % change")
    sender_type: Optional[str] = Field(default=None, description="Sender tag: CEX, UNKNOWN_WHALE, DEFI_PROTOCOL")
    receiver_type: Optional[str] = Field(default=None, description="Receiver tag: CEX, UNKNOWN_WHALE, DEFI_PROTOCOL")

    # Phase 2: Sentiment & Macro Context Fields
    sentiment_score: Optional[float] = Field(default=None, description="Polarity score from -1.0 (Extreme Bearish) to +1.0 (Extreme Bullish)")
    sentiment_velocity: Optional[float] = Field(default=None, description="Shift velocity (mentions/minute change rate)")
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords/topics (e.g., ETF_APPROVAL, EXPLOIT, CPI)")
    macro_event_name: Optional[str] = Field(default=None, description="Macro calendar label (e.g. CPI_RELEASE, FOMC_RATE_DECISION)")

    @field_validator("asset")
    @classmethod
    def normalize_asset(cls, v: str) -> str:
        return v.upper().strip()


class HistoricalRegime(BaseModel):
    """Vector memory historical market regime match."""
    regime_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    similar_event_id: str = Field(..., description="Source event ID from vector memory")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score (0.0 - 1.0)")
    past_outcome_summary: str = Field(..., description="Historical price resolution summary")
    actual_price_change_pct: float = Field(..., description="Historical realized price movement percentage")
    regime_date: str = Field(..., description="Historical regime timeframe label")


class FilteredSignal(BaseModel):
    """
    Quantitatively qualified signal passing the CMIS threshold score (> 70.0).
    """
    signal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str = Field(..., description="ID of source RawMarketEvent")
    asset: str = Field(..., description="Target asset ticker")
    CMIS_score: float = Field(..., ge=0.0, le=100.0, description="Composite Market Impact Score (0-100)")
    trigger_reasons: List[str] = Field(default_factory=list, description="Scoring breakdown and flags")
    priority: SignalPriority = Field(..., description="Derived urgency priority")
    raw_event: RawMarketEvent = Field(..., description="Embedded source event metadata")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Scenario(BaseModel):
    """Probabilistic price action scenario forecast."""
    description: str = Field(..., description="Detailed market hypothesis and movement projection")
    probability_pct: float = Field(..., ge=0.0, le=100.0, description="Estimated scenario probability percentage")
    target_zone: str = Field(..., description="Expected price target or key liquidity range")


class ScenarioForecast(BaseModel):
    """
    Multi-agent debate outcome model presenting structured primary & secondary market scenarios.
    """
    forecast_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    signal_id: str = Field(..., description="ID of source FilteredSignal")
    asset: str = Field(..., description="Target asset ticker")
    primary_scenario: Scenario = Field(..., description="Highest probability primary forecast scenario")
    secondary_scenario: Scenario = Field(..., description="Alternative counter-hypothesis scenario")
    invalidation_level: str = Field(..., description="Price or data point invalidating primary hypothesis")
    reasoning_summary: str = Field(..., description="Synthesized multi-agent debate summary")
    agent_perspectives: Dict[str, Any] = Field(
        default_factory=dict, description="Raw input analysis from OnChain, Macro, and Memory modules"
    )
    historical_regimes: List[HistoricalRegime] = Field(
        default_factory=list, description="Top matched historical market regimes retrieved from vector memory"
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ForecastEvaluation(BaseModel):
    """
    Immutable accuracy record evaluating a forecast against actual market price action over 1h, 4h, or 24h.
    """
    evaluation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    forecast_id: str = Field(..., description="Target ScenarioForecast ID")
    asset: str = Field(..., description="Target asset ticker")
    evaluation_window: str = Field(..., description="Evaluation horizon: '1h', '4h', or '24h'")
    outcome_status: OutcomeStatus = Field(..., description="Evaluation classification")
    predicted_prob_pct: float = Field(..., description="Primary scenario predicted probability")
    realized_price_change_pct: float = Field(..., description="Actual observed price movement percentage")
    accuracy_score: float = Field(..., ge=0.0, le=100.0, description="Score matching forecast precision")
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

