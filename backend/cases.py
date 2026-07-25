import sqlite3
import os
from datetime import datetime
from urgency import get_urgency

DB_PATH = os.path.join(os.path.dirname(__file__), "cases.db")


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db():
    conn = _connect()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL,
            transcript  TEXT,
            label       TEXT,
            category    TEXT,
            urgency     TEXT,
            language    TEXT,
            lat         REAL,
            lng         REAL,
            message     TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS case_followups (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id     INTEGER NOT NULL,
            timestamp   TEXT NOT NULL,
            transcript  TEXT,
            language    TEXT
        )
    """)

    # Migration for existing databases — safe to re-run.
    existing_cols = {row[1] for row in conn.execute("PRAGMA table_info(cases)").fetchall()}
    new_columns = {
        "hospital_name":         "TEXT",
        "hospital_distance_km":  "REAL",
        "hospital_travel_min":   "REAL",
        "hospital_phone":        "TEXT",
        # Existing rows predate the conversation feature entirely, so
        # they're backfilled as 'completed' rather than 'in_progress'.
        "session_status":        "TEXT DEFAULT 'completed'",
        # case_status tracks treatment outcome (active/resolved) —
        # distinct from session_status, which only tracks whether the
        # voice conversation itself is still open.
        "case_status":           "TEXT DEFAULT 'active'",
    }
    for col, coltype in new_columns.items():
        if col not in existing_cols:
            conn.execute(f"ALTER TABLE cases ADD COLUMN {col} {coltype}")

    conn.commit()
    conn.close()


def log_case(transcript, label, category, language, lat, lng, message, hospital=None):
    """Returns the new case's id (needed so the frontend can attach
    follow-up voice messages to this exact case)."""
    init_db()
    urgency = get_urgency(label, category)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    hospital_name = hospital["name"] if hospital else None
    hospital_distance_km = hospital["distance_km"] if hospital else None
    hospital_travel_min = hospital["travel_minutes"] if hospital else None
    hospital_phone = hospital.get("phone") if hospital else None

    conn = _connect()
    cur = conn.execute("""
        INSERT INTO cases (
            timestamp, transcript, label, category, urgency, language,
            lat, lng, message,
            hospital_name, hospital_distance_km, hospital_travel_min, hospital_phone,
            session_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')
    """, (
        timestamp, transcript, label, category, urgency, language, lat, lng, message,
        hospital_name, hospital_distance_km, hospital_travel_min, hospital_phone
    ))
    case_id = cur.lastrowid
    conn.commit()
    conn.close()
    return case_id


def add_followup(case_id: int, transcript: str, language: str = "en"):
    init_db()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = _connect()
    conn.execute("""
        INSERT INTO case_followups (case_id, timestamp, transcript, language)
        VALUES (?, ?, ?, ?)
    """, (case_id, timestamp, transcript, language))
    conn.commit()
    conn.close()
    return {"timestamp": timestamp, "transcript": transcript, "language": language}


def close_case(case_id: int):
    init_db()
    conn = _connect()
    conn.execute("UPDATE cases SET session_status = 'completed' WHERE id = ?", (case_id,))
    conn.commit()
    conn.close()


def resolve_case(case_id: int):
    """Marks a case as resolved (patient treated/discharged) — separate
    from session_status, which only tracks the voice conversation."""
    init_db()
    conn = _connect()
    conn.execute("UPDATE cases SET case_status = 'resolved' WHERE id = ?", (case_id,))
    conn.commit()
    conn.close()


def get_cases_for_hospital(hospital_name: str) -> list:
    all_cases = get_all_cases()
    return [c for c in all_cases if c.get("hospital_name") == hospital_name]


def get_all_cases():
    init_db()
    conn = _connect()
    conn.row_factory = sqlite3.Row

    rows = conn.execute("SELECT * FROM cases ORDER BY id DESC").fetchall()
    cases = [dict(r) for r in rows]

    followup_rows = conn.execute(
        "SELECT * FROM case_followups ORDER BY case_id, id ASC"
    ).fetchall()
    conn.close()

    followups_by_case = {}
    for f in followup_rows:
        followups_by_case.setdefault(f["case_id"], []).append({
            "timestamp": f["timestamp"],
            "transcript": f["transcript"],
            "language": f["language"],
        })

    for c in cases:
        c["followups"] = followups_by_case.get(c["id"], [])

    return cases
