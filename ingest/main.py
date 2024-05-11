import asyncio
import logging
import os
import signal

from ingestor.handler import MessageHandler
from ingestor.ingestor import Ingestor
from ingestor.parser import MessageParser

SERVER_URL = os.environ.get("SERVER_URL")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)


def _handle_message(message_str: str):
    try:
        message = MessageParser(message_str).parse()
    except ValueError as e:
        logging.error(f"Bad message: {e}")
    else:
        logging.debug(f"Received message: {message}")
        asyncio.create_task(MessageHandler(message).handle_message())


async def _stop_all_tasks():
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    await MessageHandler.close()


def _handle_signal(stop_event: asyncio.Event, loop):
    logging.info("Signal received, stopping...")
    stop_event.clear()
    loop.create_task(_stop_all_tasks())


def main():
    if not SERVER_URL:
        raise EnvironmentError("Server URL not set")

    stop_event = asyncio.Event()
    stop_event.set()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _handle_signal, stop_event, loop)

    ingestor = Ingestor(SERVER_URL, on_message=_handle_message)

    try:
        loop.run_until_complete(ingestor.ingest(stop_event))
    except Exception as e:
        logging.error(e)
    finally:
        logging.info("Program interrupted")


if __name__ == "__main__":
    main()
