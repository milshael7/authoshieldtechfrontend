import React, { useEffect, useMemo, useRef, useState } from "react";

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://authoshieldtech2.onrender.com"
  );
}

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "Voice AI",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [conversation, setConversation] = useState(false);
  const [speechOn, setSpeechOn] = useState(true);
  const [status, setStatus] = useState("Idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");

  const recRef = useRef(null);
  const bufferRef = useRef("");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus("SpeechRecognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
      setStatus("Listening…");
    };

    rec.onend = () => {
      setListening(false);
      const msg = (bufferRef.current || "").trim();
      bufferRef.current = "";
      if (msg) void sendToAI(msg);
      setStatus(conversation ? "Paused (tap mic to resume)" : "Idle");
    };

    rec.onerror = (e) => {
      setListening(false);
      setStatus("Mic error: " + (e?.error || "unknown"));
    };

    rec.onresult = (event) => {
      let interim = "";
      let finalText = bufferRef.current || "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) finalText += text + " ";
        else interim += text;
      }

      bufferRef.current = finalText;
      setTranscript((finalText + interim).trim());
    };

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak(text) {
    if (!speechOn) return;
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices?.() || [];
      const preferred =
        voices.find(v => /en-US/i.test(v.lang) && /Samantha|Aria|Zira|Google/i.test(v.name)) ||
        voices.find(v => /en/i.test(v.lang)) ||
        voices[0];
      if (preferred) u.voice = preferred;

      u.onstart = () => setStatus("Speaking…");
      u.onend = () => setStatus("Reply ready");

      window.speechSynthesis.speak(u);
    } catch {
      // If speech fails, we still show text.
    }
  }

  async function sendToAI(message) {
    setStatus("Thinking…");
    setReply("");

    const ctx = (() => {
      try {
        return typeof getContext === "function" ? (getContext() || {}) : {};
      } catch {
        return {};
      }
    })();

    // send multiple keys so backend accepts whichever it expects
    const payload = {
      message,
      prompt: message,
      input: message,
      text: message,
      context: ctx,
    };

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          data?.detail ||
          `HTTP ${res.status}`;
        setStatus("AI error: " + msg);
        setReply(String(msg));
        return;
      }

      const text =
        data?.reply ??
        data?.text ??
        data?.message ??
        data?.output ??
        data?.result ??
        data?.answer ??
        "";

      if (!text) {
        setStatus("AI returned empty reply (backend mismatch)");
        setReply("(No reply returned. Backend may use a different field.)");
        return;
      }

      setReply(text);
      setStatus("Reply ready");
      speak(text);
    } catch {
      setStatus("Network error calling AI");
      setReply("Network error calling AI");
    }
  }

  function startMic() {
    if (!recRef.current) return;
    try {
      bufferRef.current = "";
      setTranscript("");
      recRef.current.start();
    } catch {}
  }

  function stopMic() {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }

  function toggleMic() {
    if (!supported) return;
    if (listening) stopMic();
    else startMic();
  }

  if (!supported) {
    return (
      <div style={card}>
        <div style={titleStyle}>{title}</div>
        <div style={{ opacity: 0.85 }}>
          Voice input isn’t supported in this browser.
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={topRow}>
        <div style={titleStyle}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{status}</div>
      </div>

      <div style={controls}>
        <button onClick={toggleMic} style={btnPrimary}>
          {listening ? "Stop Mic" : "Push to Talk"}
        </button>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={conversation}
            onChange={() => setConversation(v => !v)}
          />
          Conversation mode
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={speechOn}
            onChange={() => setSpeechOn(v => !v)}
          />
          Voice reply
        </label>
      </div>

      <div style={box}>
        <div style={boxLabel}>You said</div>
        <div style={boxText}>{transcript || "…"}</div>
      </div>

      <div style={box}>
        <div style={boxLabel}>AI says</div>
        <div style={boxText}>{reply || "…"}</div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
        If “AI says” stays empty, the status line will show the backend error.
      </div>
    </div>
  );
}

const card = {
  borderRadius: 14,
  padding: 14,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(8px)",
};

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const titleStyle = { fontWeight: 700, letterSpacing: 0.3 };

const controls = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 10,
  alignItems: "center",
};

const btnPrimary = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const toggle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  opacity: 0.9,
};

const box = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.25)",
};

const boxLabel = { fontSize: 12, opacity: 0.75, marginBottom: 6 };
const boxText = { whiteSpace: "pre-wrap", lineHeight: 1.35 };
