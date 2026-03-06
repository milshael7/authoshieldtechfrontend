// frontend/src/pages/User.jsx
// ======================================================
// USER WORKSPACE — INDIVIDUAL / SEAT VIEW
// Scoped • Non-admin • Non-manager
// Tool-driven • Entitlement-aware • Unified layout
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import { api, req } from "../lib/api.js";
import NotificationList from "../components/NotificationList.jsx";
import PosturePanel from "../components/PosturePanel.jsx";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ================= PAGE ================= */

export default function User() {
  const [me, setMe] = useState(null);
  const [entitlements, setEntitlements] = useState([]);
  const [tools, setTools] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [postureKey, setPostureKey] = useState(0);

  async function loadWorkspace() {
    setLoading(true);
    setErr("");

    try {
      const [
        meRes,
        entRes,
        toolsRes,
        eventsRes,
      ] = await Promise.all([
        req("/api/users/me"),
        req("/api/entitlements/me"),
        req("/api/security/tools"),
        req("/api/security/events", { silent: true }),
      ]);

      setMe(meRes?.user || meRes || null);
      setEntitlements(safeArray(entRes?.entitlements?.tools));
      setTools(safeArray(toolsRes?.tools));
      setNotifications(safeArray(eventsRes?.events));

    } catch (e) {
      setErr(e?.message || "Failed to load user workspace");
    } finally {
      setLoading(false);
    }
  }

  function refreshPosture() {
    setPostureKey((k) => k + 1);
  }

  useEffect(() => {
    loadWorkspace();
    refreshPosture();
    // eslint-disable-next-line
  }, []);

  /* ================= DERIVED ================= */

  const accessibleTools = useMemo(() => {
    if (!tools.length) return [];
    return tools.filter(
      (t) => t.accessible === true || entitlements.includes(t.id)
    );
  }, [tools, entitlements]);

  /* ================= UI ================= */

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>User Security Workspace</h2>

        {me && (
          <div style={{ opacity: 0.7 }}>
            <small>
              {safeStr(me.email)} • Role: {safeStr(me.role)}
            </small>
          </div>
        )}

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={loadWorkspace} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Workspace"}
          </button>

          <button onClick={refreshPosture}>
            Refresh Posture
          </button>
        </div>

        {err && (
          <div className="error" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}
      </div>

      {/* ================= POSTURE ================= */}
      <div style={{ gridColumn: "1 / -1" }}>
        <PosturePanel
          key={postureKey}
          title="Personal Security Posture"
          subtitle="Account-level security health"
        />
      </div>

      {/* ================= TOOL ACCESS ================= */}
      <div className="card">
        <h3>Available Security Tools</h3>

        {accessibleTools.length === 0 && (
          <p className="muted">
            No tools available under your current subscription.
          </p>
        )}

        <ul style={{ marginTop: 12 }}>
          {accessibleTools.map((t) => (
            <li key={t.id} style={{ marginBottom: 12 }}>
              <strong>{safeStr(t.name)}</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                {safeStr(t.description)}
              </div>

              {t.requiresApproval && !t.hasActiveGrant && (
                <div style={{ fontSize: 12, opacity: 0.5 }}>
                  Approval required
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ================= ENTITLEMENTS ================= */}
      <div className="card">
        <h3>My Entitlements</h3>

        {entitlements.length === 0 ? (
          <p className="muted">
            No special tool entitlements assigned.
          </p>
        ) : (
          <ul>
            {entitlements.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      <div className="card">
        <h3>Security Notifications</h3>

        {notifications.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            {loading ? "Loading…" : "No alerts detected."}
          </div>
        )}

        <NotificationList items={notifications} />
      </div>

    </div>
  );
}
