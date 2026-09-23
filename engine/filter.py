"""
Composite Market Impact Score (CMIS) Filtering Engine.

Evaluates raw incoming market events against quantitative thresholds, volume impact,
derivative metrics alignment, social sentiment velocity, and macro calendar releases to generate
a normalized score (0-100).
Emits FilteredSignal instances only when CMIS >= threshold (default: 70.0).
"""

import math
import logging
from typing import Optional, Tuple, List

from config.settings import settings
from data.database.models import EventType, FilteredSignal, RawMarketEvent, SignalPriority

logger = logging.getLogger(__name__)


class CMISFilter:
    """
    Quantitative filtering module calculating Composite Market Impact Score (CMIS).
    Filtering criteria:
    1. Volume/USD Impact (0 - 40 points)
    2. Derivative Shifts (Funding Extreme & OI Spikes) (0 - 30 points)
    3. Sentiment & News Shift (0 - 25 points)
    4. Macro Economic Release Impact (0 - 25 points)
    5. Entity Flow & Actionability Context (0 - 30 points)
    6. Synergy Multiplier for multi-factor convergence.
    """

    def __init__(
        self,
        emission_threshold: float = settings.CMIS_EMISSION_THRESHOLD,
        min_usd_threshold: float = settings.WHALE_TRANSFER_MIN_USD,
        funding_threshold: float = settings.FUNDING_RATE_EXTREME_THRESHOLD,
        oi_threshold: float = settings.OI_SPIKE_PERCENT_THRESHOLD,
    ):
        self.emission_threshold = emission_threshold
        self.min_usd_threshold = min_usd_threshold
        self.funding_threshold = funding_threshold
        self.oi_threshold = oi_threshold

    def calculate_score(self, event: RawMarketEvent) -> Tuple[float, List[str]]:
        """
        Calculate CMIS score (0-100) and return breakdown trigger reasons.
        """
        score = 0.0
        reasons: List[str] = []

        # -------------------------------------------------------------
        # 1. Volume / USD Impact Component (Max 40 points)
        # -------------------------------------------------------------
        usd_val = event.usd_value or 0.0
        if usd_val >= self.min_usd_threshold:
            log_scale = math.log10(usd_val / self.min_usd_threshold + 1)
            vol_score = min(40.0, 15.0 + (log_scale * 12.5))
            score += vol_score
            reasons.append(f"High USD volume transfer (${usd_val:,.0f} -> +{vol_score:.1f} pts)")
        elif usd_val > 0:
            vol_score = (usd_val / self.min_usd_threshold) * 10.0
            score += vol_score
            reasons.append(f"Sub-threshold USD transfer (${usd_val:,.0f} -> +{vol_score:.1f} pts)")

        # -------------------------------------------------------------
        # 2. Derivative Shifts Component (Max 30 points)
        # -------------------------------------------------------------
        funding = abs(event.funding_rate) if event.funding_rate is not None else 0.0
        oi_change = event.open_interest_change_pct if event.open_interest_change_pct is not None else 0.0

        if funding >= self.funding_threshold:
            funding_score = 15.0
            score += funding_score
            reasons.append(f"Extreme funding rate ({event.funding_rate:.5f} -> +{funding_score} pts)")

        if oi_change >= self.oi_threshold:
            oi_score = 15.0
            score += oi_score
            reasons.append(f"Open Interest surge (+{oi_change:.1f}% -> +{oi_score} pts)")

        # -------------------------------------------------------------
        # 3. Sentiment & Unstructured News Component (Max 25 points)
        # -------------------------------------------------------------
        sentiment = abs(event.sentiment_score) if event.sentiment_score is not None else 0.0
        velocity = event.sentiment_velocity or 0.0

        if sentiment >= 0.60:
            sent_score = 15.0
            score += sent_score
            reasons.append(f"Extreme Sentiment Polarity ({event.sentiment_score:+.2f} -> +{sent_score} pts)")

        if velocity >= 150.0:
            vel_score = 10.0
            score += vel_score
            reasons.append(f"High Sentiment Velocity ({velocity:.0f} msgs/min -> +{vel_score} pts)")

        # -------------------------------------------------------------
        # 4. Macro Calendar Release Component (Max 25 points)
        # -------------------------------------------------------------
        if event.event_type == EventType.MACRO_EVENT or event.macro_event_name:
            macro_score = 25.0
            score += macro_score
            reasons.append(f"High-Impact Macro Event ({event.macro_event_name or 'MACRO'} -> +{macro_score} pts)")

        # -------------------------------------------------------------
        # 5. Entity Flow & Actionability Context (Max 30 points)
        # -------------------------------------------------------------
        sender = event.sender_type or ""
        receiver = event.receiver_type or ""

        if sender == "UNKNOWN_WHALE" and "CEX" in receiver:
            flow_score = 20.0
            score += flow_score
            reasons.append(f"Exchange Inflow (Whale -> {receiver} -> +{flow_score} pts)")
        elif "CEX" in sender and receiver == "UNKNOWN_WHALE":
            flow_score = 20.0
            score += flow_score
            reasons.append(f"Exchange Outflow ({sender} -> Whale -> +{flow_score} pts)")
        elif sender != "" or receiver != "":
            flow_score = 10.0
            score += flow_score
            reasons.append(f"Known Entity Flow ({sender} -> {receiver} -> +{flow_score} pts)")

        # -------------------------------------------------------------
        # 6. Multi-Factor Convergence Synergy Multiplier
        # -------------------------------------------------------------
        factors_count = sum([
            1 if usd_val >= self.min_usd_threshold else 0,
            1 if funding >= self.funding_threshold or oi_change >= self.oi_threshold else 0,
            1 if sentiment >= 0.60 or velocity >= 150.0 else 0,
            1 if event.event_type == EventType.MACRO_EVENT else 0,
        ])

        if factors_count >= 2:
            synergy_boost = 1.15 if factors_count == 2 else 1.25
            score *= synergy_boost
            reasons.append(f"Multi-Factor Synergy ({factors_count} converging factors -> +{int((synergy_boost-1)*100)}% Boost)")

        # Cap score between 0.0 and 100.0
        final_score = round(min(100.0, max(0.0, score)), 1)
        return final_score, reasons

    def determine_priority(self, score: float) -> SignalPriority:
        """Derive signal priority based on CMIS score."""
        if score >= 90.0:
            return SignalPriority.CRITICAL
        elif score >= 80.0:
            return SignalPriority.HIGH
        elif score >= 70.0:
            return SignalPriority.MED
        return SignalPriority.LOW

    async def filter_event(self, event: RawMarketEvent) -> Optional[FilteredSignal]:
        """
        Process a RawMarketEvent. If CMIS >= emission_threshold, returns a FilteredSignal;
        otherwise returns None to prevent signal noise and API waste.
        """
        score, reasons = self.calculate_score(event)

        if score < self.emission_threshold:
            logger.debug(
                f"[CMIS Filter] Filtered out event {event.id} ({event.asset}): Score {score:.1f} < Threshold {self.emission_threshold}"
            )
            return None

        priority = self.determine_priority(score)
        signal = FilteredSignal(
            event_id=event.id,
            asset=event.asset,
            CMIS_score=score,
            trigger_reasons=reasons,
            priority=priority,
            raw_event=event,
            timestamp=event.timestamp,
        )
        logger.info(
            f"[CMIS Filter] SIGNAL EMITTED | ID: {signal.signal_id[:8]} | Asset: {signal.asset} | Score: {signal.CMIS_score} | Priority: {signal.priority.value}"
        )
        return signal
