// frontend/src/components/VoiceAI.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * VoiceAI.jsx (FULL DROP-IN)
 * Goals:
 * - “ChatGPT-like” feel as much as the browser allows (natural voice selection, interruption handling, smooth flow)
 * - Conversation mode that DOESN’T talk over itself (pause mic while speaking, resume after)
 * - Better AI prompts/context packaging (page-aware + non-robotic guidance)
 * - Single file, copy/paste ready
 *
 * Reality check:
 * - True ChatGPT-grade voice requires a server TTS (e.g., OpenAI TTS). Browser SpeechSynthesis quality depends on device voices.
 * - This file selects the most natural available voice on the device and avoids the “robot loop” behavior.
 */

function getApiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "https://authoshieldtech2.onrender.com") + ""
  ).trim();
}

const LS_VOICE = "autoprotect_voice_choice_v2";
const LS_VOICE_ON = "autoprotect_voice_reply_v2";
const LS_HANDS_FREE = "autoprotect_conversation_mode_v2";
const LS_LANG = "autoprotect_voice_lang_v2";
const LS_RATE = "autoprotect_voice_rate_v2";
const LS_PITCH = "autoprotect_voice_pitch_v2";

const DEFAULT_LANG = "en-US";

/** Small helpers */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const safeStr = (v, max = 6000) => String(v ?? "").slice(0, max);
const cleanTextForSpeech = (t) =>
  safeStr(t)
    .replace(/\s+/g, " ")
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .trim();

/**
 * Pick “best” voices:
 * - Prefer: en-US, “Natural/Neural/Enhanced/Premium”, then Google/Microsoft, then anything English.
 * - We do NOT show raw voice names in UI; we map to “Natural US”, etc.
 */
function buildVoiceOptions(voices) {
  const list = Array.isArray(voices) ? voices : [];
  const name = (v) => String(v?.name || "");
  const lang = (v) => String(v?.lang || "");

  const isEN = (v) => /^en/i.test(lang(v));
  const isUS = (v) => /^en-US/i.test(lang(v));
  const isUK = (v) => /^en-GB/i.test(lang(v));
  const isAU = (v) => /^en-AU/i.test(lang(v));

  const premiumHint = /natural|neural|enhanced|premium|online|cloud/i;
  const vendorHint = /google|microsoft|apple|siri/i;

  // Score voice for selection
  const scoreVoice = (v) => {
    let s = 0;
    if (isEN(v)) s += 10;
    if (isUS(v)) s += 12;
    if (isUK(v)) s += 8;
    if (isAU(v)) s += 6;
    if (premiumHint.test(name(v))) s += 20;
    if (vendorHint.test(name(v))) s += 8;

    // A few known “good” names across platforms
    if (/samantha|ava|olivia|emma|allison|jenny|aria/i.test(name(v))) s += 6;
    if (/alex|daniel|guy|davis|matthew|ryan|tom/i.test(name(v))) s += 6;

    return s;
  };

  const sorted = list.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a));

  // Build friendly options from top matches (unique by name)
  const used = new Set();
  const out = [];

  const push = (id, label, predicate) => {
    const v = sorted.find((x) => !used.has(name(x)) && predicate(x));
    if (!v) return;
    used.add(name(v));
    out.push({
      id,
      label,
      voiceName: name(v),
      lang: lang(v) || DEFAULT_LANG,
    });
  };

  // Primary picks
  push("natural_us", "Natural US", (v) => isUS(v) && premiumHint.test(name(v)));
  push("clear_us", "Clear US", (v) => isUS(v));
  push("natural_uk", "Natural UK", (v) => isUK(v) && premiumHint.test(name(v)));
  push("uk", "UK", (v) => isUK(v));
  push("au", "Australia", (v) => isAU(v));
  push("natural_en", "Natural English", (v) => isEN(v) && premiumHint.test(name(v)));
  push("english", "English", (v) => isEN(v));

  // Fallback: at least one option
  if (out.length === 0 && sorted.length) {
    out.push({
      id: "fallback",
      label: "Default Voice",
      voiceName: name(sorted[0]),
      lang: lang(sorted[0]) || DEFAULT_LANG,
    });
  }

  return out;
}

