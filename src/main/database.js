import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

const DB_FILENAME = 'vault_V2.db'

let db = null
let currentDbPath = null

export function getDefaultDbPath() {
  if (process.env.ROOTPASS_TEST_DIR) return path.join(process.env.ROOTPASS_TEST_DIR, DB_FILENAME)
  return path.join(app.getPath('userData'), DB_FILENAME)
}

function applySchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS master_check (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      salt TEXT NOT NULL,
      canary TEXT NOT NULL
    );
  `)
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT,
      login TEXT,
      password TEXT NOT NULL,
      category TEXT,
      is_favorite INTEGER DEFAULT 0,
      custom_fields TEXT,
      created_at TEXT NOT NULL
    );
  `)
  try {
    database.exec(`ALTER TABLE accounts ADD COLUMN is_favorite INTEGER DEFAULT 0`)
  } catch {}
  try {
    database.exec(`ALTER TABLE accounts ADD COLUMN custom_fields TEXT`)
  } catch {}
  try {
    database.exec(`ALTER TABLE accounts ADD COLUMN password_updated_at TEXT`)
  } catch {}
  try {
    database.exec(
      `UPDATE accounts SET password_updated_at = created_at WHERE password_updated_at IS NULL`
    )
  } catch {}
  try {
    database.exec(`ALTER TABLE accounts ADD COLUMN totp_secret TEXT`)
  } catch {}
  try {
    database.exec(`ALTER TABLE master_check ADD COLUMN iterations INTEGER`)
  } catch {}
}

export function openDatabase(dbPath) {
  if (db) {
    try {
      db.close()
    } catch {}
    db = null
  }
  currentDbPath = dbPath ?? getDefaultDbPath()
  db = new Database(currentDbPath)
  db.pragma('journal_mode = DELETE')
  db.pragma('busy_timeout = 5000')
  applySchema(db)
  return db
}

export function getDb() {
  if (!db) openDatabase(getDefaultDbPath())
  return db
}

export function getCurrentDbPath() {
  return currentDbPath ?? getDefaultDbPath()
}

export function closeDatabase() {
  if (db) {
    try {
      db.close()
    } catch {}
    db = null
    currentDbPath = null
  }
}
