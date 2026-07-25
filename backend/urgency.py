URGENCY_MAP = {
    "tourniquet":     "CRITICAL",
    "incision":       "CRITICAL",
    "electrotherapy": "CRITICAL",
    "suction":        "HIGH",
    "alcohol":        "HIGH",
    "walking":        "HIGH",
    "delay":          "HIGH",
    "healer_visit":   "MEDIUM",
    "herbal_remedy":  "MEDIUM",
    "black_stone":    "MEDIUM",
    "safe":           "LOW",
    "default":        "HIGH",
}

def get_urgency(label: str, category: str) -> str:
    """Same rule cases.py already uses: SAFE cases are always LOW urgency,
    HARMFUL cases are urgency-mapped by category."""
    if label != "HARMFUL":
        return "LOW"
    return URGENCY_MAP.get(category, URGENCY_MAP["default"])