import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

/* ================= SAFE STORAGE ================= */

function safeLocalGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function getRoomId() {
  if (typeof window === "undefined") return "root";
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "root";
}

function getSavedUserLocal() {
  try {
    return JSON.parse(localStorage.getItem("as_user") || "null");
  } catch {
    return null;
  }
}

function getStorageKey() {
  const user = getSavedUserLocal();
  const tenantId = user?.companyId || user?.company || "unknown";
  const roomId = getRoomId();
  return `authodev.panel.${tenantId}.${roomId}`;
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "Security Advisor",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const user = getSavedUserLocal();
  const storageKey = getStorageKey();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  /* ================= LOAD STORED MESSAGES ================= */

  useEffect(() => {
    const raw = safeLocalGet(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setMessages(Array.isArray(parsed?.messages) ? parsed.messages : []);
      } catch {
        setMessages([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    safeLocalSet(storageKey, JSON.stringify({ messages }));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= VOICE INPUT ================= */

  function startListening() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  /* ================= SEND MESSAGE ================= */

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: "user",
      text: input.trim(),
      ts: new Date().toLocaleTimeString(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const pageContext =
        typeof getContext === "function" ? getContext() : {};

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMsg.text,
          context: pageContext,
        }),
      });

      const data = await res.json().catch(() => ({}));

      const aiMsg = {
        role: "ai",
        text: data?.reply || "No response available.",
        speakText: data?.speakText || data?.reply,
        ts: new Date().toLocaleTimeString(),
      };

      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Assistant temporarily unavailable.",
          speakText: "Assistant temporarily unavailable.",
          ts: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="advisor-dock">

      {/* HEADER */}
      <div className="advisor-header">
        <div>
          <strong>{title}</strong>
          <div className="advisor-sub">Enterprise AI Assistant</div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="advisor-messages">
        {messages.map((m, i) => (
          <div key={i} className={`advisor-bubble ${m.role}`}>
            <div className="advisor-text">{m.text}</div>

            {m.role === "ai" && (
              <div className="advisor-controls">
                <button
                  className="icon-btn"
                  onClick={() => readAloud(m.speakText)}
                >
                  🔊
                </button>
              </div>
            )}

            <div className="advisor-time">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="advisor-input">
        <textarea
          placeholder="Type or use voice…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <div className="advisor-actions">
          <button
            className={`icon-btn ${listening ? "active" : ""}`}
            onClick={startListening}
          >
            🎙
          </button>

          <button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>

    </div>
  );
}
