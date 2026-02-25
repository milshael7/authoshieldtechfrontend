// frontend/src/components/security/AuditStream.jsx

import React, { useEffect, useRef, useState } from "react";
import { getToken } from "../../lib/api";

function getColor(action) {
  if (!action) return "#94a3b8";

  if (action.includes("INTEGRITY")) return "#ff4d4f";
  if (action.includes("DEVICE")) return "#fa8c16";
  if (action.includes("ROLE")) return "#faad14";
  if (action.includes("TOKEN")) return "#fa541c";
  if (action.includes("HIGH_PRIVILEGE")) return "#722ed1";

  return "#52c41a";
}

export default function AuditStream() {

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  async function fetchAudit() {
    try {
      setLoading(true);

      const res = await fetch("/api/security/audit-stream", {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const data = await res.json();

      if (data?.ok) {
        setEvents((data.events || []).slice(0, 200));
      }

    } catch (e) {
      console.error("Audit fetch failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div style={styles.wrapper}>

      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>SOC Audit Console</h3>
        {loading && <span style={styles.loading}>Syncing...</span>}
      </div>

      <div style={styles.console}>

        {events.length === 0 && (
          <div style={styles.empty}>
            No audit activity
          </div>
        )}

        {events.map((event) => (
          <div key={event.id} style={styles.logLine}>

            <span style={styles.timestamp}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>

            <span
              style={{
                ...styles.action,
                color: getColor(event.action)
              }}
            >
              {event.action}
            </span>

            <span style={styles.actor}>
              {event.actor}
            </span>

            {event.detail?.path && (
              <span style={styles.detail}>
                → {event.detail.path}
              </span>
            )}

          </div>
        ))}

        <div ref={bottomRef} />

      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  wrapper: {
    background: "#0b1220",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 0 30px rgba(0,0,0,0.6)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    color: "#e5e7eb"
  },

  loading: {
    fontSize: 12,
    color: "#9ca3af"
  },

  console: {
    background: "#000000",
    borderRadius: 8,
    padding: 14,
    height: 300,
    overflowY: "auto",
    fontFamily: "monospace",
    fontSize: 12
  },

  empty: {
    color: "#6b7280"
  },

  logLine: {
    display: "flex",
    gap: 10,
    marginBottom: 6,
    alignItems: "center"
  },

  timestamp: {
    color: "#6b7280",
    width: 70
  },

  action: {
    fontWeight: 600,
    minWidth: 180
  },

  actor: {
    color: "#e5e7eb"
  },

  detail: {
    color: "#94a3b8"
  }
};
