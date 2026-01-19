import React, { useEffect, useMemo, useRef, useState } from "react";

function getApiBase() {
  return (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://authoshieldtech2.onrender.com"
  );
}

function pickProfessionalVoices(voices) {
  const list = voices || [];
  const by = (pred) => list.find(pred);

  const candidates = [
    { id: "pro_us_female", label: "Professional US (Female)", match: (v) => /en-US/i.test(v.lang) },
    { id: "pro_us_male", label: "Professional US (Male)", match: (v) => /en-US/i.test(v.lang) },
    { id: "pro_uk", label: "Professional UK", match: (v) => /en-GB/i.test(v.lang) },
    { id: "neutral_en", label: "Neutral English", match: (v) => /^en/i.test(v.lang) },
  ];

  const resolved = candidates
    .map((c) => {
      const v = by(c.match);
      return v ? { ...c, voiceName: v.name, lang: v.lang } : null;
    })
    .filter(Boolean);

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

  // ✅ default ON: hands-free by default
  const [conversationMode, setConversationMode] = useState(true);
  const [voiceReply, setVoiceReply] = useState(true);

  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState(() => {
    return window.localStorage.getItem("autoprotect_voice_choice") || "pro_us_female";
  });

  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");

  const recRef = useRef(null);
  const bufferFinalRef = useRef("");
  const interimRef = useRef("");
  const silenceTimerRef = useRef(null);
  const lastSendRef = useRef("");
  const busyRef = useRef(false);

  const userStoppedRef = useRef(false);
  const shouldAutoRestartRef = useRef(true);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  // Load device voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices?.() || [];
      const opts = pickProfessionalVoices(v);
      setVoiceOptions(opts);

      if (opts.length && !opts.some((o) => o.id === voiceChoice)) {
        setVoiceChoice(opts[0].id);
      }
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;

    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch {}
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
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
      setStatus(conversationMode ? "Conversation listening…" : "Listening…");
    };

    rec.onerror = (e) => {
      setListening(false);
      setStatus("Mic error: " + (e?.error || "unknown"));
      clearTimeout(silenceTimerRef.current);

      // ✅ mobile stability: auto restart
      if (conversationMode && !userStoppedRef.current && shouldAutoRestartRef.current) {
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 700);
      }
    };

    rec.onend = () => {
      setListening(false);
      clearTimeout(silenceTimerRef.current);

      if (!conversationMode) {
        // push-to-talk: send on end
        const finalText = (bufferFinalRef.current + " " + interimRef.current).trim();
        bufferFinalRef.current = "";
        interimRef.current = "";
        setYouSaid(finalText || "");
        if (finalText) void sendToAI(finalText);
        setStatus("Idle");
        return;
      }

      // ✅ conversation mode: auto restart unless user pressed Stop
      if (conversationMode && !userStoppedRef.current && shouldAutoRestartRef.current) {
        setStatus("Reconnecting mic…");
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 450);
      } else {
        setStatus("Conversation paused");
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

      // ✅ hands-free: send after silence
      if (conversationMode) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const msg = (bufferFinalRef.current + " " + interimRef.current).trim();
          if (!msg) return;
          if (msg === lastSendRef.current) return;

          lastSendRef.current = msg;

          // clear buffers for next sentence
          bufferFinalRef.current = "";
          interimRef.current = "";

          setYouSaid(msg);
          void sendToAI(msg);
        }, 850);
      }
    };

    recRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
      clearTimeout(silenceTimerRef.current);
    };
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
      const opt = voiceOptions.find((o) => o.id === voiceChoice);
      const chosen = opt ? all.find((v) => v.name === opt.voiceName) : null;
      if (chosen) u.voice = chosen;

      u.onstart = () => setStatus("Speaking…");
      u.onend = () => setStatus(conversationMode ? "Conversation listening…" : "Reply ready");

      window.speechSynthesis.speak(u);
    } catch {}
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

    // ✅ timeout guard
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setAiSays(String(msg));
        setStatus("AI error");
        speak("AI error. " + String(msg));
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
        setAiSays("(No reply from AutoProtect)");
        setStatus("Reply empty");
        speak("I did not receive a reply.");
        return;
      }

      setAiSays(text);
      setStatus("Reply ready");
      speak(text);
    } catch (e) {
      const msg = e?.name === "AbortError" ? "Request timeout" : "Network error";
      setAiSays(msg);
      setStatus(msg);
      speak(msg);
    } finally {
      clearTimeout(timeout);
      busyRef.current = false;
    }
  }

  function start() {
    if (!recRef.current) return;
    userStoppedRef.current = false;
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
    userStoppedRef.current = true;
    try { recRef.current.stop(); } catch {}
  }

  if (!supported) {
    return (
      <div style={card}>
        <div style={rowTop}><div style={titleStyle}>{title}</div></div>
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
        <button onClick={() => (listening ? stop() : start())} style={btnPrimary}>
          {listening ? "Stop" : (conversationMode ? "Start Conversation" : "Push to Talk")}
        </button>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={conversationMode}
            onChange={() => setConversationMode((v) => !v)}
          />
          Conversation mode (hands-free)
        </label>

        <label style={toggle}>
          <input
            type="checkbox"
            checked={voiceReply}
            onChange={() => setVoiceReply((v) => !v)}
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
            {voiceOptions.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>

          <button style={btnSmall} onClick={() => speak("Voice preview. AutoProtect is ready.")}>
            Preview
          </button>
        </div>
      </div>

      <div style={box}>
        <div style={boxLabel}>You said</div>
        <div style={boxText}>{youSaid || "…"}</div>
      </div>

      <div style={box}>
        <div style={boxLabel}>AutoProtect says</div>
        <div style={boxText}>{aiSays || "…"}</div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
        Tip: Leave Conversation mode ON. Talk normally. When you stop speaking, AutoProtect replies automatically.
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
const rowTop = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 };
const titleStyle = { fontWeight: 800, letterSpacing: 0.2 };
const controls = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, alignItems: "center" };
const btnPrimary = { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "white", cursor: "pointer", fontWeight: 800 };
const btnSmall = { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", fontWeight: 700 };
const toggle = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.9 };
const selectStyle = { borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "white", outline: "none" };
const box = { marginTop: 10, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)" };
const boxLabel = { fontSize: 12, opacity: 0.75, marginBottom: 6 };
const boxText = { whiteSpace: "pre-wrap", lineHeight: 1.35 };
