import math

HOSPITALS = [
    {
        "name": "King George Hospital",
        "type": "Government",
        "address": "Maharani Peta, Visakhapatnam",
        "lat": 17.7231,
        "lng": 83.3012,
        "antivenom": True,
        "phone": "0891-2564891"
    },
    {
        "name": "GEMS Hospital Visakhapatnam",
        "type": "Government",
        "address": "MVP Colony, Visakhapatnam",
        "lat": 17.7483,
        "lng": 83.3246,
        "antivenom": True,
        "phone": "0891-2523444"
    },
    {
        "name": "Visakha Institute of Medical Sciences (VIMS)",
        "type": "Government",
        "address": "Seethammadhara, Visakhapatnam",
        "lat": 17.7480,
        "lng": 83.3011,
        "antivenom": True,
        "phone": "0891-2727272"
    },
    {
        "name": "District Hospital Anakapalle",
        "type": "Government",
        "address": "Anakapalle, Visakhapatnam District",
        "lat": 17.6914,
        "lng": 83.0038,
        "antivenom": True,
        "phone": "08924-223333"
    },
    {
        "name": "Area Hospital Narsipatnam",
        "type": "Government",
        "address": "Narsipatnam, Visakhapatnam District",
        "lat": 17.6667,
        "lng": 82.6167,
        "antivenom": True,
        "phone": "08932-222222"
    },
    {
        "name": "PHC Chodavaram",
        "type": "PHC",
        "address": "Chodavaram, Visakhapatnam District",
        "lat": 17.8167,
        "lng": 82.9333,
        "antivenom": False,
        "phone": "08933-222222"
    },
    {
        "name": "PHC Paderu",
        "type": "PHC",
        "address": "Paderu, Alluri Sitharama Raju District",
        "lat": 18.0667,
        "lng": 82.6667,
        "antivenom": False,
        "phone": "08936-222222"
    },
]

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_nearest_hospitals(lat: float, lng: float, top_n: int = 3) -> list:
    scored = []
    for h in HOSPITALS:
        dist = haversine(lat, lng, h["lat"], h["lng"])
        scored.append({**h, "distance_km": round(dist, 2)})
    scored.sort(key=lambda x: x["distance_km"])
    return scored[:top_n]