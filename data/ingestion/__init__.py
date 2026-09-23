"""Ingestion module initialization."""
from data.ingestion.base import BaseIngestor
from data.ingestion.whale_tracker import WhaleTrackerIngestor
from data.ingestion.market_data import MarketDataIngestor
from data.ingestion.social_sentiment import SocialSentimentIngestor
from data.ingestion.macro_calendar import MacroCalendarIngestor

__all__ = [
    "BaseIngestor",
    "WhaleTrackerIngestor",
    "MarketDataIngestor",
    "SocialSentimentIngestor",
    "MacroCalendarIngestor",
]
