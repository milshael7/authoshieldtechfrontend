import React, { useEffect, useRef, useState } from "react";
import { api, getToken } from "../lib/api";

export default function SOC() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [threatIndex, setThreatIndex] = useState(0);
  const [adaptiveRisk, setAdaptiveRisk] = useState(0);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await api.securityEvents(100);
        const list = res?.events || [];
        const sorted = sortEvents(list);
        setEvents(sorted);
        computeStats(sorted);
        computeThreatIndex(sorted);
      } catch {}
      setLoading(false);
    }

    loadInitial();
  }, []);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
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

        /* ===== Security Event ===== */
        if (data.type === "security_event") {
          setEvents((prev) => {
            const exists = prev.find((e) => e.id === data.event.id);
            if (exists) return prev;

            const updated = sortEvents([data.event, ...prev]).slice(0, 200);
            computeStats(updated);
            computeThreatIndex(updated);
            return updated;
          });
        }

        /* ===== Adaptive Risk Update ===== */
        if (data.type === "risk_update") {
          setAdaptiveRisk(data.riskScore || 0);
        }

      } catch {}
    };

    return () => ws.close();
  }, []);

  /* ================= ACKNOWLEDGE ================= */

  async function acknowledge(event) {
    try {
      await api.req(`/api/security/events/${event.id}/ack`, {
        method: "PATCH",
      });

      const updated = events.map((e) =>
        e.id === event.id ? { ...e, acknowledged: true } : e
      );

      setEvents(updated);
      computeStats(updated);
      computeThreatIndex(updated);
    } catch {
      alert("Failed to acknowledge event.");
    }
  }

  /* ================= STATS ================= */

  function computeStats(list) {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };

    list.forEach((e) => {
      if (!e.severity) return;
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    });

    setStats(counts);
  }

  /* ================= LOCAL THREAT INDEX ================= */

  function computeThreatIndex(list) {
    let score = 0;

    list.forEach((e) => {
      if (e.severity === "critical") score += 25;
      if (e.severity === "high") score += 15;
      if (e.severity === "medium") score += 8;
      if (e.severity === "low") score += 2;
      if (!e.acknowledged) score += 5;
      if (e.aiGenerated) score += 10;
    });

    if (score > 100) score = 100;
    setThreatIndex(score);
  }

  function levelFromScore(score) {
    if (score >= 75) return { label: "CRITICAL", color: "#ff3b30" };
    if (score >= 50) return { label: "ELEVATED", color: "#ff9500" };
    if (score >= 25) return { label: "MODERATE", color: "#f5b400" };
    return { label: "LOW", color: "#16c784" };
  }

  if (loading) return <div style={{ padding: 28 }}>Loading SOC…</div>;

  const localRisk = levelFromScore(threatIndex);
  const aiRisk = levelFromScore(adaptiveRisk);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Security Operations Center</h2>
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
      </div>

      {/* ================= EXECUTIVE PANEL ================= */}

      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          background: "rgba(255,255,255,.04)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          <Stat label="Critical" value={stats.critical} color="#ff3b30" />
          <Stat label="High" value={stats.high} color="#ff9500" />
          <Stat label="Medium" value={stats.medium} color="#f5b400" />
          <Stat label="Low" value={stats.low} color="#16c784" />
        </div>

        <div style={{ display: "flex", gap: 40 }}>

          {/* Local Threat Index */}
          <RiskCard
            title="Event Threat Index"
            score={threatIndex}
            risk={localRisk}
          />

          {/* Adaptive AI Risk */}
          <RiskCard
            title="Adaptive AI Risk"
            score={adaptiveRisk}
            risk={aiRisk}
          />

        </div>
      </div>

      {/* ================= EVENT LIST ================= */}

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        {events.length === 0 && (
          <div style={{ opacity: 0.5 }}>
            No security events detected.
          </div>
        )}

        {events.map((e) => (
          <div
            key={e.id}
            style={{
              padding: 16,
              borderRadius: 10,
              background: "rgba(255,255,255,.05)",
              borderLeft: `4px solid ${severityColor(e.severity)}`,
              opacity: e.acknowledged ? 0.6 : 1,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {e.title || "Security Event"}
            </div>

            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {new Date(
                e.timestamp || e.createdAt || Date.now()
              ).toLocaleString()}
            </div>

            <div style={{ marginTop: 6 }}>
              Severity:{" "}
              <span style={{ color: severityColor(e.severity) }}>
                {e.severity || "low"}
              </span>
            </div>

            {!e.acknowledged && (
              <button
                style={{
                  marginTop: 10,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#4f8cff",
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => acknowledge(e)}
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function severityColor(level) {
  if (level === "critical") return "#ff3b30";
  if (level === "high") return "#ff9500";
  if (level === "medium") return "#f5b400";
  return "#16c784";
}

function sortEvents(list) {
  return [...list].sort(
    (a, b) =>
      new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
    </div>
  );
}

function RiskCard({ title, score, risk }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>
        {title}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: risk.color }}>
        {score}
      </div>

      <div
        style={{
          marginTop: 6,
          padding: "6px 12px",
          borderRadius: 8,
          background: risk.color,
          color: "#000",
          fontWeight: 700,
          display: "inline-block",
        }}
      >
        {risk.label}
      </div>
    </div>
  );
}
