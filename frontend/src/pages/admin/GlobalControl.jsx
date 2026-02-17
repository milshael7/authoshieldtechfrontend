// frontend/src/pages/admin/GlobalControl.jsx
// ADMIN GLOBAL CONTROL CENTER — SUPREME AUTHORITY BUILD
// Full override power
// Suspend / Reactivate
// Clean enterprise tabs
// No nested routes

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

/* ========================================================= */

export default function GlobalControl() {
  const [view, setView] = useState("managers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [smallCompanies, setSmallCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [
        mgr,
        comp,
        small,
        usr
      ] = await Promise.all([
        api.managerUsers?.().catch(() => []),
        api.adminCompanies?.().catch(() => []),
        api.adminSmallCompanies?.().catch(() => []),
        api.adminUsers?.().catch(() => [])
      ]);

      setManagers(Array.isArray(mgr) ? mgr : []);
      setCompanies(Array.isArray(comp) ? comp : []);
      setSmallCompanies(Array.isArray(small) ? small : []);
      setUsers(Array.isArray(usr) ? usr : []);
    } catch (e) {
      setError(e.message || "Failed loading global data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function suspend(entityType, id) {
    console.log("Suspend:", entityType, id);
    alert(`Suspend ${entityType} ${id} (API hook pending)`);
  }

  function activate(entityType, id) {
    console.log("Activate:", entityType, id);
    alert(`Activate ${entityType} ${id} (API hook pending)`);
  }

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <h2 style={{ margin: 0 }}>Global Control Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Full administrative override authority
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Tab label="Managers" active={view === "managers"} onClick={() => setView("managers")} />
        <Tab label="Companies" active={view === "companies"} onClick={() => setView("companies")} />
        <Tab label="Small Companies" active={view === "small"} onClick={() => setView("small")} />
        <Tab label="Users" active={view === "users"} onClick={() => setView("users")} />
      </div>

      {loading && <div>Loading global data…</div>}
      {error && <div style={{ color: "#ff5a5f" }}>{error}</div>}

      {/* ACTIVE VIEW */}
      {view === "managers" && (
        <EntityTable
          title="Managers"
          data={managers}
          type="manager"
          suspend={suspend}
          activate={activate}
        />
      )}

      {view === "companies" && (
        <EntityTable
          title="Companies"
          data={companies}
          type="company"
          suspend={suspend}
          activate={activate}
        />
      )}

      {view === "small" && (
        <EntityTable
          title="Small Companies"
          data={smallCompanies}
          type="small_company"
          suspend={suspend}
          activate={activate}
        />
      )}

      {view === "users" && (
        <EntityTable
          title="Users"
          data={users}
          type="user"
          suspend={suspend}
          activate={activate}
        />
      )}

      <button className="btn" onClick={loadAll} disabled={loading}>
        {loading ? "Refreshing…" : "Reload Global Data"}
      </button>

    </div>
  );
}

/* ========================================================= */

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        background: active ? "#5EC6FF" : "rgba(255,255,255,.08)",
        color: active ? "#000" : "#fff"
      }}
    >
      {label}
    </button>
  );
}

/* ========================================================= */

function EntityTable({ title, data, type, suspend, activate }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h3>{title} Overview</h3>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {data.length === 0 && (
          <div style={{ opacity: 0.6 }}>No records found</div>
        )}

        {data.map((item, i) => (
          <div
            key={item?.id || i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 14,
              borderRadius: 12,
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)"
            }}
          >
            <div>
              <strong>{item?.name || item?.email || item?.id}</strong>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                ID: {item?.id || "—"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn"
                style={{ background: "#ff5a5f" }}
                onClick={() => suspend(type, item?.id)}
              >
                Suspend
              </button>

              <button
                className="btn"
                style={{ background: "#2bd576" }}
                onClick={() => activate(type, item?.id)}
              >
                Activate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
