// frontend/src/pages/FrontpageBuyerSecurityView.jsx
// Public Buyer Security Intelligence Layer
// Pre-Account Risk Assessment • Fraud Detection Preview • Trust-Optimized

import React, { useEffect, useState } from "react";

export default function FrontpageBuyerSecurityView() {
  const [deviceRisk, setDeviceRisk] = useState(null);
  const [riskLevel, setRiskLevel] = useState("Low");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  /* ================= BASIC SIGNALS ================= */

  function collectBasicSignals() {
    return {
      ua: navigator.userAgent,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${window.screen.width}x${window.screen.height}`,
    };
  }

  /* ================= FETCH RISK ================= */

  async function fetchRiskScore() {
    try {
      const signals = collectBasicSignals();

      const res = await fetch(`${base}/api/security/public-device-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signals),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      if (data?.ok) {
        setDeviceRisk(Number(data.riskScore || 0));
        setRiskLevel(data.level || "Low");
      } else {
        throw new Error();
      }

    } catch {
      setError(true);
      setDeviceRisk(12); // safe fallback
      setRiskLevel("Low");
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
    return "#22c55e";
  }

  return (
    <div style={styles.wrapper}>

      <div style={styles.card}>

        <h2 style={styles.title}>
          Device Security Check
        </h2>

        {loading && (
          <div style={styles.loading}>
            Performing security validation...
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
              Security Rating: {riskLevel}
            </div>

            <p style={styles.description}>
              We automatically assess device integrity before account
              creation to prevent fraud, abuse, and automated attacks.
            </p>

            {error && (
              <div style={styles.fallback}>
                Secure fallback mode active.
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.trustBox}>
        <strong>How this protects you:</strong>
        <ul>
          <li>Prevents bot and automated abuse</li>
          <li>Reduces fraudulent activity</li>
          <li>Detects suspicious behavior patterns</li>
          <li>Keeps customer data safe</li>
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
    marginBottom: 20,
    fontWeight: 600
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
    opacity: 0.75
  },

  fallback: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.6
  },

  trustBox: {
    marginTop: 30,
    fontSize: 14,
    opacity: 0.85,
    maxWidth: 480
  }
};
