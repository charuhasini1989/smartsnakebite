from faster_whisper import WhisperModel
import tempfile
import os

TELUGU_MODEL_PATH = r"C:\Users\glsch\.cache\huggingface\hub\whisper-telugu-small-ct2"

# Generic model — handles Hindi + English. faster-whisper pulls a
# pre-converted CT2 build automatically, so no manual conversion needed here.
print("Loading generic Whisper small (Hindi/English)...")
whisper_general = WhisperModel("small", device="cpu", compute_type="int8")
print("Generic Whisper ready.")

# Telugu-specific fine-tuned model — the one you converted to CT2 earlier.
print("Loading Telugu Whisper (fine-tuned, CT2)...")
whisper_telugu = WhisperModel(TELUGU_MODEL_PATH, device="cpu", compute_type="int8")
print("Telugu Whisper ready.")


def transcribe_audio(audio_bytes: bytes) -> dict:
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # ── Step 1: cheap language detection pass ──────────────────────────
        # beam_size=1 keeps this fast — we only need info.language here,
        # not a full transcript. info is populated before segments are
        # consumed, so this is a lightweight probe, not a double transcribe.
        _, probe_info = whisper_general.transcribe(
            tmp_path,
            beam_size=1,
            language=None,
        )
        detected_language = probe_info.language
        detection_confidence = probe_info.language_probability

        # ── Step 2: route to the right model ───────────────────────────────
        if detected_language == "te":
            active_model = whisper_telugu
            transcribe_language = "te"
        else:
            active_model = whisper_general
            transcribe_language = detected_language  # "hi", "en", etc.

        segments, final_info = active_model.transcribe(
            tmp_path,
            beam_size=5,
            language=transcribe_language,
        )
        transcript = " ".join([seg.text for seg in segments]).strip()

        return {
            "transcript": transcript,
            "language": detected_language,
            "language_probability": round(detection_confidence * 100, 2),
            "model_used": "telugu" if detected_language == "te" else "general"
        }
    finally:
        os.unlink(tmp_path)