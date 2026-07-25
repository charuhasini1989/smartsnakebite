import math
from urgency import URGENCY_MAP

# ── Hospital data ───────────────────────────────────────────────
# antivenom_stock:      units of polyvalent antivenom currently in stock
# ambulance_total:      total ambulances assigned to this facility
# ambulance_available:  ambulances currently free (not out on a call)
# capacity:             approx. beds relevant to snakebite/emergency intake
# current_patients:     patients currently occupying those beds
# road_speed_kmph:      heuristic avg travel speed for the roads serving this
#                       facility — city/highway hospitals are faster to reach
#                       than Agency-area (hilly, rural) ones like Paderu.
#                       This is an estimate for demo purposes, not a verified figure.

HOSPITALS = [
    {
        "name": "King George Hospital",
        "type": "Government",
        "address": "Maharani Peta, Visakhapatnam",
        "lat": 17.7231, "lng": 83.3012,
        "antivenom": True, "antivenom_stock": 12,
        "ambulance_total": 4, "ambulance_available": 3,
        "capacity": 40, "current_patients": 22,
        "road_speed_kmph": 35,
        "phone": "0891-2564891",
    },
    {
        "name": "GEMS Hospital Visakhapatnam",
        "type": "Government",
        "address": "MVP Colony, Visakhapatnam",
        "lat": 17.7483, "lng": 83.3246,
        "antivenom": True, "antivenom_stock": 6,
        "ambulance_total": 2, "ambulance_available": 1,
        "capacity": 25, "current_patients": 20,
        "road_speed_kmph": 35,
        "phone": "0891-2523444",
    },
    {
        "name": "Visakha Institute of Medical Sciences (VIMS)",
        "type": "Government",
        "address": "Seethammadhara, Visakhapatnam",
        "lat": 17.7480, "lng": 83.3011,
        "antivenom": True, "antivenom_stock": 9,
        "ambulance_total": 3, "ambulance_available": 3,
        "capacity": 30, "current_patients": 11,
        "road_speed_kmph": 35,
        "phone": "0891-2727272",
    },
    {
        "name": "District Hospital Anakapalle",
        "type": "Government",
        "address": "Anakapalle, Visakhapatnam District",
        "lat": 17.6914, "lng": 83.0038,
        "antivenom": True, "antivenom_stock": 4,
        "ambulance_total": 2, "ambulance_available": 1,
        "capacity": 15, "current_patients": 9,
        "road_speed_kmph": 30,
        "phone": "08924-223333",
    },
    {
        "name": "Area Hospital Narsipatnam",
        "type": "Government",
        "address": "Narsipatnam, Visakhapatnam District",
        "lat": 17.6667, "lng": 82.6167,
        "antivenom": True, "antivenom_stock": 3,
        "ambulance_total": 1, "ambulance_available": 1,
        "capacity": 12, "current_patients": 6,
        "road_speed_kmph": 25,
        "phone": "08932-222222",
    },
    {
        "name": "PHC Chodavaram",
        "type": "PHC",
        "address": "Chodavaram, Visakhapatnam District",
        "lat": 17.8167, "lng": 82.9333,
        "antivenom": False, "antivenom_stock": 0,
        "ambulance_total": 1, "ambulance_available": 0,
        "capacity": 6, "current_patients": 4,
        "road_speed_kmph": 25,
        "phone": "08933-222222",
    },
    {
        "name": "PHC Paderu",
        "type": "PHC",
        "address": "Paderu, Alluri Sitharama Raju District",
        "lat": 18.0667, "lng": 82.6667,
        "antivenom": False, "antivenom_stock": 0,
        "ambulance_total": 1, "ambulance_available": 0,
        "capacity": 5, "current_patients": 3,
        "road_speed_kmph": 18,  # hilly Agency-area roads, slower going
        "phone": "08936-222222",
    },

    # ── Additional facilities ──────────────────────────────────────
    # NOTE: names/locations below are real, verifiable government
    # facilities in mandals of Visakhapatnam district. Coordinates are
    # town-center estimates (safe/public). antivenom_stock, ambulance
    # counts, and current_patients are PLACEHOLDER demo values, NOT
    # verified real-time data — same as the rest of this file. Phone
    # numbers are intentionally omitted rather than guessed; look them
    # up from the district health department before using this for
    # anything beyond a prototype/demo.
    {
        "name": "Area Hospital Yelamanchili",
        "type": "Government",
        "address": "Yelamanchili (Elamanchili), Visakhapatnam District",
        "lat": 17.5667, "lng": 82.8500,
        "antivenom": True, "antivenom_stock": 5,
        "ambulance_total": 2, "ambulance_available": 1,
        "capacity": 15, "current_patients": 8,
        "road_speed_kmph": 32,
        "phone": None,
    },
    {
        "name": "CHC Sabbavaram",
        "type": "CHC",
        "address": "Sabbavaram, Visakhapatnam District",
        "lat": 17.7167, "lng": 83.1167,
        "antivenom": True, "antivenom_stock": 3,
        "ambulance_total": 1, "ambulance_available": 1,
        "capacity": 10, "current_patients": 5,
        "road_speed_kmph": 30,
        "phone": None,
    },
    {
        "name": "CHC Bheemunipatnam",
        "type": "CHC",
        "address": "Bheemunipatnam, Visakhapatnam District",
        "lat": 17.8903, "lng": 83.4514,
        "antivenom": True, "antivenom_stock": 4,
        "ambulance_total": 1, "ambulance_available": 1,
        "capacity": 10, "current_patients": 4,
        "road_speed_kmph": 33,
        "phone": None,
    },
    {
        "name": "PHC Anandapuram",
        "type": "PHC",
        "address": "Anandapuram, Visakhapatnam District",
        "lat": 17.8500, "lng": 83.3667,
        "antivenom": False, "antivenom_stock": 0,
        "ambulance_total": 1, "ambulance_available": 0,
        "capacity": 6, "current_patients": 2,
        "road_speed_kmph": 33,
        "phone": None,
    },
    {
        "name": "PHC G.K. Veedhi",
        "type": "PHC",
        "address": "G.K. Veedhi (Gudem Kotha Veedhi), Alluri Sitharama Raju District",
        "lat": 18.0333, "lng": 82.3833,
        "antivenom": False, "antivenom_stock": 0,
        "ambulance_total": 1, "ambulance_available": 0,
        "capacity": 5, "current_patients": 2,
        "road_speed_kmph": 16,  # deep Agency-area terrain
        "phone": None,
    },
    {
        "name": "Area Hospital Araku Valley",
        "type": "Government",
        "address": "Araku Valley, Alluri Sitharama Raju District",
        "lat": 18.3273, "lng": 82.8749,
        "antivenom": True, "antivenom_stock": 2,
        "ambulance_total": 1, "ambulance_available": 1,
        "capacity": 8, "current_patients": 3,
        "road_speed_kmph": 20,
        "phone": None,
    },
]

