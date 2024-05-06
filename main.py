import asyncio
import dataclasses
import logging
import os

import zmq.asyncio

SERVER_URL = os.environ.get("SERVER_URL")

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
)


@dataclasses.dataclass
class Message:
    name: str
    latitude: float
    longitude: float
    heading: float
    measurement: float
    verification_id: str


class MessageParser:
    _expected_num_parts = 6

    def __init__(self, message: str):
        self._message = message

    def _get_parts(self) -> list[str]:
        parts = self._message.split(';')

        if len(parts) != self._expected_num_parts:
            raise ValueError(
                f"incorrect number of parts: {len(parts)}"
                f" (expected {self._expected_num_parts})"
            )

        return parts

    def parse(self) -> Message:
        try:
            parts = self._get_parts()
        except ValueError as e:
            err_msg = f"Unexpected message format: {e}"
            logging.error(err_msg)
            raise ValueError(err_msg)

        try:
            message = Message(
                name=parts[0],
                latitude=float(parts[1]),
                longitude=float(parts[2]),
                heading=float(parts[3]),
                measurement=float(parts[4]),
                verification_id=parts[5],
            )
        except ValueError:
            err_msg = f"Invalid data format: cannot parse numbers {parts[1:5]}"
            logging.error(err_msg)
            raise ValueError(err_msg)

        logging.debug(f"Parsed message: '{message}'")
        return message


class MessageHandler:
    def __init__(self, message: Message):
        self._message = message

    async def handle_message(self) -> Message:
        try:
            # TODO: Processing logic here (calculate, update storage)
            await asyncio.sleep(1)  # Sleep for a bit to simulate processing time
            return self._message
        except asyncio.CancelledError as e:
            err_msg = f"Cancelled message processing: {e}"
            logging.error(err_msg)
            raise IOError(err_msg)


class Ingestor:
    def __init__(self, server_url: str = SERVER_URL):
        self._server_url = server_url
        self._context = zmq.asyncio.Context()
        self._subscriber = self._context.socket(zmq.SUB)

    def _subscribe(self, topic: str):
        self._subscriber.connect(self._server_url)
        self._subscriber.setsockopt_string(zmq.SUBSCRIBE, topic)

    async def _on_message(self):
        message_str = await self._subscriber.recv_string()
        logging.info(f"Received message: {message_str}")
        try:
            message = MessageParser(message_str).parse()
        except ValueError as e:
            logging.error(f"Bad message: {e}")
        else:
            await MessageHandler(message).handle_message()

    async def _run_ingest_loop(self):
        try:
            while True:
                await self._on_message()
        except IOError:
            logging.info("Program interrupted by user")
        finally:
            self._subscriber.close()
            self._context.term()

    async def ingest(self, topic: str = ""):
        self._subscribe(topic)
        await self._run_ingest_loop()


def main():
    if not SERVER_URL:
        raise EnvironmentError("Server URL not set")

    ingestor = Ingestor(SERVER_URL)
    try:
        asyncio.run(ingestor.ingest())
    except KeyboardInterrupt as e:
        logging.fatal(e)
        exit(1)


if __name__ == "__main__":
    main()
