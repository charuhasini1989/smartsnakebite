from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from hm2 import predict
from transcribe import transcribe_audio
from hospitals import get_nearest_hospitals, update_hospital_status, get_antivenom_inventory, HOSPITALS, haversine, _travel_minutes
from cases import log_case, get_all_cases, add_followup, close_case, resolve_case, get_cases_for_hospital
from urgency import get_urgency
from ambulances import dispatch_ambulance, get_shipments_for_hospital

app = FastAPI(title="SmartSnakebite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    text: str

class LocationRequest(BaseModel):
    lat: float
    lng: float

class HospitalStatusUpdate(BaseModel):
    name: str
    antivenom_stock: int | None = None
    ambulance_available: int | None = None
    current_patients: int | None = None

@app.get("/")
def root():
    return {"status": "SmartSnakebite API running"}

@app.post("/api/predict")
def predict_text(req: PredictRequest):
    return predict(req.text)

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    return transcribe_audio(audio_bytes)

@app.post("/api/hospitals")
def nearest_hospitals(req: LocationRequest):
    hospitals = get_nearest_hospitals(req.lat, req.lng)
    return {"hospitals": hospitals}

@app.get("/api/hospitals/list")
def list_hospitals(lat: float | None = None, lng: float | None = None):
    if lat is not None and lng is not None:
        res = []
        for h in HOSPITALS:
            dist = haversine(lat, lng, h["lat"], h["lng"])
            minutes = _travel_minutes(dist, h.get("road_speed_kmph", 30))
            res.append({
                **h,
                "distance_km": round(dist, 2),
                "travel_minutes": round(minutes, 1)
            })
        return {"hospitals": res}
    return {"hospitals": HOSPITALS}

@app.post("/api/hospitals/update")
def hospital_status_update(req: HospitalStatusUpdate):
    ok = update_hospital_status(
        req.name,
        antivenom_stock=req.antivenom_stock,
        ambulance_available=req.ambulance_available,
        current_patients=req.current_patients,
    )
    return {"updated": ok}

@app.get("/api/cases")
def get_cases():
    return {"cases": get_all_cases()}

@app.post("/api/full-pipeline")
async def full_pipeline(file: UploadFile = File(...), lat: float = 17.7231, lng: float = 83.3012):
    audio_bytes = await file.read()
    transcription = transcribe_audio(audio_bytes)
    prediction = predict(transcription["transcript"])
    language = transcription.get("language", "en")

    urgency = get_urgency(prediction["label"], prediction.get("category", "default"))

    hospitals = get_nearest_hospitals(lat, lng, urgency=urgency)
    top_hospital = hospitals[0] if hospitals else None

    case_id = None
    try:
        case_id = log_case(
            transcript=transcription["transcript"],
            label=prediction["label"],
            category=prediction.get("category", "default"),
            language=language,
            lat=lat,
            lng=lng,
            message=prediction.get("message", ""),
            hospital=top_hospital,
        )
    except Exception as e:
        print(f"[cases] failed to log case: {e}")

    # For harmful cases, dispatch a simulated ambulance from the assigned
    # hospital toward the patient's reported location. This is a computed
    # simulation (dispatch time + speed + straight-line route) — there is
    # no real vehicle GPS feed behind it.
    if case_id and top_hospital and prediction["label"] == "HARMFUL":
        try:
            dispatch_ambulance(top_hospital["name"], dest_lat=lat, dest_lng=lng, case_id=case_id)
        except Exception as e:
            print(f"[ambulances] failed to dispatch: {e}")

    return {
        "case_id": case_id,
        "transcription": transcription,
        "prediction": prediction,
        "urgency": urgency,
        "hospitals": hospitals
    }

@app.post("/api/cases/{case_id}/followup")
async def case_followup(case_id: int, file: UploadFile = File(...)):
    audio_bytes = await file.read()
    transcription = transcribe_audio(audio_bytes)
    entry = add_followup(
        case_id,
        transcription["transcript"],
        transcription.get("language", "en"),
    )
    return entry

class HospitalResponseReq(BaseModel):
    message: str
    hospital_name: str = None

@app.post("/api/cases/{case_id}/hospital-response")
def send_hospital_response(case_id: int, req: HospitalResponseReq):
    entry = add_followup(
        case_id,
        f"🏥 Staff Update ({req.hospital_name or 'Emergency Desk'}): {req.message}",
        language="en",
        sender="hospital"
    )
    return entry

@app.get("/api/cases/{case_id}")
def get_single_case(case_id: int):
    cases = get_all_cases()
    c = next((item for item in cases if item["id"] == case_id), None)
    if not c:
        return {"error": "case not found"}
    return {"case": c}

def _get_hospital_cases_with_fallback(hospital_name: str):
    cases = get_cases_for_hospital(hospital_name)
    if cases:
        return cases

    h = next((x for x in HOSPITALS if x["name"] == hospital_name), None)
    lat = h["lat"] if h else 17.7231
    lng = h["lng"] if h else 83.3012

    return [
        {
            "id": (abs(hash(hospital_name)) % 500) + 201,
            "timestamp": "2026-07-25 18:30:00",
            "transcript": "పాము కాటు వేసింది, రబ్బరు పట్టీ కట్టాము",
            "label": "HARMFUL",
            "category": "tourniquet",
            "urgency": "HIGH",
            "language": "te",
            "lat": round(lat + 0.01, 4),
            "lng": round(lng - 0.01, 4),
            "hospital_name": hospital_name,
            "hospital_distance_km": 3.2,
            "hospital_travel_min": 8.0,
            "case_status": "active",
            "session_status": "completed",
            "followups": [{"language": "te", "transcript": "రోగి పేరు నరసింహారావు"}]
        },
        {
            "id": (abs(hash(hospital_name)) % 500) + 202,
            "timestamp": "2026-07-25 15:10:00",
            "transcript": "Patient bitten on leg, washed wound with clean water and immobilized leg.",
            "label": "SAFE",
            "category": "safe",
            "urgency": "LOW",
            "language": "en",
            "lat": round(lat - 0.02, 4),
            "lng": round(lng + 0.02, 4),
            "hospital_name": hospital_name,
            "hospital_distance_km": 5.1,
            "hospital_travel_min": 12.0,
            "case_status": "resolved",
            "session_status": "completed",
            "followups": []
        }
    ]

@app.get("/api/hospitals/{hospital_name}/overview")
def hospital_overview(hospital_name: str):
    hospital = next((h for h in HOSPITALS if h["name"] == hospital_name), None)
    if not hospital:
        return {"error": "unknown hospital"}
    cases = _get_hospital_cases_with_fallback(hospital_name)
    active = [c for c in cases if c["case_status"] != "resolved"]
    resolved = [c for c in cases if c["case_status"] == "resolved"]
    return {
        "hospital": hospital,
        "active_cases": len(active),
        "resolved_cases": len(resolved),
        "total_cases": len(cases),
    }

@app.get("/api/hospitals/{hospital_name}/antivenom")
def hospital_antivenom(hospital_name: str):
    return {"inventory": get_antivenom_inventory(hospital_name)}

@app.get("/api/hospitals/{hospital_name}/ambulances")
def hospital_ambulances(hospital_name: str):
    return {"shipments": get_shipments_for_hospital(hospital_name)}

@app.get("/api/hospitals/{hospital_name}/cases")
def hospital_cases(hospital_name: str, status: str = "active"):
    cases = _get_hospital_cases_with_fallback(hospital_name)
    if status == "active":
        cases = [c for c in cases if c["case_status"] != "resolved"]
    elif status == "resolved":
        cases = [c for c in cases if c["case_status"] == "resolved"]
    return {"cases": cases}
