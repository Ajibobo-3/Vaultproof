"""
Unit tests for Telegram Bot Service and Delivery Dispatcher.
"""

from datetime import datetime, timezone
import pytest
from unittest.mock import AsyncMock, patch

from data.database.models import (
    EventType,
    FilteredSignal,
    HistoricalRegime,
    RawMarketEvent,
    Scenario,
    ScenarioForecast,
    SignalPriority,
)
from services.telegram_bot import TelegramBotService
from services.delivery import DeliveryService


@pytest.fixture
def sample_forecast_and_signal():
    raw_event = RawMarketEvent(
        asset="BTC",
        event_type=EventType.WHALE_TRANSFER,
        source="RPC_Whale_Tracker",
        usd_value=50_000_000.0,
    )

    signal = FilteredSignal(
        event_id=raw_event.id,
        asset="BTC",
        CMIS_score=85.5,
        trigger_reasons=["High USD volume transfer ($50,000,000 -> +34.5 pts)", "Exchange Inflow (Whale -> CEX -> +20 pts)"],
        priority=SignalPriority.HIGH,
        raw_event=raw_event,
        timestamp=datetime.now(timezone.utc),
    )

    regime = HistoricalRegime(
        similar_event_id="regime_001",
        similarity_score=0.92,
        past_outcome_summary="V-shape recovery (+7.4% in 24h)",
        actual_price_change_pct=7.4,
        regime_date="2024-Q1",
    )

    forecast = ScenarioForecast(
        signal_id=signal.signal_id,
        asset="BTC",
        primary_scenario=Scenario(
            description="Upward short squeeze",
            probability_pct=75.0,
            target_zone="+8% Upside sweep",
        ),
        secondary_scenario=Scenario(
            description="Range consolidation",
            probability_pct=25.0,
            target_zone="0% Consolidation",
        ),
        invalidation_level="Loss of support",
        reasoning_summary="Multi-agent debate consensus",
        historical_regimes=[regime],
    )
    return forecast, signal


def test_telegram_gauge_rendering():
    """Test score progress bar gauge rendering."""
    bot = TelegramBotService()

    gauge_50 = bot.render_score_gauge(50.0)
    assert "[█████░░░░░] 50.0/100.0" == gauge_50

    gauge_90 = bot.render_score_gauge(90.0)
    assert "[█████████░] 90.0/100.0" == gauge_90


def test_telegram_message_formatting(sample_forecast_and_signal):
    """Test institutional HTML card formatting of Telegram message payload."""
    forecast, signal = sample_forecast_and_signal
    bot = TelegramBotService()

    msg = bot.format_telegram_message(forecast, signal)

    assert "CORTEXFI SIGNAL" in msg
    assert "$BTC" in msg
    assert "🟢" in msg  # Upward / bullish emoji
    assert "Impact Score" in msg
    assert "85.5/100" in msg
    assert "[HIGH]" in msg
    assert "Drivers" in msg
    assert "(-> +34.5 pts)" not in msg  # Point math stripped out
    assert "PROBABLE SCENARIOS" in msg
    assert "Primary (75%)" in msg
    assert "+8% Upside sweep" in msg
    assert "Invalidation" in msg
    assert "QUICK TAKE" in msg
    assert "⚡ Delivered by CortexFi Market Intelligence Engine" in msg


@pytest.mark.asyncio
async def test_telegram_send_forecast_mocked_http(sample_forecast_and_signal):
    """Test async Telegram dispatch using mocked aiohttp HTTP POST response."""
    forecast, signal = sample_forecast_and_signal
    bot = TelegramBotService(bot_token="test_token_123", channel_id="@test_channel")

    mock_response = AsyncMock()
    mock_response.status = 200

    with patch("aiohttp.ClientSession.post") as mock_post:
        mock_post.return_value.__aenter__.return_value = mock_response

        success = await bot.send_forecast(forecast, signal)

        assert success is True
        assert mock_post.called
        call_args = mock_post.call_args
        assert "https://api.telegram.org/bottest_token_123/sendMessage" in call_args[0][0]


@pytest.mark.asyncio
async def test_delivery_service_integrated(sample_forecast_and_signal):
    """Test DeliveryService dispatches to both stdout and Telegram service."""
    forecast, signal = sample_forecast_and_signal
    mock_telegram = AsyncMock(spec=TelegramBotService)
    mock_telegram.render_score_gauge.side_effect = TelegramBotService().render_score_gauge
    mock_telegram.send_forecast.return_value = True
    delivery = DeliveryService(telegram_service=mock_telegram)

    res = await delivery.dispatch_forecast(forecast, signal)
    assert res is True
    assert mock_telegram.send_forecast.called
