from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_PATH = "./snake3_model"

print("Loading Snake3 model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()
print("Snake3 ready.")

CORRECTIVE_MESSAGES = {
    "tourniquet": "Do NOT tie a cloth or rope above the bite. This worsens venom spread and causes tissue damage. Keep the limb still and go to hospital immediately.",
    "incision": "Do NOT cut the wound. This does not remove venom and increases risk of infection and bleeding.",
    "suction": "Do NOT suck the wound. Venom cannot be removed this way and it risks infecting the helper.",
    "healer_visit": "Traditional healers and mantras cannot treat snakebite venom. Every minute matters. Go to the nearest government hospital immediately.",
    "herbal_remedy": "Do NOT apply herbs, turmeric, or any paste on the bite. This delays proper treatment. Go to hospital now.",
    "electrotherapy": "Electric shock does not neutralize venom. This is dangerous. Go to hospital immediately.",
    "black_stone": "Black stones have no effect on venom. This is not a treatment. Go to hospital immediately.",
    "alcohol": "Do NOT give alcohol. It accelerates venom absorption. Go to hospital immediately.",
    "delay": "Time is critical in snakebite. Do not wait. Go to the nearest hospital immediately.",
    "walking": "Do NOT walk. Movement speeds up venom circulation. Carry the patient or use a vehicle.",
    "default": "This practice is dangerous. Stop immediately and go to the nearest hospital."
}
#python -m uvicorn main:app --reload --port 8000
def predict(text: str) -> dict:
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )
    with torch.no_grad():
        outputs = model(**inputs)

    pred = torch.argmax(outputs.logits, dim=1).item()
    confidence = torch.softmax(outputs.logits, dim=1).max().item()

    if pred == 1:
        # Pick corrective message — default for now, category detection coming
        return {
            "label": "HARMFUL",
            "category": "default",
            "confidence": round(confidence * 100, 2),
            "message": CORRECTIVE_MESSAGES.get("default")
        }
    else:
        return {
            "label": "SAFE",
            "category": "safe",
            "confidence": round(confidence * 100, 2),
            "message": None
        }