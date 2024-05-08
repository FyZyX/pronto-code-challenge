import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import AsyncConnectionPool

app = FastAPI()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.environ.get("POSTGRES_USER")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
DB_NAME = os.environ.get("POSTGRES_DB")
DATABASE_DSN = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"

DASHBOARD_HOST = os.environ.get("DASHBOARD_HOST", "localhost")
DASHBOARD_PORT = os.environ.get("DASHBOARD_PORT", 3001)

pool = AsyncConnectionPool(DATABASE_DSN, open=False)

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


@app.on_event("shutdown")
async def shutdown():
    await pool.close()


@app.get("/metrics/top10")
async def get_top_metrics():
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                WITH LatestTime AS (
                    SELECT
                        name,
                        MAX(time) AS latest_time
                    FROM messages
                    GROUP BY name
                ),
                AggregatedMeasurements AS (
                    SELECT
                        name,
                        AVG(measurement) AS average_measurement,
                        MIN(measurement) AS min_measurement,
                        MAX(measurement) AS max_measurement,
                        COUNT(measurement) AS count_measurements 
                    FROM messages
                    GROUP BY name
                )

                SELECT
                    am.name,
                    am.average_measurement,
                    am.min_measurement,
                    am.max_measurement,
                    am.count_measurements,
                    m.latitude AS latest_latitude,
                    m.longitude AS latest_longitude,
                    m.heading AS latest_heading
                FROM AggregatedMeasurements am
                JOIN LatestTime lt ON am.name = lt.name
                JOIN messages m ON m.name = lt.name AND m.time = lt.latest_time
                ORDER BY am.name
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
