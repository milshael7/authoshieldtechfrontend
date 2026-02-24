import React, { useEffect, useRef, useState } from "react";
import { api, getToken } from "../lib/api";

export default function SOC() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await api.securityEvents(100);
        const list = (res?.events || []).sort(
          (a, b) =>
            new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
        setEvents(list);
      } catch {}
      setLoading(false);
    }

    loadInitial();
  }, []);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const wsUrl = `${import.meta.env.VITE_API_BASE.replace(
      /^http/,
      "ws"
    )}/ws/market?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type !== "security_event") return;

        setEvents((prev) => {
          const exists = prev.find((e) => e.id === data.event.id);
          if (exists) return prev;

          const updated = [data.event, ...prev];

          // Limit to 200 events (enterprise safe cap)
          return updated.slice(0, 200);
        });
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, []);

  /* ================= ACKNOWLEDGE ================= */

  async function acknowledge(event) {
    try {
      await api.req(`/api/security/events/${event.id}/ack`, {
        method: "PATCH",
      });

      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, acknowledged: true } : e
        )
      );
    } catch {
      alert("Failed to acknowledge event.");
    }
  }

  if (loading) return <div style={{ padding: 28 }}>Loading SOC…</div>;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Security Operations Center</h2>

        <div
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 20,
            background: connected ? "#16c784" : "#ff3b30",
            color: "#000",
            fontWeight: 600,
          }}
        >
          {connected ? "LIVE" : "DISCONNECTED"}
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {events.length === 0 && (
          <div style={{ opacity: 0.5 }}>
            No security events detected.
          </div>
        )}

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
            <div style={{ fontWeight: 600 }}>
              {e.title || "Security Event"}
            </div>

            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {new Date(
                e.timestamp || e.createdAt || Date.now()
              ).toLocaleString()}
            </div>

            <div style={{ marginTop: 6 }}>
              Severity:{" "}
              <span style={{ color: severityColor(e.severity) }}>
                {e.severity || "low"}
              </span>
            </div>

            {e.description && (
              <div style={{ marginTop: 6 }}>{e.description}</div>
            )}

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
