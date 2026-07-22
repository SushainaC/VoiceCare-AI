import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  // Connect Backend
  const connectBackend = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/");
      console.log("Success:", res.data);
      setMessage(res.data.message);
    } catch (error) {
      console.log("FULL ERROR:", error);
      if (error.response) {
        alert("Backend Error: " + JSON.stringify(error.response.data));
      } else if (error.request) {
        alert("No response from backend.");
      } else {
        alert(error.message);
      }
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setLoading(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });

          const formData = new FormData();
          formData.append("file", blob, "voice.webm");

          const response = await axios.post(
            "http://127.0.0.1:8000/upload-audio",
            formData
          );

          console.log("Backend Response:", response.data);

          if (response.data.status === "error") {
            alert(response.data.message || "No speech detected");
            setLoading(false);
            return;
          }

          setTranscript(response.data.user_text || "No text returned");
          setReplyText(response.data.reply_text || "");

          // Decode base64 audio and play it
          if (response.data.audio_base64) {
            const audioBlob = base64ToBlob(response.data.audio_base64, "audio/mpeg");
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioPlayerRef.current) {
              audioPlayerRef.current.src = audioUrl;
              audioPlayerRef.current.play();
            }
          }
        } catch (error) {
          console.error(error);
          if (error.response) {
            alert(JSON.stringify(error.response.data));
          } else {
            alert(error.message);
          }
        } finally {
          setLoading(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied.");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // Helper: base64 -> Blob
  const base64ToBlob = (base64, mimeType) => {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "60px",
        fontFamily: "Arial",
      }}
    >
      <h1>🏥 VoiceCare AI</h1>

      <button onClick={connectBackend}>Connect Backend</button>
      <h3>{message}</h3>

      <hr />

      {!recording ? (
        <button onClick={startRecording} disabled={loading}>
          🎤 Start Recording
        </button>
      ) : (
        <button onClick={stopRecording}>⏹ Stop Recording</button>
      )}

      {loading && <p>⏳ Thinking...</p>}

      <br />
      <br />

      <h2>You said</h2>
      <div
        style={{
          width: "70%",
          margin: "auto",
          minHeight: "60px",
          border: "1px solid gray",
          padding: "15px",
          borderRadius: "8px",
          background: "#f5f5f5",
        }}
      >
        {transcript}
      </div>

      <h2>VoiceCare AI replied</h2>
      <div
        style={{
          width: "70%",
          margin: "auto",
          minHeight: "60px",
          border: "1px solid gray",
          padding: "15px",
          borderRadius: "8px",
          background: "#e8f4ff",
        }}
      >
        {replyText}
      </div>

      <br />
      <audio ref={audioPlayerRef} controls style={{ marginTop: "20px" }} />
    </div>
  );
}

export default App;