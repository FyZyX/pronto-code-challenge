import asyncio
import json
import websockets


async def listen_to_messages(uri, names_to_subscribe):
    async with websockets.connect(uri) as websocket:
        # Subscribe to specific names
        for name in names_to_subscribe:
            subscribe_message = json.dumps({"action": "subscribe", "name": name})
            await websocket.send(subscribe_message)
            print(f"Subscribed to {name}")

        # Listening for messages
        try:
            while True:
                message = await websocket.recv()
                print("Received message:", message)
        except websockets.exceptions.ConnectionClosed as e:
            print(f"Connection closed: {e}")


if __name__ == "__main__":
    uri = "ws://localhost:8080/ws"
    names_to_subscribe = [
        "AnhHNB",
        "BBwBTJ",
    ]

    try:
        asyncio.run(listen_to_messages(uri, names_to_subscribe))
    except KeyboardInterrupt:
        print("Shutting down")
