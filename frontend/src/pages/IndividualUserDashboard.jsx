// frontend/src/pages/IndividualUserDashboard.jsx
// Individual User — Personal Security Dashboard

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useSecurity } from "../context/SecurityContext";
import { getToken } from "../lib/api";

export default function IndividualUserDashboard() {

  const { user } = useUser() || {};
  const { riskScore } = useSecurity();

  const [recentLogins, setRecentLogins] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState("trusted");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH LOGIN HISTORY ================= */

  async function fetchLoginHistory() {
    try {
      setLoading(true);

      const res = await fetch("/api/security/my-logins", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await res.json();

      if (data?.ok) {
        setRecentLogins(data.logins || []);
      }

    } catch (err) {
      console.error("Login history fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= FETCH DEVICE STATUS ================= */

  async function fetchDeviceStatus() {
    try {
      const res = await fetch("/api/security/my-device-status", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await res.json();

      if (data?.ok) {
        setDeviceStatus(data.status || "trusted");
      }

    } catch (err) {
      console.error("Device status fetch failed", err);
    }
  }

  useEffect(() => {
    fetchLoginHistory();
    fetchDeviceStatus();
  }, []);

  function getDeviceColor(status) {
    if (status === "compromised") return "#ff4d4f";
    if (status === "warning") return "#faad14";
    return "#52c41a";
  }

  return (
    <div style={styles.wrapper}>

      <h2 style={styles.title}>Your Security Dashboard</h2>

      {/* ================= ACCOUNT INFO ================= */}

      <div style={styles.card}>
        <h3>Account Overview</h3>
        <div><strong>Email:</strong> {user?.email}</div>
        <div><strong>Role:</strong> {user?.role}</div>
        <div><strong>Subscription:</strong> {user?.subscriptionStatus}</div>
      </div>

      {/* ================= SECURITY SCORE ================= */}

      <div style={styles.card}>
        <h3>Security Health Score</h3>

        <div style={styles.scoreBox}>
          <span style={styles.score}>{riskScore}</span>
          <span style={styles.outOf}>/100</span>
        </div>

        <div style={styles.scoreHint}>
          Lower risk = healthier account security.
        </div>
      </div>

      {/* ================= DEVICE STATUS ================= */}

      <div style={styles.card}>
        <h3>Device Trust Status</h3>

        <div
          style={{
            ...styles.deviceBadge,
            backgroundColor: getDeviceColor(deviceStatus)
          }}
        >
          {deviceStatus.toUpperCase()}
        </div>
      </div>

      {/* ================= RECENT LOGINS ================= */}

      <div style={styles.card}>
        <h3>Recent Login Activity</h3>

        {loading && <div style={styles.muted}>Loading...</div>}

        {recentLogins.length === 0 && (
          <div style={styles.muted}>No recent login records</div>
        )}

        {recentLogins.map((login) => (
          <div key={login.id} style={styles.loginRow}>
            <span style={styles.time}>
              {new Date(login.timestamp).toLocaleString()}
            </span>
            <span>{login.deviceSummary}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  wrapper: {
    padding: 28,
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f1f5f9"
  },

  title: {
    marginBottom: 24
  },

  card: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 0 20px rgba(0,0,0,0.4)"
  },

  muted: {
    color: "#6b7280",
    fontStyle: "italic"
  },

  scoreBox: {
    display: "flex",
    alignItems: "baseline",
    gap: 4
  },

  score: {
    fontSize: 36,
    fontWeight: 700
  },

  outOf: {
    fontSize: 14,
    opacity: 0.6
  },

  scoreHint: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7
  },

  deviceBadge: {
    padding: "8px 16px",
    borderRadius: 20,
    fontWeight: 600,
    display: "inline-block"
  },

  loginRow: {
    display: "flex",
    gap: 12,
    fontSize: 13,
    marginBottom: 6
  },

  time: {
    color: "#94a3b8",
    width: 180
  }
};
