import React, { useEffect, useState, useCallback } from "react";
import { getToken } from "../../lib/api.js";

/*
  SecurityToolMarketplace
  Enterprise Tool Deployment Panel
  AUTH RACE FIXED • TOKEN SAFE • PRODUCTION STABLE
*/

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

export default function SecurityToolMarketplace() {
  const base = apiBase();

  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  /* ================= LOAD TOOLS ================= */

  const loadTools = useCallback(async () => {
    const token = getToken();

    if (!base || !token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const res = await fetch(`${base}/api/security/tools`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load tools");
      }

      setTools(Array.isArray(data.tools) ? data.tools : []);
    } catch {
      setTools([]);
      setError("Unable to load security modules");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    loadTools();

    // 🔒 Reload if token changes (login / refresh)
    const i = setInterval(() => {
      loadTools();
    }, 15000);

    return () => clearInterval(i);
  }, [loadTools]);

  /* ================= INSTALL / UNINSTALL ================= */

  async function toggleInstall(tool) {
    const token = getToken();
    if (!base || !token || busyId) return;

    setBusyId(tool.id);
    setError(null);

    const endpoint = tool.installed
      ? `/api/security/tools/${tool.id}/uninstall`
      : `/api/security/tools/${tool.id}/install`;

    try {
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error();

      await loadTools();

      window.dispatchEvent(new Event("security:refresh"));
    } catch {
      setError("Action failed. Please retry.");
    } finally {
      setBusyId(null);
    }
  }

  /* ================= FILTER ================= */

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Security Control Marketplace</h3>
        <small className="muted">
          Deploy, activate, and manage enterprise-grade security modules.
        </small>

        <div style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder="Search security controls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {loading && <div className="muted">Loading security modules…</div>}

      {error && (
        <div style={{ marginBottom: 12, color: "#ff5a5f" }}>
          {error}
        </div>
      )}

      <div className="toolGrid">
        {filteredTools.map((tool) => (
          <div key={tool.id} className="toolCard">
            <div className="toolHeader">
              <div>
                <b>{tool.name}</b>
                <div className="toolCategory">
                  {tool.domain?.toUpperCase()}
                </div>
              </div>

              <span className={`badge ${tool.installed ? "ok" : ""}`}>
                {tool.installed ? "Installed" : "Available"}
              </span>
            </div>

            <div className="toolDesc">
              Security domain coverage module.
            </div>

            <div className="toolActions">
              <button
                className={`btn ${tool.installed ? "warn" : "ok"}`}
                disabled={busyId === tool.id}
                onClick={() => toggleInstall(tool)}
              >
                {busyId === tool.id
                  ? "Processing..."
                  : tool.installed
                  ? "Uninstall"
                  : "Install"}
              </button>
            </div>
          </div>
        ))}

        {!loading && filteredTools.length === 0 && (
          <div className="muted">
            No matching security controls found.
          </div>
        )}
      </div>
    </div>
  );
}
