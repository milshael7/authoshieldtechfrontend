import React, { useState } from "react";
import IncidentModal from "./IncidentModal";

const SAMPLE_INCIDENTS = [
  {
    id: 1,
    title: "Suspicious Login Attempt",
    severity: "medium",
    status: "open",
    description:
      "Multiple failed login attempts detected from unusual IP range.",
  },
  {
    id: 2,
    title: "Malware Detected on Endpoint",
    severity: "high",
    status: "investigating",
    description:
      "Endpoint flagged by EDR engine with potential trojan behavior.",
  },
  {
    id: 3,
    title: "Phishing Email Clicked",
    severity: "low",
    status: "resolved",
    description:
      "User interacted with known phishing domain. Credentials reset.",
  },
];

export default function IncidentBoard() {
  const [incidents] = useState(SAMPLE_INCIDENTS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = incidents.filter((i) =>
    filter === "all" ? true : i.severity === filter
  );

  return (
    <div className="card">
      <div style={header}>
        <div>
          <b>Incident Board</b>
          <div className="muted" style={{ fontSize: 12 }}>
            Active security investigations
          </div>
        </div>

        <div style={filters}>
          {["all", "high", "medium", "low"].map((f) => (
            <button
              key={f}
              style={filterBtn(filter === f)}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={list}>
        {filtered.map((incident) => (
          <div
            key={incident.id}
            style={card(incident.severity)}
            onClick={() => setSelected(incident)}
          >
            <div style={rowTop}>
              <b>{incident.title}</b>
              <span style={severityBadge(incident.severity)}>
                {incident.severity}
              </span>
            </div>

            <div style={meta}>
              Status: {incident.status}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="muted">No incidents for this filter.</div>
        )}
      </div>

      <IncidentModal
        incident={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

/* ================= STYLES ================= */

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const filters = {
  display: "flex",
  gap: 6,
};

const filterBtn = (active) => ({
  padding: "4px 10px",
  fontSize: 12,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  background: active ? "rgba(122,167,255,0.25)" : "transparent",
  color: "#fff",
  cursor: "pointer",
});

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const card = (severity) => ({
  padding: 14,
  borderRadius: 14,
  background: "rgba(0,0,0,0.35)",
  border:
    severity === "high"
      ? "1px solid #ff5a5f"
      : severity === "medium"
      ? "1px solid #ffd166"
      : "1px solid #2bd576",
  cursor: "pointer",
});

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const meta = {
  marginTop: 6,
  fontSize: 12,
  opacity: 0.7,
};

function severityBadge(sev) {
  return {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 999,
    background:
      sev === "high"
        ? "#ff5a5f"
        : sev === "medium"
        ? "#ffd166"
        : "#2bd576",
    color: "#000",
    fontWeight: 700,
  };
}
