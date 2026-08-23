from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import difflib
import re

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

# ── Category keyword dictionary ──────────────────────────────────────
# The Snake3 model is a BINARY classifier (harmful/safe) — it was never
# trained on category labels, so category can't come from the model's
# output. This dictionary drives a rule-based fallback: once the model
# says HARMFUL, we scan the raw transcript for keyword/phrase hits in
# English, Hindi, and Telugu to guess *which* harmful practice it was.
CATEGORY_KEYWORDS = {
    "tourniquet": [
        "tourniquet", "tied a cloth", "tied a rope", "tied above the bite",
        "tied a rubber band", "band above the wound", "cloth above the bite",
        "tied it tightly", "rubber band",
        "రబ్బరు పట్టీ", "పట్టీ కట్ట", "గట్టిగా కట్ట", "తాడు కట్ట",
        "కట్టు కట్ట",  # stem covers కట్టాను/కట్టాము/కట్టారు (I/we/they tied)
        "కట్టు కట్టాము", "కట్టు కట్టాను", "కట్టు కట్టారు",  # full forms, for fuzzy matching against ASR-mutated versions
        "बांध दिया", "रस्सी बांधी", "कपड़ा बांधा", "जोर से बांधा",
        "पट्टी बांधी", "रबर बैंड बांधा", "टाइट बांधा",
    ],
    "incision": [
        "cut the wound", "made a cut", "cut with a knife", "cut the bite",
        "cut it open", "made an incision",
        "కోశాము", "కోశాను", "కోశారు", "కోసాము", "కోసాను", "కోసారు", "కోసాడు", "కోసింది",
        "కత్తితో కో", "గాటు పెట్ట", "కోసేశాము", "కోసేశాను",
        "चीरा लगाया", "चीरा लगा दिया", "काट दिया", "चाकू से काटा", "घाव काटा",
    ],
    "suction": [
        "sucked the wound", "sucked out the poison", "sucked venom",
        "sucked out the venom", "used mouth to suck",
        "నోరు పెట్టి చీకా", "విషం పీల్చ", "నోటితో పీల్చ", "చీకా",
        "जहर चूस", "मुँह से चूस", "ज़हर चूस", "विष चूस",
    ],
    "healer_visit": [
        "traditional healer", "witch doctor", "went to healer", "sorcerer",
        "mantra", "magic healer", "went to a baba", "faith healer",
        "మంత్రగాడి దగ్గరికి", "మంత్రగాడు", "మంత్రసాని", "పూజారి దగ్గరికి",
        "వైద్యుడి దగ్గరికి కాకుండా",
        "ओझा के पास", "तांत्रिक के पास", "बाबा के पास ले गए", "मंत्र पढ़ा",
        "झाड़ फूंक",
    ],
    "herbal_remedy": [
        "applied herbs", "turmeric paste", "herbal paste", "home remedy applied",
        "applied leaves", "put turmeric",
        "మూలికలు వేశా", "పసుపు రాశా", "ఆకులు కట్ట", "మూలిక పెట్ట",
        "जड़ी बूटी लगा", "हल्दी लगा", "पत्ते बांध", "घरेलू नुस्खा",
    ],
    "electrotherapy": [
        "electric shock", "gave a shock", "electrocuted", "used electric current",
        "కరెంట్ షాక్ ఇచ్చ", "విద్యుత్ షాక్", "కరెంట్ పెట్ట",
        "बिजली का झटका दि", "करंट दि", "बिजली दिखा",
    ],
    "black_stone": [
        "black stone", "snake stone", "applied stone", "snake stone remedy",
        "నల్ల రాయి పెట్ట", "పాము రాయి", "రాయి పెట్ట",
        "काला पत्थर लगा", "सर्प मणि", "पत्थर लगा",
    ],
    "alcohol": [
        "gave alcohol", "gave him a drink", "gave liquor", "made him drink alcohol",
        "మద్యం ఇచ్చ", "సారా ఇచ్చ", "మద్యం తాగించ",
        "शराब पिला", "दारू पिला", "शराब दी",
    ],
    "delay": [
        "waited before going", "hours passed", "didn't go immediately",
        "took time to decide", "delayed going to hospital",
        "ఆలస్యం చేశ", "గంటలు గడిచా", "వెంటనే వెళ్లలేదు",
        "देर हो गई", "घंटे बीत गए", "देर से गए", "तुरंत नहीं गए",
    ],
    "walking": [
        "made him walk", "walked to hospital", "walked the patient",
        "he walked", "walked all the way",
        "నడిపించ", "నడుచుకుంటూ వెళ్ళ", "నడిపి తీసుకెళ్ళ", "నడిచి వెళ్ళ",
        "चलवा दिया", "पैदल", "चलकर गया", "पैदल भेजा",  # पैदल = "on foot", distinctive enough alone
    ],
}

# Priority order when multiple categories match in the same transcript —
# more clinically severe / higher-urgency practice wins. Keep this in
# sync with URGENCY_MAP's tiers in urgency.py.
CATEGORY_PRIORITY = [
    "tourniquet", "incision", "electrotherapy",      # CRITICAL
    "suction", "alcohol", "walking", "delay",        # HIGH
    "healer_visit", "herbal_remedy", "black_stone",  # MEDIUM
]


