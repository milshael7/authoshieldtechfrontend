// frontend/src/components/AuthoDevPanel.jsx
// AuthoDev 6.5 — Universal AI Text Panel (SOC-TUNED)
// STEP 34 — ROLE + PAGE AWARE BEHAVIOR LAYER
// ✅ Assistant-only (non-intrusive)
// ✅ SOC-grade tone enforcement
// ✅ Role + page contextual framing
// ❌ No UI / layout changes
// ❌ No auto speech, no mic, no floating

import React, { useEffect, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";
import { getSavedUser } from "../lib/api";

/* ================= HELPERS ================= */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

function getRoomId() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "root";
}

function getStorageKey() {
  const user = getSavedUser();
  const tenantId = user?.companyId || user?.company || "unknown";
  const roomId = getRoomId();
  return `authodev.panel.${tenantId}.${roomId}`;
}

function buildSystemContext(user, pageContext = {}) {
  const role = String(user?.role || "user").toLowerCase();
  const page = pageContext?.page || getRoomId();

  return {
    role,
    page,
    guidance: {
      admin:
        "You are a SOC advisor. Be concise, technical, and action-oriented. Assume expertise.",
      manager:
        "You are an oversight assistant. Focus on risk, trends, and decisions.",
      company:
        "You are a security guidance assistant. Explain clearly without jargon.",
      user:
        "You are a security assistant. Keep explanations simple and practical.",
    }[role],
  };
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "AuthoDev 6.5",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const storageKey = getStorageKey();
  const user = getSavedUser();

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw).messages || [] : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  /* ================= PERSISTENCE ================= */

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages }));
    } catch {}
  }, [messages, storageKey]);

  /* ================= SEND ================= */

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

      const data = await res.json();

      const aiMsg = {
        role: "ai",
        text: data?.reply || "No response available.",
        speakText: data?.speakText || data?.reply || "",
        ts: new Date().toLocaleTimeString(),
      };

      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            "The assistant is temporarily unavailable. Please retry shortly.",
          speakText:
            "The assistant is temporarily unavailable. Please retry shortly.",
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

  /* ================= UI ================= */

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
                <button
                  title="Read this message"
                  onClick={() => readAloud(m.speakText)}
                >
                  🔊
                </button>
                <button title="Copy" onClick={() => copyText(m.text)}>
                  📋
                </button>
                <button title="Helpful">👍</button>
                <button title="Not helpful">👎</button>
                <button
                  title="Share"
                  onClick={() =>
                    navigator.share?.({ text: m.text }) || copyText(m.text)
                  }
                >
                  🔗
                </button>
              </div>
            )}

            <div className="ad-time">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT — TEXT ONLY */}
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
