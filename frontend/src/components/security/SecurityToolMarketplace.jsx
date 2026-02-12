import React, { useEffect, useState } from "react";

/*
  SecurityToolMarketplace
  Connected to backend score engine
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const base = apiBase();

  async function loadTools() {
    if (!base) return;
    try {
      const res = await fetch(`${base}/api/security/tools`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setTools(data.tools || []);
      }
    } catch {}
    setLoading(false);
  }

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

      loadTools(); // refresh state after change
    } catch {}
  }

  useEffect(() => {
    loadTools();
  }, []);

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(search.toLowerCase())
  );

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

      {loading && <div className="muted">Loading tools...</div>}

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
              Domain: {tool.domain}
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
