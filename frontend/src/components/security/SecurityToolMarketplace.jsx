import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getToken } from "../../lib/api.js";

/*
SecurityToolMarketplace
Enterprise Tool Deployment Panel
BACKEND-ALIGNED • REQUEST-BASED • STABLE
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

      const res = await fetch(`${base}/api/tools/catalog`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
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
  }, [loadTools]);

  /* ================= REQUEST ACCESS ================= */

  async function requestTool(tool) {
    const token = getToken();
    if (!base || !token || busyId) return;

    setBusyId(tool.id);
    setError(null);

    try {
      const res = await fetch(
        `${base}/api/tools/request/${tool.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error();

      await loadTools();
    } catch {
      setError("Request failed. Please retry.");
    } finally {
      setBusyId(null);
    }
  }

  /* ================= FILTER ================= */

  const filteredTools = useMemo(() => {
    const q = search.toLowerCase();
    return tools.filter((tool) =>
      (tool?.name || "").toLowerCase().includes(q)
    );
  }, [tools, search]);

  /* ================= METRICS ================= */

  const metrics = useMemo(() => {
    const accessible = tools.filter((t) => t.accessible).length;
    const restricted = tools.length - accessible;
    const categories = new Set(tools.map((t) => t.category)).size;

    return {
      accessible,
      restricted,
      categories,
    };
  }, [tools]);

  /* ================= UI ================= */

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Security Control Marketplace</h3>

        <small className="muted">
          Deploy, request, and manage enterprise-grade security modules.
        </small>

        {/* METRICS */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <div className="metricCard">
            Accessible: <b>{metrics.accessible}</b>
          </div>

          <div className="metricCard">
            Restricted: <b>{metrics.restricted}</b>
          </div>

          <div className="metricCard">
            Categories: <b>{metrics.categories}</b>
          </div>
        </div>

        {/* SEARCH */}
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
                  {(tool.category || "").toUpperCase()}
                </div>
              </div>

              <span
                className={`badge ${
                  tool.accessible ? "ok" : "warn"
                }`}
              >
                {tool.accessible ? "Accessible" : "Restricted"}
              </span>
            </div>

            <div className="toolDesc">
              {tool.description || "Security capability module."}
            </div>

            <div className="toolActions">
              {!tool.accessible && (
                <button
                  className="btn ok"
                  disabled={busyId === tool.id}
                  onClick={() => requestTool(tool)}
                >
                  {busyId === tool.id
                    ? "Requesting..."
                    : "Request Access"}
                </button>
              )}
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
