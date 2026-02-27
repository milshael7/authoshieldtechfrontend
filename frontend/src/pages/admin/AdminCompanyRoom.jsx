// frontend/src/pages/admin/AdminCompanyRoom.jsx
// Enterprise Company Intelligence Command Room
// Live Risk • Exposure • Incidents • Audit • Integrity

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useSecurity } from "../../context/SecurityContext.jsx";

/* =========================================================
   Helpers
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

/* =========================================================
   Component
========================================================= */

export default function AdminCompanyRoom() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const { riskByCompany, exposureByCompany } = useSecurity();

  const [company, setCompany] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [riskHistory, setRiskHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     Load Company Core Data
  ========================================================= */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [companiesRes, incidentsRes, auditRes] =
          await Promise.allSettled([
            api.adminCompanies(),
            api.securityEvents?.() || Promise.resolve({ events: [] }),
            api.adminAuditPreview?.() || Promise.resolve({ events: [] }),
          ]);

        if (companiesRes.status === "fulfilled") {
          const found =
            companiesRes.value?.companies?.find(
              (c) => String(c.id) === String(companyId)
            ) || null;
          setCompany(found);
        }

        if (incidentsRes.status === "fulfilled") {
          const filtered =
            (incidentsRes.value?.events || []).filter(
              (e) => String(e.companyId) === String(companyId)
            );
          setIncidents(filtered);
        }

        if (auditRes.status === "fulfilled") {
          const filtered =
            (auditRes.value?.events || []).filter(
              (e) => String(e.companyId) === String(companyId)
            );
          setAuditEvents(filtered.slice(0, 20));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [companyId]);

  /* =========================================================
     Live Risk Sync
  ========================================================= */

  const liveRisk =
    riskByCompany?.[String(companyId)]?.riskScore ?? 0;

  useEffect(() => {
    setRiskHistory((prev) => {
      const updated = [...prev, liveRisk];
      if (updated.length > 40) updated.shift();
      return updated;
    });
  }, [liveRisk]);

  /* =========================================================
     Draw Risk Graph
  ========================================================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (riskHistory.length < 2) return;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = riskColor(liveRisk);

    riskHistory.forEach((value, i) => {
      const x =
        (i / (riskHistory.length - 1)) * canvas.width;
      const y =
        canvas.height -
        (Number(value) / 100) * canvas.height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [riskHistory, liveRisk]);

  /* =========================================================
     Exposure
  ========================================================= */

  const exposure =
    exposureByCompany?.[String(companyId)]?.exposure || {};

  const exposureEntries = useMemo(() => {
    return Object.entries(exposure).sort(
      (a, b) => Number(b[1] || 0) - Number(a[1] || 0)
    );
  }, [exposure]);

  if (loading) {
    return <div style={{ padding: 30 }}>Loading Company Intelligence…</div>;
  }

  if (!company) {
    return (
      <div style={{ padding: 30 }}>
        Company not found.
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate("/admin/companies")}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const color = riskColor(liveRisk);
  const label = riskLabel(liveRisk);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 28 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2>{company.name}</h2>
          <div style={{ opacity: 0.6, fontSize: 12 }}>
            Company Intelligence Command Room
          </div>
        </div>

        <button onClick={() => navigate("/admin/companies")}>
          ← Back
        </button>
      </div>

      {/* RISK PANEL */}
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,.04)",
          border: `2px solid ${color}`,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          Live Risk Score
        </div>

        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color,
          }}
        >
          {liveRisk}
        </div>

        <div
          style={{
            marginTop: 8,
            padding: "6px 12px",
            borderRadius: 8,
            background: color,
            color: "#000",
            fontWeight: 700,
            display: "inline-block",
          }}
        >
          {label}
        </div>

        <div style={{ marginTop: 20 }}>
          <canvas
            ref={canvasRef}
            width={900}
            height={180}
            style={{ width: "100%", height: 180 }}
          />
        </div>
      </div>

      {/* EXPOSURE */}
      <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,.04)" }}>
        <h3>Asset Exposure</h3>

        {exposureEntries.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No exposure signals.</div>
        ) : (
          exposureEntries.map(([asset, score]) => (
            <div key={asset} style={{ marginTop: 10 }}>
              {asset} — <b>{Number(score)}</b>
            </div>
          ))
        )}
      </div>

      {/* INCIDENTS */}
      <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,.04)" }}>
        <h3>Recent Incidents</h3>

        {incidents.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No incidents recorded.</div>
        ) : (
          incidents.slice(0, 10).map((i) => (
            <div key={i.id} style={{ marginTop: 10 }}>
              <b>{i.title || "Incident"}</b> — {i.severity}
            </div>
          ))
        )}
      </div>

      {/* AUDIT */}
      <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,.04)" }}>
        <h3>Audit Trail</h3>

        {auditEvents.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No audit activity.</div>
        ) : (
          auditEvents.map((a, i) => (
            <div key={i} style={{ marginTop: 8 }}>
              {new Date(a.ts || a.timestamp || Date.now()).toLocaleString()} —{" "}
              <b>{a.action}</b>
            </div>
          ))
        )}
      </div>

      {/* COMPANY META */}
      <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,.04)" }}>
        <h3>Company Integrity</h3>

        <div>Members: <b>{company.members?.length || 0}</b></div>
        <div>Tier: <b>{company.tier || "Standard"}</b></div>
        <div>Status: <b>{company.status || "Active"}</b></div>
        <div>Created: <b>
          {company.createdAt
            ? new Date(company.createdAt).toLocaleDateString()
            : "—"}
        </b></div>
      </div>
    </div>
  );
}
