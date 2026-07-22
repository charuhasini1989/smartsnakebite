from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from hm2 import predict
from transcribe import transcribe_audio
from hospitals import get_nearest_hospitals

app = FastAPI(title="SmartSnakebite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request models ────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    text: str

class LocationRequest(BaseModel):
    lat: float
    lng: float

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "SmartSnakebite API running"}

@app.post("/api/predict")
def predict_text(req: PredictRequest):
    result = predict(req.text)
    return result

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    result = transcribe_audio(audio_bytes)
    return result

@app.post("/api/hospitals")
def nearest_hospitals(req: LocationRequest):
    hospitals = get_nearest_hospitals(req.lat, req.lng)
    return {"hospitals": hospitals}

@app.post("/api/full-pipeline")
async def full_pipeline(file: UploadFile = File(...), lat: float = 17.7231, lng: float = 83.3012):
    # Transcribe audio
    audio_bytes = await file.read()
    transcription = transcribe_audio(audio_bytes)

    # Predict
    prediction = predict(transcription["transcript"])

    # Get nearest hospitals
    hospitals = get_nearest_hospitals(lat, lng)

    return {
        "transcription": transcription,
        "prediction": prediction,
        "hospitals": hospitals
    }