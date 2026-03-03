// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Platform + Operator Stateful Engine (Layer 3)

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { api } from "../../lib/api";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

/* ========================================================= */

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function riskLevel(score) {
  const s = Number(score || 0);
  if (s >= 75) return { label: "CRITICAL", cls: "warn" };
  if (s >= 50) return { label: "ELEVATED", cls: "warn" };
  if (s >= 25) return { label: "MODERATE", cls: "warn" };
  return { label: "STABLE", cls: "ok" };
}

function containmentBadge(status) {
  switch (status) {
    case "LOCKDOWN": return { label: "LOCKDOWN", cls: "warn" };
    case "CONTAINED": return { label: "CONTAINED", cls: "ok" };
    case "MONITORING": return { label: "MONITORING", cls: "warn" };
    default: return { label: "STABLE", cls: "ok" };
  }
}

/* ========================================================= */

export default function AdminOverview() {

  const { riskScore, integrityAlert, auditFeed } = useSecurity();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("platform");
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const [companyState, setCompanyState] = useState({});

  const canvasRef = useRef(null);
  const [riskHistory, setRiskHistory] = useState([]);

  /* ================= LOAD ================= */

  const load = useCallback(async () => {
    const res = await api.adminMetrics().catch(() => null);
    setMetrics(res?.metrics || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ================= MOCK COMPANIES ================= */

  const mockCompanies = [
    { id: "c1", name: "Alpha Systems", risk: 22 },
    { id: "c2", name: "Beta Holdings", risk: 61 },
    { id: "c3", name: "Gamma Logistics", risk: 38 },
    { id: "c4", name: "Delta Finance", risk: 12 }
  ];

  /* ================= INIT STATE ================= */

  useEffect(() => {
    const initial = {};
    mockCompanies.forEach(c => {
      initial[c.id] = {
        containmentStatus: "STABLE",
        isolatedEndpoints: 0,
        lockedAccounts: 0,
        escalated: false,
        activityLog: []
      };
    });
    setCompanyState(initial);
  }, []);

  const selectedCompany = mockCompanies.find(c => c.id === selectedCompanyId);
  const currentState = selectedCompany ? companyState[selectedCompany.id] : null;

  /* ================= ACTION ENGINE ================= */

  const logAction = (companyId, message) => {
    setCompanyState(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        activityLog: [
          { time: new Date(), message },
          ...prev[companyId].activityLog
        ]
      }
    }));
  };

  const updateState = (companyId, updates) => {
    setCompanyState(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        ...updates
      }
    }));
  };

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Center…</div>;
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">
          {mode === "platform"
            ? "Platform Command Center"
            : selectedCompany
              ? `${selectedCompany.name} — Operator Console`
              : "Operator Fleet"}
        </div>

        <select
          value={mode}
          onChange={(e) => {
            setSelectedCompanyId(null);
            setMode(e.target.value);
          }}
        >
          <option value="platform">Platform View</option>
          <option value="operator">Operator View</option>
        </select>
      </div>

      {/* ================= OPERATOR MODE ================= */}

      {mode === "operator" && (
        <>
          {!selectedCompany && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {mockCompanies.map(c => (
                <div
                  key={c.id}
                  className="postureCard"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCompanyId(c.id)}
                >
                  <h4>{c.name}</h4>
                  <div>Risk: {c.risk}</div>
                  <div>Status: {containmentBadge(companyState[c.id]?.containmentStatus).label}</div>
                </div>
              ))}
            </div>
          )}

          {selectedCompany && currentState && (
            <>
              <button className="btn" onClick={() => setSelectedCompanyId(null)}>
                ← Exit Console
              </button>

              {/* Snapshot */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
                <div className="kpiCard"><small>Status</small>
                  <b className={`badge ${containmentBadge(currentState.containmentStatus).cls}`}>
                    {containmentBadge(currentState.containmentStatus).label}
                  </b>
                </div>
                <div className="kpiCard"><small>Isolated</small><b>{currentState.isolatedEndpoints}</b></div>
                <div className="kpiCard"><small>Locked</small><b>{currentState.lockedAccounts}</b></div>
                <div className="kpiCard"><small>Escalated</small><b>{currentState.escalated ? "YES" : "NO"}</b></div>
              </div>

              {/* Actions */}
              <div className="postureCard executivePanel">
                <h3>Operator Actions</h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <button className="btn warn" onClick={() => {
                    updateState(selectedCompany.id, {
                      containmentStatus: "CONTAINED",
                      isolatedEndpoints: currentState.isolatedEndpoints + 1
                    });
                    logAction(selectedCompany.id, "Endpoint isolated");
                  }}>
                    Force Endpoint Isolation
                  </button>

                  <button className="btn warn" onClick={() => {
                    updateState(selectedCompany.id, {
                      lockedAccounts: currentState.lockedAccounts + 1
                    });
                    logAction(selectedCompany.id, "Suspicious account locked");
                  }}>
                    Lock Suspicious Account
                  </button>

                  <button className="btn primary" onClick={() => {
                    updateState(selectedCompany.id, {
                      escalated: true,
                      containmentStatus: "LOCKDOWN"
                    });
                    logAction(selectedCompany.id, "Incident escalated to LOCKDOWN");
                  }}>
                    Escalate Incident
                  </button>

                  <button className="btn" onClick={() => {
                    updateState(selectedCompany.id, {
                      containmentStatus: "MONITORING"
                    });
                    logAction(selectedCompany.id, "Deep scan initiated");
                  }}>
                    Trigger Deep Scan
                  </button>
                </div>
              </div>

              {/* Activity Log */}
              <div className="postureCard">
                <h3>Operator Activity Log</h3>
                {currentState.activityLog.length === 0 && (
                  <div className="muted">No actions performed yet.</div>
                )}
                {currentState.activityLog.map((entry, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <small>{entry.time.toLocaleTimeString()}</small>
                    <div><b>{entry.message}</b></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ================= PLATFORM MODE ================= */}

      {mode === "platform" && (
        <>
          {integrityAlert && (
            <div className="dashboard-warning">
              Integrity Alert Detected — Elevated State
            </div>
          )}

          <ExecutiveRiskBanner />
          <SecurityPostureDashboard />
          <IncidentBoard />
          <SecurityPipeline />
          <SecurityRadar />
          <SecurityFeedPanel />
        </>
      )}

    </div>
  );
}
