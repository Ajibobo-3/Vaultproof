"""
Unit tests for Composite Market Impact Score (CMIS) Filter logic.
"""

from datetime import datetime, timezone
import pytest

from data.database.models import EventType, RawMarketEvent, SignalPriority
from engine.filter import CMISFilter


@pytest.mark.asyncio
async def test_cmis_filter_high_impact_whale_dump():
    """Test that a high-value whale transfer to exchange with extreme funding triggers CMIS > 70."""
    cmis_filter = CMISFilter(emission_threshold=70.0)

    raw_event = RawMarketEvent(
        asset="BTC",
        event_type=EventType.WHALE_TRANSFER,
        source="Test_RPC",
        usd_value=55_000_000.0,  # $55M transfer
        funding_rate=-0.0006,     # Negative funding extreme
        open_interest_change_pct=8.0,  # OI spike
        sender_type="UNKNOWN_WHALE",
        receiver_type="CEX_BINANCE",
    )

    signal = await cmis_filter.filter_event(raw_event)

    assert signal is not None
    assert signal.CMIS_score >= 70.0
    assert signal.asset == "BTC"
    assert signal.priority in (SignalPriority.HIGH, SignalPriority.CRITICAL)
    assert any("High USD volume" in reason for reason in signal.trigger_reasons)
    assert any("Exchange Inflow" in reason for reason in signal.trigger_reasons)


@pytest.mark.asyncio
async def test_cmis_filter_sub_threshold_event():
    """Test that low impact transfers below $1M and no funding extreme are filtered out (CMIS < 70)."""
    cmis_filter = CMISFilter(emission_threshold=70.0)

    raw_event = RawMarketEvent(
        asset="SOL",
        event_type=EventType.WHALE_TRANSFER,
        source="Test_RPC",
        usd_value=150_000.0,  # $150k transfer (sub-threshold)
        funding_rate=0.0001,
        open_interest_change_pct=0.5,
        sender_type="UNKNOWN_WHALE",
        receiver_type="UNKNOWN_WHALE",
    )

    signal = await cmis_filter.filter_event(raw_event)

    assert signal is None
