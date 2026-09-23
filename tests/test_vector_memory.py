"""
Unit tests for Closed-Loop Vector Memory Engine.
"""

from datetime import datetime, timezone
import pytest

from data.database.models import EventType, FilteredSignal, RawMarketEvent, SignalPriority
from engine.memory.vector_memory import VectorMemoryEngine


@pytest.mark.asyncio
async def test_vector_memory_search_regimes():
    """Test searching historical market regimes via cosine similarity."""
    memory_engine = VectorMemoryEngine()

    raw_event = RawMarketEvent(
        asset="BTC",
        event_type=EventType.WHALE_TRANSFER,
        source="RPC_Whale_Tracker",
        usd_value=50_000_000.0,
        funding_rate=-0.0006,
        open_interest_change_pct=8.0,
    )

    signal = FilteredSignal(
        event_id=raw_event.id,
        asset="BTC",
        CMIS_score=92.5,
        trigger_reasons=["High USD Volume", "Extreme Funding"],
        priority=SignalPriority.CRITICAL,
        raw_event=raw_event,
        timestamp=datetime.now(timezone.utc),
    )

    regimes = await memory_engine.search_historical_regimes(signal, top_k=2)

    assert len(regimes) == 2
    assert regimes[0].similarity_score > 0.0
    assert len(regimes[0].past_outcome_summary) > 0
