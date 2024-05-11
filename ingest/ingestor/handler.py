import asyncio
import dataclasses
import json
import logging
import os

import psycopg_pool
import redis.asyncio as redis

from .model import Message

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.environ.get("POSTGRES_USER")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
DB_NAME = os.environ.get("POSTGRES_DB")
DATABASE_DSN = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"


class MessageHandler:
    _db_pool: psycopg_pool.AsyncConnectionPool | None = None
    _redis_pool: redis.ConnectionPool | None = None

    def __init__(self, message: Message):
        self._message = message

    @classmethod
    def _get_db_pool(cls):
        if not cls._db_pool:
            cls._db_pool = psycopg_pool.AsyncConnectionPool(
                conninfo=DATABASE_DSN,
                min_size=1,
                max_size=10,
                open=False,
            )
        return cls._db_pool

    @classmethod
    def _get_redis_connection(cls):
        if not cls._redis_pool:
            cls._redis_pool = redis.ConnectionPool.from_url(REDIS_URL)
        return cls._redis_pool

    @classmethod
    async def connect(cls):
        cls._get_db_pool()
        await cls._db_pool.open()

        cls._get_redis_connection()

    @classmethod
    async def close(cls):
        await cls._db_pool.close()
        await cls._redis_pool.aclose()

    def _row(self):
        return (
            self._message.name,
            self._message.latitude,
            self._message.longitude,
            self._message.heading,
            self._message.measurement,
            self._message.verification_id,
        )

    async def _persist(self):
        async with self._db_pool.connection() as conn:
            await conn.execute(
                """
                INSERT INTO messages (name, latitude, longitude, heading, measurement, verification_id)
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                self._row(),
            )
            logging.debug(f"inserted message: {self._message}")

    async def _publish(self):
        message = json.dumps(dataclasses.asdict(self._message))

        connection = redis.Redis(connection_pool=self._redis_pool)
        await connection.publish("messages", message)
        await connection.aclose()

    async def handle_message(self) -> Message:
        await asyncio.gather(
            self._persist(),
            self._publish(),
        )
        return self._message
