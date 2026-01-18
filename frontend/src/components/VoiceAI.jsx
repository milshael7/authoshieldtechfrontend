import React, { useEffect, useMemo, useRef, useState } from "react";

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://authoshieldtech2.onrender.com"
  );
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function pickProfessionalVoices(voices) {
  // We don't show raw voice names; we map to professional labels.
  // We'll pick best matches available on the device.
  const list = voices || [];
  const by = (pred) => list.find(pred);

  const candidates = [
    {
      id: "pro_us_female",
      label: "Professional US (Female)",
      match: (v) =>
        /en-US/i.test(v.lang) && /Samantha|Aria|Jenny|Zira|Google US English/i.test(v.name),
    },
    {
      id: "pro_us_male",
      label: "Professional US (Male)",
      match: (v) =>
        /en-US/i.test(v.lang) && /Guy|Davis|Matthew|Google US English/i.test(v.name) && /Male|Guy|Davis|Matthew/i.test(v.name),
    },
    {
      id: "pro_uk",
      label: "Professional UK",
      match: (v) => /en-GB/i.test(v.lang),
    },
    {
      id: "neutral_en",
      label: "Neutral English",
      match: (v) => /^en/i.test(v.lang),
    },
    {
      id: "accessibility",
      label: "Accessibility Voice",
      match: (v) => /en/i.test(v.lang) && /compact|enhanced|premium/i.test(v.name),
    },
  ];

  const resolved = candidates
    .map((c) => {
      const v = by(c.match);
      return v ? { ...c, voiceName: v.name, lang: v.lang } : null;
    })
    .filter(Boolean);

  // Always include a fallback option
  if (resolved.length === 0 && list.length) {
    resolved.push({
      id: "fallback",
      label: "Standard Voice",
      voiceName: list[0].name,
      lang: list[0].lang,
    });
  }

  return resolved;
}

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "AutoProtect Voice",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const [supported, setSupported] = useState(true);

  // Modes
  const [conversationMode, setConversationMode] = useState(false); // hands-free
  const [voiceReply, setVoiceReply] = useState(true);

  // Voice selection (professional labels)
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState(() => {
    return window.localStorage.getItem("autoprotect_voice_choice") || "pro_us_female";
  });

  // SpeechRecognition states
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");

  const recRef = useRef(null);
  const bufferFinalRef = useRef("");     // final text buffer
  const interimRef = useRef("");         // interim text buffer
  const silenceTimerRef = useRef(null);  // detects "you stopped talking"
  const lastSendRef = useRef("");        // prevent duplicate sends
  const busyRef = useRef(false);         // avoid overlapping requests

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  // Load speech synthesis voices & map to professional choices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices?.() || [];
      const opts = pickProfessionalVoices(v);
      setVoiceOptions(opts);

      // If saved choice isn't available, pick the first available.
      if (opts.length && !opts.some(o => o.id === voiceChoice)) {
        setVoiceChoice(opts[0].id);
      }
    };

    load();
    // Some browsers fire this when voices become available
    window.speechSynthesis.onvoiceschanged = load;

    return () => {
      try { window.speechSynthesis.onvoiceschanged = null; } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create recognition instance
  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus("SpeechRecognition not supported on this device/browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true; // required for conversation mode

    rec.onstart = () => {
      setListening(true);
      setStatus(conversationMode ? "Conversation listening…" : "Listening…");
    };

    rec.onerror = (e) => {
      setListening(false);
      setStatus("Mic error: " + (e?.error || "unknown"));
      clearTimeout(silenceTimerRef.current);
    };

    rec.onend = () => {
      setListening(false);
      clearTimeout(silenceTimerRef.current);

      // In push-to-talk mode, end means send whatever we have.
      if (!conversationMode) {
        const finalText = (bufferFinalRef.current + " " + interimRef.current).trim();
        bufferFinalRef.current = "";
        interimRef.current = "";
        setYouSaid(finalText || "");
        if (finalText) void sendToAI(finalText);
        setStatus("Idle");
      } else {
        // In conversation mode, browser might stop unexpectedly (mobile).
        // We keep it "armed", user can hit Stop/Start again if needed.
        setStatus("Conversation paused (tap Start to resume)");
      }
    };

    rec.onresult = (event) => {
      let finalText = bufferFinalRef.current || "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) finalText += text + " ";
        else interim += text;
      }

      bufferFinalRef.current = finalText;
      interimRef.current = interim;

      const combined = (finalText + interim).trim();
      setYouSaid(combined);

      // Hands-free: send after silence
      if (conversationMode) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const msg = (bufferFinalRef.current + " " + interimRef.current).trim();
          if (!msg) return;

          // Avoid double-sending the same line
          if (msg === lastSendRef.current) return;
          lastSendRef.current = msg;

          // Clear buffers so new speech starts fresh
          bufferFinalRef.current = "";
          interimRef.current = "";
          setYouSaid(msg);

          void sendToAI(msg);
        }, 900); // silence window (ms). Can tune later.
      }
    };

    recRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
      clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationMode]);

  // Save voice choice
  useEffect(() => {
    try {
      window.localStorage.setItem("autoprotect_voice_choice", voiceChoice);
    } catch {}
  }, [voiceChoice]);

  function speak(text) {
    if (!voiceReply) return;
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);

      const all = window.speechSynthesis.getVoices?.() || [];
      const opt = voiceOptions.find(o => o.id === voiceChoice);
      const chosen = opt ? all.find(v => v.name === opt.voiceName) : null;
      if (chosen) u.voice = chosen;

      u.onstart = () => setStatus("Speaking…");
      u.onend = () => setStatus(conversationMode ? "Conversation listening…" : "Reply ready");

      window.speechSynthesis.speak(u);
    } catch {
      // If speaking fails, we still show text.
    }
  }

  async function sendToAI(message) {
    const clean = (message || "").trim();
    if (!clean) return;
    if (busyRef.current) return;

    busyRef.current = true;
    setStatus("Thinking…");
    setAiSays("");

    const ctx = (() => {
      try { return typeof getContext === "function" ? (getContext() || {}) : {}; }
      catch { return {}; }
    })();

    const payload = { message: clean, context: ctx };

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || data?.message || data?.detail || `HTTP ${res.status}`;
        setAiSays(String(msg));
        setStatus("AI error");
        // Speak errors too (so you hear something)
        speak("AI error. " + String(msg));
        busyRef.current = false;
        return;
      }

      const text =
        data?.reply ??
        data?.text ??
        data?.message ??
        data?.output ??
        data?.result ??
        "";

      if (!text) {
        setAiSays("(No reply from AI)");
        setStatus("Reply empty");
        speak("I did not receive a reply.");
        busyRef.current = false;
        return;
      }

      setAiSays(text);
      setStatus("Reply ready");
      speak(text);
    } catch {
      setAiSays("Network error calling AI");
      setStatus("Network error");
      speak("Network error calling the AI.");
    } finally {
      busyRef.current = false;
    }
  }

  function start() {
    if (!recRef.current) return;
    try {
      bufferFinalRef.current = "";
      interimRef.current = "";
      lastSendRef.current = "";
      setYouSaid("");
      setAiSays("");
      recRef.current.start();
    } catch {}
  }

  function stop() {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }

  if (!supported) {
    return (
      <div style={card}>
        <div style={rowTop}>
          <div style={titleStyle}>{title}</div>
        </div>
        <div style={{ opacity: 0.85 }}>{status}</div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={rowTop}>
        <div style={titleStyle}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{status}</div>
      </div>

      <div style={controls}>
        {/* Conversation = hands-free mic */}
        <button
          onClick={() => {
            if (listening) stop();
            else start();
          }}
          style={btnPrimary}
        >
          {listening ? "Stop" : (conversationMode ? "Start Conversation" : "Push to Talk")}
        </button>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={conversationMode}
            onChange={() => setConversationMode(v => !v)}
          />
          Conversation mode (hands-free)
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={voiceReply}
            onChange={() => setVoiceReply(v => !v)}
          />
          Voice reply
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Voice</span>
          <select
            value={voiceChoice}
            onChange={(e) => setVoiceChoice(e.target.value)}
            style={selectStyle}
          >
            {voiceOptions.length === 0 && <option value="fallback">Standard Voice</option>}
            {voiceOptions.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>

          <button
            style={btnSmall}
            onClick={() => speak("Voice preview. AutoProtect is ready.")}
            type="button"
          >
            Preview
          </button>
        </div>
      </div>

      <div style={box}>
        <div style={boxLabel}>You said</div>
        <div style={boxText}>{youSaid || "…"}</div>
      </div>

      <div style={box}>
        <div style={boxLabel}>AI says</div>
        <div style={boxText}>{aiSays || "…"}</div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
        Tip: Turn on Conversation mode and just talk. When you stop speaking, AutoProtect replies automatically.
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

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const titleStyle = { fontWeight: 800, letterSpacing: 0.2 };

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
  fontWeight: 800,
};

const btnSmall = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
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

const selectStyle = {
  borderRadius: 10,
  padding: "8px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
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
