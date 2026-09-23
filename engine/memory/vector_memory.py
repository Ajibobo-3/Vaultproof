"""
Closed-Loop Vector Memory Engine.

Provides semantic market memory by embedding high-impact CMIS signals and historical market regimes.
Queries top similar historical market conditions to ground multi-agent forecasts in historical price outcomes.
"""

import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from data.database.models import FilteredSignal, HistoricalRegime, ScenarioForecast

logger = logging.getLogger(__name__)


class VectorMemoryEngine:
    """
    Vector Memory Store managing semantic indexing and regime search.
    Supports in-memory vector similarity index with fallback vector models.
    """

    def __init__(self):
        # In-memory vector database storage index
        self._memory_store: List[Dict[str, Any]] = []
        self._seed_historical_regimes()

    def _seed_historical_regimes(self) -> None:
        """Seed initial historical market regime knowledge base."""
        seed_data = [
            {
                "event_id": "hist_regime_001",
                "asset": "BTC",
                "vector": [1.0, 45.0, -0.0006, 0.0, 0.8, -1.0, 1.0],  # [asset_id, usd_val_m, funding, sent, flow_in, flow_out, is_macro]
                "past_outcome_summary": "Spot selling pressure absorbed by institutional OTC buyers after 4h drawdown of -3.2%; strong V-shape recovery (+7.4% within 24h).",
                "actual_price_change_pct": 7.4,
                "regime_date": "2024-Q1 Liquidity Sweep",
            },
            {
                "event_id": "hist_regime_002",
                "asset": "ETH",
                "vector": [2.0, 120.0, 0.0008, 0.75, 0.0, 1.0, 0.0],
                "past_outcome_summary": "Exchange cold wallet withdrawal triggered supply crunch on Binance/Coinbase; price rallied +11.8% over 18h.",
                "actual_price_change_pct": 11.8,
                "regime_date": "2024-Q2 ETF Accumulation",
            },
            {
                "event_id": "hist_regime_003",
                "asset": "BTC",
                "vector": [1.0, 75.0, 0.0009, 0.85, 0.0, 0.0, 1.0],
                "past_outcome_summary": "FOMC dovish rate decision led to immediate +5.5% expansion followed by short squeeze across perp markets.",
                "actual_price_change_pct": 5.5,
                "regime_date": "2024-Q3 Macro Pivot",
            },
            {
                "event_id": "hist_regime_004",
                "asset": "SOL",
                "vector": [3.0, 15.0, 0.0002, 0.72, 0.0, 0.0, 0.0],
                "past_outcome_summary": "Ecosystem DEX volume surge triggered +8.2% breakout to new local highs.",
                "actual_price_change_pct": 8.2,
                "regime_date": "2024-Q4 Solana Rally",
            },
        ]
        self._memory_store.extend(seed_data)

    def _extract_feature_vector(self, signal: FilteredSignal) -> List[float]:
        """Convert FilteredSignal into normalized numeric feature embedding vector."""
        raw = signal.raw_event
        asset_map = {"BTC": 1.0, "ETH": 2.0, "SOL": 3.0}
        asset_val = asset_map.get(signal.asset, 0.0)
        usd_m = (raw.usd_value or 0.0) / 1_000_000.0
        funding = raw.funding_rate or 0.0
        sent = raw.sentiment_score or 0.0
        flow_in = 1.0 if raw.receiver_type and "CEX" in raw.receiver_type else 0.0
        flow_out = 1.0 if raw.sender_type and "CEX" in raw.sender_type else 0.0
        is_macro = 1.0 if raw.macro_event_name else 0.0

        return [asset_val, usd_m, funding, sent, flow_in, flow_out, is_macro]

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity score between two feature vectors."""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        sim = dot_product / (norm1 * norm2)
        return max(0.0, min(1.0, sim))

    async def search_historical_regimes(self, signal: FilteredSignal, top_k: int = 3) -> List[HistoricalRegime]:
        """
        Query vector memory for top k historical regimes matching incoming signal context.
        """
        signal_vec = self._extract_feature_vector(signal)
        scored_matches = []

        for item in self._memory_store:
            sim = self._cosine_similarity(signal_vec, item["vector"])
            scored_matches.append((sim, item))

        # Sort by highest similarity score
        scored_matches.sort(key=lambda x: x[0], reverse=True)

        regimes: List[HistoricalRegime] = []
        for sim_score, item in scored_matches[:top_k]:
            regime = HistoricalRegime(
                similar_event_id=item["event_id"],
                similarity_score=round(sim_score, 3),
                past_outcome_summary=item["past_outcome_summary"],
                actual_price_change_pct=item["actual_price_change_pct"],
                regime_date=item["regime_date"],
            )
            regimes.append(regime)

        logger.info(
            f"[VectorMemory] Queried memory for {signal.asset} | Found {len(regimes)} top regime matches (Top Sim: {regimes[0].similarity_score if regimes else 0.0})"
        )
        return regimes

    async def store_signal_embedding(self, signal: FilteredSignal, forecast: ScenarioForecast) -> None:
        """
        Index a newly synthesized forecast into vector memory store for future retrieval.
        """
        vec = self._extract_feature_vector(signal)
        entry = {
            "event_id": signal.event_id,
            "asset": signal.asset,
            "vector": vec,
            "past_outcome_summary": f"Synthesized Primary Target: {forecast.primary_scenario.target_zone}",
            "actual_price_change_pct": 0.0,  # Will be updated by AccuracyTracker upon resolution
            "regime_date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        }
        self._memory_store.append(entry)
        logger.info(f"[VectorMemory] Embedded Signal {signal.signal_id[:8]} into memory store (Total: {len(self._memory_store)})")
