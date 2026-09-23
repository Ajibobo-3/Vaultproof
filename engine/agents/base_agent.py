"""
Base Agent Interface.

Abstract base class for specialized domain analysis agents in the Market Intelligence Engine.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict
import logging

from data.database.models import FilteredSignal

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract Base Class for analysis agents.
    Every agent accepts a FilteredSignal and produces an analysis dictionary.
    """

    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    @abstractmethod
    async def analyze(self, signal: FilteredSignal) -> Dict[str, Any]:
        """
        Perform async domain-specific analysis on incoming FilteredSignal.
        """
        pass
