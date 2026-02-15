import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function riskColor(level) {
  switch (String(level).toLowerCase()) {
    case "critical":
      return "#ff4d4d";
    case "high":
      return "#ff884d";
    case "medium":
      return "#ffd166";
    case "low":
      return "#2bd576";
    default:
      return "#999";
  }
}

/* ================= PAGE ================= */

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("risk");
  const [sortDir, setSortDir] = useState("desc");

  async function load() {
    setLoading(true);
    try {
      const res = await api.assets().catch(() => ({}));
      setAssets(safeArray(res?.assets));
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ================= FILTER + SORT ================= */

  const filtered = useMemo(() => {
    let list = safeArray(assets);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        JSON.stringify(a).toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      const aVal = a?.[sortKey];
      const bVal = b?.[sortKey];

      if (aVal === bVal) return 0;

      if (sortDir === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return list;
  }, [assets, search, sortKey, sortDir]);

  function changeSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Asset Intelligence</h2>
          <div style={{ fontSize: 13, opacity: 0.6 }}>
            Enterprise-wide monitored assets
          </div>
        </div>

        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: 260,
            padding: 10,
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        />
      </div>

      {/* ================= SUMMARY STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Assets</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {assets.length}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Critical</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff4d4d" }}>
            {assets.filter((a) => a?.risk === "critical").length}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>High Risk</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff884d" }}>
            {assets.filter((a) => a?.risk === "high").length}
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 800,
            }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["name", "type", "owner", "risk", "lastScan"].map((col) => (
                  <th
                    key={col}
                    onClick={() => changeSort(col)}
                    style={{
                      textAlign: "left",
                      padding: "14px 18px",
                      fontSize: 13,
                      cursor: "pointer",
                      opacity: 0.8,
                    }}
                  >
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: 20 }}>
                    Loading assets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: 20 }}>
                    No assets found.
                  </td>
                </tr>
              ) : (
                filtered.map((a, i) => (
                  <tr
                    key={a?.id || i}
                    style={{
                      borderTop:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      {safeStr(a?.name)}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {safeStr(a?.type)}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {safeStr(a?.owner)}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background:
                            "rgba(255,255,255,0.05)",
                          color: riskColor(a?.risk),
                        }}
                      >
                        {safeStr(a?.risk, "unknown").toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", opacity: 0.7 }}>
                      {safeStr(a?.lastScan)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
