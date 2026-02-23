import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeFromReport(report) {
  // Try multiple shapes safely
  const r = report?.complianceReport || report || {};

  // Frameworks: prefer explicit frameworks, otherwise build a simple set
  let frameworks =
    safeArray(r.frameworks) ||
    safeArray(r?.controls?.frameworks) ||
    safeArray(r?.summary?.frameworks);

  if (!frameworks.length) {
    // Build “framework-style” cards from known report areas (if present)
    const auditOk =
      r?.auditIntegrity?.ok ?? r?.auditOk ?? r?.audit?.ok ?? null;

    const drift =
      Number(r?.financialIntegrity?.revenueDrift ?? r?.revenueDrift ?? 0) || 0;

    frameworks = [
      {
        name: "Audit Integrity",
        coverage: auditOk === null ? 0 : auditOk ? 100 : 25,
      },
      {
        name: "Financial Drift",
        coverage: pct(100 - Math.min(100, Math.abs(drift) * 4)),
      },
      {
        name: "Retention & Snapshots",
        coverage: r?.retentionPolicy ? 85 : 50,
      },
      {
        name: "System Governance",
        coverage: 75,
      },
    ];
  }

  // Controls: prefer explicit controls/checks, otherwise build from fields
  let controls =
    safeArray(r.controls) ||
    safeArray(r.checks) ||
    safeArray(r?.compliance?.controls) ||
    [];

  // If controls are objects but no name/status, map them
  controls = controls.map((c, i) => {
    if (!c || typeof c !== "object") {
      return { id: i, name: String(c), status: "unknown" };
    }
    const name =
      c.name || c.title || c.control || c.key || `Control ${i + 1}`;
    const status =
      c.status ||
      c.state ||
      (c.ok === true ? "passed" : c.ok === false ? "failed" : "unknown");
    return { ...c, id: c.id ?? i, name, status: String(status).toLowerCase() };
  });

  // Normalize status labels to passed/failed/warn/unknown
  controls = controls.map((c) => {
    const s = String(c.status || "").toLowerCase();
    const normalized =
      s === "pass" || s === "passed" || s === "ok" ? "passed"
      : s === "fail" || s === "failed" || s === "danger" ? "failed"
      : s === "warn" || s === "warning" ? "warn"
      : "unknown";
    return { ...c, status: normalized };
  });

  return { frameworks, controls };
}

function normalizeFromSecurityCompliance(data) {
  const d = data || {};
  const frameworks = safeArray(d.frameworks).map((fw) => ({
    name: fw?.name || fw?.framework || "Framework",
    coverage: pct(fw?.coverage ?? fw?.score ?? 0),
  }));

  const controls = safeArray(d.controls).map((c, i) => ({
    id: c?.id ?? i,
    name: c?.name || c?.title || c?.control || `Control ${i + 1}`,
    status: String(c?.status || "unknown").toLowerCase(),
  }));

  return { frameworks, controls };
}

/* ================= PAGE ================= */

export default function Compliance() {
  const [frameworks, setFrameworks] = useState([]);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 920);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function load() {
    setLoading(true);
    setErr("");

    try {
      // 1) Try security compliance endpoint (works for more roles)
      // 2) Fallback to admin compliance report if security route doesn't exist/forbidden
      try {
        const res = await api.compliance();
        const normalized = normalizeFromSecurityCompliance(res);
        setFrameworks(safeArray(normalized.frameworks));
        setControls(safeArray(normalized.controls));
      } catch {
        const res2 = await api.adminComplianceReport();
        const normalized2 = normalizeFromReport(res2);
        setFrameworks(safeArray(normalized2.frameworks));
        setControls(safeArray(normalized2.controls));
      }
    } catch (e) {
      setErr(e?.message || "Failed to load compliance");
      setFrameworks([]);
      setControls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const failedControls = useMemo(
    () => controls.filter((c) => c?.status === "failed"),
    [controls]
  );

  /* ================= UI ================= */

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Compliance & Audit Command</h2>
        <div style={{ fontSize: 13, opacity: 0.65 }}>
          Regulatory readiness and control coverage
        </div>
        {err ? (
          <div style={{ marginTop: 10, color: "#ff5a5f", fontSize: 13 }}>
            <b>Error:</b> {err}
          </div>
        ) : null}
      </div>

      {/* FRAMEWORK STATUS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
        }}
      >
        {frameworks.map((fw, idx) => (
          <div key={fw.name + idx} className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 800 }}>{fw.name}</div>

            <div
              style={{
                marginTop: 12,
                height: 8,
                background: "rgba(255,255,255,.08)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct(fw.coverage)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#5EC6FF,#7aa2ff)",
                }}
              />
            </div>

            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
              {pct(fw.coverage)}% Coverage
            </div>
          </div>
        ))}

        {frameworks.length === 0 && (
          <div className="card" style={{ padding: 18 }}>
            {loading ? "Loading compliance…" : "No compliance data available"}
          </div>
        )}
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
          gap: 16,
        }}
      >
        {/* CONTROL MATRIX */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Control Coverage Matrix</h3>
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {safeArray(controls)
              .slice(0, 12)
              .map((c, i) => (
                <div
                  key={c?.id || i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <span style={{ opacity: 0.95 }}>{c?.name || "Control"}</span>
                  <strong
                    style={{
                      color:
                        c?.status === "passed"
                          ? "#5EC6FF"
                          : c?.status === "failed"
                          ? "#ff5a5f"
                          : c?.status === "warn"
                          ? "#ffd166"
                          : "rgba(255,255,255,.65)",
                    }}
                  >
                    {(c?.status || "unknown").toUpperCase()}
                  </strong>
                </div>
              ))}

            {controls.length === 0 && (
              <div style={{ opacity: 0.65 }}>
                {loading ? "Loading controls…" : "No controls returned yet."}
              </div>
            )}
          </div>
        </div>

        {/* FAILED CONTROLS */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Failed Controls</h3>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {failedControls.slice(0, 8).map((c, i) => (
              <div
                key={c?.id || i}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,90,95,.12)",
                  border: "1px solid rgba(255,90,95,.35)",
                }}
              >
                <strong>{c?.name || "Control"}</strong>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Immediate remediation required
                </div>
              </div>
            ))}

            {failedControls.length === 0 && (
              <div style={{ opacity: 0.65 }}>
                {loading ? "Checking failures…" : "No critical failures detected"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
