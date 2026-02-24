import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function SOC() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  async function load() {
    try {
      const res = await api.securityEvents(100);
      setEvents(res?.events || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function acknowledge(event) {
    try {
      setWorkingId(event.id);
      await api.req(`/api/security/events/${event.id}/ack`, {
        method: "PATCH"
      });
      await load();
    } catch {
      alert("Failed to acknowledge event.");
    } finally {
      setWorkingId(null);
    }
  }

  async function escalate(event) {
    try {
      setWorkingId(event.id);

      await api.req("/api/incidents", {
        method: "POST",
        body: {
          title: event.title || "Security Event Escalation",
          description: event.description || "",
          severity: event.severity || "medium",
        },
      });

      alert("Incident created.");
    } catch {
      alert("Failed to create incident.");
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) return <div style={{ padding: 28 }}>Loading SOC feed…</div>;

  return (
    <div style={{ padding: 28 }}>
      <h2>Security Operations Center</h2>

      <div style={feed}>
        {events.length === 0 && (
          <div style={{ opacity: 0.5 }}>No security events detected.</div>
        )}

        {events.map((e, i) => {
          const acknowledged = e.acknowledged;

          return (
            <div
              key={i}
              style={{
                ...eventCard,
                opacity: acknowledged ? 0.6 : 1,
                borderLeft: `4px solid ${severityColor(e.severity)}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600 }}>
                  {e.title || "Security Event"}
                </div>

                {acknowledged && (
                  <span style={badge}>
                    Acknowledged
                  </span>
                )}
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
                <div style={{ marginTop: 6 }}>
                  {e.description}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {!acknowledged && (
                  <button
                    style={ackBtn}
                    disabled={workingId === e.id}
                    onClick={() => acknowledge(e)}
                  >
                    {workingId === e.id
                      ? "Processing..."
                      : "Acknowledge"}
                  </button>
                )}

                <button
                  style={escalateBtn}
                  disabled={workingId === e.id}
                  onClick={() => escalate(e)}
                >
                  {workingId === e.id
                    ? "Processing..."
                    : "Escalate"}
                </button>
              </div>
            </div>
          );
        })}
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

const badge = {
  padding: "4px 8px",
  background: "#16c784",
  borderRadius: 6,
  fontSize: 12,
  color: "#000",
  fontWeight: 600
};

const ackBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#4f8cff",
  color: "#fff",
  cursor: "pointer"
};

const escalateBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#ff3b30",
  color: "#fff",
  cursor: "pointer"
};
