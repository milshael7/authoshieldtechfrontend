// frontend/src/pages/admin/GlobalControl.jsx
// ADMIN GLOBAL CONTROL CENTER — PHASE 7
// Tool Governance Integrated
// Enterprise Hardened

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

/* ========================================================= */

export default function GlobalControl() {
  const [view, setView] = useState("managers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  /* ================= TOOL GOVERNANCE ================= */

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyTools, setCompanyTools] = useState([]);
  const [blockedTools, setBlockedTools] = useState([]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [
        mgr,
        comp,
        usr
      ] = await Promise.all([
        api.managerUsers?.().catch(() => []),
        api.adminCompanies?.().catch(() => []),
        api.adminUsers?.().catch(() => [])
      ]);

      setManagers(Array.isArray(mgr) ? mgr : []);
      setCompanies(Array.isArray(comp) ? comp : []);
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

  /* ================= TOOL LOAD ================= */

  async function loadCompanyTools(companyId) {
    try {
      const res = await api.adminCompanyTools(companyId);
      setCompanyTools(res.installed || []);
      setBlockedTools(res.blocked || []);
      setSelectedCompany(companyId);
    } catch (e) {
      alert("Failed loading company tools");
    }
  }

  async function blockTool(toolId) {
    if (!selectedCompany) return;

    await api.adminBlockTool(selectedCompany, toolId);
    await loadCompanyTools(selectedCompany);
  }

  async function unblockTool(toolId) {
    if (!selectedCompany) return;

    await api.adminUnblockTool(selectedCompany, toolId);
    await loadCompanyTools(selectedCompany);
  }

  /* ================= ENTITY ACTIONS ================= */

  function suspend(entityType, id) {
    alert(`Suspend ${entityType} ${id}`);
  }

  function activate(entityType, id) {
    alert(`Activate ${entityType} ${id}`);
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
        <Tab label="Users" active={view === "users"} onClick={() => setView("users")} />
        <Tab label="Tool Governance" active={view === "tools"} onClick={() => setView("tools")} />
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "#ff5a5f" }}>{error}</div>}

      {view === "managers" && (
        <EntityTable title="Managers" data={managers} type="manager" suspend={suspend} activate={activate} />
      )}

      {view === "companies" && (
        <EntityTable title="Companies" data={companies} type="company" suspend={suspend} activate={activate} />
      )}

      {view === "users" && (
        <EntityTable title="Users" data={users} type="user" suspend={suspend} activate={activate} />
      )}

      {view === "tools" && (
        <div className="card" style={{ padding: 24 }}>
          <h3>Tool Governance</h3>

          <div style={{ marginTop: 16 }}>
            <select
              onChange={(e) => loadCompanyTools(e.target.value)}
              value={selectedCompany || ""}
            >
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.id}
                </option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div style={{ marginTop: 20 }}>

              <h4>Installed Tools</h4>
              {companyTools.length === 0 && <div>No installed tools</div>}
              {companyTools.map((tool) => (
                <div key={tool} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>{tool}</span>
                  <button className="btn" style={{ background: "#ff5a5f" }} onClick={() => blockTool(tool)}>
                    Block
                  </button>
                </div>
              ))}

              <h4 style={{ marginTop: 24 }}>Globally Blocked Tools</h4>
              {blockedTools.length === 0 && <div>No blocked tools</div>}
              {blockedTools.map((tool) => (
                <div key={tool} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>{tool}</span>
                  <button className="btn" style={{ background: "#2bd576" }} onClick={() => unblockTool(tool)}>
                    Unblock
                  </button>
                </div>
              ))}

            </div>
          )}
        </div>
      )}

      <button className="btn" onClick={loadAll} disabled={loading}>
        Reload Global Data
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
      <h3>{title}</h3>

      {data.length === 0 && (
        <div style={{ opacity: 0.6 }}>No records found</div>
      )}

      {data.map((item, i) => (
        <div
          key={item?.id || i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: 14,
            marginBottom: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)"
          }}
        >
          <div>
            <strong>{item?.name || item?.email || item?.id}</strong>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              ID: {item?.id}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" style={{ background: "#ff5a5f" }} onClick={() => suspend(type, item?.id)}>
              Suspend
            </button>

            <button className="btn" style={{ background: "#2bd576" }} onClick={() => activate(type, item?.id)}>
              Activate
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
