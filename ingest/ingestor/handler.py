import logging
import os

import psycopg

from .model import Message

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.environ.get("POSTGRES_USER")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
DB_NAME = os.environ.get("POSTGRES_DB")
DATABASE_DSN = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"


class MessageHandler:
    def __init__(self, message: Message):
        self._message = message

    def _row(self):
        return (
            self._message.name,
            self._message.latitude,
            self._message.longitude,
            self._message.heading,
            self._message.measurement,
            self._message.verification_id,
        )

    async def handle_message(self) -> Message:
        async with await psycopg.AsyncConnection.connect(DATABASE_DSN) as conn:
            await conn.execute(
                """
                INSERT INTO messages (name, latitude, longitude, heading, measurement, verification_id)
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                self._row(),
            )
            logging.debug(f"inserted message: {self._message}")
        return self._message
