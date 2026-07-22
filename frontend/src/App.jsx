import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Connect Backend
  const connectBackend = async () => {
    const res = await axios.get("http://127.0.0.1:8000/");
    setMessage(res.data.message);
  };

  // Start Recording
  const startRecording = async () => {
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
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "voice.webm"
      );

      const response = await axios.post(
        "http://127.0.0.1:8000/upload-audio",
        formData
      );

      alert("Uploaded Successfully ✅");

      console.log(response.data);
    };

    recorder.start();

    mediaRecorderRef.current = recorder;

    setRecording(true);
  };

  // Stop Recording
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h1>🏥 VoiceCare AI</h1>

      <button onClick={connectBackend}>
        Connect Backend
      </button>

      <h3>{message}</h3>

      <hr />

      {!recording ? (
        <button onClick={startRecording}>
          🎤 Start Recording
        </button>
      ) : (
        <button onClick={stopRecording}>
          ⏹ Stop Recording
        </button>
      )}
    </div>
  );
}

export default App;