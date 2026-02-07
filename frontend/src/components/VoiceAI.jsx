// frontend/src/components/VoiceAI.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ================= BRAND + STATE ================= */

const AI_STATE = {
  IDLE: "Idle",
  LISTENING: "Listening",
  THINKING: "Thinking",
  SPEAKING: "Speaking",
};

/* ================= HELPERS ================= */

function getApiBase() {
  return String(import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim();
}

function isAbsoluteUrl(s) {
  return /^https?:\/\//i.test(String(s || "")) || /^wss?:\/\//i.test(String(s || ""));
}

function joinUrl(base, path) {
  if (!path) return base || "";
  if (isAbsoluteUrl(path)) return path;
  if (!base) return path;
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const safeStr = (v, max = 6000) => String(v ?? "").slice(0, max);

/* Make speech more human */
function cleanTextForSpeech(t) {
  return safeStr(t)
    .replace(/```[\s\S]*?```/g, "Code omitted.")
    .replace(/([.!?])\s+/g, "$1 … ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ================= COMPONENT ================= */

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "AutoShield AI",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const [aiState, setAiState] = useState(AI_STATE.IDLE);
  const [listening, setListening] = useState(false);
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");

  const [conversationMode, setConversationMode] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);

  const recRef = useRef(null);
  const speakingRef = useRef(false);
  const busyRef = useRef(false);
  const silenceTimerRef = useRef(null);

  /* ================= SPEECH ================= */

  const speak = async (text) => {
    if (!voiceReply || !("speechSynthesis" in window)) return;

    const say = cleanTextForSpeech(text);
    if (!say) return;

    const shouldResume = conversationMode && listening;
    if (shouldResume) stopListening();

    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const u = new SpeechSynthesisUtterance(say);
      u.rate = 1.0;
      u.pitch = 1.0;

      speakingRef.current = true;
      setAiState(AI_STATE.SPEAKING);

      u.onend = () => {
        speakingRef.current = false;
        setAiState(conversationMode ? AI_STATE.LISTENING : AI_STATE.IDLE);
        if (shouldResume) setTimeout(() => startListening(false), 300);
      };

      synth.speak(u);
    } catch {
      speakingRef.current = false;
      setAiState(AI_STATE.IDLE);
    }
  };

  /* ================= MIC ================= */

  const startListening = (reset = true) => {
    if (!recRef.current) return;
    if (reset) {
      setYouSaid("");
      setAiSays("");
    }
    recRef.current.start();
  };

  const stopListening = () => {
    try {
      recRef.current?.stop();
    } catch {}
  };

  useEffect(() => {
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setListening(true);
      setAiState(AI_STATE.LISTENING);
    };

    rec.onend = () => {
      setListening(false);
      if (!conversationMode) setAiState(AI_STATE.IDLE);
    };

    rec.onresult = (e) => {
      if (speakingRef.current) return;

      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }

      setYouSaid(text);

      if (conversationMode) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          sendToAI(text);
        }, 900);
      }
    };

    recRef.current = rec;
    return () => rec.stop();
  }, [conversationMode]);

  /* ================= AI ================= */

  async function sendToAI(message) {
    const clean = safeStr(message).trim();
    if (!clean || busyRef.current) return;

    busyRef.current = true;
    setAiState(AI_STATE.THINKING);

    const payload = {
      message: clean,
      context: typeof getContext === "function" ? getContext() : {},
    };

    try {
      const res = await fetch(joinUrl(API_BASE, endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const text = data?.reply || "";

      setAiSays(text);
      setAiState(AI_STATE.IDLE);
      await speak(data?.speakText || text);
    } catch {
      setAiSays("Network error.");
      setAiState(AI_STATE.IDLE);
    } finally {
      busyRef.current = false;
    }
  }

  /* ================= UI ================= */

  return (
    <div style={card}>
      <div style={rowTop}>
        <div style={titleStyle}>
          {title}
          <span
            style={{
              marginLeft: 8,
              width: 10,
              height: 10,
              borderRadius: "50%",
              display: "inline-block",
              background:
                aiState === AI_STATE.SPEAKING
                  ? "#2bd576"
                  : aiState === AI_STATE.THINKING
                  ? "#ffd166"
                  : aiState === AI_STATE.LISTENING
                  ? "#7aa2ff"
                  : "#666",
              animation: aiState !== AI_STATE.IDLE ? "pulse 1.2s infinite" : "none",
            }}
          />
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{aiState}</div>
      </div>

      <button
        style={btnPrimary}
        onClick={() => (listening ? stopListening() : startListening())}
      >
        {listening ? "Stop" : conversationMode ? "Start Conversation" : "Push to Talk"}
      </button>

      <div style={box}>
        <b>You said</b>
        <div>{youSaid || "…"}</div>
      </div>

      <div style={box}>
        <b>AutoShield says</b>
        <div>{aiSays || "…"}</div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  padding: 14,
  borderRadius: 14,
  background: "rgba(0,0,0,.35)",
  border: "1px solid rgba(255,255,255,.1)",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle = { fontWeight: 800 };

const btnPrimary = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  fontWeight: 700,
};

const box = {
  marginTop: 10,
  padding: 10,
  borderRadius: 10,
  background: "rgba(0,0,0,.25)",
};
