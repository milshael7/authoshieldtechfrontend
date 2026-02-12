import React, { useEffect, useState } from "react";

/*
  SecurityToolMarketplace
  Enterprise Tool Deployment Panel
  LIVE Backend Connected
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
  const [search, setSearch] = useState("");

  /* ================= LOAD TOOLS ================= */

  async function loadTools() {
    if (!base) return;

    try {
      const res = await fetch(`${base}/api/security/tools`, {
        credentials: "include",
      });

      const data = await res.json();
      if (data.ok) {
        setTools(data.tools);
      }
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTools();
  }, []);

  /* ================= INSTALL / UNINSTALL ================= */

  async function toggleInstall(tool) {
    if (!base) return;

    const endpoint = tool.installed
      ? `/api/security/tools/${tool.id}/uninstall`
      : `/api/security/tools/${tool.id}/install`;

    try {
      await fetch(`${base}${endpoint}`, {
        method: "POST",
        credentials: "include",
      });

      await loadTools();

      // 🔥 Notify radar instantly
      window.dispatchEvent(new Event("security:refresh"));
    } catch {}
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
                onClick={() => toggleInstall(tool)}
              >
                {tool.installed ? "Uninstall" : "Install"}
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
