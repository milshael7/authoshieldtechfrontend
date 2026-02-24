import React, { useEffect, useRef, useState } from "react";
import { api, getToken } from "../lib/api";

export default function Intelligence() {
  const [items, setItems] = useState([]);
  const [connected, setConnected] = useState(false);
  const [adaptiveRisk, setAdaptiveRisk] = useState(0);
  const wsRef = useRef(null);

  useEffect(() => {
    loadInitial();
    initSocket();
    return () => wsRef.current?.close();
  }, []);

  async function loadInitial() {
    try {
      const [eventsRes, incidentsRes] = await Promise.all([
        api.securityEvents(100),
        api.incidents(),
      ]);

      const events = (eventsRes?.events || []).map(e => ({
        ...e,
        type: "security_event",
        ts: e.timestamp || e.createdAt
      }));

      const incidents = (incidentsRes?.incidents || []).map(i => ({
        ...i,
        type: "incident",
        ts: i.createdAt
      }));

      setItems(sort([...events, ...incidents]));
    } catch {}
  }

  function initSocket() {
    const token = getToken();
    if (!token) return;

    const wsUrl = `${import.meta.env.VITE_API_BASE.replace(/^http/, "ws")}/ws/market?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        /* ===== Intelligence Events ===== */
        if (["security_event", "incident_created"].includes(data.type)) {
          const payload = {
            ...data.event,
            type: data.type,
            ts: data.event.timestamp || data.event.createdAt
          };

          setItems(prev => sort([payload, ...prev]).slice(0, 200));
        }

        /* ===== Adaptive Risk ===== */
        if (data.type === "risk_update") {
          setAdaptiveRisk(data.riskScore || 0);
        }

      } catch {}
    };
  }

  const risk = levelFromScore(adaptiveRisk);

  return (
    <div style={{ padding: 28 }}>

      {/* ===== Header ===== */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Global Intelligence Stream</h2>
        <Status connected={connected} />
      </div>

      {/* ===== Executive Risk Banner ===== */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 10,
          background: risk.color,
          color: "#000",
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>Adaptive AI Risk Level</div>
        <div style={{ fontSize: 22 }}>{adaptiveRisk}</div>
      </div>

      {/* ===== Stream ===== */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {items.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            style={{
              padding: 16,
              borderRadius: 10,
              background: "rgba(255,255,255,.05)",
              borderLeft: `4px solid ${color(item)}`,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {label(item)}
            </div>

            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {new Date(item.ts).toLocaleString()}
            </div>

            <div style={{ marginTop: 6 }}>
              Severity:{" "}
              <span style={{ color: color(item) }}>
                {item.severity || "info"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function sort(list) {
  return [...list].sort(
    (a, b) => new Date(b.ts) - new Date(a.ts)
  );
}

function label(item) {
  if (item.type === "incident") return `🚨 Incident: ${item.title}`;
  return `🛡️ Security Event: ${item.title || "Event"}`;
}

function color(item) {
  const s = item.severity;
  if (s === "critical") return "#ff3b30";
  if (s === "high") return "#ff9500";
  if (s === "medium") return "#f5b400";
  return "#16c784";
}

function levelFromScore(score) {
  if (score >= 75) return { label: "CRITICAL", color: "#ff3b30" };
  if (score >= 50) return { label: "ELEVATED", color: "#ff9500" };
  if (score >= 25) return { label: "MODERATE", color: "#f5b400" };
  return { label: "LOW", color: "#16c784" };
}

function Status({ connected }) {
  return (
    <div
      style={{
        fontSize: 12,
        padding: "6px 12px",
        borderRadius: 20,
        background: connected ? "#16c784" : "#ff3b30",
        color: "#000",
        fontWeight: 600,
      }}
    >
      {connected ? "LIVE" : "DISCONNECTED"}
    </div>
  );
}
