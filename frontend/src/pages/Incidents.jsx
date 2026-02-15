import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function statusColor(status) {
  switch (status?.toLowerCase()) {
    case "critical":
      return "rgba(255,0,0,.25)";
    case "active":
      return "rgba(255,90,0,.25)";
    case "investigating":
      return "rgba(255,200,0,.25)";
    case "resolved":
      return "rgba(43,213,118,.18)";
    default:
      return "rgba(255,255,255,.08)";
  }
}

function groupByStatus(incidents = []) {
  const map = {
    critical: 0,
    active: 0,
    investigating: 0,
    resolved: 0,
  };

  incidents.forEach(i => {
    const s = i?.status?.toLowerCase();
    if (map[s] !== undefined) map[s]++;
  });

  return map;
}

/* ================= PAGE ================= */

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.incidents().catch(() => ({}));
      setIncidents(safeArray(data?.incidents));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => groupByStatus(incidents),
    [incidents]
  );

  const total = incidents.length;

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Incident Response Command Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Detection, containment & remediation lifecycle
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 18
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Incidents</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{total}</div>
        </div>

        {Object.entries(stats).map(([level, count]) => (
          <div key={level} className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {level.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24
        }}
      >

        {/* ================= INCIDENT TABLE ================= */}
        <div className="card">
          <h3>Active Incident Stream</h3>

          {loading ? (
            <div>Loading incident stream...</div>
          ) : total === 0 ? (
            <div style={{ opacity: 0.6 }}>
              No active incidents detected.
            </div>
          ) : (
            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.6 }}>
                    <th>Title</th>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i, index) => (
                    <tr
                      key={i?.id || index}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,.08)"
                      }}
                    >
                      <td style={{ padding: "10px 0" }}>
                        {i?.title || "—"}
                      </td>
                      <td>{i?.asset || "—"}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            background: statusColor(i?.status)
                          }}
                        >
                          {i?.status || "open"}
                        </span>
                      </td>
                      <td>{i?.severity || "unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= RESPONSE PANEL ================= */}
        <div className="card">
          <h3>Response Playbook</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <strong>Containment</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Isolate affected endpoints and revoke compromised credentials.
              </div>
            </div>

            <div>
              <strong>Eradication</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Patch vulnerabilities and remove malicious artifacts.
              </div>
            </div>

            <div>
              <strong>Recovery</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Restore services and validate system integrity.
              </div>
            </div>

            <button className="btn" onClick={load}>
              Refresh Incident Stream
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
