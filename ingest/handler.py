import asyncio
import logging

from .model import Message


class MessageHandler:
    def __init__(self, message: Message):
        self._message = message

    async def _process_message(self) -> Message:
        # TODO: Processing logic here (calculate, update storage)
        await asyncio.sleep(1)  # Sleep for a bit to simulate processing time
        logging.debug(f"done message: {self._message}")
        return self._message

    async def handle_message(self) -> Message:
        try:
            return await self._process_message()
        except asyncio.CancelledError:
            logging.error("Cancelled message processing")
