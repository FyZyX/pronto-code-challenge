import asyncio
import logging
from typing import Callable

import zmq.asyncio

from .handler import MessageHandler


class Ingestor:
    def __init__(self, server_url: str, on_message: Callable[[str], None]):
        self._server_url = server_url
        self._context = zmq.asyncio.Context()
        self._subscriber = self._context.socket(zmq.SUB)
        self._on_message = on_message

    def _subscribe(self, topic: str):
        self._subscriber.connect(self._server_url)
        self._subscriber.subscribe(topic)

    async def _start(self, stop_event: asyncio.Event):
        while stop_event.is_set():
            message_str = await self._subscriber.recv_string()
            self._on_message(message_str)

    def _stop(self):
        self._subscriber.close()
        self._context.term()

    async def ingest(self, stop_event: asyncio.Event, topic: str = ""):
        await MessageHandler.connect()
        self._subscribe(topic)

        try:
            await self._start(stop_event)
        except asyncio.CancelledError:
            logging.error("Ingest task cancelled")
        except BaseException as e:
            logging.error(f"Unexpected error: {e}")
        finally:
            self._stop()
