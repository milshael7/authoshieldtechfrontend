import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadCompanies() {
    try {
      const res = await api.adminCompanies();
      setCompanies(res?.companies || []);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadOverview(companyId) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/company/${companyId}/overview`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("as_token")}`,
          },
        }
      );

      const data = await res.json();
      setOverview(data?.overview || null);
    } catch (e) {
      console.error(e.message);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div style={{ padding: 28 }}>

      <h2>Operational Oversight — Companies</h2>

      {loading && <p>Loading companies…</p>}

      <div style={{ display: "flex", gap: 24 }}>

        {/* LEFT: COMPANY LIST */}
        <div style={{ width: 300 }}>
          {companies.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelected(c.id);
                loadOverview(c.id);
              }}
              style={{
                padding: 14,
                cursor: "pointer",
                background:
                  selected === c.id ? "#1f2937" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <b>{c.name}</b>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Tier: {c.tier || "Standard"}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: OVERVIEW PANEL */}
        <div style={{ flex: 1 }}>
          {!overview && (
            <div style={{ opacity: 0.6 }}>
              Select a company to view overview.
            </div>
          )}

          {overview && (
            <div
              style={{
                background: "#111827",
                padding: 24,
                borderRadius: 8,
              }}
            >
              <h3>{overview.company.name}</h3>

              <div style={{ marginTop: 16 }}>
                <b>Risk Score:</b> {overview.riskScore}%
              </div>

              <div style={{ marginTop: 8 }}>
                <b>Members:</b> {overview.memberCount}
              </div>

              <div style={{ marginTop: 8 }}>
                <b>Incidents:</b> {overview.incidentCount}
              </div>

              <div style={{ marginTop: 8 }}>
                <b>Autoprotek:</b>{" "}
                {overview.autoprotekEnabled
                  ? "Enabled"
                  : "Disabled"}
              </div>

              <div style={{ marginTop: 16 }}>
                <h4>Vulnerabilities</h4>
                <div>Critical: {overview.vulnerabilityCounts.critical}</div>
                <div>High: {overview.vulnerabilityCounts.high}</div>
                <div>Medium: {overview.vulnerabilityCounts.medium}</div>
                <div>Low: {overview.vulnerabilityCounts.low}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
