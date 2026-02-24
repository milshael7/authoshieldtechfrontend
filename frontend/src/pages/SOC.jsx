import React, { useEffect, useState } from "react";
import { api, getToken } from "../lib/api";

export default function SOC() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await api.securityEvents(100);
        setEvents(res?.events || []);
      } catch {}
      setLoading(false);
    }

    loadInitial();

    const token = getToken();
    const ws = new WebSocket(
      `${import.meta.env.VITE_API_BASE.replace("http", "ws")}/ws/market?token=${token}`
    );

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === "security_event") {
          setEvents((prev) => [data.event, ...prev]);
        }
      } catch {}
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  async function acknowledge(event) {
    await api.req(`/api/security/events/${event.id}/ack`, {
      method: "PATCH",
    });

    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, acknowledged: true } : e
      )
    );
  }

  if (loading) return <div style={{ padding: 28 }}>Loading SOC…</div>;

  return (
    <div style={{ padding: 28 }}>
      <h2>Security Operations Center</h2>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {events.map((e) => (
          <div
            key={e.id}
            style={{
              padding: 16,
              borderRadius: 10,
              background: "rgba(255,255,255,.05)",
              borderLeft: `4px solid ${severityColor(e.severity)}`,
              opacity: e.acknowledged ? 0.6 : 1,
            }}
          >
            <div style={{ fontWeight: 600 }}>{e.title}</div>

            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {new Date(e.timestamp || Date.now()).toLocaleString()}
            </div>

            <div style={{ marginTop: 6 }}>
              Severity:{" "}
              <span style={{ color: severityColor(e.severity) }}>
                {e.severity}
              </span>
            </div>

            {!e.acknowledged && (
              <button
                style={{
                  marginTop: 10,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#4f8cff",
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => acknowledge(e)}
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function severityColor(level) {
  if (level === "critical") return "#ff3b30";
  if (level === "high") return "#ff9500";
  if (level === "medium") return "#f5b400";
  return "#16c784";
}
