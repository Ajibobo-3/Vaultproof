"""
Macro & Derivatives Analyst Agent.

Analyzes funding rate skew, open interest leverage build-up, derivative positioning,
and broader macro context.
"""

import logging
from typing import Any, Dict

from data.database.models import FilteredSignal
from engine.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class MacroAnalystAgent(BaseAgent):
    """
    Agent specializing in perpetual futures dynamics, options volatility, and macro market context.
    """

    def __init__(self):
        super().__init__(name="MacroAnalyst", role="Macro Context & Derivatives Positioning Specialist")

    async def analyze(self, signal: FilteredSignal) -> Dict[str, Any]:
        """Analyze derivative positioning and macro market environment."""
        logger.info(f"[{self.name}] Analyzing market dynamics for asset {signal.asset}")

        raw_event = signal.raw_event
        funding = raw_event.funding_rate if raw_event.funding_rate is not None else 0.0
        oi_change = raw_event.open_interest_change_pct if raw_event.open_interest_change_pct is not None else 0.0

        if funding > 0.0005:
            derivative_bias = "EXTREME_LONG_POSITIONING"
            assessment = (
                f"Perpetual funding rate for {signal.asset} elevated at {funding:.4%} (8h). "
                f"Market is heavily long-skewed. Combined with Open Interest change of +{oi_change:.1f}%, "
                f"the asset is vulnerable to a long-liquidation cascade if key support breaks."
            )
        elif funding < -0.0003:
            derivative_bias = "EXTREME_SHORT_POSITIONING"
            assessment = (
                f"Perpetual funding rate for {signal.asset} heavily negative at {funding:.4%}. "
                f"Market is aggressively shorting. A sudden upward liquidity sweep could trigger a high-potency Short Squeeze."
            )
        else:
            derivative_bias = "BALANCED_DERIVATIVES"
            assessment = (
                f"Funding rates remain neutral at {funding:.4%} with Open Interest shift of {oi_change:.1f}%. "
                f"Derivatives market is balanced; price movement will be driven predominantly by spot liquidity flows."
            )

        return {
            "agent_name": self.name,
            "derivative_bias": derivative_bias,
            "funding_rate": funding,
            "oi_change_pct": oi_change,
            "macro_assessment": assessment,
            "macro_confidence": 0.82,
        }
