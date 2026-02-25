// frontend/src/pages/SessionMonitor.jsx
// Enterprise Session Command Center
// JTI Revocation • Token Version Control • Admin Force Logout

import React, { useEffect, useState, useCallback } from "react";
import { getToken } from "../lib/api.js";

export default function SessionMonitor() {
  const [sessions, setSessions] = useState([]);
  const [currentJti, setCurrentJti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base}/api/security/sessions`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (!res.ok) throw new Error("Failed to load sessions");

      const data = await res.json();

      setSessions(data.sessions || []);
      setCurrentJti(data.currentJti || null);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 20000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  async function revokeSession(jti) {
    await fetch(`${base}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ jti })
    });

    fetchSessions();
  }

  async function revokeAll() {
    await fetch(`${base}/api/auth/logout-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    fetchSessions();
  }

  async function adminForceLogout(userId) {
    await fetch(`${base}/api/auth/admin/force-logout/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    fetchSessions();
  }

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 25 }}>
      <div className="sectionTitle">Session Monitor</div>

      {error && (
        <div className="dashboard-warning">
          {error}
        </div>
      )}

      <div className="postureCard">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Active Sessions</h3>
          <button className="btn warn" onClick={revokeAll}>
            Revoke All Sessions
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 20 }} className="muted">
            No active sessions.
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {sessions.map((s) => {
              const isCurrent = s.jti === currentJti;

              return (
                <div
                  key={s.jti}
                  style={{
                    padding: 14,
                    marginBottom: 12,
                    borderRadius: 10,
                    border: isCurrent
                      ? "1px solid rgba(80,200,120,.6)"
                      : "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.03)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {isCurrent ? "🟢 Current Session" : "Session"}
                    </div>
                    <small style={{ opacity: 0.6 }}>
                      JTI: {s.jti}
                    </small>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Created: {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    {!isCurrent && (
                      <button
                        className="btn"
                        onClick={() => revokeSession(s.jti)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="postureCard">
        <h3>Admin Force Logout</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            id="forceUserId"
            placeholder="Enter User ID"
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,.2)",
              background: "rgba(0,0,0,.3)",
              color: "#fff"
            }}
          />
          <button
            className="btn warn"
            onClick={() => {
              const id = document.getElementById("forceUserId").value;
              if (id) adminForceLogout(id);
            }}
          >
            Force Logout User
          </button>
        </div>
      </div>
    </div>
  );
}
