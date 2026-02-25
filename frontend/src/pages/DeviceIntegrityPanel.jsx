// frontend/src/pages/DeviceIntegrityPanel.jsx
// Device & System Integrity Command Panel
// Integrity Alerts • Device Events • Audit Anomalies • Live Risk Correlation

import React, { useMemo } from "react";
import { useSecurity } from "../context/SecurityContext.jsx";

function severityColor(level) {
  const l = String(level || "").toLowerCase();
  if (l === "critical") return "#ff4d4f";
  if (l === "high") return "#ff9800";
  if (l === "medium") return "#facc15";
  return "#22c55e";
}

export default function DeviceIntegrityPanel() {
  const {
    deviceAlerts,
    integrityAlert,
    auditFeed,
    riskScore,
    systemStatus
  } = useSecurity();

  const sortedAlerts = useMemo(() => {
    return [...(deviceAlerts || [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [deviceAlerts]);

  const anomalyDetected = useMemo(() => {
    return auditFeed.some(e =>
      String(e.action || "").toLowerCase().includes("failure")
    );
  }, [auditFeed]);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Device & Integrity Control Panel</div>

      {/* ================= SYSTEM INTEGRITY ================= */}
      <div
        className="postureCard executivePanel"
        style={{
          border:
            systemStatus === "compromised"
              ? "1px solid rgba(255,77,79,.6)"
              : "1px solid rgba(80,200,120,.4)",
        }}
      >
        <h3>System Integrity Status</h3>

        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color:
              systemStatus === "compromised"
                ? "#ff4d4f"
                : "#22c55e",
          }}
        >
          {String(systemStatus || "secure").toUpperCase()}
        </div>

        {integrityAlert && (
          <div
            style={{
              marginTop: 15,
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,77,79,.15)",
              border: "1px solid rgba(255,77,79,.5)",
            }}
          >
            🚨 Audit Ledger Integrity Failure Detected
          </div>
        )}
      </div>

      {/* ================= RISK CORRELATION ================= */}
      <div className="postureCard">
        <h3>Risk Correlation</h3>

        <div style={{ fontSize: 16 }}>
          Current Risk Score:{" "}
          <b
            style={{
              color: riskScore >= 80 ? "#ff4d4f" : "#22c55e",
              marginLeft: 8,
            }}
          >
            {Number(riskScore || 0)}
          </b>
        </div>

        {riskScore >= 80 && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 6,
              background: "rgba(255,77,79,.15)",
              border: "1px solid rgba(255,77,79,.4)",
            }}
          >
            ⚠ Elevated risk level detected. Device and system integrity should
            be reviewed immediately.
          </div>
        )}
      </div>

      {/* ================= DEVICE ALERTS ================= */}
      <div className="postureCard">
        <h3>Device Alerts</h3>

        {sortedAlerts.length === 0 ? (
          <div className="muted">No device alerts detected.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedAlerts.slice(0, 20).map((alert, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${severityColor(alert.severity)}40`,
                  background: "rgba(255,255,255,.03)",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {alert.deviceName || "Unknown Device"}
                </div>

                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {alert.message || "No message provided"}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: severityColor(alert.severity),
                    fontWeight: 700,
                  }}
                >
                  {String(alert.severity || "low").toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= AUDIT ANOMALIES ================= */}
      <div className="postureCard">
        <h3>Audit Anomaly Detection</h3>

        {anomalyDetected ? (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,77,79,.15)",
              border: "1px solid rgba(255,77,79,.4)",
            }}
          >
            ⚠ Suspicious audit events detected in recent activity logs.
          </div>
        ) : (
          <div className="muted">
            No suspicious audit patterns identified.
          </div>
        )}
      </div>

    </div>
  );
}
