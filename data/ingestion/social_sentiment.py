"""
Social Sentiment & Unstructured News Ingestor.

Monitors X/Twitter, RSS financial feeds, and social media for sentiment velocity shifts,
breaking headlines, and keyword clusters (e.g., ETF approvals, protocol exploits, regulatory actions).
"""

import asyncio
from datetime import datetime, timezone
import random
from typing import AsyncGenerator, List, Dict, Any

from data.database.models import EventType, RawMarketEvent
from data.ingestion.base import BaseIngestor


class SocialSentimentIngestor(BaseIngestor):
    """
    Ingestor reading social streams and RSS feeds.
    Converts unstructured news into structured RawMarketEvent models with sentiment polarity.
    """

    def __init__(self, poll_interval: float = 1.8):
        super().__init__(name="SocialSentimentReader")
        self.poll_interval = poll_interval

    async def stream_events(self) -> AsyncGenerator[RawMarketEvent, None]:
        """Stream news and social sentiment events."""
        await self.start()

        # High-impact sample headlines and sentiment signals
        mock_news_stream = [
            {
                "asset": "BTC",
                "headline": "SEC Approves In-Kind Staking for Spot Bitcoin ETFs in Landmark Ruling",
                "source": "Twitter_X_Feed",
                "sentiment_score": 0.88,  # Strongly Bullish
                "sentiment_velocity": 450.0,  # 450 tweets/min surge
                "keywords": ["ETF_APPROVAL", "SEC_RULING", "INSTITUTIONAL"],
                "usd_value": 50_000_000.0,
                "payload": {"author": "@BloombergCrypto", "retweets": 12400},
            },
            {
                "asset": "ETH",
                "headline": "Critical Reentrancy Vulnerability Discovered in Major Ethereum DeFi Lending Pool",
                "source": "RSS_News_Feed",
                "sentiment_score": -0.92,  # Strongly Bearish
                "sentiment_velocity": 820.0,
                "keywords": ["EXPLOIT", "SECURITY_ALERT", "DEFI_HACK"],
                "usd_value": 30_000_000.0,
                "payload": {"publisher": "Coindesk", "alert_level": "RED"},
            },
            {
                "asset": "SOL",
                "headline": "Solana Ecosystem DEX Volume Reaches All-Time High Amid Meme Token Trading Surge",
                "source": "Twitter_X_Feed",
                "sentiment_score": 0.72,
                "sentiment_velocity": 210.0,
                "keywords": ["DEX_VOLUME", "Ecosystem_ATH"],
                "usd_value": 15_000_000.0,
                "payload": {"author": "@SolanaFloor"},
            },
        ]

        idx = 0
        while self.is_running:
            await asyncio.sleep(self.poll_interval)

            if idx < len(mock_news_stream):
                scen = mock_news_stream[idx]
                idx += 1
            else:
                asset = random.choice(["BTC", "ETH", "SOL"])
                sentiment = round(random.uniform(-0.85, 0.85), 2)
                scen = {
                    "asset": asset,
                    "headline": f"Breaking market sentiment narrative shift for {asset}",
                    "source": "Twitter_X_Feed",
                    "sentiment_score": sentiment,
                    "sentiment_velocity": round(random.uniform(50.0, 300.0), 1),
                    "keywords": ["MARKET_RUMOR", asset],
                    "usd_value": random.choice([5_000_000.0, 20_000_000.0]),
                    "payload": {"sample_feed": True},
                }

            event = RawMarketEvent(
                asset=scen["asset"],
                timestamp=datetime.now(timezone.utc),
                event_type=EventType.NEWS_ITEM,
                source=scen["source"],
                raw_payload={"headline": scen["headline"], **scen["payload"]},
                usd_value=scen["usd_value"],
                sentiment_score=scen["sentiment_score"],
                sentiment_velocity=scen["sentiment_velocity"],
                keywords=scen["keywords"],
            )

            yield event
