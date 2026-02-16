import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

/* ================= STORAGE ================= */

function safeGet(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); }
  catch {}
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
  title = "Security Advisory",
  endpoint = "/api/ai/chat",
  getContext
}) {
  const storageKey = getStorageKey();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  /* ================= LOAD / SAVE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setMessages(parsed?.messages || []);
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    safeSet(storageKey, JSON.stringify({ messages }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= VOICE INPUT ================= */

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage(regenerateText = null) {
    const messageText = regenerateText || input.trim();
    if (!messageText || loading) return;

    if (!regenerateText) {
      setMessages(m => [
        ...m,
        { role: "user", text: messageText, ts: new Date().toLocaleTimeString() }
      ]);
      setInput("");
    }

    setLoading(true);

    try {
      const context =
        typeof getContext === "function" ? getContext() : {};

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: messageText,
          context
        })
      });

      const data = await res.json().catch(() => ({}));

      setMessages(m => [
        ...m,
        {
          role: "ai",
          text: data?.reply || "No response available.",
          speakText: data?.speakText || data?.reply,
          reaction: null,
          ts: new Date().toLocaleTimeString()
        }
      ]);

    } catch {
      setMessages(m => [
        ...m,
        {
          role: "ai",
          text: "Assistant unavailable.",
          speakText: "Assistant unavailable.",
          reaction: null,
          ts: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= ACTIONS ================= */

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  function shareText(text) {
    if (navigator.share) {
      navigator.share({ text });
    } else {
      copyText(text);
    }
  }

  function setReaction(index, type) {
    setMessages(m =>
      m.map((msg, i) =>
        i === index ? { ...msg, reaction: type } : msg
      )
    );
  }

  /* ================= UI ================= */

  return (
    <div className="advisor-wrapper">

      {/* HEADER */}
      <div className="advisor-header">
        <div className="advisor-title">{title}</div>
      </div>

      {/* MESSAGES */}
      <div className="advisor-body">
        {messages.map((m, i) => (
          <div key={i} className={`advisor-message ${m.role}`}>

            <div className="advisor-bubble">
              {m.text}
            </div>

            {m.role === "ai" && (
              <div className="advisor-controls">

                <button onClick={() => readAloud(m.speakText)} title="Read aloud">
                  🔊
                </button>

                <button onClick={() => copyText(m.text)} title="Copy">
                  ⧉
                </button>

                <button onClick={() => shareText(m.text)} title="Share">
                  ⇪
                </button>

                <button
                  className={m.reaction === "up" ? "active" : ""}
                  onClick={() => setReaction(i, "up")}
                  title="Helpful"
                >
                  ↑
                </button>

                <button
                  className={m.reaction === "down" ? "active" : ""}
                  onClick={() => setReaction(i, "down")}
                  title="Not helpful"
                >
                  ↓
                </button>

                <button onClick={() => sendMessage(m.text)} title="Regenerate">
                  ↻
                </button>

              </div>
            )}

            <div className="advisor-time">{m.ts}</div>

          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="advisor-input-area">

        <textarea
          placeholder="Ask about risks, posture, compliance..."
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={2}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <div className="advisor-input-controls">

          {!listening ? (
            <button onClick={startListening} title="Voice input">
              🎙
            </button>
          ) : (
            <button onClick={stopListening} title="Stop listening">
              ■
            </button>
          )}

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            title="Send"
          >
            ➤
          </button>

        </div>

      </div>
    </div>
  );
}
