import React, { useEffect, useState } from "react";

/*
  Enterprise Security Tool Marketplace
  Backend-Driven • Persistent • Production Grade
*/

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

export default function SecurityToolMarketplace() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const base = apiBase();

  async function loadTools() {
    try {
      const res = await fetch(`${base}/api/security/tools`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setTools(data.tools || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTool(tool) {
    try {
      setStatus("Updating...");

      const endpoint = tool.installed
        ? `${base}/api/security/tools/${tool.id}/uninstall`
        : `${base}/api/security/tools/${tool.id}/install`;

      await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      await loadTools();
      setStatus("Updated");
      setTimeout(() => setStatus(""), 1500);
    } catch (e) {
      console.error(e);
      setStatus("Error");
    }
  }

  useEffect(() => {
    loadTools();
  }, []);

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 20 }}>
        <h3>Security Control Marketplace</h3>
        <small className="muted">
          Deploy and manage enterprise-grade security modules.
        </small>
      </div>

      {status && (
        <div style={{ marginBottom: 10 }}>
          <span className="badge primary">{status}</span>
        </div>
      )}

      {loading && <div className="muted">Loading tools…</div>}

      <div className="toolGrid">
        {tools.map((tool) => (
          <div key={tool.id} className="toolCard">
            <div className="toolHeader">
              <div>
                <div className="toolTitle">{tool.name}</div>
              </div>

              <span className={`badge ${tool.installed ? "ok" : ""}`}>
                {tool.installed ? "Installed" : "Available"}
              </span>
            </div>

            <div className="toolDesc">
              Enterprise security module ready for deployment.
            </div>

            <div className="toolActions">
              <button
                className={`btn ${tool.installed ? "warn" : "ok"}`}
                onClick={() => toggleTool(tool)}
              >
                {tool.installed ? "Uninstall" : "Install"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
