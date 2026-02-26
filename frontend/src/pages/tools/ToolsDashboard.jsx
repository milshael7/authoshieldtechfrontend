// frontend/src/pages/tools/ToolsDashboard.jsx
// Enterprise Tools Control Center
// Fully aligned with backend v4 Tool Governance

import React, { useMemo, useState } from "react";
import { useTools } from "./ToolContext.jsx";

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

  const [requesting, setRequesting] = useState(null);

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
        gap: 24,
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

        return (
          <div
            key={tool.id}
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "rgba(255,255,255,.02)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {tool.name}
                </div>
                <div style={{ fontSize: 13, opacity: 0.6 }}>
                  {tool.description}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background:
                    tool.tier === "enterprise"
                      ? "rgba(255,77,79,.2)"
                      : tool.tier === "paid"
                      ? "rgba(250,204,21,.2)"
                      : "rgba(34,197,94,.2)",
                }}
              >
                {tool.tier?.toUpperCase()}
              </div>
            </div>

            {/* Status Area */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {access && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  ✔ Accessible
                </div>
              )}

              {requiresApproval && !activeGrant && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#facc15",
                    fontWeight: 600,
                  }}
                >
                  ⚠ Requires Approval
                </div>
              )}

              {activeGrant && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  ⏳ Active Grant
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
            </div>

            {/* Actions */}
            <div style={{ marginTop: 6 }}>
              {access ? (
                <button className="btn small">Open Tool</button>
              ) : request ? (
                <button
                  className="btn small muted"
                  disabled
                >
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
