"""
Abstract base class for data ingestors.

Provides a unified interface for streaming RawMarketEvent instances.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional
import logging

from data.database.models import RawMarketEvent

logger = logging.getLogger(__name__)


class BaseIngestor(ABC):
    """
    Abstract Base Class for all market event ingestors.
    All subclasses must implement `stream_events()`.
    """

    def __init__(self, name: str):
        self.name = name
        self.is_running: bool = False

    async def start(self) -> None:
        """Initialize connections or resources for the ingestor."""
        self.is_running = True
        logger.info(f"[{self.name}] Ingestor started.")

    async def stop(self) -> None:
        """Clean up ingestor resources."""
        self.is_running = False
        logger.info(f"[{self.name}] Ingestor stopped.")

    @abstractmethod
    async def stream_events(self) -> AsyncGenerator[RawMarketEvent, None]:
        """
        Async generator yielding RawMarketEvent instances as they occur.
        """
        yield  # type: ignore
