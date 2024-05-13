import asyncio
import json
import logging
import os

import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import AsyncConnectionPool

app = FastAPI()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.environ.get("POSTGRES_USER")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
DB_NAME = os.environ.get("POSTGRES_DB")
DATABASE_DSN = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"

DASHBOARD_HOST = os.environ.get("DASHBOARD_HOST", "localhost")
DASHBOARD_PORT = os.environ.get("DASHBOARD_PORT", 3001)

pool = AsyncConnectionPool(DATABASE_DSN, open=False)
redis_pool = redis.ConnectionPool.from_url(REDIS_URL)

clients = {}
client_subscriptions = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://{DASHBOARD_HOST}:{DASHBOARD_PORT}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await pool.open()
    start_listening_to_redis()


@app.on_event("shutdown")
async def shutdown():
    await pool.close()


def start_listening_to_redis():
    asyncio.create_task(listen_to_redis())


async def distribute_message_to_clients(message_data):
    for client_id, websocket in clients.items():
        if message_data['name'] in client_subscriptions[client_id]:
            await websocket.send_json(message_data)


async def cleanup_client(client_id: str):
    clients.pop(client_id, None)
    client_subscriptions.pop(client_id, None)


async def listen_to_redis():
    redis_client = redis.Redis(connection_pool=redis_pool)

    async with redis_client.pubsub(ignore_subscribe_messages=True) as pubsub:
        await pubsub.subscribe('messages')

        async for message in pubsub.listen():
            if message['type'] == 'message':
                message_data = json.loads(message['data'])
                await distribute_message_to_clients(message_data)

        await pubsub.unsubscribe('messages')


@app.websocket("/ws")
async def live_location_data(websocket: WebSocket):
    client_id = f"client_{websocket.client.host}_{websocket.client.port}"
    clients[client_id] = websocket
    client_subscriptions[client_id] = []

    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            action = data.get("action")
            names = data.get("names")
            if not action or not names:
                continue

            if action == 'subscribe':
                client_subscriptions[client_id] = names
            elif action == 'unsubscribe':
                del client_subscriptions[client_id]

    except WebSocketDisconnect as e:
        logging.info(f"Client {client_id} disconnected")
    finally:
        await cleanup_client(client_id)


@app.get("/metrics/top10")
async def get_top_metrics():
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT
                    name,
                    AVG(measurement) AS avg_measurement,
                    MIN(measurement) AS min_measurement,
                    MAX(measurement) AS max_measurement,
                    COUNT(*) AS record_count,
                    LAST(latitude, time) AS last_latitude,
                    LAST(longitude, time) AS last_longitude,
                    LAST(heading, time) AS last_heading
                FROM messages
                GROUP BY name
                ORDER BY max_measurement DESC
                LIMIT 10;
            """)
            results = await cur.fetchall()
            return [
                {
                    "name": result[0],
                    "mean_measurement": result[1],
                    "min_measurement": result[2],
                    "max_measurement": result[3],
                    "count": result[4],
                    "last_latitude": result[5],
                    "last_longitude": result[6],
                    "last_heading": result[7],
                } for result in results
            ]


@app.get("/summary-stats")
async def summary_stats(limit: int = 10):
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(f"""
                SELECT
                    name,
                    AVG(measurement) AS avg_measurement,
                    MIN(measurement) AS min_measurement,
                    MAX(measurement) AS max_measurement,
                    COUNT(*)
                FROM messages
                GROUP BY name
                ORDER BY max_measurement DESC
                LIMIT {limit};
            """)
            results = await cur.fetchall()
            return [
                {
                    "name": result[0],
                    "mean_measurement": result[1],
                    "min_measurement": result[2],
                    "max_measurement": result[3],
                    "count": result[4],
                } for result in results
            ]
