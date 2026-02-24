import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function SOC() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.securityEvents(100);
      setEvents(res?.events || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // auto refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: 28 }}>Loading SOC feed…</div>;

  return (
    <div style={{ padding: 28 }}>
      <h2>Security Operations Center</h2>

      <div style={feed}>
        {events.length === 0 && (
          <div style={{ opacity: 0.5 }}>No security events detected.</div>
        )}

        {events.map((e, i) => (
          <div key={i} style={{
            ...eventCard,
            borderLeft: `4px solid ${severityColor(e.severity)}`
          }}>
            <div style={{ fontWeight: 600 }}>
              {e.title || "Security Event"}
            </div>

            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {new Date(e.timestamp || Date.now()).toLocaleString()}
            </div>

            <div style={{ marginTop: 6 }}>
              Severity:{" "}
              <span style={{ color: severityColor(e.severity) }}>
                {e.severity || "low"}
              </span>
            </div>

            {e.description && (
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {e.description}
              </div>
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

const feed = {
  marginTop: 24,
  display: "flex",
  flexDirection: "column",
  gap: 14
};

const eventCard = {
  padding: 16,
  borderRadius: 10,
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.06)"
};
