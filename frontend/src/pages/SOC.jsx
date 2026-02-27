import React, { useEffect, useRef, useState, useMemo } from "react";
import { api } from "../lib/api";
import { useSecurity } from "../context/SecurityContext";

/* =========================================================
   ENTERPRISE SOC COMMAND CONSOLE — v2
   Context-Aligned • Zero WS Duplication • Risk Adaptive
========================================================= */

export default function SOC() {
  const {
    wsStatus,
    riskScore,
    auditFeed,
    deviceAlerts,
  } = useSecurity();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);

  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [threatIndex, setThreatIndex] = useState(0);
  const [riskHistory, setRiskHistory] = useState([]);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await api.securityEvents();
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

  /* ================= LIVE RISK TRACKING ================= */

  useEffect(() => {
    if (typeof riskScore !== "number") return;

    setRiskHistory((prev) => {
      const updated = [...prev, riskScore];
      if (updated.length > 60) updated.shift();
      return updated;
    });
  }, [riskScore]);

  /* ================= DRAW RISK GRAPH ================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (riskHistory.length < 2) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = "#4f8cff";
    ctx.lineWidth = 2;

    riskHistory.forEach((value, index) => {
      const x = (index / (riskHistory.length - 1)) * width;
      const y = height - (value / 100) * height;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [riskHistory]);

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
    } catch {}
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

  const localRisk = levelFromScore(threatIndex);
  const adaptiveRisk = levelFromScore(riskScore || 0);

  const connected = wsStatus === "connected";

  const recentAudit = useMemo(() => {
    return auditFeed.slice(0, 8);
  }, [auditFeed]);

  if (loading) return <div style={{ padding: 28 }}>Loading SOC…</div>;

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
          <RiskCard
            title="Event Threat Index"
            score={threatIndex}
            risk={localRisk}
          />
          <RiskCard
            title="Adaptive AI Risk"
            score={riskScore || 0}
            risk={adaptiveRisk}
          />
        </div>
      </div>

      {/* ================= RISK TREND ================= */}

      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          background: "rgba(255,255,255,.04)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>
          Adaptive Risk Trend (Live)
        </div>

        <canvas
          ref={canvasRef}
          width={900}
          height={220}
          style={{ width: "100%", height: 220 }}
        />
      </div>

      {/* ================= DEVICE ALERTS ================= */}

      {deviceAlerts.length > 0 && (
        <div
          style={{
            marginTop: 28,
            padding: 18,
            borderRadius: 12,
            background: "rgba(255,59,48,.08)",
            border: "1px solid rgba(255,59,48,.4)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Device Anomalies Detected
          </div>

          {deviceAlerts.slice(0, 5).map((d, i) => (
            <div key={i} style={{ fontSize: 13, opacity: 0.8 }}>
              {JSON.stringify(d)}
            </div>
          ))}
        </div>
      )}

      {/* ================= RECENT AUDIT ================= */}

      <div style={{ marginTop: 28 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>
          Recent Enforcement Activity
        </div>

        {recentAudit.map((a) => (
          <div
            key={a.id}
            style={{
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
              background: "rgba(255,255,255,.04)",
              fontSize: 12,
            }}
          >
            <div style={{ opacity: 0.6 }}>
              {new Date(a.ts).toLocaleString()}
            </div>
            <div>{a.action}</div>
          </div>
        ))}
      </div>

      {/* ================= EVENTS ================= */}

      <div style={{ marginTop: 28 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>
          Security Events
        </div>

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
              marginBottom: 12,
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

function levelFromScore(score) {
  if (score >= 75) return { label: "CRITICAL", color: "#ff3b30" };
  if (score >= 50) return { label: "ELEVATED", color: "#ff9500" };
  if (score >= 25) return { label: "MODERATE", color: "#f5b400" };
  return { label: "LOW", color: "#16c784" };
}
