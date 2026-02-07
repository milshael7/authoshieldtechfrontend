// frontend/src/components/AuthoDevPanel.jsx
// AuthoDev 6.5 — Universal AI Text Panel
// Professional, long-form, readable, shareable, speaker-enabled
// Step 30: Persistent Dock + Minimize (localStorage)
// Uses unified ReadAloud engine

import React, { useState, useRef, useEffect } from "react";
import { readAloud } from "./ReadAloud";

/* ================= STORAGE KEYS ================= */

const STORAGE_KEY = "authodev.panel.state";

/* ================= HELPERS ================= */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

function loadPanelState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { docked: false, minimized: false };
    return JSON.parse(raw);
  } catch {
    return { docked: false, minimized: false };
  }
}

function savePanelState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "AuthoDev 6.5",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const saved = loadPanelState();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [docked, setDocked] = useState(saved.docked);
  const [minimized, setMinimized] = useState(saved.minimized);

  const bottomRef = useRef(null);

  /* ================= PERSIST STATE ================= */

  useEffect(() => {
    savePanelState({ docked, minimized });
  }, [docked, minimized]);

  /* ================= AI ================= */

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

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: data?.reply || "No response.",
          speakText: data?.speakText || data?.reply || "",
          ts: new Date().toLocaleTimeString(),
        },
      ]);
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
    <div
      className={`authodev-panel ${docked ? "docked" : ""} ${
        minimized ? "minimized" : ""
      }`}
    >
      <header className="ad-header">
        <div>
          <h3>{title}</h3>
          <span className="ad-sub">Professional AI Assistant</span>
        </div>

        <div className="ad-controls">
          <button onClick={() => setMinimized((v) => !v)}>
            {minimized ? "⬆️" : "⬇️"}
          </button>
          <button onClick={() => setDocked((v) => !v)}>
            {docked ? "📍" : "📌"}
          </button>
        </div>
      </header>

      {!minimized && (
        <>
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
        </>
      )}

      {/* ================= STYLES ================= */}
      <style>{`
        .authodev-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f1218;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
        }

        .authodev-panel.docked {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 380px;
          height: 520px;
          z-index: 9999;
        }

        .authodev-panel.minimized {
          height: auto;
        }

        .ad-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ad-header h3 {
          margin: 0;
          font-weight: 700;
        }

        .ad-sub {
          font-size: 12px;
          opacity: .7;
        }

        .ad-controls {
          display: flex;
          gap: 6px;
        }

        .ad-controls button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          opacity: .8;
        }

        .ad-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ad-msg {
          max-width: 85%;
          line-height: 1.5;
          font-size: 14px;
        }

        .ad-msg.user {
          align-self: flex-end;
          background: rgba(122,162,255,.15);
          padding: 12px;
          border-radius: 12px;
        }

        .ad-msg.ai {
          align-self: flex-start;
          background: rgba(255,255,255,.06);
          padding: 14px;
          border-radius: 14px;
        }

        .ad-text {
          white-space: pre-wrap;
        }

        .ad-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          font-size: 13px;
        }

        .ad-actions button {
          background: none;
          border: none;
          cursor: pointer;
          opacity: .75;
        }

        .ad-time {
          margin-top: 6px;
          font-size: 11px;
          opacity: .5;
        }

        .ad-input {
          border-top: 1px solid rgba(255,255,255,.08);
          padding: 12px;
          display: flex;
          gap: 10px;
        }

        .ad-input textarea {
          flex: 1;
          resize: none;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(0,0,0,.3);
          color: #fff;
          font-size: 14px;
        }

        .ad-input button {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          background: #2bd576;
          color: #000;
        }
      `}</style>
    </div>
  );
}