# ── Antivenom inventory by snake species ────────────────────────
# India's "Big Four" venomous snakes (Russell's Viper, Common Krait,
# Indian Cobra, Saw-scaled Viper) account for most snakebite fatalities
# nationally, and the standard Indian Polyvalent Antivenom (PAV) targets
# exactly these four — that part is a real clinical fact. The specific
# vial counts below are DEMO/PLACEHOLDER data, not a real hospital's
# actual pharmacy inventory.
ANTIVENOM_INVENTORY = {
    "King George Hospital": [
        {"snake": "Russell's Viper", "vials": 5},
        {"snake": "Common Krait", "vials": 3},
        {"snake": "Indian Cobra", "vials": 3},
        {"snake": "Saw-scaled Viper", "vials": 1},
    ],
    "Visakha Institute of Medical Sciences (VIMS)": [
        {"snake": "Russell's Viper", "vials": 4},
        {"snake": "Common Krait", "vials": 2},
        {"snake": "Indian Cobra", "vials": 2},
        {"snake": "Saw-scaled Viper", "vials": 1},
    ],
    "GEMS Hospital Visakhapatnam": [
        {"snake": "Russell's Viper", "vials": 2},
        {"snake": "Common Krait", "vials": 2},
        {"snake": "Indian Cobra", "vials": 1},
        {"snake": "Saw-scaled Viper", "vials": 1},
    ],
    "District Hospital Anakapalle": [
        {"snake": "Russell's Viper", "vials": 2},
        {"snake": "Common Krait", "vials": 1},
        {"snake": "Indian Cobra", "vials": 1},
        {"snake": "Saw-scaled Viper", "vials": 0},
    ],
}


