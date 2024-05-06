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


class MessageParser:
    def __init__(self, message: str):
        self._message = message

    def parse(self) -> Message:
        parts = self._message.split(';')
        if len(parts) != 6:
            logging.error(f'Unexpected message format: {len(self._message)} parts')
            raise ValueError(f"Unexpected data format")

        name, latitude, longitude, heading, measurement, verification_id = parts

        try:
            latitude = float(latitude)
            longitude = float(longitude)
            heading = float(heading)
            measurement = float(measurement)
        except ValueError:
            logging.error(f'Invalid message format: cannot parse numbers: {parts[1:]}')
            raise ValueError(f'Invalid data format: {latitude}, {longitude}')

        message = Message(name, latitude, longitude, heading, measurement)

        logging.debug(f"Parsed message: '{message}'")
        return message


class MessageHandler:
    def __init__(self, message: Message):
        self._message = message

    async def handle_message(self) -> Message:
        # TODO: Processing logic here (calculate, update storage)
        await asyncio.sleep(1)  # Sleep for a bit to simulate processing time
        return self._message


class Ingestor:
    def __init__(self, server_url: str = SERVER_URL):
        self._server_url = server_url
        self._context = zmq.asyncio.Context()
        self._subscriber = self._context.socket(zmq.SUB)

    def _subscribe(self, topic: str):
        self._subscriber.connect(self._server_url)
        self._subscriber.setsockopt_string(zmq.SUBSCRIBE, topic)

    async def _run_ingest_loop(self):
        try:
            while True:
                message_str = await self._subscriber.recv_string()
                logging.info(f"Received message: {message_str}")
                message = MessageParser(message_str).parse()
                await MessageHandler(message).handle_message()
        except KeyboardInterrupt:
            logging.info("Program interrupted by user")
        finally:
            self._subscriber.close()
            self._context.term()

    async def ingest(self, topic: str = ""):
        self._subscribe(topic)
        await self._run_ingest_loop()


def main():
    ingestor = Ingestor(SERVER_URL)
    asyncio.run(ingestor.ingest())


if __name__ == "__main__":
    main()
