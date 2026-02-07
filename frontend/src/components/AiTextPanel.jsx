import React, { useState, useRef } from "react";

/**
 * AuthoDev 6.5 — Professional AI Text Panel
 * - Long-form answers
 * - Copy / Speak / Rate / Share
 * - Tenant-safe (backend enforced)
 */

export default function AiTextPanel({
  title = "AuthoDev 6.5",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const synthRef = useRef(window.speechSynthesis);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: "user",
      text: input.trim(),
      ts: Date.now(),
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
        text: data.reply || "No response.",
        speakText: data.speakText || data.reply,
        ts: Date.now(),
      };

      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Connection issue. Please try again.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function speak(text) {
    if (!synthRef.current || !text) return;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    synthRef.current.speak(u);
  }

  function copy(text) {
    navigator.clipboard?.writeText(text);
  }

  return (
    <div style={panel}>
      <div style={header}>{title}</div>

      <div style={chatArea}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === "ai" ? aiMsg : userMsg}>
            <div style={text}>{m.text}</div>

            {m.role === "ai" && (
              <div style={tools}>
                <button onClick={() => speak(m.speakText)}>🔊</button>
                <button onClick={() => copy(m.text)}>📋</button>
                <button title="Helpful">👍</button>
                <button title="Not helpful">👎</button>
                <button title="Share">🔗</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AuthoDev about your security, activity, or issues…"
          style={inputBox}
          rows={2}
        />
        <button onClick={sendMessage} disabled={loading} style={sendBtn}>
          {loading ? "Thinking…" : "Send"}
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const panel = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
};

const header = {
  padding: 14,
  fontWeight: 800,
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const chatArea = {
  flex: 1,
  padding: 14,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const userMsg = {
  alignSelf: "flex-end",
  maxWidth: "80%",
  background: "rgba(122,162,255,0.2)",
  borderRadius: 12,
  padding: 12,
};

const aiMsg = {
  alignSelf: "flex-start",
  maxWidth: "85%",
  background: "rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 14,
};

const text = {
  fontSize: 14,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const tools = {
  display: "flex",
  gap: 8,
  marginTop: 8,
  fontSize: 12,
  opacity: 0.85,
};

const inputRow = {
  display: "flex",
  gap: 10,
  padding: 12,
  borderTop: "1px solid rgba(255,255,255,0.1)",
};

const inputBox = {
  flex: 1,
  resize: "none",
  borderRadius: 10,
  padding: 10,
  background: "rgba(0,0,0,0.4)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.15)",
};

const sendBtn = {
  padding: "0 18px",
  borderRadius: 10,
  fontWeight: 700,
  background: "#7aa2ff",
  color: "#000",
};
