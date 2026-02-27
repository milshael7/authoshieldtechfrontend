// frontend/src/pages/tools/ToolsDashboard.jsx
// Enterprise Tools Control Center — Hardened v2
// Backend v5 Aligned • Subscription Aware • Grant Countdown • Locked Overlay

import React, { useMemo, useState, useEffect } from "react";
import { useTools } from "./ToolContext.jsx";
import { getSavedUser } from "../../lib/api.js";

function statusColor(status) {
  switch (status) {
    case "approved":
      return "#22c55e";
    case "denied":
      return "#ff4d4f";
    case "pending_review":
    case "pending_company":
    case "pending_admin":
      return "#facc15";
    default:
      return "#888";
  }
}

function timeRemaining(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ToolsDashboard() {
  const {
    loading,
    tools,
    myRequests,
    requestTool,
    hasToolAccess,
    hasActiveGrant,
    toolRequiresApproval,
  } = useTools();

  const user = getSavedUser();
  const [requesting, setRequesting] = useState(null);
  const [tick, setTick] = useState(0);

  // Live countdown refresh
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  const requestMap = useMemo(() => {
    const map = {};
    (myRequests || []).forEach((r) => {
      map[r.toolId] = r;
    });
    return map;
  }, [myRequests]);

  async function handleRequest(toolId) {
    setRequesting(toolId);
    await requestTool(toolId, "Access requested from dashboard");
    setRequesting(null);
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading tools…</div>;
  }

  return (
    <div
      style={{
        padding: 30,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div className="sectionTitle">Enterprise Tools Center</div>

      {tools.length === 0 && (
        <div className="muted">No tools available.</div>
      )}

      {tools.map((tool) => {
        const access = hasToolAccess(tool.id);
        const requiresApproval = toolRequiresApproval(tool.id);
        const activeGrant = hasActiveGrant(tool.id);
        const request = requestMap[tool.id];

        const subscriptionLocked =
          user?.subscriptionStatus === "Locked" ||
          user?.subscriptionStatus === "Past Due";

        const fullyBlocked = !access && !request;

        return (
          <div
            key={tool.id}
            style={{
              position: "relative",
              padding: 22,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: "rgba(255,255,255,.02)",
            }}
          >
            {/* LOCK OVERLAY */}
            {fullyBlocked && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,.55)",
                  borderRadius: 14,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>
                  {tool.name}
                </div>

                <div style={{ fontSize: 13, opacity: 0.65 }}>
                  {tool.description}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  padding: "5px 12px",
                  borderRadius: 999,
                  background:
                    tool.tier === "enterprise"
                      ? "rgba(255,77,79,.25)"
                      : tool.tier === "paid"
                      ? "rgba(250,204,21,.25)"
                      : "rgba(34,197,94,.25)",
                }}
              >
                {tool.tier?.toUpperCase()}
              </div>
            </div>

            {/* STATUS CHIPS */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {access && (
                <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
                  ✔ Accessible
                </div>
              )}

              {requiresApproval && !activeGrant && (
                <div style={{ fontSize: 12, color: "#facc15", fontWeight: 600 }}>
                  ⚠ Requires Approval
                </div>
              )}

              {activeGrant && (
                <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
                  ⏳ Active Grant
                </div>
              )}

              {tool.dangerous && (
                <div style={{ fontSize: 12, color: "#ff4d4f", fontWeight: 600 }}>
                  ⚠ Dangerous
                </div>
              )}

              {request && (
                <div
                  style={{
                    fontSize: 12,
                    color: statusColor(request.status),
                    fontWeight: 600,
                  }}
                >
                  {request.status.replace("_", " ").toUpperCase()}
                </div>
              )}

              {subscriptionLocked && (
                <div style={{ fontSize: 12, color: "#ff4d4f", fontWeight: 600 }}>
                  Subscription Locked
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div style={{ marginTop: 6 }}>
              {subscriptionLocked ? (
                <button className="btn small muted" disabled>
                  Subscription Required
                </button>
              ) : access ? (
                <button className="btn small">Open Tool</button>
              ) : request ? (
                <button className="btn small muted" disabled>
                  Request Pending
                </button>
              ) : (
                <button
                  className="btn small"
                  onClick={() => handleRequest(tool.id)}
                  disabled={requesting === tool.id}
                >
                  {requesting === tool.id
                    ? "Requesting..."
                    : "Request Access"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
