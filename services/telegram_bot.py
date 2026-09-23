"""
Telegram Bot Service Module.

Dispatches high-conviction signal forecasts directly to Telegram channels/subscribers
via the Telegram Bot API with clean, institutional-grade, highly scannable HTML cards.
"""

import asyncio
import logging
import re
from typing import Optional, Dict, Any, List
import aiohttp

from config.settings import settings
from data.database.models import FilteredSignal, ScenarioForecast

logger = logging.getLogger(__name__)


class TelegramBotService:
    """
    Async Telegram Bot Dispatcher for CortexFi Market Intelligence Engine signals.
    Formats forecasts into scannable HTML cards for active traders.
    """

    def __init__(
        self,
        bot_token: Optional[str] = settings.TELEGRAM_BOT_TOKEN,
        channel_id: Optional[str] = settings.TELEGRAM_CHANNEL_ID,
    ):
        self.bot_token = bot_token
        self.channel_id = channel_id
        self.api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage" if bot_token else ""

    def render_score_gauge(self, score: float, max_score: float = 100.0) -> str:
        """Render a 10-block progress bar gauge."""
        pct = max(0.0, min(1.0, score / max_score))
        filled_blocks = int(round(pct * 10))
        empty_blocks = 10 - filled_blocks
        bar = "█" * filled_blocks + "░" * empty_blocks
        return f"[{bar}] {score:.1f}/100.0"

    def _get_direction_emoji(self, forecast: ScenarioForecast) -> str:
        """Determine directional indicator emoji based on primary scenario hypothesis."""
        desc = forecast.primary_scenario.description.lower()
        target = forecast.primary_scenario.target_zone.lower()

        if any(w in desc or w in target for w in ["bullish", "upward", "expansion", "rally", "squeeze", "outflow", "+"]):
            return "🟢"
        elif any(w in desc or w in target for w in ["bearish", "downward", "pullback", "dump", "cascade", "inflow", "-"]):
            return "🔴"
        return "⚡"

    def _clean_trigger_reasons(self, trigger_reasons: List[str]) -> str:
        """Strip raw point math from trigger reasons for clean trader scannability."""
        cleaned = []
        for reason in trigger_reasons:
            # Strip point math patterns like (-> +34.5 pts) or (-> +15% Boost)
            clean_item = re.sub(r"\s*\(->\s*[^)]+\)", "", reason).strip()
            cleaned.append(clean_item)
        return ", ".join(cleaned)

    def format_telegram_message(self, forecast: ScenarioForecast, signal: FilteredSignal) -> str:
        """
        Format ScenarioForecast and FilteredSignal into an institutional-grade scannable HTML card.
        """
        direction_emoji = self._get_direction_emoji(forecast)
        drivers = self._clean_trigger_reasons(signal.trigger_reasons)
        quick_take = forecast.primary_scenario.description

        msg = (
            f"🧠 <b>CORTEXFI SIGNAL</b> | <b>${forecast.asset}</b> {direction_emoji}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📊 <b>Impact Score</b> : {signal.CMIS_score:.1f}/100 [{signal.priority.value}]\n"
            f"🔥 <b>Drivers</b>      : {drivers}\n\n"
            f"🎯 <b>PROBABLE SCENARIOS</b>\n"
            f"• <b>Primary ({forecast.primary_scenario.probability_pct:.0f}%)</b>   : {forecast.primary_scenario.target_zone}\n"
            f"• <b>Secondary ({forecast.secondary_scenario.probability_pct:.0f}%)</b> : {forecast.secondary_scenario.target_zone}\n\n"
            f"⛔ <b>Invalidation</b>   : {forecast.invalidation_level}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"💡 <b>QUICK TAKE</b>:\n"
            f"{quick_take}\n\n"
            f"⚡ Delivered by CortexFi Market Intelligence Engine"
        )
        return msg

    async def send_forecast(
        self,
        forecast: ScenarioForecast,
        signal: FilteredSignal,
        max_retries: int = 3,
    ) -> bool:
        """
        Send formatted forecast message to configured Telegram Channel with retry backoff.
        """
        if not self.bot_token or not self.channel_id:
            logger.info(
                f"[TelegramBotService] Telegram credentials not configured. Formatted Telegram message generated (Simulated Dispatch)."
            )
            return True

        message_text = self.format_telegram_message(forecast, signal)
        payload = {
            "chat_id": self.channel_id,
            "text": message_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }

        retry_delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(self.api_url, json=payload, timeout=5) as response:
                        if response.status == 200:
                            logger.info(
                                f"[TelegramBotService] Message delivered successfully to {self.channel_id} (Attempt {attempt})."
                            )
                            return True
                        elif response.status == 429:  # Rate limited
                            resp_json = await response.json()
                            retry_after = resp_json.get("parameters", {}).get("retry_after", retry_delay)
                            logger.warning(
                                f"[TelegramBotService] Rate limited by Telegram API. Waiting {retry_after}s..."
                            )
                            await asyncio.sleep(retry_after)
                        else:
                            text = await response.text()
                            logger.warning(
                                f"[TelegramBotService] Telegram API error {response.status}: {text} (Attempt {attempt}/{max_retries})"
                            )

            except Exception as e:
                logger.error(f"[TelegramBotService] Request error on attempt {attempt}: {e}")

            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2.0

        logger.error(f"[TelegramBotService] Failed to send Telegram message after {max_retries} attempts.")
        return False
