import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [error, setError] = useState("");

  /* ======================================================
     LOAD ALL COMPANIES
  ====================================================== */

  async function loadCompanies() {
    setLoadingCompanies(true);
    setError("");

    try {
      const res = await api.adminCompanies();
      setCompanies(res?.companies || []);
    } catch (e) {
      setError(e.message || "Failed to load companies");
    } finally {
      setLoadingCompanies(false);
    }
  }

  /* ======================================================
     LOAD COMPANY OVERVIEW (USING API BASE + TOKEN SAFE)
  ====================================================== */

  async function loadOverview(companyId) {
    setLoadingOverview(true);
    setError("");
    setOverview(null);

    try {
      const res = await api.req(`/api/company/${companyId}/overview`);
      setOverview(res?.overview || null);
    } catch (e) {
      setError(e.message || "Failed to load company overview");
    } finally {
      setLoadingOverview(false);
    }
  }

  /* ======================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    loadCompanies();
  }, []);

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>

      <div>
        <h2 style={{ marginBottom: 6 }}>
          Operational Oversight — Companies
        </h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Executive-level organization monitoring and risk intelligence
        </div>
      </div>

      {error && (
        <div style={{ color: "#ff5a5f" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 28, minHeight: 420 }}>

        {/* ======================================================
            LEFT PANEL — COMPANY LIST
        ====================================================== */}
        <div
          style={{
            width: 320,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 10,
            padding: 16,
            overflowY: "auto",
          }}
        >
          {loadingCompanies && (
            <div style={{ opacity: 0.6 }}>Loading companies…</div>
          )}

          {!loadingCompanies && companies.length === 0 && (
            <div style={{ opacity: 0.6 }}>
              No companies registered.
            </div>
          )}

          {companies.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedId(c.id);
                loadOverview(c.id);
              }}
              style={{
                padding: 14,
                marginBottom: 8,
                cursor: "pointer",
                borderRadius: 8,
                background:
                  selectedId === c.id
                    ? "rgba(94,198,255,0.12)"
                    : "transparent",
                border:
                  selectedId === c.id
                    ? "1px solid rgba(94,198,255,0.4)"
                    : "1px solid rgba(255,255,255,0.04)",
                transition: "all .2s ease",
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {c.name}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Tier: {c.tier || "Standard"}
              </div>
            </div>
          ))}
        </div>

        {/* ======================================================
            RIGHT PANEL — COMPANY OVERVIEW
        ====================================================== */}
        <div style={{ flex: 1 }}>

          {!selectedId && (
            <div style={{ opacity: 0.6 }}>
              Select a company to view operational intelligence.
            </div>
          )}

          {loadingOverview && (
            <div style={{ opacity: 0.6 }}>
              Loading company overview…
            </div>
          )}

          {overview && (
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                padding: 24,
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div>
                <h3 style={{ marginBottom: 4 }}>
                  {overview.company.name}
                </h3>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Company ID: {overview.company.id}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
                <Metric label="Risk Score" value={`${overview.riskScore}%`} />
                <Metric label="Members" value={overview.memberCount} />
                <Metric label="Incidents" value={overview.incidentCount} />
                <Metric
                  label="Autoprotek"
                  value={overview.autoprotekEnabled ? "Enabled" : "Disabled"}
                />
              </div>

              <div>
                <h4 style={{ marginBottom: 8 }}>Vulnerabilities</h4>

                <div style={{ display: "flex", gap: 20 }}>
                  <Vuln severity="Critical" value={overview.vulnerabilityCounts.critical} />
                  <Vuln severity="High" value={overview.vulnerabilityCounts.high} />
                  <Vuln severity="Medium" value={overview.vulnerabilityCounts.medium} />
                  <Vuln severity="Low" value={overview.vulnerabilityCounts.low} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function Metric({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        padding: 16,
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function Vuln({ severity, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        {severity}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}
