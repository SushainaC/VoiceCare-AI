# VoiceCare AI

## Overview
VoiceCare AI is an interruption-aware voice assistant for hospital appointment booking and FAQs. It is designed to provide low-latency, real-time conversations while allowing users to interrupt naturally.

## Features
- Real-time React frontend
- FastAPI backend
- Audio recording
- Audio upload endpoint
- WebRTC-ready architecture
- Silero VAD design
- Redis-based context management (architecture)
- LangGraph orchestration (architecture)

## Tech Stack
- React
- FastAPI
- Python
- Axios
- WebRTC
- Whisper (planned)
- LangGraph
- Redis

## Project Structure

VoiceCare-AI/
├── frontend/
├── backend/
├── docs/
└── README.md

## How to Run

Backend

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

Frontend

```bash
cd frontend
npm install
npm run dev
```

## Future Improvements

- Whisper Speech-to-Text
- GPT-powered responses
- Text-to-Speech
- Real-time interruption detection
- LangSmith observability