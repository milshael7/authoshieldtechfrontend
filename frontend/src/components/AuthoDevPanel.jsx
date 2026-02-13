import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

/* ================= SAFE HELPERS ================= */

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

function buildSystemContext(user, pageContext = {}) {
  const role = String(user?.role || "user").toLowerCase();
  const page = pageContext?.page || getRoomId();

  const toneMap = {
    admin: "SOC advisor. Concise and technical.",
    manager: "Risk-focused advisor.",
    company: "Clear security guidance.",
    user: "Simple practical assistance.",
  };

  return {
    role,
    page,
    tone: toneMap[role] || toneMap.user,
  };
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "AuthoDev 6.5",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const user = getSavedUserLocal();
  const storageKey = getStorageKey();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const raw = safeLocalGet(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMessages(Array.isArray(parsed?.messages) ? parsed.messages : []);
      }
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    safeLocalSet(storageKey, JSON.stringify({ messages }));
  }, [messages, storageKey]);

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

      const systemContext = buildSystemContext(user, pageContext);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMsg.text,
          context: {
            ...pageContext,
            system: systemContext,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      const aiText = data?.reply || "No response available.";

      const aiMsg = {
        role: "ai",
        text: aiText,
        speakText: data?.speakText || aiText,
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
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    }
  }

  return (
    <div className="authodev-panel">
      <header className="ad-header">
        <div className="ad-title">
          <span className="ad-badge">AI</span>
          <h3>{title}</h3>
        </div>
        <span className="ad-sub">Advisory assistant</span>
      </header>

      <div className="ad-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ad-msg ${m.role}`}>
            <div className="ad-text">{m.text}</div>

            {m.role === "ai" && (
              <div className="ad-actions">
                <button onClick={() => readAloud(m.speakText)}>🔊</button>
              </div>
            )}

            <div className="ad-time">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="ad-input">
        <textarea
          placeholder="Ask about risks, posture, or actions…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Analyzing…" : "Send"}
        </button>
      </div>
    </div>
  );
}
