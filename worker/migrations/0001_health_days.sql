CREATE TABLE IF NOT EXISTS health_days (
  day TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS health_days_updated_at ON health_days(updated_at);
