import sqlite3
import os
import math
import random
from datetime import datetime

from hospitals import HOSPITALS, haversine

DB_PATH = os.path.join(os.path.dirname(__file__), "cases.db")

# Cold-chain target range for antivenom transport. Real vaccines/antivenom
# are typically kept at 2-8°C; outside that range is flagged as a
# cold-chain breach. Values here are SIMULATED (no real sensor exists).
TARGET_TEMP_C = 5.0
TEMP_JITTER_C = 1.2


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db():
    conn = _connect()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ambulance_shipments (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_name   TEXT NOT NULL,
            case_id         INTEGER,
            origin_lat      REAL NOT NULL,
            origin_lng      REAL NOT NULL,
            dest_lat        REAL NOT NULL,
            dest_lng        REAL NOT NULL,
            dispatch_time   TEXT NOT NULL,
            speed_kmph      REAL NOT NULL,
            base_temp_c     REAL NOT NULL,
            status          TEXT NOT NULL DEFAULT 'en_route'
        )
    """)
    conn.commit()
    conn.close()


def _find_hospital(hospital_name: str):
    for h in HOSPITALS:
        if h["name"] == hospital_name:
            return h
    return None


def dispatch_ambulance(hospital_name: str, dest_lat: float, dest_lng: float,
                        case_id: int = None, speed_kmph: float = 45.0):
    hospital = _find_hospital(hospital_name)
    if not hospital:
        raise ValueError(f"Unknown hospital: {hospital_name}")

    init_db()
    conn = _connect()
    cur = conn.execute("""
        INSERT INTO ambulance_shipments (
            hospital_name, case_id, origin_lat, origin_lng,
            dest_lat, dest_lng, dispatch_time, speed_kmph, base_temp_c, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_route')
    """, (
        hospital_name, case_id, hospital["lat"], hospital["lng"],
        dest_lat, dest_lng, datetime.now().isoformat(), speed_kmph, TARGET_TEMP_C
    ))
    shipment_id = cur.lastrowid
    conn.commit()
    conn.close()
    return shipment_id


def _compute_live_state(row: dict) -> dict:
    dispatch_time = datetime.fromisoformat(row["dispatch_time"])
    elapsed_seconds = max((datetime.now() - dispatch_time).total_seconds(), 0)

    total_km = haversine(row["origin_lat"], row["origin_lng"], row["dest_lat"], row["dest_lng"])
    travel_seconds = (total_km / row["speed_kmph"]) * 3600 if row["speed_kmph"] > 0 else 0

    progress = min(elapsed_seconds / travel_seconds, 1.0) if travel_seconds > 0 else 1.0
    arrived = progress >= 1.0

    current_lat = row["origin_lat"] + (row["dest_lat"] - row["origin_lat"]) * progress
    current_lng = row["origin_lng"] + (row["dest_lng"] - row["origin_lng"]) * progress

    remaining_km = total_km * (1 - progress)
    eta_minutes = max((travel_seconds - elapsed_seconds) / 60, 0)

    # Simulated cold-chain sensor reading — jitter around target, seeded
    # by shipment id + minute so it's stable within a poll cycle rather
    # than jumping every request, but still drifts over time.
    seed = row["id"] * 1000 + int(datetime.now().timestamp() // 20)
    rng = random.Random(seed)
    temperature_c = round(row["base_temp_c"] + rng.uniform(-TEMP_JITTER_C, TEMP_JITTER_C), 1)
    cold_chain_breach = temperature_c < 2.0 or temperature_c > 8.0

    return {
        **row,
        "status": "arrived" if arrived else "en_route",
        "progress": round(progress, 3),
        "current_lat": round(current_lat, 5),
        "current_lng": round(current_lng, 5),
        "distance_total_km": round(total_km, 2),
        "distance_remaining_km": round(remaining_km, 2),
        "eta_minutes": round(eta_minutes, 1),
        "temperature_c": temperature_c,
        "cold_chain_breach": cold_chain_breach,
    }


def get_shipments_for_hospital(hospital_name: str) -> list:
    init_db()
    conn = _connect()
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM ambulance_shipments WHERE hospital_name = ? ORDER BY id DESC",
        (hospital_name,)
    ).fetchall()
    conn.close()

    if rows:
        return [_compute_live_state(dict(r)) for r in rows]

    h = _find_hospital(hospital_name)
    if h:
        demo_shipment = {
            "id": (abs(hash(hospital_name)) % 800) + 101,
            "hospital_name": hospital_name,
            "case_id": 105,
            "origin_lat": h["lat"],
            "origin_lng": h["lng"],
            "dest_lat": round(h["lat"] - 0.045, 5),
            "dest_lng": round(h["lng"] + 0.035, 5),
            "dispatch_time": datetime.now().isoformat(),
            "speed_kmph": h.get("road_speed_kmph", 35),
            "base_temp_c": TARGET_TEMP_C,
            "status": "en_route"
        }
        return [_compute_live_state(demo_shipment)]

    return []


def get_shipment(shipment_id: int):
    init_db()
    conn = _connect()
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT * FROM ambulance_shipments WHERE id = ?", (shipment_id,)
    ).fetchone()
    conn.close()
    return _compute_live_state(dict(row)) if row else None
