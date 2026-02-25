// frontend/src/components/security/DeviceIntegrityPanel.jsx

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api";

function getSeverityColor(severity) {
  if (severity === "critical") return "#ff4d4f";
  if (severity === "high") return "#fa8c16";
  if (severity === "medium") return "#fadb14";
  return "#52c41a";
}

export default function DeviceIntegrityPanel() {

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DEVICE EVENTS ================= */

  async function fetchDeviceEvents() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/security/events?type=device_anomaly",
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      const data = await res.json();

      if (data?.ok) {
        setEvents(data.events || []);
      }

    } catch (err) {
      console.error("Failed to load device events", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeviceEvents();
    const interval = setInterval(fetchDeviceEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  /* ================= RENDER ================= */

  return (
    <div style={styles.wrapper}>

      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>Device Integrity Monitor</h3>
        {loading && <span style={styles.loading}>Refreshing...</span>}
      </div>

      {events.length === 0 && (
        <div style={styles.empty}>
          No recent device anomalies
        </div>
      )}

      {events.map((event) => (
        <div
          key={event.id}
          style={{
            ...styles.eventCard,
            borderLeft: `4px solid ${getSeverityColor(event.severity)}`
          }}
        >
          <div style={styles.topRow}>
            <span style={styles.severity}>
              {event.severity?.toUpperCase() || "INFO"}
            </span>
            <span style={styles.timestamp}>
              {new Date(event.timestamp).toLocaleString()}
            </span>
          </div>

          <div style={styles.message}>
            {event.message}
          </div>

          {event.companyId && (
            <div style={styles.meta}>
              Company: {event.companyId}
            </div>
          )}
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

  eventCard: {
    background: "#1f2937",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    marginBottom: 6
  },

  severity: {
    fontWeight: 600,
    color: "#e5e7eb"
  },

  timestamp: {
    color: "#9ca3af"
  },

  message: {
    fontSize: 13,
    color: "#f1f5f9",
    marginBottom: 6
  },

  meta: {
    fontSize: 11,
    color: "#94a3b8"
  }
};
