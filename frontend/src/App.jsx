import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const connectBackend = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/");
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage("Unable to connect");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h1>🏥 VoiceCare AI</h1>

      <button onClick={connectBackend}>
        Connect Backend
      </button>

      <h2>{message}</h2>
    </div>
  );
}

export default App;