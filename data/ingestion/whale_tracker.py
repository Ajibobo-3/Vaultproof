"""
Whale Tracker Ingestor.

Monitors RPC/CEX feeds for high-value wallet transfers, exchange inflows,
and large on-chain transactions.
"""

import asyncio
from datetime import datetime, timezone
import random
from typing import AsyncGenerator, List

from data.database.models import EventType, RawMarketEvent
from data.ingestion.base import BaseIngestor


class WhaleTrackerIngestor(BaseIngestor):
    """
    Ingestor listening to simulated or live RPC whale transfers.
    Yields RawMarketEvent objects for transfers across BTC, ETH, SOL.
    """

    def __init__(self, poll_interval: float = 1.5):
        super().__init__(name="WhaleTracker")
        self.poll_interval = poll_interval
        self._sample_assets = ["BTC", "ETH", "SOL"]
        self._wallet_types = ["UNKNOWN_WHALE", "CEX_BINANCE", "CEX_COINBASE", "DEFI_PROTOCOL"]

    async def stream_events(self) -> AsyncGenerator[RawMarketEvent, None]:
        """Generate whale movement events with realistic market parameters."""
        await self.start()
        
        # Predefined mock events to ensure deterministic high-impact test cases
        mock_scenarios = [
            # High-impact whale dump to CEX ($45M BTC transfer + negative funding & OI spike)
            {
                "asset": "BTC",
                "usd_value": 45_000_000.0,
                "sender_type": "UNKNOWN_WHALE",
                "receiver_type": "CEX_BINANCE",
                "funding_rate": -0.0006,
                "open_interest_change_pct": 8.4,
                "payload": {"tx_hash": "0xabc123...ff9", "from": "1P5ZED...", "to": "Binance_HotWallet"},
            },
            # Low-impact small whale movement ($300k SOL transfer)
            {
                "asset": "SOL",
                "usd_value": 300_000.0,
                "sender_type": "UNKNOWN_WHALE",
                "receiver_type": "UNKNOWN_WHALE",
                "funding_rate": 0.0001,
                "open_interest_change_pct": 0.5,
                "payload": {"tx_hash": "5Kj89...xzz", "from": "7Xw...", "to": "3Yp..."},
            },
            # Critical-impact massive accumulation ($120M ETH off exchange to unknown whale)
            {
                "asset": "ETH",
                "usd_value": 120_000_000.0,
                "sender_type": "CEX_COINBASE",
                "receiver_type": "UNKNOWN_WHALE",
                "funding_rate": 0.0008,
                "open_interest_change_pct": 12.5,
                "payload": {"tx_hash": "0x789def...", "from": "Coinbase_ColdStorage", "to": "0x987111..."},
            },
        ]

        scenario_idx = 0
        while self.is_running:
            await asyncio.sleep(self.poll_interval)
            
            # Select scenario or generate dynamic event
            if scenario_idx < len(mock_scenarios):
                scen = mock_scenarios[scenario_idx]
                scenario_idx += 1
            else:
                # Dynamic random generator for ongoing stream
                asset = random.choice(self._sample_assets)
                usd_val = random.choice([500_000.0, 2_500_000.0, 15_000_000.0, 80_000_000.0])
                scen = {
                    "asset": asset,
                    "usd_value": usd_val,
                    "sender_type": random.choice(self._wallet_types),
                    "receiver_type": random.choice(self._wallet_types),
                    "funding_rate": round(random.uniform(-0.0008, 0.0008), 5),
                    "open_interest_change_pct": round(random.uniform(-3.0, 10.0), 2),
                    "payload": {"tx_hash": f"0x{random.getrandbits(64):x}"},
                }

            event = RawMarketEvent(
                asset=scen["asset"],
                timestamp=datetime.now(timezone.utc),
                event_type=EventType.WHALE_TRANSFER,
                source="RPC_Whale_Tracker",
                raw_payload=scen["payload"],
                usd_value=scen["usd_value"],
                funding_rate=scen["funding_rate"],
                open_interest_change_pct=scen["open_interest_change_pct"],
                sender_type=scen["sender_type"],
                receiver_type=scen["receiver_type"],
            )
            
            yield event
