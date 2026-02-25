// frontend/src/components/security/SessionMonitor.jsx

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api";

export default function SessionMonitor() {

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH SESSIONS ================= */

  async function fetchSessions() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/sessions", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await res.json();

      if (data?.ok) {
        setSessions(data.sessions || []);
      }

    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ================= ACTIONS ================= */

  async function forceLogoutUser(userId) {
    await fetch(`/api/auth/admin/force-logout/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    fetchSessions();
  }

  async function logoutAll(userId) {
    await fetch(`/api/auth/admin/force-logout/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    fetchSessions();
  }

  /* ================= RENDER ================= */

  return (
    <div style={styles.wrapper}>

      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>Active Sessions</h3>
        {loading && <span style={styles.loading}>Refreshing...</span>}
      </div>

      {sessions.length === 0 && (
        <div style={styles.empty}>No active sessions</div>
      )}

      {sessions.map((s) => (
        <div key={s.jti} style={styles.sessionCard}>

          <div style={styles.topRow}>
            <span style={styles.userId}>{s.userId}</span>

            {["Admin", "Finance"].includes(s.role) && (
              <span style={styles.highPrivilege}>HIGH PRIVILEGE</span>
            )}
          </div>

          <div style={styles.meta}>
            <div><strong>Role:</strong> {s.role}</div>
            <div><strong>Company:</strong> {s.companyId || "—"}</div>
            <div><strong>Last Active:</strong> {new Date(s.lastSeen).toLocaleString()}</div>
            <div><strong>Device:</strong> {s.deviceSummary || "Unknown Device"}</div>
          </div>

          <div style={styles.actions}>
            <button
              style={styles.dangerBtn}
              onClick={() => forceLogoutUser(s.userId)}
            >
              Force Logout
            </button>
          </div>

        </div>
      ))}

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  wrapper: {
    background: "#111827",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 0 25px rgba(0,0,0,0.45)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    color: "#e5e7eb"
  },

  loading: {
    fontSize: 12,
    color: "#9ca3af"
  },

  empty: {
    color: "#6b7280",
    fontStyle: "italic"
  },

  sessionCard: {
    background: "#1f2937",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },

  userId: {
    fontWeight: 600,
    color: "#f9fafb"
  },

  highPrivilege: {
    backgroundColor: "#7f1d1d",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: 11
  },

  meta: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 12,
    display: "grid",
    gap: 4
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end"
  },

  dangerBtn: {
    backgroundColor: "#dc2626",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer",
    fontSize: 12
  }
};
