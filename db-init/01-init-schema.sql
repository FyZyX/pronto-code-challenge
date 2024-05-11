CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS messages
(
    time            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name            TEXT        NOT NULL,
    latitude        FLOAT       NOT NULL,
    longitude       FLOAT       NOT NULL,
    heading         FLOAT       NOT NULL,
    measurement     FLOAT       NOT NULL,
    verification_id TEXT        NOT NULL
);

SELECT create_hypertable('messages', 'time');

CREATE INDEX IF NOT EXISTS ix_name_time ON messages (name, time DESC);

SELECT add_retention_policy('messages', INTERVAL '3 hours');

CREATE MATERIALIZED VIEW IF NOT EXISTS messages_minutely_stats
    WITH (timescaledb.continuous)
AS
SELECT time_bucket('1 minute', time) AS bucket,
       name,
       AVG(measurement)              AS avg_measurement,
       MIN(measurement)              AS min_measurement,
       MAX(measurement)              AS max_measurement,
       COUNT(*)                      AS record_count
FROM messages
GROUP BY bucket, name;

SELECT add_continuous_aggregate_policy('messages_minutely_stats',
                                       start_offset => INTERVAL '5 minutes',
                                       end_offset => INTERVAL '2 minutes',
                                       schedule_interval => INTERVAL '2 minutes');
