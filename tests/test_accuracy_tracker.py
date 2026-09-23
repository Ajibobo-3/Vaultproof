"""
Unit tests for Accuracy Verification Engine and Feedback Loop.
"""

from datetime import datetime, timezone
import pytest

from data.database.models import (
    EventType,
    FilteredSignal,
    OutcomeStatus,
    RawMarketEvent,
    Scenario,
    ScenarioForecast,
    SignalPriority,
)
from engine.accuracy.accuracy_tracker import AccuracyTracker


@pytest.mark.asyncio
async def test_accuracy_tracker_record_and_evaluate():
    """Test recording a forecast and evaluating precision against market price action."""
    tracker = AccuracyTracker()

    raw_event = RawMarketEvent(
        asset="ETH",
        event_type=EventType.WHALE_TRANSFER,
        source="RPC_Whale_Tracker",
        usd_value=120_000_000.0,
    )

    signal = FilteredSignal(
        event_id=raw_event.id,
        asset="ETH",
        CMIS_score=100.0,
        trigger_reasons=["High USD Volume"],
        priority=SignalPriority.CRITICAL,
        raw_event=raw_event,
        timestamp=datetime.now(timezone.utc),
    )

    forecast = ScenarioForecast(
        signal_id=signal.signal_id,
        asset="ETH",
        primary_scenario=Scenario(
            description="Upward breakout",
            probability_pct=75.0,
            target_zone="+10%",
        ),
        secondary_scenario=Scenario(
            description="Consolidation",
            probability_pct=25.0,
            target_zone="0%",
        ),
        invalidation_level="-5%",
        reasoning_summary="Test multi-agent debate",
    )

    await tracker.record_forecast(forecast, signal)

    # Evaluate with positive price movement (+12.0%)
    evaluations = await tracker.evaluate_past_forecasts(price_oracles={"ETH": 12.0})

    assert len(evaluations) == 1
    eval_item = evaluations[0]
    assert eval_item.forecast_id == forecast.forecast_id
    assert eval_item.outcome_status == OutcomeStatus.PRIMARY_HIT
    assert eval_item.accuracy_score >= 85.0

    summary = tracker.get_rolling_accuracy_summary()
    assert summary["total_evaluated"] == 1
    assert summary["precision_pct"] == 100.0
