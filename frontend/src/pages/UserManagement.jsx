import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ================= PAGE ================= */

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.adminUsers().catch(() => ({}));
      setUsers(safeArray(res?.users));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ================= ACTIONS ================= */

  async function suspendUser(id) {
    if (!id) return;
    setWorkingId(id);
    try {
      await api.req(`/api/admin/users/${id}/suspend`, { method: "POST" });
      await load();
    } catch (e) {
      alert(e.message || "Failed to suspend user");
    } finally {
      setWorkingId(null);
    }
  }

  async function activateUser(id) {
    if (!id) return;
    setWorkingId(id);
    try {
      await api.req(`/api/admin/users/${id}/activate`, { method: "POST" });
      await load();
    } catch (e) {
      alert(e.message || "Failed to activate user");
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleLock(id, locked) {
    if (!id) return;
    setWorkingId(id);
    try {
      await api.req(`/api/admin/users/${id}/${locked ? "unlock" : "lock"}`, {
        method: "POST",
      });
      await load();
    } catch (e) {
      alert(e.message || "Failed to update lock state");
    } finally {
      setWorkingId(null);
    }
  }

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === "admin").length,
      managers: users.filter(u => u.role === "manager").length,
      locked: users.filter(u => u.locked === true).length,
      suspended: users.filter(u => u.suspended === true).length,
    };
  }, [users]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Admin Authority Control</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Full power identity governance — suspend, activate, override
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20
        }}
      >
        <StatCard label="Total Users" value={stats.total} />
        <StatCard label="Administrators" value={stats.admins} color="#5EC6FF" />
        <StatCard label="Managers" value={stats.managers} color="#a88bff" />
        <StatCard label="Locked Accounts" value={stats.locked} color="#ff5a5f" />
        <StatCard label="Suspended Accounts" value={stats.suspended} color="#ffb347" />
      </div>

      {/* USER TABLE */}
      <div className="card" style={{ padding: 24 }}>
        <h3>User Registry</h3>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {safeArray(users).map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderRadius: 14,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)"
              }}
            >
              {/* LEFT */}
              <div>
                <strong>{safeStr(u.name, "User")}</strong>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {safeStr(u.email)}
                </div>
              </div>

              {/* CENTER STATUS */}
              <div style={{ display: "flex", gap: 10 }}>
                <Badge text={safeStr(u.role).toUpperCase()} color="#5EC6FF" />
                {u.locked && <Badge text="LOCKED" color="#ff5a5f" />}
                {u.suspended && <Badge text="SUSPENDED" color="#ffb347" />}
              </div>

              {/* RIGHT ACTIONS */}
              <div style={{ display: "flex", gap: 10 }}>
                {!u.suspended ? (
                  <button
                    className="btn"
                    disabled={workingId === u.id}
                    onClick={() => suspendUser(u.id)}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    className="btn"
                    disabled={workingId === u.id}
                    onClick={() => activateUser(u.id)}
                  >
                    Activate
                  </button>
                )}

                <button
                  className="btn"
                  disabled={workingId === u.id}
                  onClick={() => toggleLock(u.id, u.locked)}
                >
                  {u.locked ? "Unlock" : "Lock"}
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div style={{ opacity: 0.6 }}>No users registered</div>
          )}
        </div>

        <button
          className="btn"
          onClick={load}
          disabled={loading}
          style={{ marginTop: 24 }}
        >
          {loading ? "Refreshing…" : "Reload Users"}
        </button>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value, color }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: color || "#fff"
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "6px 10px",
        borderRadius: 999,
        background: `${color}20`,
        color
      }}
    >
      {text}
    </span>
  );
}
