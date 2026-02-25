import React, { useRef } from "react";
import { useSecurity } from "../context/SecurityContext";
import SecurityRadar from "../components/security/SecurityRadar";
import SecurityToolMarketplace from "../components/security/SecurityToolMarketplace";

function getRiskColor(score) {
  if (score >= 60) return "#ff4d4f";
  if (score >= 30) return "#faad14";
  return "#52c41a";
}

function getRiskLabel(score) {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "ELEVATED";
  return "STABLE";
}

export default function SecurityOverview() {
  const radarRef = useRef(null);

  const {
    systemStatus,
    riskScore,
    integrityAlert
  } = useSecurity();

  function refreshRadar() {
    if (radarRef.current?.reload) {
      radarRef.current.reload();
    }
  }

  const riskColor = getRiskColor(riskScore);
  const riskLabel = getRiskLabel(riskScore);

  return (
    <div className="postureWrap">

      {/* ================= COMMAND HEADER ================= */}

      <div style={styles.commandHeader}>

        <div style={styles.statusBlock}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor:
                systemStatus === "secure" ? "#52c41a" : "#ff4d4f"
            }}
          />
          <span>
            System:{" "}
            <strong>
              {systemStatus === "secure"
                ? "SECURE"
                : "COMPROMISED"}
            </strong>
          </span>
        </div>

        <div style={styles.riskBlock}>
          <div style={styles.riskBar}>
            <div
              style={{
                ...styles.riskFill,
                width: `${riskScore}%`,
                backgroundColor: riskColor
              }}
            />
          </div>

          <div style={styles.riskMeta}>
            <span style={{ color: riskColor }}>
              {riskLabel}
            </span>
            <span>{riskScore}/100</span>
          </div>
        </div>

      </div>

      {/* ================= INTEGRITY ALERT ================= */}

      {integrityAlert && (
        <div style={styles.integrityAlert}>
          ⚠ AUDIT INTEGRITY FAILURE DETECTED
        </div>
      )}

      {/* ================= EXISTING MODULES ================= */}

      <SecurityRadar ref={radarRef} />
      <SecurityToolMarketplace onChange={refreshRadar} />

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
    boxShadow: "0 0 20px rgba(0,0,0,0.4)"
  },

  statusBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#e5e7eb",
    fontSize: 15
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: "50%"
  },

  riskBlock: {
    minWidth: 280
  },

  riskBar: {
    height: 10,
    backgroundColor: "#1e293b",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6
  },

  riskFill: {
    height: "100%",
    transition: "width 0.4s ease"
  },

  riskMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#cbd5e1"
  },

  integrityAlert: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#7f1d1d",
    color: "#fff",
    borderRadius: 8,
    fontWeight: 600,
    textAlign: "center"
  }
};
