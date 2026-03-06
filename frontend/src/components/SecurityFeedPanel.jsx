// frontend/src/components/SecurityFeedPanel.jsx
// SOC Live Threat Intelligence Stream — SHELL-SAFE • QUIET • HARDENED

import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { readAloud } from "./ReadAloud";

/* ================= HELPERS ================= */

function copy(text) {
  try {
    navigator.clipboard?.writeText(String(text || ""));
  } catch {}
}

function formatTime(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown time";
  return d.toLocaleString();
}

/* ================= COMPONENT ================= */

export default function SecurityFeedPanel() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("IDLE");
  const [loading, setLoading] = useState(true);

  const failureCount = useRef(0);
  const timerRef = useRef(null);
  const aliveRef = useRef(false);
  const runningRef = useRef(false);

  async function load() {
    if (!aliveRef.current) return;

    try {
      const res = await api.securityEvents?.();

      if (!res || res.error || !Array.isArray(res.events)) {
        failureCount.current += 1;
        setStatus("QUIET");

        // Only clear once to avoid flicker
        if (failureCount.current === 1) {
          setEvents([]);
        }
        return;
      }

      // Valid data
      failureCount.current = 0;
      setEvents(res.events);
      setStatus("LIVE");
    } catch {
      failureCount.current += 1;
      setStatus("QUIET");

      if (failureCount.current === 1) {
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    aliveRef.current = true;

    if (runningRef.current) return;
    runningRef.current = true;

    load();

    const schedule = () => {
      if (!aliveRef.current) return;

      const delay =
        failureCount.current >= 3
          ? 20000
          : failureCount.current >= 1
          ? 10000
          : 7000;

      timerRef.current = setTimeout(async () => {
        await load();
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      aliveRef.current = false;
      runningRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="platformCard" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>Live Security Operations Feed</h3>
          <small style={{ opacity: 0.6 }}>Real-time threat intelligence</small>
        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

      {loading && <div style={{ opacity: 0.6 }}>Loading security events…</div>}

      {!loading && events.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          No active threats detected.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {events.map((e) => {
          const severity = String(e.severity || "low").toLowerCase();
          const explanation = buildExplanation(e);

          const key =
            e.id ||
            `${e.type || "event"}-${e.iso || ""}-${e.source || ""}`;

          return (
            <div
              key={key}
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <b>{e.type || "Unknown Event"}</b>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {formatTime(e.iso)} • {e.source || "Unknown Source"}
                    </div>
                  </div>

                  <div style={severityBadge(severity)}>
                    {severity.toUpperCase()}
                  </div>
                </div>

                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><b>Description:</b> {e.description || "No description"}</div>
                  <div><b>Target:</b> {e.target || "Not specified"}</div>
                  <div><b>Assessment:</b> {assessmentText(severity)}</div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    marginTop: 14,
                    borderTop: "1px solid rgba(255,255,255,.08)",
                    paddingTop: 10,
                    fontSize: 13,
                  }}
                >
                  <button style={actionBtn} onClick={() => copy(explanation)}>
                    Copy Report
                  </button>
                  <button style={actionBtn} onClick={() => readAloud(explanation)}>
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

/* ================= TEXT ================= */

function buildExplanation(e) {
  return `
Security Event: ${e.type || "Unknown"}
Severity: ${e.severity || "Low"}
Time: ${formatTime(e.iso)}
Source: ${e.source || "Unknown"}
Target: ${e.target || "Not specified"}

Description:
${e.description || "No description"}

Assessment:
${assessmentText(e.severity)}
`.trim();
}

function assessmentText(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical") return "Immediate containment required.";
  if (s === "high") return "High priority threat. Review recommended.";
  if (s === "medium") return "Monitor and validate activity.";
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
  return { width: 6, background: colors[sev] || colors.low };
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
