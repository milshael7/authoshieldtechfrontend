// frontend/src/pages/Dashboard.jsx
// ENTERPRISE ADMIN COMMAND CENTER — PLATFORM MODE

import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {

  const [loading, setLoading] = useState(true);

  const [health, setHealth] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [protectedTenants, setProtectedTenants] = useState([]);
  const [defenseMode, setDefenseMode] = useState("auto");

  const [events, setEvents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadAll() {
    try {
      const [
        healthRes,
        tenantsRes,
        scopeRes,
        eventsRes
      ] = await Promise.all([
        api.adminPlatformHealth(),
        api.adminTenants(),
        api.adminProtectionScope(),
        api.securityEvents(20)
      ]);

      setHealth(healthRes?.health || null);
      setTenants(tenantsRes?.tenants || []);
      setProtectedTenants(scopeRes?.protectedTenants || []);
      setDefenseMode(scopeRes?.defenseMode || "auto");
      setEvents(eventsRes?.events || []);
      setLastUpdated(new Date());

    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function toggleDefense() {
    const newMode = defenseMode === "auto" ? "manual" : "auto";
    await api.adminSetDefenseMode(newMode);
    setDefenseMode(newMode);
  }

  async function toggleProtection(id) {
    if (protectedTenants.includes(id)) {
      const res = await api.adminUnprotectTenant(id);
      setProtectedTenants(res.protectedTenants);
    } else {
      const res = await api.adminProtectTenant(id);
      setProtectedTenants(res.protectedTenants);
    }
  }

  if (loading) {
    return <div style={{ padding: 30 }}>Initializing Command Center...</div>;
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ================= COMMAND STRIP ================= */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderRadius: 12,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
        fontSize: 13
      }}>
        <div>
          <StatusDot ok />
          SYSTEM: {health?.systemStatus || "Operational"}
        </div>

        <div>
          <StatusDot ok={defenseMode === "auto"} />
          DEFENSE: {defenseMode.toUpperCase()}
        </div>

        <div>
          ACTIVE USERS: {health?.activeUsers || 0}
        </div>

        <div>
          EVENTS: {health?.totalEvents || 0}
        </div>

        <div style={{ opacity: .6 }}>
          {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>

      {/* ================= DEFENSE CONTROL ================= */}
      <div style={panelStyle}>
        <h3>Defense Engine</h3>

        <div style={{ marginTop: 10 }}>
          Mode: <strong>{defenseMode.toUpperCase()}</strong>
        </div>

        <button
          onClick={toggleDefense}
          style={buttonStyle}
        >
          Switch to {defenseMode === "auto" ? "Manual" : "Automatic"}
        </button>

        <p style={{ marginTop: 12, opacity: .6, fontSize: 13 }}>
          {defenseMode === "auto"
            ? "Admin protection actively monitors selected tenants."
            : "Manual mode — mitigation must be triggered manually."}
        </p>
      </div>

      {/* ================= TENANT PROTECTION BOARD ================= */}
      <div style={panelStyle}>
        <h3>Admin Protection Scope</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 12,
          marginTop: 14
        }}>
          {tenants.map(t => (
            <div key={t.id} style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.06)",
              background: "rgba(255,255,255,.02)"
            }}>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 12, opacity: .6 }}>
                Status: {t.status}
              </div>

              <button
                onClick={() => toggleProtection(t.id)}
                style={{
                  ...buttonStyle,
                  marginTop: 10,
                  background: protectedTenants.includes(t.id)
                    ? "#ff3b30"
                    : "#16c784"
                }}
              >
                {protectedTenants.includes(t.id)
                  ? "Remove Protection"
                  : "Add to Protection"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= LIVE EVENT FEED ================= */}
      <div style={panelStyle}>
        <h3>Platform Event Feed</h3>

        <div style={{
          maxHeight: 240,
          overflowY: "auto",
          marginTop: 12
        }}>
          {events.map((e, i) => (
            <div key={i} style={{
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              fontSize: 13,
              color:
                e.severity === "critical" ? "#ff3b30" :
                e.severity === "high" ? "#ff9500" :
                e.severity === "medium" ? "#f5b400" :
                "#16c784"
            }}>
              <strong>{e.severity?.toUpperCase() || "INFO"}</strong>
              <span style={{ marginLeft: 10 }}>
                {e.message || e.description}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatusDot({ ok }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      marginRight: 6,
      background: ok ? "#16c784" : "#ff3b30"
    }} />
  );
}

const panelStyle = {
  padding: 20,
  borderRadius: 12,
  background: "rgba(255,255,255,.03)",
  border: "1px solid rgba(255,255,255,.08)"
};

const buttonStyle = {
  marginTop: 12,
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: "#1f6feb",
  color: "#fff",
  fontSize: 13
};
