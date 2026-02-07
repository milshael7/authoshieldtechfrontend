import React, { useState, useRef } from "react";

/**
 * AuthoDev 6.5 — Professional AI Text Panel
 * Enterprise-grade, long-form, shareable responses
 *
 * Features:
 * - Long professional answers (email-quality)
 * - Read aloud per message
 * - Copy / Share / Rate controls
 * - Clean, non-bubble layout
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
        text: data.reply || "No response available.",
        speakText: data.speakText || data.reply,
        ts: Date.now(),
      };

      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            "There was a connection issue while generating the response. Please try again.",
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

  function share(text) {
    if (navigator.share) {
      navigator.share({ text });
    } else {
      copy(text);
    }
  }

  return (
    <div style={panel}>
      <div style={header}>{title}</div>

      <div style={chatArea}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === "ai" ? aiBlock : userBlock}>
            <div style={text}>{m.text}</div>

            {m.role === "ai" && (
              <div style={tools}>
                <button style={toolBtn} onClick={() => speak(m.speakText)}>
                  🔊
                </button>
                <button style={toolBtn} onClick={() => copy(m.text)}>
                  📋
                </button>
                <button style={toolBtn} title="Helpful">
                  👍
                </button>
                <button style={toolBtn} title="Not helpful">
                  👎
                </button>
                <button style={toolBtn} onClick={() => share(m.text)}>
                  🔗
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AuthoDev about security activity, incidents, or analysis…"
          style={inputBox}
          rows={3}
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
  fontSize: 15,
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const chatArea = {
  flex: 1,
  padding: 16,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const userBlock = {
  alignSelf: "flex-end",
  maxWidth: "75%",
  background: "rgba(122,162,255,0.15)",
  borderRadius: 12,
  padding: 12,
  fontSize: 13,
};

const aiBlock = {
  alignSelf: "flex-start",
  maxWidth: "85%",
  background: "rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: 16,
};

const text = {
  fontSize: 13,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const tools = {
  display: "flex",
  gap: 10,
  marginTop: 10,
  fontSize: 12,
  opacity: 0.8,
};

const toolBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
};

const inputRow = {
  display: "flex",
  gap: 10,
  padding: 14,
  borderTop: "1px solid rgba(255,255,255,0.1)",
};

const inputBox = {
  flex: 1,
  resize: "none",
  borderRadius: 10,
  padding: 12,
  background: "rgba(0,0,0,0.4)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.15)",
  fontSize: 13,
};

const sendBtn = {
  padding: "0 20px",
  borderRadius: 10,
  fontWeight: 700,
  background: "#7aa2ff",
  color: "#000",
};
