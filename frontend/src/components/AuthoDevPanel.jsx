// frontend/src/components/AuthoDevPanel.jsx
// AuthoDev 6.5 — Universal AI Text Panel
// STEP 31: Per-Tenant + Per-Room Persistent State
// Professional, long-form, readable, shareable, speaker-enabled

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
  // Example:
  // /company            -> company:overview
  // /company/notifications -> company:notifications
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "root";
}

function getStorageKey() {
  const user = getSavedUser();
  const tenantId = user?.companyId || user?.company || "unknown";
  const roomId = getRoomId();

  return `authodev.panel.${tenantId}.${roomId}`;
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "AuthoDev 6.5",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const storageKey = getStorageKey();

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
      localStorage.setItem(
        storageKey,
        JSON.stringify({ messages })
      );
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
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMsg.text,
          context: typeof getContext === "function" ? getContext() : {},
        }),
      });

      const data = await res.json();

      const aiMsg = {
        role: "ai",
        text: data?.reply || "No response.",
        speakText: data?.speakText || data?.reply || "",
        ts: new Date().toLocaleTimeString(),
      };

      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Network issue. Please try again.",
          speakText: "Network issue. Please try again.",
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
        <h3>{title}</h3>
        <span className="ad-sub">Professional AI Assistant</span>
      </header>

      <div className="ad-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ad-msg ${m.role}`}>
            <div className="ad-text">{m.text}</div>

            {m.role === "ai" && (
              <div className="ad-actions">
                <button onClick={() => readAloud(m.speakText)}>🔊</button>
                <button onClick={() => copyText(m.text)}>📋</button>
                <button title="Helpful">👍</button>
                <button title="Not helpful">👎</button>
                <button
                  onClick={() =>
                    navigator.share?.({ text: m.text }) ||
                    copyText(m.text)
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

      <div className="ad-input">
        <textarea
          placeholder="Ask AuthoDev 6.5 anything about this room, security, or the situation…"
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
          {loading ? "Thinking…" : "Send"}
        </button>
      </div>
    </div>
  );
}
