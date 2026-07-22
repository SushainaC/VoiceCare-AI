import os
import base64
import requests
import whisper
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import anthropic

load_dotenv()

app = FastAPI()

# --- Load models / clients once at startup ---
whisper_model = whisper.load_model("base")
claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # default: "Rachel"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are VoiceCare AI, a warm, efficient hospital receptionist assistant.
You help patients book, reschedule, or cancel appointments, and answer common hospital FAQs
(visiting hours, departments, insurance, directions, etc).
Keep replies short and conversational — 1-3 sentences — since they will be spoken aloud.
If you don't know something specific to this hospital, say so and offer to connect them to a human."""


@app.get("/")
def root():
    return {"message": "VoiceCare AI Backend Running 🚀"}


def text_to_speech_elevenlabs(text: str) -> bytes:
    """Call ElevenLabs REST API directly, no SDK needed."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()  # raises an error if the request failed
    return response.content  # raw mp3 bytes


@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", file.filename)

    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    # 1. Speech to text
    stt_result = whisper_model.transcribe(filepath, fp16=False)
    user_text = stt_result["text"].strip()
    print("User said:", user_text)

    if not user_text:
        return {"status": "error", "message": "No speech detected"}

    # 2. LLM response
    llm_response = claude_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_text}],
    )
    reply_text = "".join(
        block.text for block in llm_response.content if block.type == "text"
    )
    print("Claude replied:", reply_text)

    # 3. Text to speech (via direct REST call)
    try:
        audio_bytes = text_to_speech_elevenlabs(reply_text)
    except requests.exceptions.HTTPError as e:
        print("ElevenLabs error:", e, e.response.text)
        return {"status": "error", "message": "TTS failed", "detail": e.response.text}

    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

    return {
        "status": "success",
        "user_text": user_text,
        "reply_text": reply_text,
        "audio_base64": audio_base64,
    }