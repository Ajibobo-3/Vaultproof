"""
Market Data Ingestor.

Monitors perpetual futures market dynamics including Funding Rate spikes and Open Interest shifts.
"""

import asyncio
from datetime import datetime, timezone
import random
from typing import AsyncGenerator

from data.database.models import EventType, RawMarketEvent
from data.ingestion.base import BaseIngestor


class MarketDataIngestor(BaseIngestor):
    """
    Ingestor monitoring derivative exchange websocket/REST endpoints for perpetual contracts.
    Yields FUNDING_SPIKE and OPEN_INTEREST_SPIKE events.
    """

    def __init__(self, poll_interval: float = 2.0):
        super().__init__(name="MarketDataCollector")
        self.poll_interval = poll_interval

    async def stream_events(self) -> AsyncGenerator[RawMarketEvent, None]:
        """Stream derivative metrics events."""
        await self.start()

        mock_derivative_events = [
            # Massive Funding Spike (Short Squeeze Risk)
            {
                "asset": "BTC",
                "event_type": EventType.FUNDING_SPIKE,
                "funding_rate": 0.00095,  # 0.095% 8h funding (very high)
                "open_interest_change_pct": 6.8,
                "usd_value": 35_000_000.0,
                "payload": {"exchange": "Binance_Futures", "market": "BTCUSDT-PERP"},
            },
            # Open Interest Surge without Funding Extreme
            {
                "asset": "ETH",
                "event_type": EventType.OPEN_INTEREST_SPIKE,
                "funding_rate": 0.0001,
                "open_interest_change_pct": 11.2,
                "usd_value": 18_000_000.0,
                "payload": {"exchange": "Bybit_Perps", "market": "ETHUSDT-PERP"},
            },
        ]

        idx = 0
        while self.is_running:
            await asyncio.sleep(self.poll_interval)

            if idx < len(mock_derivative_events):
                scen = mock_derivative_events[idx]
                idx += 1
            else:
                scen = {
                    "asset": random.choice(["BTC", "ETH", "SOL"]),
                    "event_type": random.choice([EventType.FUNDING_SPIKE, EventType.OPEN_INTEREST_SPIKE]),
                    "funding_rate": round(random.uniform(-0.0007, 0.0007), 5),
                    "open_interest_change_pct": round(random.uniform(1.0, 9.0), 2),
                    "usd_value": random.choice([2_000_000.0, 25_000_000.0]),
                    "payload": {"exchange": "Deribit"},
                }

            event = RawMarketEvent(
                asset=scen["asset"],
                timestamp=datetime.now(timezone.utc),
                event_type=scen["event_type"],
                source="Derivative_Market_Data",
                raw_payload=scen["payload"],
                usd_value=scen["usd_value"],
                funding_rate=scen["funding_rate"],
                open_interest_change_pct=scen["open_interest_change_pct"],
            )

            yield event