def get_antivenom_inventory(hospital_name: str) -> list:
    if hospital_name in ANTIVENOM_INVENTORY:
        return ANTIVENOM_INVENTORY[hospital_name]

    h = next((x for x in HOSPITALS if x["name"] == hospital_name), None)
    stock = h["antivenom_stock"] if h else 3
    if stock == 0:
        return [
            {"snake": "Russell's Viper", "vials": 0},
            {"snake": "Common Krait", "vials": 0},
            {"snake": "Indian Cobra", "vials": 0},
            {"snake": "Saw-scaled Viper", "vials": 0},
        ]

    v1 = max(1, math.ceil(stock * 0.4))
    v2 = max(1, math.ceil(stock * 0.3))
    v3 = max(0, math.floor(stock * 0.2))
    v4 = max(0, stock - (v1 + v2 + v3))
    return [
        {"snake": "Russell's Viper", "vials": v1},
        {"snake": "Common Krait", "vials": v2},
        {"snake": "Indian Cobra", "vials": v3},
        {"snake": "Saw-scaled Viper", "vials": v4},
    ]

# ── Weight profiles: how much each factor matters, by urgency tier ──
# CRITICAL cases lean hard on speed + stock (get them antivenom fast).
# LOW urgency leans more on workload balancing (don't dogpile one hospital).
WEIGHT_PROFILES = {
    "CRITICAL": {"travel": 0.45, "antivenom": 0.35, "ambulance": 0.10, "workload": 0.10},
    "HIGH":     {"travel": 0.35, "antivenom": 0.30, "ambulance": 0.15, "workload": 0.20},
    "MEDIUM":   {"travel": 0.30, "antivenom": 0.25, "ambulance": 0.20, "workload": 0.25},
    "LOW":      {"travel": 0.25, "antivenom": 0.20, "ambulance": 0.20, "workload": 0.35},
}


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _travel_minutes(dist_km: float, speed_kmph: float) -> float:
    return (dist_km / speed_kmph) * 60


def _score_hospital(h: dict, dist_km: float, urgency: str) -> dict:
    weights = WEIGHT_PROFILES.get(urgency, WEIGHT_PROFILES["HIGH"])

    minutes = _travel_minutes(dist_km, h["road_speed_kmph"])
    travel_score = 1 / (1 + minutes / 20)  # decays smoothly as travel time grows

    # Reference point: 8 units is "comfortably stocked" for normalization.
    stock_score = min(h["antivenom_stock"] / 8, 1.0) if h["antivenom_stock"] > 0 else 0.0

    ambulance_score = h["ambulance_available"] / max(h["ambulance_total"], 1)

    occupancy = h["current_patients"] / max(h["capacity"], 1)
    workload_score = max(1 - occupancy, 0.0)

    total = (
        weights["travel"] * travel_score +
        weights["antivenom"] * stock_score +
        weights["ambulance"] * ambulance_score +
        weights["workload"] * workload_score
    )

    return {
        "distance_km": round(dist_km, 2),
        "travel_minutes": round(minutes, 1),
        "sub_scores": {
            "travel": round(travel_score, 3),
            "antivenom": round(stock_score, 3),
            "ambulance": round(ambulance_score, 3),
            "workload": round(workload_score, 3),
        },
        "score": round(total, 4),
    }


def get_nearest_hospitals(lat: float, lng: float, urgency: str = "HIGH", top_n: int = 3) -> list:
    """
    Ranks hospitals by a weighted combination of travel time, antivenom
    stock, ambulance availability, and current workload — not just raw
    distance. Weighting shifts based on case urgency.

    Hospitals with zero antivenom stock are excluded unless every
    candidate is out of stock, in which case we fall back to ranking
    by the other factors and flag the result.
    """
    candidates = []
    for h in HOSPITALS:
        dist = haversine(lat, lng, h["lat"], h["lng"])
        scoring = _score_hospital(h, dist, urgency)
        candidates.append({**h, **scoring})

    stocked = [c for c in candidates if c["antivenom_stock"] > 0]
    pool = stocked if stocked else candidates
    no_stock_warning = not stocked

    pool.sort(key=lambda c: c["score"], reverse=True)

    results = pool[:top_n]
    if no_stock_warning:
        for r in results:
            r["warning"] = "No hospitals in range currently report antivenom stock — showing best available by other factors."

    return results


def update_hospital_status(name: str, antivenom_stock: int = None,
                            ambulance_available: int = None,
                            current_patients: int = None) -> bool:
    """Lets a hospital update its own live status (e.g. from the dashboard)."""
    for h in HOSPITALS:
        if h["name"] == name:
            if antivenom_stock is not None:
                h["antivenom_stock"] = antivenom_stock
                h["antivenom"] = antivenom_stock > 0
            if ambulance_available is not None:
                h["ambulance_available"] = ambulance_available
            if current_patients is not None:
                h["current_patients"] = current_patients
            return True
    return False
