// frontend/src/components/AuthoDevPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

/* ================= CONFIG ================= */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MESSAGES = 50;

/* ================= STORAGE ================= */

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}
function getRoomId() {
  if (typeof window === "undefined") return "root";
  return window.location.pathname.replace(/\/+$/, "") || "root";
}
function getUser() {
  try { return JSON.parse(localStorage.getItem("as_user") || "null"); }
  catch { return null; }
}
function getStorageKey() {
  const user = getUser();
  const tenant = user?.companyId || user?.company || "unknown";
  return `authodev.panel.${tenant}.${getRoomId()}`;
}

export default function AuthoDevPanel({
  title = "",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const storageKey = useMemo(() => getStorageKey(), []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const inactivityTimer = useRef(null);

  /* ================= LOAD / SAVE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const now = Date.now();

      if (parsed?.lastActive && now - parsed.lastActive > SESSION_TIMEOUT_MS) {
        safeSet(storageKey, "");
        return;
      }

      setMessages(Array.isArray(parsed?.messages) ? parsed.messages : []);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    safeSet(storageKey, JSON.stringify({
      messages,
      lastActive: Date.now(),
    }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resetInactivityTimer() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    inactivityTimer.current = setTimeout(() => {
      setMessages([]);
      safeSet(storageKey, "");
    }, SESSION_TIMEOUT_MS);
  }

  useEffect(() => {
    resetInactivityTimer();
    return () => inactivityTimer.current && clearTimeout(inactivityTimer.current);
  }, [messages]);

  /* ================= VOICE ================= */

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser.");
      return;
    }

    try { recognitionRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      const last = e.results?.[e.results.length - 1];
      const text = last?.[0]?.transcript || "";
      if (text) setInput(text);
    };

    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }

  /* ================= MESSAGE ACTIONS ================= */

  function copyText(text) {
    navigator.clipboard?.writeText(text);
  }

  function shareText(text) {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      copyText(text);
    }
  }

  function setReaction(index, type) {
    setMessages((m) =>
      m.map((msg, i) =>
        i === index ? { ...msg, reaction: type } : msg
      )
    );
  }

  /* ================= SEND ================= */

  async function sendMessage(regenText = null) {
    const messageText = (regenText || input).trim();
    if (!messageText || loading) return;

    if (!regenText) {
      setMessages((m) => [
        ...m.slice(-MAX_MESSAGES),
        { role: "user", text: messageText, ts: new Date().toLocaleTimeString() },
      ]);
      setInput("");
    }

    setLoading(true);

    try {
      const ctx = typeof getContext === "function" ? getContext() : {};
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageText, context: ctx }),
      });

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "No response available.";

      setMessages((m) => [
        ...m.slice(-MAX_MESSAGES),
        {
          role: "ai",
          text: reply,
          speakText: data?.speakText || reply,
          reaction: null,
          ts: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m.slice(-MAX_MESSAGES),
        {
          role: "ai",
          text: "Assistant unavailable.",
          speakText: "Assistant unavailable.",
          reaction: null,
          ts: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="advisor-wrap">
      <div className="advisor-miniTitle">
        {title || "Advisor"}
      </div>

      <div className="advisor-feed">
        {messages.map((m, i) => (
          <div key={i} className={`advisor-row ${m.role}`}>
            <div className="advisor-bubble">{m.text}</div>

            {m.role === "ai" && (
              <div className="advisor-actions">
                <button onClick={() => copyText(m.text)}>⧉</button>
                <button onClick={() => readAloud(m.speakText)}>🔊</button>
                <button onClick={() => setReaction(i, "up")}>👍</button>
                <button onClick={() => setReaction(i, "down")}>👎</button>
                <button onClick={() => sendMessage(m.text)}>↻</button>
                <button onClick={() => shareText(m.text)}>⇪</button>
              </div>
            )}

            <div className="advisor-ts">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ===== NEW CHATGPT STYLE INPUT ===== */}

      <div className="advisor-inputBar">
        <div className="advisor-inputPill">

          {!listening ? (
            <textarea
              className="advisor-textarea"
              placeholder="Ask anything"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          ) : (
            <div className="advisor-waveContainer">
              <div className="advisor-waveform">
                <span /><span /><span /><span /><span />
                <span /><span /><span />
              </div>
            </div>
          )}

          <div className="advisor-controls">
            {!listening ? (
              <button onClick={startListening}>🎙</button>
            ) : (
              <button onClick={stopListening}>⬛</button>
            )}

            <button
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !listening)}
            >
              ⬆
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="advisor-loading">Analyzing…</div>}
    </div>
  );
}
