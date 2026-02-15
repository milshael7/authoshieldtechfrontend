import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ================= PAGE ================= */

export default function Response() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.incidents().catch(() => ({}));
      setIncidents(safeArray(data?.incidents));
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(
    () => incidents.filter((i) => i?.status !== "resolved").length,
    [incidents]
  );

  /* ================= UI ================= */

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Incident Response Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Real-time response and containment operations
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Active Incidents
          </div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {activeCount}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Total Incidents
          </div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {incidents.length}
          </div>
        </div>
      </div>

      {/* INCIDENT LIST */}
      <div className="card">
        <h3>Current Incident Log</h3>

        {loading ? (
          <div>Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div style={{ opacity: 0.6 }}>
            No incidents detected.
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {incidents.map((incident, index) => (
              <div
                key={incident?.id || index}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>
                    {safeStr(incident?.title, "Security Incident")}
                  </strong>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {safeStr(incident?.description, "No details provided")}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background:
                      incident?.status === "resolved"
                        ? "rgba(43,213,118,.18)"
                        : "rgba(255,90,95,.18)",
                  }}
                >
                  {safeStr(incident?.status, "unknown")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="card">
        <h3>Response Actions</h3>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button className="btn">Initiate Containment</button>
          <button className="btn">Run Threat Scan</button>
          <button className="btn">Export Incident Report</button>
          <button className="btn">Escalate to Executive</button>
        </div>
      </div>
    </div>
  );
}
