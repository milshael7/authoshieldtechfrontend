// frontend/src/pages/FrontpageBuyerSecurityView.jsx
// Public Buyer Security Intelligence Layer
// Pre-Account Risk Assessment • Fraud Detection Preview

import React, { useEffect, useState } from "react";

export default function FrontpageBuyerSecurityView() {

  const [deviceRisk, setDeviceRisk] = useState(0);
  const [riskLevel, setRiskLevel] = useState("Low");
  const [loading, setLoading] = useState(true);

  /* ================= DEVICE FINGERPRINT SIGNAL ================= */

  function collectBasicSignals() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${window.screen.width}x${window.screen.height}`,
      memory: navigator.deviceMemory || null,
      cores: navigator.hardwareConcurrency || null
    };
  }

  /* ================= FETCH PUBLIC RISK SCORE ================= */

  async function fetchRiskScore() {
    try {
      const signals = collectBasicSignals();

      const res = await fetch("/api/security/public-device-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(signals)
      });

      const data = await res.json();

      if (data?.ok) {
        setDeviceRisk(data.riskScore || 0);
        setRiskLevel(data.level || "Low");
      }

    } catch (err) {
      console.error("Public risk fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRiskScore();
  }, []);

  function riskColor(level) {
    if (level === "High") return "#ff4d4f";
    if (level === "Medium") return "#faad14";
    return "#52c41a";
  }

  return (
    <div style={styles.wrapper}>

      <div style={styles.card}>

        <h2 style={styles.title}>
          Real-Time Device Security Check
        </h2>

        {loading && (
          <div style={styles.loading}>
            Analyzing device integrity...
          </div>
        )}

        {!loading && (
          <>
            <div style={styles.scoreBox}>
              <span style={styles.score}>
                {deviceRisk}
              </span>
              <span style={styles.outOf}>/100</span>
            </div>

            <div
              style={{
                ...styles.badge,
                backgroundColor: riskColor(riskLevel)
              }}
            >
              Risk Level: {riskLevel}
            </div>

            <p style={styles.description}>
              We automatically evaluate your device security posture
              before account creation to prevent fraud and abuse.
            </p>
          </>
        )}

      </div>

      <div style={styles.trustBox}>
        <strong>Why this matters:</strong>
        <ul>
          <li>Prevents automated bot signups</li>
          <li>Stops checkout fraud</li>
          <li>Detects suspicious device behavior</li>
          <li>Protects platform integrity</li>
        </ul>
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  wrapper: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    color: "#f1f5f9"
  },

  card: {
    background: "#111827",
    padding: 30,
    borderRadius: 14,
    width: 420,
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.6)"
  },

  title: {
    marginBottom: 20
  },

  loading: {
    opacity: 0.7,
    fontStyle: "italic"
  },

  scoreBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 15
  },

  score: {
    fontSize: 48,
    fontWeight: 700
  },

  outOf: {
    fontSize: 16,
    opacity: 0.6
  },

  badge: {
    padding: "8px 18px",
    borderRadius: 20,
    fontWeight: 600,
    marginBottom: 15
  },

  description: {
    fontSize: 13,
    opacity: 0.7
  },

  trustBox: {
    marginTop: 30,
    fontSize: 14,
    opacity: 0.85,
    maxWidth: 480
  }
};
