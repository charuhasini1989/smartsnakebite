import pyttsx3
import threading
import sys

CORRECTIVE_AUDIO = {
    "en": {
        "HARMFUL": "Warning. A harmful practice has been detected. Stop immediately and go to the nearest hospital.",
        "SAFE": "No harmful practice detected. Please proceed to the hospital as a precaution.",
    },
    "hi": {
        "HARMFUL": "Chetavani. Stop . Emergency. Stop. Emergency.",
        "SAFE": "Reporting to hospital",
    },
    "te": {
        "HARMFUL": "Hechcharika. Stop . Emergency. Stop. Emergency",
        "SAFE": "Reporting to hospital.",
    },
}

ASK_DETAILS_AUDIO = {
    "en": "Please tell us the patient's name and current location so we can help.",
    "hi": "Kripya hamein mareez ka naam aur unki abhi ki location batayein.",
    "te": "Dayachesi rogi paeru mariyu ippudu unna sthalam cheppandi.",
}

_lock = threading.Lock()


def _speak_worker(message: str) -> None:
    com_initialized = False
    try:
        if sys.platform == "win32":
            import pythoncom
            pythoncom.CoInitialize()
            com_initialized = True

        with _lock:
            engine = pyttsx3.init()
            engine.setProperty('rate', 145)
            engine.setProperty('volume', 1.0)
            engine.say(message)
            engine.runAndWait()
            engine.stop()

    except Exception as e:
        print(f"[tts] speech failed: {e}", file=sys.stderr)

    finally:
        if com_initialized:
            import pythoncom
            pythoncom.CoUninitialize()


def speak_message(message: str) -> None:
    """Fire-and-forget: speaks arbitrary text in a background thread.
    The shared lock means calls queue up and play in order, rather than
    overlapping — so calling speak() then ask_for_details() back-to-back
    plays the advice fully, then the follow-up question, not both at once."""
    threading.Thread(target=_speak_worker, args=(message,), daemon=True).start()


def speak(label: str, language: str = "en") -> None:
    lang = language if language in CORRECTIVE_AUDIO else "en"
    message = CORRECTIVE_AUDIO[lang].get(label, CORRECTIVE_AUDIO["en"][label])
    speak_message(message)


def ask_for_details(language: str = "en") -> None:
    lang = language if language in ASK_DETAILS_AUDIO else "en"
    speak_message(ASK_DETAILS_AUDIO[lang])


AMBULANCE_DISPATCH_AUDIO = {
    "en": "An ambulance has been dispatched from {hospital_name}. Please stay calm.",
    "hi": "{hospital_name} se ek ambulance ravaana ho chuki hai. Kripya shant rahein.",
    "te": "{hospital_name} nunchi ambulance bayaludherindhi. Dayachesi prashanthamga undandi.",
}


def speak_ambulance_dispatch(hospital_name: str, language: str = "en") -> None:
    lang = language if language in AMBULANCE_DISPATCH_AUDIO else "en"
    template = AMBULANCE_DISPATCH_AUDIO[lang]
    speak_message(template.format(hospital_name=hospital_name))
