// frontend/src/pages/CompanySeatDashboard.jsx
// Company Seat — Personal Zero Trust Security View

import React, { useEffect, useState } from "react";
import { useSecurity } from "../context/SecurityContext";
import { useUser } from "../context/UserContext";
import { getToken } from "../lib/api";

export default function CompanySeatDashboard() {

  const { user } = useUser() || {};
  const { riskScore } = useSecurity();

  const [sessions, setSessions] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH PERSONAL SESSIONS ================= */

  async function fetchSessions() {
    try {
      const res = await fetch("/api/auth/my-sessions", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await res.json();
      if (data?.ok) setSessions(data.sessions || []);
    } catch (err) {
      console.error("Session load failed", err);
    }
  }

  /* ================= FETCH PERSONAL AUDIT ================= */

  async function fetchAudit() {
    try {
      setLoading(true);

      const res = await fetch("/api/security/my-audit", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await res.json();
      if (data?.ok) setAudit(data.events || []);

    } catch (err) {
      console.error("Audit load failed", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
    fetchAudit();
  }, []);

  /* ================= LOGOUT THIS SESSION ================= */

  async function logoutCurrent() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    window.location.reload();
  }

  /* ================= RENDER ================= */

  return (
    <div style={styles.wrapper}>

      <h2 style={styles.title}>Personal Security Panel</h2>

      {/* ================= PERSONAL STATUS ================= */}

      <div style={styles.card}>
        <h3>Account Status</h3>
        <div><strong>Email:</strong> {user?.email}</div>
        <div><strong>Role:</strong> {user?.role}</div>
        <div><strong>Company:</strong> {user?.companyId || "—"}</div>
        <div>
          <strong>Subscription:</strong>{" "}
          {user?.subscriptionStatus || "Unknown"}
        </div>
      </div>

      {/* ================= PERSONAL RISK ================= */}

      <div style={styles.card}>
        <h3>Personal Risk Score</h3>
        <div style={styles.riskBox}>
          <span style={styles.riskNumber}>{riskScore}</span>
          <span style={styles.outOf}>/100</span>
        </div>
      </div>

      {/* ================= ACTIVE SESSIONS ================= */}

      <div style={styles.card}>
        <h3>Your Active Sessions</h3>

        {sessions.length === 0 && (
          <div style={styles.muted}>No active sessions</div>
        )}

        {sessions.map((s) => (
          <div key={s.jti} style={styles.sessionRow}>
            <div>
              <div><strong>Device:</strong> {s.deviceSummary || "Unknown"}</div>
              <div><strong>Last Active:</strong> {new Date(s.lastSeen).toLocaleString()}</div>
            </div>

            <button style={styles.logoutBtn} onClick={logoutCurrent}>
              Logout
            </button>
          </div>
        ))}
      </div>

      {/* ================= PERSONAL AUDIT ================= */}

      <div style={styles.card}>
        <h3>Recent Account Activity</h3>

        {loading && <div style={styles.muted}>Loading...</div>}

        {audit.length === 0 && (
          <div style={styles.muted}>No recent activity</div>
        )}

        {audit.map((event) => (
          <div key={event.id} style={styles.auditRow}>
            <span style={styles.auditTime}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span>{event.action}</span>
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

  riskBox: {
    display: "flex",
    alignItems: "baseline",
    gap: 4
  },

  riskNumber: {
    fontSize: 32,
    fontWeight: 700
  },

  outOf: {
    fontSize: 14,
    opacity: 0.6
  },

  sessionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },

  logoutBtn: {
    background: "#dc2626",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer"
  },

  auditRow: {
    display: "flex",
    gap: 12,
    fontSize: 13,
    marginBottom: 6
  },

  auditTime: {
    color: "#94a3b8",
    width: 60
  }
};
