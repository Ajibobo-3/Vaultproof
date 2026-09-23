"""
Unit tests for Social Sentiment and Macro Ingestors.
"""

import pytest

from data.database.models import EventType
from data.ingestion.social_sentiment import SocialSentimentIngestor
from data.ingestion.macro_calendar import MacroCalendarIngestor


@pytest.mark.asyncio
async def test_social_sentiment_ingestor_stream():
    """Test that SocialSentimentIngestor yields valid RawMarketEvents with sentiment fields."""
    ingestor = SocialSentimentIngestor(poll_interval=0.01)
    gen = ingestor.stream_events()
    
    event = await anext(gen)
    await ingestor.stop()

    assert event is not None
    assert event.event_type == EventType.NEWS_ITEM
    assert event.sentiment_score is not None
    assert event.sentiment_velocity is not None
    assert len(event.keywords) > 0


@pytest.mark.asyncio
async def test_macro_calendar_ingestor_stream():
    """Test that MacroCalendarIngestor yields MACRO_EVENT items with macro_event_name."""
    ingestor = MacroCalendarIngestor(poll_interval=0.01)
    gen = ingestor.stream_events()

    event = await anext(gen)
    await ingestor.stop()

    assert event is not None
    assert event.event_type == EventType.MACRO_EVENT
    assert event.macro_event_name is not None
