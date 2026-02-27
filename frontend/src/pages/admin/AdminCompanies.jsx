import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useSecurity } from "../../context/SecurityContext.jsx";

/* =========================================================
   Admin Companies — Executive Risk Heatmap v2
   Multi-Tenant Risk Dominance Layer
========================================================= */

function riskColor(score = 0) {
  const n = Number(score) || 0;
  if (n >= 75) return "#ff3b30";
  if (n >= 50) return "#ff9500";
  if (n >= 25) return "#f5b400";
  return "#16c784";
}

function riskLabel(score = 0) {
  const n = Number(score) || 0;
  if (n >= 75) return "CRITICAL";
  if (n >= 50) return "ELEVATED";
  if (n >= 25) return "MODERATE";
  return "LOW";
}

export default function AdminCompanies() {
  const { riskByCompany, exposureByCompany } = useSecurity();

  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD COMPANIES
  ========================================================= */

  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");

      const res = await api.adminCompanies();
      setCompanies(res?.companies || []);
    } catch (e) {
      setError(e?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  /* =========================================================
     CREATE COMPANY
  ========================================================= */

  async function createCompany(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);

      await api.adminCreateCompany({
        name: name.trim(),
      });

      setName("");
      await loadCompanies();
    } catch (e) {
      alert(e?.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  }

  /* =========================================================
     RISK RANKING (LIVE FROM WEBSOCKET CONTEXT)
  ========================================================= */

  const rankedCompanies = useMemo(() => {
    return [...companies]
      .map((c) => {
        const riskData = riskByCompany?.[String(c.id)];
        const exposureData = exposureByCompany?.[String(c.id)];

        return {
          ...c,
          riskScore: Number(riskData?.riskScore || 0),
          exposureCount: Object.keys(exposureData?.exposure || {}).length,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [companies, riskByCompany, exposureByCompany]);

  /* =========================================================
     RENDER
  ========================================================= */

  if (loading) return <div className="card">Loading companies…</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="page">
      <h2>Executive · Company Risk Heatmap</h2>

      {/* ================= CREATE ================= */}
      <div className="card">
        <form onSubmit={createCompany} className="row">
          <input
            placeholder="New company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      </div>

      {/* ================= HEATMAP GRID ================= */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 18,
        }}
      >
        {rankedCompanies.map((c) => {
          const color = riskColor(c.riskScore);
          const label = riskLabel(c.riskScore);

          return (
            <div
              key={c.id}
              style={{
                padding: 20,
                borderRadius: 14,
                background: "rgba(255,255,255,.05)",
                border: `2px solid ${color}`,
                transition: "all .25s ease",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {c.name}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Members: {c.members?.length || 0}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  Risk Score
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color,
                  }}
                >
                  {c.riskScore}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: color,
                    color: "#000",
                    fontWeight: 700,
                    fontSize: 12,
                    display: "inline-block",
                  }}
                >
                  {label}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  Asset Exposure Signals
                </div>

                <div style={{ fontWeight: 600 }}>
                  {c.exposureCount}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6 }}>
                Tier: {c.tier || "Standard"} <br />
                Status: {c.status || "Active"}
              </div>
            </div>
          );
        })}

        {rankedCompanies.length === 0 && (
          <div className="muted">
            No companies created yet.
          </div>
        )}
      </div>
    </div>
  );
}
