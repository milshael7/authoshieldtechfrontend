import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

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

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const storageKey = getStorageKey();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // voice
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const bottomRef = useRef(null);

  /* ================= LOAD / SAVE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setMessages(Array.isArray(parsed?.messages) ? parsed.messages : []);
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    safeSet(storageKey, JSON.stringify({ messages }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= VOICE INPUT (ChatGPT-like) ================= */

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);

      recognition.onresult = (e) => {
        // build full transcript (including interim)
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setInput((prev) => {
          // if user already typed some text, append intelligently
          const p = (prev || "").trim();
          const t = (transcript || "").trim();
          if (!p) return t;
          // don’t spam duplicates
          if (p.endsWith(t)) return p;
          return `${p} ${t}`.trim();
        });
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      alert("Voice input failed to start.");
      setListening(false);
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage(textOverride = null) {
    const messageText = (textOverride ?? input).trim();
    if (!messageText || loading) return;

    // If this is a regenerate request, don’t add another user bubble
    const isRegenerate = typeof textOverride === "string" && textOverride.trim();

    if (!isRegenerate) {
      setMessages((m) => [
        ...m,
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
        body: JSON.stringify({
          message: messageText,
          context: ctx,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "No response available.";

      setMessages((m) => [
        ...m,
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
        ...m,
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

  /* ================= ACTIONS ================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  async function shareText(text) {
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await copyText(text);
      }
    } catch {
      // ✅ user cancelled share → don’t throw / don’t spam
    }
  }

  function setReaction(index, type) {
    setMessages((m) =>
      m.map((msg, i) => (i === index ? { ...msg, reaction: type } : msg))
    );
  }

  return (
    <div className="advisor-wrap">
      {/* optional tiny title line (kept empty for your design) */}
      {title ? <div className="advisor-miniTitle">{title}</div> : null}

      {/* MESSAGES */}
      <div className="advisor-feed">
        {messages.map((m, i) => (
          <div key={i} className={`advisor-row ${m.role}`}>
            <div className="advisor-bubble">{m.text}</div>

            {m.role === "ai" && (
              <div className="advisor-actions">
                <button onClick={() => readAloud(m.speakText)} title="Read aloud">🔊</button>
                <button onClick={() => copyText(m.text)} title="Copy">📋</button>
                <button onClick={() => shareText(m.text)} title="Share">📤</button>

                <button
                  className={m.reaction === "up" ? "active" : ""}
                  onClick={() => setReaction(i, "up")}
                  title="Helpful"
                >
                  👍
                </button>

                <button
                  className={m.reaction === "down" ? "active" : ""}
                  onClick={() => setReaction(i, "down")}
                  title="Not helpful"
                >
                  👎
                </button>

                <button onClick={() => sendMessage(m.text)} title="Regenerate">↻</button>
              </div>
            )}

            <div className="advisor-ts">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT (ChatGPT-like: mic LEFT, send RIGHT, bars center when listening) */}
      <div className="advisor-inputBar">
        <button
          className="advisor-micBtn"
          onClick={listening ? stopListening : startListening}
          title={listening ? "Pause voice" : "Voice"}
        >
          {listening ? "■" : "🎙"}
        </button>

        <div className="advisor-inputCenter">
          <textarea
            className="advisor-textarea"
            placeholder="Message AutoShield Advisor…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                stopListening();
                sendMessage();
              }
            }}
          />

          {listening && (
            <div className="advisor-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <button
          className="advisor-sendBtn"
          onClick={() => {
            stopListening();
            sendMessage();
          }}
          disabled={loading || !input.trim()}
          title="Send"
        >
          ➤
        </button>
      </div>

      {loading && <div className="advisor-loading">Thinking…</div>}
    </div>
  );
}
