CREATE TABLE IF NOT EXISTS messages (
    time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    heading FLOAT NOT NULL,
    measurement FLOAT NOT NULL,
    verification_id TEXT NOT NULL
);

SELECT create_hypertable('{table_name}', 'time');

CREATE INDEX IF NOT EXISTS ix_name_time ON messages (name, time DESC);
