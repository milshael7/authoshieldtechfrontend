// frontend/src/components/AuthoDevPanel.jsx
// AuthoDevPanel — Advisor v6.5 UI-RESTORED
// UI CONTRACT PRESERVED • SHELL-SAFE • NO FEATURE REMOVALS
// CHANGE: icon gap tightened to 3 ONLY

import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud, stopReadAloud } from "./ReadAloud";

const MAX_MESSAGES = 50;

/* ================= STORAGE ================= */

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch {}
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

function copyText(text) {
  try { navigator.clipboard?.writeText(String(text || "")); } catch {}
}

/* ================= CONTEXT ================= */

function detectModule() {
  const path = window.location.pathname;
  if (path.includes("/admin/trading")) return "trading";
  if (path.includes("/admin/security")) return "security";
  if (path.includes("/admin/risk")) return "risk";
  if (path.includes("/admin/incidents")) return "incident";
  if (path.includes("/admin/companies")) return "company";
  return "platform";
}

/* ================= COMPONENT ================= */

export default function AuthoDevPanel({
  title = "Advisor",
  endpoint = "/api/ai/chat",
  getContext,
}) {
  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  const storageKey = useMemo(() => getStorageKey(), []);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  /* ================= LIFECYCLE ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      try { stopReadAloud(); } catch {}
      try { abortRef.current?.abort(); } catch {}
    };
  }, []);

  /* ================= STORAGE ================= */

  useEffect(() => {
    const raw = safeGet(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.messages)) {
        setMessages(parsed.messages);
      }
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

  /* ================= SPEECH ================= */

  function handleSpeak(text) {
    readAloud(text);
  }

  /* ================= VOICE INPUT ================= */

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    try { recognitionRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;

    rec.onstart = () => mountedRef.current && setListening(true);
    rec.onend = () => mountedRef.current && setListening(false);

    rec.onresult = (e) => {
      const last = e.results?.[e.results.length - 1];
      const text = last?.[0]?.transcript || "";
      if (text) setInput(text);
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage() {
    const messageText = String(input || "").trim();
    if (!messageText || loading) return;

    if (listening) stopListening();

    setMessages(m => [
      ...m.slice(-MAX_MESSAGES + 1),
      { role: "user", text: messageText, ts: Date.now() }
    ]);
    setInput("");
    setLoading(true);

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const ctxFromParent = typeof getContext === "function" ? getContext() : {};
      const module = detectModule();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          message: messageText,
          context: {
            ...ctxFromParent,
            module,
            tradingActive: module === "trading",
            location: window.location.pathname,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "Assistant unavailable.";

      if (!mountedRef.current) return;

      setMessages(m => [
        ...m.slice(-MAX_MESSAGES + 1),
        { role: "ai", text: reply, ts: Date.now() }
      ]);

    } catch {
      if (!mountedRef.current) return;
      setMessages(m => [
        ...m.slice(-MAX_MESSAGES + 1),
        { role: "ai", text: "Assistant unavailable.", ts: Date.now() }
      ]);
    } finally {
      mountedRef.current && setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>{title}</div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "75%",
                padding: "14px 18px",
                borderRadius: 18,
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg,#5EC6FF,#7aa2ff)"
                    : "rgba(255,255,255,.06)",
                color: "#fff",
              }}
            >
              {m.text}
            </div>

            {m.role === "ai" && (
              <div
                style={{
                  display: "flex",
                  gap: 3,          // ✅ EXACT GAP REQUESTED
                  marginTop: 6,
                  opacity: 0.75,
                }}
              >
                <IconBtn onClick={() => handleSpeak(m.text)}><IconSpeaker /></IconBtn>
                <IconBtn onClick={() => copyText(m.text)}><IconCopy /></IconBtn>
                <IconBtn><IconThumbUp /></IconBtn>
                <IconBtn><IconThumbDown /></IconBtn>
                <IconBtn><IconRefresh /></IconBtn>
                <IconBtn><IconShare /></IconBtn>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT PILL */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,.05)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <IconBtn onClick={!listening ? startListening : stopListening}>
          <IconMic />
        </IconBtn>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            resize: "none",
            fontSize: 14,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <IconBtn onClick={sendMessage}>
          <IconSend />
        </IconBtn>
      </div>
    </div>
  );
}

/* ================= ICONS (UNCHANGED) ================= */

const iconBase = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "#cbd5e1",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const IconBtn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
    {children}
  </button>
);

const IconSpeaker = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
  </svg>
);

const IconCopy = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconThumbUp = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-1 7" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    <path d="M7 11h8a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7" />
  </svg>
);

const IconThumbDown = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <path d="M10 15v4a3 3 0 0 0 3 3l1-7" />
    <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    <path d="M17 13H9a2 2 0 0 1-2-2l1-7a2 2 0 0 1 2-2h7" />
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15A9 9 0 1 1 23 10" />
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconMic = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
    <path d="M19 11a7 7 0 0 1-14 0" />
    <path d="M12 18v4" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" {...iconBase}>
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22l-4-9-9-4 20-7z" />
  </svg>
);
