"""
Delivery Service Module.

Dispatches validated FilteredSignal and ScenarioForecast objects to external webhooks,
Telegram channels, and formatted stdout logs.
"""

import json
import logging
from typing import Optional, Dict, Any
import aiohttp

from config.settings import settings
from data.database.models import FilteredSignal, ScenarioForecast
from services.telegram_bot import TelegramBotService

logger = logging.getLogger(__name__)


class DeliveryService:
    """
    Central Delivery Dispatcher routing high-priority signals and scenario forecasts
    to Webhooks, Telegram channels, and stdout streams.
    """

    def __init__(
        self,
        webhook_url: Optional[str] = settings.WEBHOOK_URL,
        telegram_service: Optional[TelegramBotService] = None,
    ):
        self.webhook_url = webhook_url
        self.telegram_service = telegram_service or TelegramBotService()

    async def dispatch_forecast(self, forecast: ScenarioForecast, signal: FilteredSignal) -> bool:
        """
        Deliver forecast payload via stdout, Telegram bot channel, and HTTP Webhooks.
        """
        payload = {
            "forecast_id": forecast.forecast_id,
            "signal_id": signal.signal_id,
            "asset": forecast.asset,
            "cmis_score": signal.CMIS_score,
            "priority": signal.priority.value,
            "primary_scenario": forecast.primary_scenario.model_dump(),
            "secondary_scenario": forecast.secondary_scenario.model_dump(),
            "invalidation_level": forecast.invalidation_level,
            "reasoning_summary": forecast.reasoning_summary,
            "timestamp": forecast.timestamp.isoformat(),
        }

        # 1. Print formatted report to stdout
        self._print_formatted_forecast(forecast, signal)

        # 2. Dispatch to Telegram Channel
        telegram_success = await self.telegram_service.send_forecast(forecast, signal)

        # 3. Dispatch HTTP POST webhook if configured
        webhook_success = True
        if self.webhook_url:
            webhook_success = await self._send_webhook(payload)

        return telegram_success and webhook_success

    def _print_formatted_forecast(self, forecast: ScenarioForecast, signal: FilteredSignal) -> None:
        """Print clean, structured CLI report to stdout."""
        border = "=" * 80
        subborder = "-" * 80
        gauge = self.telegram_service.render_score_gauge(signal.CMIS_score)

        print(f"\n{border}")
        print(f" 🚀 CORTEXFI MARKET INTELLIGENCE ENGINE | FORECAST REPORT")
        print(f"{border}")
        print(f" Signal ID     : {signal.signal_id}")
        print(f" Asset         : {forecast.asset}")
        print(f" CMIS Score    : {gauge}  [Priority: {signal.priority.value}]")
        print(f" Trigger Flags : {', '.join(signal.trigger_reasons)}")
        print(f"{subborder}")
        print(f" 🟢 PRIMARY SCENARIO ({forecast.primary_scenario.probability_pct}% Probability)")
        print(f"    Description : {forecast.primary_scenario.description}")
        print(f"    Target Zone : {forecast.primary_scenario.target_zone}")
        print(f"{subborder}")
        print(f" 🟡 SECONDARY SCENARIO ({forecast.secondary_scenario.probability_pct}% Probability)")
        print(f"    Description : {forecast.secondary_scenario.description}")
        print(f"    Target Zone : {forecast.secondary_scenario.target_zone}")
        print(f"{subborder}")
        print(f" 🔴 INVALIDATION LEVEL : {forecast.invalidation_level}")
        print(f"{subborder}")
        print(f" 🧠 MULTI-AGENT REASONING SUMMARY:\n{forecast.reasoning_summary}")
        print(f"{border}\n")

    async def _send_webhook(self, payload: Dict[str, Any]) -> bool:
        """Send JSON payload to webhook endpoint using aiohttp."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload, timeout=5) as response:
                    if response.status in (200, 201, 202):
                        logger.info(f"[DeliveryService] Webhook dispatched successfully (Status {response.status}).")
                        return True
                    else:
                        logger.warning(f"[DeliveryService] Webhook dispatch returned status {response.status}.")
                        return False
        except Exception as e:
            logger.error(f"[DeliveryService] Webhook dispatch failed: {e}")
            return False
