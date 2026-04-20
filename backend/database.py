import sqlite3, os

DB_PATH = os.getenv("DB_PATH", "game.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            nickname TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            milk INTEGER DEFAULT 0,
            last_free_draw TEXT DEFAULT NULL,
            is_new_user INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            card_id TEXT NOT NULL,
            copies INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS battle_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            card_id TEXT NOT NULL,
            queued_at TEXT DEFAULT (datetime('now')),
            status TEXT DEFAULT 'waiting'
        );

        CREATE TABLE IF NOT EXISTS battle_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            winner_id TEXT,
            loser_id TEXT,
            winner_card_id TEXT,
            loser_card_id TEXT,
            winner_nickname TEXT,
            loser_nickname TEXT,
            reason TEXT,
            is_upset INTEGER DEFAULT 0,
            milk_taken INTEGER DEFAULT 0,
            card_taken INTEGER DEFAULT 1,
            round_scores TEXT DEFAULT '[]',
            winner_read INTEGER DEFAULT 0,
            loser_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS synthesis_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            grade TEXT NOT NULL,
            result_card_id TEXT,
            success INTEGER DEFAULT 0,
            milk_spent INTEGER DEFAULT 100,
            cards_lost INTEGER DEFAULT 5,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()
