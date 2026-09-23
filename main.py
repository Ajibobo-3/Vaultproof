"""
Main Entry Point - CortexFi Market Intelligence Engine (MIE).

Orchestrates Phase 2 Pipeline:
1. Expanded Ingestion: Listens to streams from WhaleTracker, MarketData, SocialSentiment, and MacroCalendar.
2. Signal Filtering: Applies Composite Market Impact Score (CMIS) quantitative algorithm.
3. Vector Memory Lookup: Queries historical regime matches.
4. Multi-Agent Synthesis: Triggers OnChain, Macro, Memory, and Synthesis agents on CMIS >= 70.
5. Accuracy Verification: Records forecast to immutable accuracy ledger and evaluates rolling accuracy.
6. Delivery: Dispatches ScenarioForecast payload to stdout / Webhook.
"""

import asyncio
import logging
import sys
from typing import List

from config.settings import settings
from data.database import db_manager, RawMarketEvent
from data.ingestion import (
    MarketDataIngestor,
    MacroCalendarIngestor,
    SocialSentimentIngestor,
    WhaleTrackerIngestor,
)
from engine.accuracy import AccuracyTracker
from engine.agents import SynthesisAgent
from engine.filter import CMISFilter
from services.delivery import DeliveryService

# Configure logging format
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("CortexFi.Main")


class MarketIntelligencePipeline:
    """
    Core Pipeline orchestrator managing Phase 2 multi-stream ingestion, filtering,
    vector memory, multi-agent synthesis, accuracy tracking, and delivery.
    """

    def __init__(self):
        self.cmis_filter = CMISFilter()
        self.synthesizer = SynthesisAgent()
        self.accuracy_tracker = AccuracyTracker()
        self.delivery_service = DeliveryService()
        self.event_queue: asyncio.Queue[RawMarketEvent] = asyncio.Queue()
        self.is_running = False

    async def ingest_worker(self, ingestor) -> None:
        """Worker task collecting raw events from an ingestor stream."""
        try:
            async for event in ingestor.stream_events():
                if not self.is_running:
                    break
                logger.info(
                    f"[{ingestor.name}] Ingested Event | Type: {event.event_type.value} | Asset: {event.asset} | USD: ${event.usd_value:,.0f}"
                )
                await self.event_queue.put(event)
        except asyncio.CancelledError:
            logger.info(f"[{ingestor.name}] Worker task cancelled.")
        except Exception as e:
            logger.error(f"[{ingestor.name}] Ingestor worker error: {e}", exc_info=True)

    async def pipeline_processor(self) -> None:
        """
        Main worker pulling events from queue, passing through CMIS filter,
        querying vector memory, triggering multi-agent synthesis, logging accuracy, and delivering forecasts.
        """
        logger.info("Phase 2 Pipeline Processor started. Waiting for multi-modal market events...")

        processed_count = 0
        emitted_count = 0

        while self.is_running or not self.event_queue.empty():
            try:
                try:
                    event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue

                processed_count += 1

                # Step 1: Pass event through CMIS Filter
                signal = await self.cmis_filter.filter_event(event)

                if signal:
                    emitted_count += 1

                    # Step 2: Trigger Multi-Agent Synthesis (incorporating Vector Memory lookup)
                    forecast = await self.synthesizer.synthesize_forecast(signal)

                    # Step 3: Record forecast to Accuracy Verification Ledger
                    await self.accuracy_tracker.record_forecast(forecast, signal)

                    # Step 4: Deliver Scenario Forecast Payload
                    await self.delivery_service.dispatch_forecast(forecast, signal)

                self.event_queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error processing pipeline event: {e}", exc_info=True)

        # Run accuracy evaluation cycle on completion
        evaluations = await self.accuracy_tracker.evaluate_past_forecasts()
        summary = self.accuracy_tracker.get_rolling_accuracy_summary()
        logger.info(f"[Accuracy Summary] Evaluated: {summary['total_evaluated']} | Precision: {summary['precision_pct']}%")

        logger.info(f"Pipeline Processor finished. Ingested: {processed_count} | Signals Emitted: {emitted_count}")

    async def run(self, duration_seconds: float = 10.0) -> None:
        """
        Initialize database, launch ingestion streams, run processor, and shutdown gracefully.
        """
        logger.info("==================================================")
        logger.info(f" Starting {settings.PROJECT_NAME} (Phase 2)")
        logger.info(f" Emission Threshold: CMIS >= {settings.CMIS_EMISSION_THRESHOLD}")
        logger.info("==================================================")

        # 1. Initialize Database layer (with fallback handling)
        await db_manager.connect()

        # 2. Instantiate Ingestors
        whale_ingestor = WhaleTrackerIngestor(poll_interval=1.0)
        market_ingestor = MarketDataIngestor(poll_interval=1.5)
        social_ingestor = SocialSentimentIngestor(poll_interval=1.2)
        macro_ingestor = MacroCalendarIngestor(poll_interval=2.0)

        self.is_running = True

        # 3. Launch async worker tasks
        tasks: List[asyncio.Task] = [
            asyncio.create_task(self.ingest_worker(whale_ingestor), name="WhaleTrackerWorker"),
            asyncio.create_task(self.ingest_worker(market_ingestor), name="MarketDataWorker"),
            asyncio.create_task(self.ingest_worker(social_ingestor), name="SocialSentimentWorker"),
            asyncio.create_task(self.ingest_worker(macro_ingestor), name="MacroCalendarWorker"),
            asyncio.create_task(self.pipeline_processor(), name="PipelineProcessor"),
        ]

        logger.info(f"Phase 2 Pipeline running. Streaming multi-modal feeds for {duration_seconds} seconds...")
        await asyncio.sleep(duration_seconds)

        # 4. Graceful Shutdown Sequence
        logger.info("Initiating graceful shutdown...")
        self.is_running = False
        await whale_ingestor.stop()
        await market_ingestor.stop()
        await social_ingestor.stop()
        await macro_ingestor.stop()

        for t in tasks:
            t.cancel()

        await asyncio.gather(*tasks, return_exceptions=True)
        await db_manager.disconnect()
        logger.info("Engine pipeline stopped cleanly.")


def main():
    """Main execution function."""
    pipeline = MarketIntelligencePipeline()
    try:
        asyncio.run(pipeline.run(duration_seconds=8.0))
    except KeyboardInterrupt:
        logger.info("Execution interrupted by user.")
    except Exception as e:
        logger.critical(f"Fatal error in engine: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
