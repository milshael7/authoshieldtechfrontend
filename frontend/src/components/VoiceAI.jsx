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
  const finalTextRef = useRef("");

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
      setStatus(conversation ? "Paused (tap mic to resume)" : "Idle");
      // In conversation mode, we can auto-restart after speaking ends
      // but iOS/Safari may block auto-restart; we keep it manual-safe.
    };

    rec.onerror = (e) => {
      setListening(false);
      setStatus("Mic error: " + (e?.error || "unknown"));
    };

    rec.onresult = (event) => {
      let interim = "";
      let finalText = finalTextRef.current || "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) finalText += text;
        else interim += text;
      }

      finalTextRef.current = finalText;
      setTranscript((finalText + " " + interim).trim());

      // If we got a final chunk, send it
      const last = event.results[event.results.length - 1];
      if (last && last.isFinal) {
        const msg = finalTextRef.current.trim();
        // reset capture buffer (so next sentence is separate)
        finalTextRef.current = "";
        if (msg) void sendToAI(msg);
      }
    };

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak(text) {
    if (!speechOn) return;
    if (!("speechSynthesis" in window)) return;

    // stop any previous speech
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;

    // pick a decent English voice if available
    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferred =
      voices.find((v) => /en-US/i.test(v.lang) && /female|aria|samantha|zira/i.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang)) ||
      voices[0];

    if (preferred) u.voice = preferred;

    window.speechSynthesis.speak(u);
  }

  async function sendToAI(message) {
    setStatus("Thinking…");
    setReply("");

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setStatus("AI error: " + msg);
        return;
      }

      const text =
        data?.reply ||
        data?.text ||
        data?.message ||
        data?.output ||
        "(No reply)";

      setReply(text);
      setStatus("Reply ready");
      speak(text);
    } catch (e) {
      setStatus("Network error");
    }
  }

  function startMic() {
    if (!recRef.current) return;
    try {
      finalTextRef.current = "";
      setTranscript("");
      recRef.current.start();
    } catch (e) {
      // start() can throw if already started
    }
  }

  function stopMic() {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
  }

  function toggleMic() {
    if (!supported) return;
    if (listening) stopMic();
    else startMic();
  }

  function toggleConversation() {
    const next = !conversation;
    setConversation(next);
    setStatus(next ? "Conversation mode ON" : "Conversation mode OFF");
    // In conversation mode, user still taps mic to comply with browser policies.
  }

  if (!supported) {
    return (
      <div style={card}>
        <div style={titleStyle}>{title}</div>
        <div style={{ opacity: 0.85 }}>
          Voice input isn’t supported in this browser. Try Chrome on desktop or
          Android. (iPhone Safari can be limited.)
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
            onChange={toggleConversation}
          />
          Conversation mode
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={speechOn}
            onChange={() => setSpeechOn((v) => !v)}
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
        Tip: On iPhone, you may need to tap “Push to Talk” each time due to
        browser mic rules.
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
  fontWeight: 600,
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
