"""Local persistent analysis summaries; raw traffic is not retained."""
import json
import sqlite3
from datetime import datetime, timezone
from uuid import uuid4
from . import config

def connect():
    config.DATABASE.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(config.DATABASE, timeout=10)
    db.execute("CREATE TABLE IF NOT EXISTS analyses (id TEXT PRIMARY KEY, created TEXT, source TEXT, result TEXT)")
    return db

def save(source, result):
    record = {"id": str(uuid4()), "created": datetime.now(timezone.utc).isoformat(),
              "source": source, "result": result}
    db = connect()
    try:
        with db:
            db.execute("INSERT INTO analyses VALUES (?, ?, ?, ?)",
                       (record["id"], record["created"], source, json.dumps(result)))
            db.execute("DELETE FROM analyses WHERE id NOT IN (SELECT id FROM analyses ORDER BY created DESC LIMIT 1000)")
    finally:
        db.close()
    return record

def recent(limit=50):
    db = connect()
    try:
        rows = db.execute("SELECT id, created, source, result FROM analyses ORDER BY created DESC LIMIT ?", (limit,)).fetchall()
        return [{"id": r[0], "created": r[1], "source": r[2], "result": json.loads(r[3])} for r in rows]
    finally:
        db.close()


def find(record_id):
    db = connect()
    try:
        row = db.execute('SELECT id, created, source, result FROM analyses WHERE id = ?', (record_id,)).fetchone()
        return {"id": row[0], "created": row[1], "source": row[2], "result": json.loads(row[3])} if row else None
    finally:
        db.close()