def detect_category(text: str) -> str:
    """
    Category detection for HARMFUL transcripts, in two passes:
      1. Exact/regex pass — matches keyword phrases tolerating extra or
         missing whitespace between words (ASR output is inconsistent
         about word boundaries, e.g. "కట్టు కట్టాము" vs "కట్టుకట్టాము").
      2. Fuzzy pass — only runs for keywords the exact pass missed.
         Compares each transcript word (and adjacent word-pairs, to
         catch words an ASR system split or merged) against the keyword
         using similarity ratio — NOT a full character-by-character
         sliding window, which was both slow and noisy. This catches
         single character-level ASR misrecognitions (e.g. "కట్టుబట్టాము"
         where a consonant got swapped, "కోసాము" vs "కోశాము" spelling
         drift) while a length-difference guard and high threshold keep
         it from matching unrelated short words.

    Never raises — always returns a known category key, falling back
    to 'default'. This sits in the live request path (/api/predict,
    /api/full-pipeline), so it must not be able to crash or block a
    response, and must stay fast (word-level comparisons only, no
    per-character scan of the whole transcript).
    """
    FUZZY_THRESHOLD = 0.86
    MIN_FUZZY_LEN = 6
    MAX_LEN_DIFF = 3

    try:
        if not text or not isinstance(text, str):
            return "default"

        normalized = text.lower().strip()
        if not normalized:
            return "default"

        words = normalized.split()
        # Candidates: each word alone, plus adjacent word-pairs (joined
        # and space-separated) — covers ASR merging or splitting a word
        # that should have been one token.
        candidates = set(words)
        for i in range(len(words) - 1):
            candidates.add(words[i] + words[i + 1])
            candidates.add(words[i] + " " + words[i + 1])

        def regex_hit(keyword: str) -> bool:
            # Join a multi-word keyword's parts with \s* so spacing
            # differences (missing/extra/joined words) don't break the match.
            parts = keyword.lower().split()
            pattern = r"\s*".join(re.escape(p) for p in parts)
            return re.search(pattern, normalized) is not None

        def fuzzy_hit(keyword: str) -> bool:
            kw = keyword.lower().replace(" ", "")
            if len(kw) < MIN_FUZZY_LEN:
                return False  # too short — fuzzy matching would be noisy
            for cand in candidates:
                cand_nospace = cand.replace(" ", "")
                if abs(len(cand_nospace) - len(kw)) > MAX_LEN_DIFF:
                    continue  # skip comparisons unlikely to be a near-miss
                if difflib.SequenceMatcher(None, cand_nospace, kw).ratio() >= FUZZY_THRESHOLD:
                    return True
            return False

        matched = set()
        for category, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if regex_hit(kw) or fuzzy_hit(kw):
                    matched.add(category)
                    break

        for category in CATEGORY_PRIORITY:
            if category in matched:
                return category

        return "default"

    except Exception as e:
        print(f"[hm2] detect_category failed, falling back to default: {e}")
        return "default"


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
        category = detect_category(text)
        return {
            "label": "HARMFUL",
            "category": category,
            "confidence": round(confidence * 100, 2),
            "message": CORRECTIVE_MESSAGES.get(category, CORRECTIVE_MESSAGES["default"])
        }
    else:
        return {
            "label": "SAFE",
            "category": "safe",
            "confidence": round(confidence * 100, 2),
            "message": None
        }


if __name__ == "__main__":
    # Quick sanity tests — run `python hm2.py` directly to check category
    # detection without hitting the API. These don't call the model, just
    # detect_category(), so they run fast and need no GPU/model load wait.
    test_cases = [
        ("I tied a cloth above the bite", "tourniquet"),
        ("పాము కాటు వేసింది, రబ్బరు పట్టీ కట్టాము", "tourniquet"),
        ("పాము కాటు వేసింది కట్టు కట్టాము", "tourniquet"),  # real transcript from testing
        ("పాము కాటేసింది కోసాము", "incision"),  # real transcript — స spelling, not శ
        ("పాము తాటేసింది కట్టుబట్టాము", "tourniquet"),  # real transcript — muffled/ASR-mutated
        ("मुँह से जहर चूस लिया", "suction"),
        ("కాటు దగ్గర నోరు పెట్టి చీకాడు", "suction"),
        ("మంత్రగాడి దగ్గరికి తీసుకెళ్ళాం", "healer_visit"),
        ("ओझा के पास ले गए", "healer_visit"),
        ("applied turmeric paste on the wound", "herbal_remedy"),
        ("गाव में करंट दिया गया", "electrotherapy"),
        ("black stone was applied to the bite", "black_stone"),
        ("शराब पिलाई गई", "alcohol"),
        ("घंटे बीत गए अस्पताल नहीं गए", "delay"),
        ("पैदल अस्पताल ले गए", "walking"),
        ("patient bitten on leg, washed with clean water", "default"),
        # Conflicting signals — tourniquet (CRITICAL) should win over
        # healer_visit (MEDIUM) per CATEGORY_PRIORITY.
        ("tied a rope above the bite then went to a traditional healer", "tourniquet"),
    ]

    passed = 0
    for text, expected in test_cases:
        result = detect_category(text)
        status = "PASS" if result == expected else "FAIL"
        if status == "PASS":
            passed += 1
        print(f"[{status}] expected={expected:<15} got={result:<15} text={text}")

    print(f"\n{passed}/{len(test_cases)} passed")