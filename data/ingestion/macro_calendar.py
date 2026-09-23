"""
Macro Economic Calendar Ingestor.

Monitors scheduled macro-economic releases (CPI, FOMC Rate Decisions, Non-Farm Payrolls).
Emits elevated-impact MACRO_EVENT RawMarketEvent instances.
"""

import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator

from data.database.models import EventType, RawMarketEvent
from data.ingestion.base import BaseIngestor


class MacroCalendarIngestor(BaseIngestor):
    """
    Ingestor monitoring macroeconomic calendar releases.
    Assigns elevated baseline weightings for high-volatility events.
    """

    def __init__(self, poll_interval: float = 2.5):
        super().__init__(name="MacroCalendar")
        self.poll_interval = poll_interval

    async def stream_events(self) -> AsyncGenerator[RawMarketEvent, None]:
        """Stream macro calendar events."""
        await self.start()

        mock_macro_events = [
            {
                "asset": "BTC",
                "macro_event_name": "US_CPI_RELEASE",
                "sentiment_score": -0.65,  # Higher than expected CPI -> Hawkish Rate expectations
                "keywords": ["CPI", "INFLATION", "FED_HAWKISH"],
                "usd_value": 40_000_000.0,
                "payload": {"actual": "3.6%", "forecast": "3.2%", "previous": "3.3%"},
            },
            {
                "asset": "BTC",
                "macro_event_name": "FOMC_RATE_DECISION",
                "sentiment_score": 0.85,  # 50bps Rate Cut -> Dovish Macro Expansion
                "keywords": ["FOMC", "RATE_CUT", "DOVISH"],
                "usd_value": 75_000_000.0,
                "payload": {"rate_decision": "5.00%", "change": "-50bps"},
            },
        ]

        idx = 0
        while self.is_running:
            await asyncio.sleep(self.poll_interval)

            if idx < len(mock_macro_events):
                scen = mock_macro_events[idx]
                idx += 1

                event = RawMarketEvent(
                    asset=scen["asset"],
                    timestamp=datetime.now(timezone.utc),
                    event_type=EventType.MACRO_EVENT,
                    source="Economic_Calendar_Feed",
                    raw_payload=scen["payload"],
                    usd_value=scen["usd_value"],
                    sentiment_score=scen["sentiment_score"],
                    keywords=scen["keywords"],
                    macro_event_name=scen["macro_event_name"],
                )

                yield event
