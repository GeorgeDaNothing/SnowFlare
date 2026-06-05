import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'horizon.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
// Schema
// ============================================

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      security_questions_json TEXT NOT NULL DEFAULT '[]',
      reset_token   TEXT,
      reset_token_expiry TEXT
    );

    CREATE TABLE IF NOT EXISTS moves (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      config_json   TEXT NOT NULL,
      last_analysis_json TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_logs (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date          TEXT NOT NULL,
      location      TEXT,
      weather_json  TEXT,
      wind_speed_kmh REAL,
      snow_quality  TEXT,
      temperature_c REAL,
      moves_json    TEXT NOT NULL DEFAULT '[]',
      is_favorite   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS log_videos (
      id            TEXT PRIMARY KEY,
      log_id        TEXT NOT NULL REFERENCES training_logs(id) ON DELETE CASCADE,
      data          TEXT NOT NULL, -- base64 or file path
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presets (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type          TEXT NOT NULL CHECK(type IN ('personal','board','trail')),
      name          TEXT NOT NULL,
      data_json     TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rider_profiles (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      profile_json  TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analysis_cache (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_hash  TEXT NOT NULL,
      result_json   TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, request_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_moves_user      ON moves(user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_user       ON training_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_videos_log      ON log_videos(log_id);
    CREATE INDEX IF NOT EXISTS idx_presets_user    ON presets(user_id);
    CREATE INDEX IF NOT EXISTS idx_cache_user_hash ON analysis_cache(user_id, request_hash);
  `);
}

initSchema();
