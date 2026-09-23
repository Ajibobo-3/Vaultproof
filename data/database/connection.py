"""
Database connection layer for async Redis Pub/Sub and PostgreSQL structured storage.

Supports connection pooling and fallback mocks for standalone local execution.
"""

import asyncio
import logging
from typing import AsyncGenerator, Optional, Any

from config.settings import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages async connections to PostgreSQL and Redis.
    Includes fallback mechanism if DB services are unreachable during development.
    """

    def __init__(self):
        self.postgres_pool: Optional[Any] = None
        self.redis_client: Optional[Any] = None
        self.is_connected: bool = False

    async def connect(self) -> None:
        """Establish async connections to Postgres and Redis."""
        logger.info("Initializing database connection pools...")
        
        # Try initializing Redis connection
        try:
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(
                settings.REDIS_URI, decode_responses=True, socket_connect_timeout=2
            )
            await self.redis_client.ping()
            logger.info("Async Redis connection established successfully.")
        except Exception as e:
            logger.warning(f"Redis connection unavailable ({e}). Fallback to in-memory event bus.")
            self.redis_client = None

        # Try initializing PostgreSQL connection
        try:
            import asyncpg
            self.postgres_pool = await asyncpg.create_pool(
                dsn=settings.POSTGRES_URI, timeout=2
            )
            logger.info("Async PostgreSQL pool established successfully.")
        except Exception as e:
            logger.warning(f"PostgreSQL connection unavailable ({e}). Fallback to in-memory data store.")
            self.postgres_pool = None

        self.is_connected = True

    async def disconnect(self) -> None:
        """Close DB connections gracefully."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed.")
        if self.postgres_pool:
            await self.postgres_pool.close()
            logger.info("PostgreSQL connection pool closed.")
        self.is_connected = False


db_manager = DatabaseManager()
