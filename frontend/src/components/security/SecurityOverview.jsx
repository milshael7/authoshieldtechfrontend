// frontend/src/components/security/SecurityOverview.jsx
// SecurityOverview — Quiet Compliance v14
// QUIET • SIGNAL-ONLY • NO FALSE ALARMS • INTEGRITY-FIRST

import React, { useRef } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import SecurityRadar from "./SecurityRadar.jsx";
import SecurityToolMarketplace from "./SecurityToolMarketplace.jsx";

/* ================= RISK HELPERS ================= */

function getRiskColor(score, integrityAlert) {
  if (integrityAlert) return "#ff4d4f";
  if (score >= 60) return "#ff4d4f";
  if (score >= 30) return "#faad14";
  return "#52c41a";
}

function getRiskLabel(score, integrityAlert) {
  if (integrityAlert) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "ELEVATED";
  return "STABLE";
}

/* ================= COMPONENT ================= */

export default function SecurityOverview() {
  const radarRef = useRef(null);

  const {
    systemStatus,
    riskScore,
    integrityAlert,
  } = useSecurity();

  function refreshRadar() {
    radarRef.current?.reload?.();
  }

  const riskColor = getRiskColor(riskScore, integrityAlert);
  const riskLabel = getRiskLabel(riskScore, integrityAlert);

  const isQuiet = systemStatus === "secure" && !integrityAlert;

  return (
    <div className="postureWrap">

      {/* ================= COMMAND HEADER ================= */}

      <div style={styles.commandHeader}>

        <div style={styles.statusBlock}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor: isQuiet ? "#52c41a" : "#ff4d4f",
            }}
          />
          <span>
            System:{" "}
            <strong>
              {isQuiet ? "SECURE" : "COMPROMISED"}
            </strong>
          </span>
        </div>

        <div style={styles.riskBlock}>
          <div style={styles.riskBar}>
            <div
              style={{
                ...styles.riskFill,
                width: `${Math.min(riskScore, 100)}%`,
                backgroundColor: riskColor,
              }}
            />
          </div>

          <div style={styles.riskMeta}>
            <span style={{ color: riskColor }}>{riskLabel}</span>
            <span>{riskScore}/100</span>
          </div>
        </div>

      </div>

      {/* ================= INTEGRITY ALERT (ONLY REAL NOISE) ================= */}

      {integrityAlert && (
        <div style={styles.integrityAlert}>
          ⚠ INTEGRITY BREACH DETECTED — IMMEDIATE ATTENTION REQUIRED
        </div>
      )}

      {/* ================= METRICS (PASSIVE / QUIET) ================= */}

      <div style={styles.metricsGrid}>

        <Metric label="Active Incidents" value={integrityAlert ? "1+" : "0"} />
        <Metric label="Threat Events" value={integrityAlert ? "Detected" : "None"} />
        <Metric label="Trusted Devices" value="Verified" />
        <Metric label="Security Modules" value="Active" />

      </div>

      {/* ================= RADAR (PASSIVE) ================= */}

      <SecurityRadar ref={radarRef} />

      {/* ================= ACTIONS (INTENTION-ONLY) ================= */}

      <div style={styles.actionPanel}>
        <h3 style={styles.actionTitle}>Security Actions</h3>

        <div style={styles.actionButtons}>
          <button style={styles.actionBtn} disabled={isQuiet}>
            Run Integrity Scan
          </button>

          <button style={styles.actionBtn} disabled={isQuiet}>
            Refresh Threat Intelligence
          </button>

          <button style={styles.actionBtn}>
            Generate Security Report
          </button>
        </div>
      </div>

      {/* ================= MARKETPLACE ================= */}

      <SecurityToolMarketplace onChange={refreshRadar} />

    </div>
  );
}

/* ================= SMALL HELPERS ================= */

function Metric({ label, value }) {
  return (
    <div style={styles.metricCard}>
      <h4>{label}</h4>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  commandHeader: {
    background: "#0f172a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },

  statusBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#e5e7eb",
    fontSize: 15,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },

  riskBlock: {
    minWidth: 260,
  },

  riskBar: {
    height: 8,
    backgroundColor: "#1e293b",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },

  riskFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },

  riskMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#cbd5e1",
  },

  integrityAlert: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#7f1d1d",
    color: "#fff",
    borderRadius: 8,
    fontWeight: 700,
    textAlign: "center",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 18,
    marginBottom: 28,
  },

  metricCard: {
    background: "#0f172a",
    padding: 16,
    borderRadius: 10,
    color: "#e5e7eb",
  },

  metricValue: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 6,
  },

  actionPanel: {
    marginTop: 28,
    marginBottom: 28,
  },

  actionTitle: {
    marginBottom: 12,
    color: "#e5e7eb",
  },

  actionButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },

  actionBtn: {
    padding: "10px 16px",
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    opacity: 0.9,
  },
};
