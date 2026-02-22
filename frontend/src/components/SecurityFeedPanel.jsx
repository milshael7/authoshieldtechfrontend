// frontend/src/components/SecurityFeedPanel.jsx
// SOC Live Threat Intelligence Stream — Hardened Enterprise Version

import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function copy(text) {
  navigator.clipboard?.writeText(text);
}

function formatTime(iso) {
  if (!iso) return "Unknown time";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Invalid date";
  return d.toLocaleString();
}

/* ================= COMPONENT ================= */

export default function SecurityFeedPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading…");

  async function load() {
    try {
      const res = await api.req
        ? await api.req("/api/security/events?limit=50")
        : await fetch("/api/security/events?limit=50");

      // If using api layer
      const data = res?.events ? res : await res.json?.();

      setEvents(data?.events || []);
      setStatus("LIVE");
    } catch (e) {
      console.error("SecurityFeedPanel error:", e);
      setEvents([]);
      setStatus("ERROR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="platformCard"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Live Security Operations Feed</h3>
          <small style={{ opacity: 0.6 }}>
            Real-time threat intelligence
          </small>
        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

      {loading && (
        <div style={{ opacity: 0.6 }}>
          Loading security events…
        </div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          No active threats detected.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {events.map((e) => {
          const severity = (e.severity || "low").toLowerCase();
          const explanation = buildExplanation(e);

          return (
            <div
              key={e.id || e.iso}
              style={{
                display: "flex",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 16,
                overflow: "hidden",
                background: "rgba(0,0,0,.35)",
              }}
            >
              <div style={severityBar(severity)} />

              <div style={{ flex: 1, padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <b>{e.type || "Unknown Event"}</b>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {formatTime(e.iso)} •{" "}
                      {e.source || "Unknown Source"}
                    </div>
                  </div>

                  <div style={severityBadge(severity)}>
                    {severity.toUpperCase()}
                  </div>
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div>
                    <b>Description:</b>{" "}
                    {e.description || "No description"}
                  </div>
                  <div>
                    <b>Target:</b>{" "}
                    {e.target || "Not specified"}
                  </div>
                  <div>
                    <b>Assessment:</b>{" "}
                    {assessmentText(severity)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    marginTop: 14,
                    borderTop:
                      "1px solid rgba(255,255,255,.08)",
                    paddingTop: 10,
                    fontSize: 13,
                  }}
                >
                  <button
                    style={actionBtn}
                    onClick={() => copy(explanation)}
                  >
                    Copy Report
                  </button>

                  <button
                    style={actionBtn}
                    onClick={() => speak(explanation)}
                  >
                    Read Aloud
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= TEXT LOGIC ================= */

function buildExplanation(e) {
  return `
Security Event: ${e.type || "Unknown"}
Severity: ${e.severity || "Low"}
Time: ${formatSafe(e.iso)}
Source: ${e.source || "Unknown"}
Target: ${e.target || "Not specified"}

Description:
${e.description || "No description"}

Assessment:
${assessmentText(e.severity)}
`.trim();
}

function formatSafe(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown";
  return d.toLocaleString();
}

function assessmentText(severity) {
  const s = (severity || "").toLowerCase();
  if (s === "critical")
    return "Immediate containment and investigation required.";
  if (s === "high")
    return "High priority threat. Rapid review recommended.";
  if (s === "medium")
    return "Monitor and validate activity.";
  return "Low risk. Logged for awareness.";
}

/* ================= STYLES ================= */

function severityBar(sev) {
  const colors = {
    critical: "#ff2e2e",
    high: "#ff5a5f",
    medium: "#ffd166",
    low: "#2bd576",
  };

  return {
    width: 6,
    background: colors[sev] || colors.low,
  };
}

function severityBadge(sev) {
  const colors = {
    critical: "#ff2e2e",
    high: "#ff5a5f",
    medium: "#ffd166",
    low: "#2bd576",
  };

  return {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: colors[sev] || colors.low,
    color: "#000",
  };
}

const actionBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  opacity: 0.85,
};