async function waitForVoices(timeoutMs = 1400) {
  if (!("speechSynthesis" in window)) return [];
  const synth = window.speechSynthesis;

  const get = () => synth.getVoices?.() || [];
  const initial = get();
  if (initial.length) return initial;

  return await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        synth.onvoiceschanged = null;
      } catch {}
      resolve(get());
    };

    try {
      synth.onvoiceschanged = finish;
    } catch {}

    setTimeout(finish, timeoutMs);
  });
}

export default function VoiceAI({
  endpoint = "/api/ai/chat",
  title = "AutoProtect Voice",
  getContext,
}) {
  const API_BASE = useMemo(() => getApiBase(), []);
  const SpeechRecognition = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition,
    []
  );

  // Support flags
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  // UI State
  const [status, setStatus] = useState("Idle");
  const [listening, setListening] = useState(false);
  const [youSaid, setYouSaid] = useState("");
  const [aiSays, setAiSays] = useState("");

  // Controls
  const [conversationMode, setConversationMode] = useState(() => {
    try {
      return window.localStorage.getItem(LS_HANDS_FREE) === "1";
    } catch {
      return false;
    }
  });

  const [voiceReply, setVoiceReply] = useState(() => {
    try {
      const v = window.localStorage.getItem(LS_VOICE_ON);
      return v ? v === "1" : true;
    } catch {
      return true;
    }
  });

  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceChoice, setVoiceChoice] = useState(() => {
    try {
      return window.localStorage.getItem(LS_VOICE) || "natural_us";
    } catch {
      return "natural_us";
    }
  });

  const [voiceLang, setVoiceLang] = useState(() => {
    try {
      return window.localStorage.getItem(LS_LANG) || DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  });

  const [rate, setRate] = useState(() => {
    try {
      const v = Number(window.localStorage.getItem(LS_RATE));
      return Number.isFinite(v) ? clamp(v, 0.7, 1.15) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [pitch, setPitch] = useState(() => {
    try {
      const v = Number(window.localStorage.getItem(LS_PITCH));
      return Number.isFinite(v) ? clamp(v, 0.85, 1.15) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const recRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const busyRef = useRef(false);

  // Speech buffers
  const bufferFinalRef = useRef("");
  const interimRef = useRef("");
  const lastSendRef = useRef("");
  const speakingRef = useRef(false);

  // --- init TTS voices ---
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setTtsSupported(false);
      return;
    }

    let alive = true;
    (async () => {
      const voices = await waitForVoices();
      if (!alive) return;

      const opts = buildVoiceOptions(voices);
      setVoiceOptions(opts);

      // If saved choice isn’t present, pick first available
      if (opts.length && !opts.some((o) => o.id === voiceChoice)) {
        setVoiceChoice(opts[0].id);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist toggles/settings
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_HANDS_FREE, conversationMode ? "1" : "0");
    } catch {}
  }, [conversationMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_VOICE_ON, voiceReply ? "1" : "0");
    } catch {}
  }, [voiceReply]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_VOICE, voiceChoice);
    } catch {}
  }, [voiceChoice]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_LANG, voiceLang);
    } catch {}
  }, [voiceLang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_RATE, String(rate));
    } catch {}
  }, [rate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_PITCH, String(pitch));
    } catch {}
  }, [pitch]);

  // --- init SpeechRecognition ---
  useEffect(() => {
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setStatus("SpeechRecognition not supported on this device/browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = voiceLang || DEFAULT_LANG;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
      setStatus(conversationMode ? "Conversation listening…" : "Listening…");
    };

    rec.onerror = (e) => {
      setListening(false);
      clearTimeout(silenceTimerRef.current);
      setStatus("Mic error: " + (e?.error || "unknown"));
    };

    rec.onend = () => {
      setListening(false);
      clearTimeout(silenceTimerRef.current);

      // In push-to-talk mode: send whatever we heard when it ends
      if (!conversationMode) {
        const finalText = (bufferFinalRef.current + " " + interimRef.current).trim();
        bufferFinalRef.current = "";
        interimRef.current = "";

        setYouSaid(finalText || "");
        if (finalText) void sendToAI(finalText);
        setStatus("Idle");
      } else {
        // In conversation mode, if we ended (mobile may stop), we stay paused until user restarts.
        setStatus("Conversation paused (tap Start to resume)");
      }
    };

    rec.onresult = (event) => {
      // If we are speaking, ignore mic results to prevent echo loops
      if (speakingRef.current) return;

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

      if (conversationMode) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const msg = (bufferFinalRef.current + " " + interimRef.current).trim();
          if (!msg) return;
          if (msg === lastSendRef.current) return; // don’t double-send
          lastSendRef.current = msg;

          bufferFinalRef.current = "";
          interimRef.current = "";

          setYouSaid(msg);
          void sendToAI(msg);
        }, 900);
      }
    };

    recRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {}
      clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SpeechRecognition, conversationMode, voiceLang]);

  /** Stop recognition safely */
  const stopListening = () => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
  };

  /** Start recognition safely */
  const startListening = () => {
    if (!recRef.current) return;
    try {
      bufferFinalRef.current = "";
      interimRef.current = "";
      lastSendRef.current = "";
      setYouSaid("");
      setAiSays("");
      recRef.current.lang = voiceLang || DEFAULT_LANG;
      recRef.current.start();
    } catch {}
  };

  /** Pick a device voice object from choice */
  const pickVoiceObject = async () => {
    const voices = await waitForVoices();
    const opt = voiceOptions.find((o) => o.id === voiceChoice);
    if (!opt) return { voice: null, lang: voiceLang || DEFAULT_LANG };

    const v = voices.find((vv) => vv.name === opt.voiceName) || null;
    return { voice: v, lang: opt.lang || voiceLang || DEFAULT_LANG };
  };

  /** Speak with better “natural” behavior */
  const speak = async (text) => {
    if (!voiceReply) return;
    if (!("speechSynthesis" in window)) return;

    const say = cleanTextForSpeech(text);
    if (!say) return;

    // If we’re in conversation mode, pause listening while speaking to avoid feedback loops
    const shouldResume = conversationMode && listening;
    if (shouldResume) stopListening();

    try {
      const synth = window.speechSynthesis;
      const { voice, lang } = await pickVoiceObject();

      // cancel any previous speech
      try {
        synth.cancel();
      } catch {}

      const u = new SpeechSynthesisUtterance(say);
      u.lang = lang || DEFAULT_LANG;
      u.rate = clamp(Number(rate) || 1.0, 0.7, 1.15);
      u.pitch = clamp(Number(pitch) || 1.0, 0.85, 1.15);
      if (voice) u.voice = voice;

      speakingRef.current = true;
      u.onstart = () => setStatus("Speaking…");
      u.onerror = () => {
        speakingRef.current = false;
        setStatus("Reply ready");
        if (shouldResume) {
          // tiny delay helps mobile
          setTimeout(() => startListening(), 250);
        }
      };
      u.onend = () => {
        speakingRef.current = false;
        setStatus(conversationMode ? "Conversation listening…" : "Reply ready");
        if (shouldResume) {
          setTimeout(() => startListening(), 250);
        }
      };

      // Mobile Safari sometimes needs a small delay after cancel
      await sleep(80);
      try {
        synth.speak(u);
      } catch {}
    } catch {
      speakingRef.current = false;
      if (shouldResume) setTimeout(() => startListening(), 250);
    }
  };

  /**
   * Better “non-robotic” system-style hints:
   * - Encourage clarity, explain trade events, use the provided context
   * - Allow general questions too
   */
  const buildAiHints = (ctx) => {
    // Keep it short: this goes with every request.
    return {
      assistant_style: {
        tone: "natural, helpful, not robotic",
        behavior: [
          "Answer like a smart assistant, not a script.",
          "If the user asks about trading, explain using the live page context (paper stats, position, decision, reason).",
          "If user asks a general question, answer normally.",
          "If you must guess, say it's a guess.",
          "When explaining a trade, include: what happened, why, risk, and what to watch next.",
        ],
      },
      page_context: {
        page: "Trading Room",
        features: [
          "Live price feed",
          "Paper trader (auto entries/exits)",
          "Wins/Losses + Net P&L",
          "Trade history + log",
          "AI controls: trade size % + max trades/day (if provided in context)",
        ],
      },
      context_snapshot: ctx || {},
    };
  };

  async function sendToAI(message) {
    const clean = safeStr(message).trim();
    if (!clean) return;
    if (busyRef.current) return;

    busyRef.current = true;
    setStatus("Thinking…");
    setAiSays("");

    // Gather context from the page (Trading.jsx already passes rich data)
    const ctx = (() => {
      try {
        return typeof getContext === "function" ? getContext() || {} : {};
      } catch {
        return {};
      }
    })();

    // Add better hints so the backend AI can respond less “robotic”
    const payload = {
      message: clean,
      context: ctx,
      hints: buildAiHints(ctx),
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
        const msg = data?.error || data?.message || data?.detail || `HTTP ${res.status}`;
        setAiSays(String(msg));
        setStatus("AI error");
        await speak("AI error. " + String(msg));
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
        await speak("I did not receive a reply.");
        busyRef.current = false;
        return;
      }

      setAiSays(text);
      setStatus("Reply ready");
      await speak(text);
    } catch {
      setAiSays("Network error calling AI");
      setStatus("Network error");
      await speak("Network error calling the AI.");
    } finally {
      busyRef.current = false;
    }
  }

  const preview = async () => {
    await speak(
      "Voice preview. AutoProtect is ready. Ask me why a trade happened, your win rate, or any question."
    );
  };

  if (!speechSupported && !ttsSupported) {
    return (
      <div style={card}>
        <div style={rowTop}>
          <div style={titleStyle}>{title}</div>
        </div>
        <div style={{ opacity: 0.85 }}>
          This device doesn’t support speech recognition or speech playback.
        </div>
      </div>
    );
  }

  if (!speechSupported) {
    return (
      <div style={card}>
        <div style={rowTop}>
          <div style={titleStyle}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{status}</div>
        </div>

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Mic input isn’t supported here. You can still use the text chat panel.
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={toggle}>
            <input
              type="checkbox"
              checked={voiceReply}
              onChange={() => setVoiceReply((v) => !v)}
            />
            Voice reply
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Voice</span>
            <select
              value={voiceChoice}
              onChange={(e) => setVoiceChoice(e.target.value)}
              style={selectStyle}
            >
              {voiceOptions.length === 0 && <option value="fallback">Default Voice</option>}
              {voiceOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>

            <button style={btnSmall} onClick={preview} type="button">
              Preview
            </button>
          </div>
        </div>
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
        <button
          onClick={() => {
            if (listening) stopListening();
            else startListening();
          }}
          style={btnPrimary}
          type="button"
        >
          {listening ? "Stop" : conversationMode ? "Start Conversation" : "Push to Talk"}
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

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Voice</span>
          <select
            value={voiceChoice}
            onChange={(e) => setVoiceChoice(e.target.value)}
            style={selectStyle}
          >
            {voiceOptions.length === 0 && <option value="fallback">Default Voice</option>}
            {voiceOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>

          <button style={btnSmall} onClick={preview} type="button">
            Preview
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Lang</span>
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            style={selectStyle}
          >
            <option value="en-US">en-US</option>
            <option value="en-GB">en-GB</option>
            <option value="en-AU">en-AU</option>
            <option value="en-CA">en-CA</option>
          </select>

          <span style={{ fontSize: 12, opacity: 0.8 }}>Rate</span>
          <input
            type="number"
            min="0.7"
            max="1.15"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(clamp(Number(e.target.value || 1), 0.7, 1.15))}
            style={numInput}
          />

          <span style={{ fontSize: 12, opacity: 0.8 }}>Pitch</span>
          <input
            type="number"
            min="0.85"
            max="1.15"
            step="0.05"
            value={pitch}
            onChange={(e) => setPitch(clamp(Number(e.target.value || 1), 0.85, 1.15))}
            style={numInput}
          />
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

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8, lineHeight: 1.4 }}>
        Tip: In Conversation mode, AutoProtect waits for silence, then replies. While it’s speaking, the mic pauses so it
        doesn’t echo itself.
      </div>
    </div>
  );
}

/* ---------- styles (self-contained) ---------- */

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

const numInput = {
  width: 76,
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
