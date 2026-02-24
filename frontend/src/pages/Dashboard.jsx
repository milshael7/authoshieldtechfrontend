// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Executive Dashboard — Phase 2 Command Center
// ✅ Uses existing api.js endpoints only
// ✅ Split layout (Command Center)
// ✅ Panels stay “alive” even if one endpoint fails
// ✅ No extra libraries

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [hardError, setHardError] = useState("");

  // Core executive
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);

  // Intelligence layers
  const [posture, setPosture] = useState(null);
  const [vulns, setVulns] = useState([]);
  const [threats, setThreats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [overlay, setOverlay] = useState(null);
  const [churn, setChurn] = useState(null);
  const [refundTimeline, setRefundTimeline] = useState([]);
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [autoprotect, setAutoprotect] = useState(null);

  // Soft errors (per panel)
  const [panelErr, setPanelErr] = useState({});

  const setPanelError = (key, msg) =>
    setPanelErr((p) => ({ ...p, [key]: msg }));

  async function safeLoad(key, fn, onOk) {
    try {
      const res = await fn();
      onOk(res);
      setPanelError(key, "");
      return true;
    } catch (e) {
      setPanelError(key, e?.message || "Failed to load");
      return false;
    }
  }

  async function loadAll() {
    setLoading(true);
    setHardError("");

    // If metrics fails, we still render page but show banner.
    const okMetrics = await safeLoad(
      "metrics",
      () => api.adminMetrics(),
      (r) => setMetrics(r?.metrics || null)
    );

    await safeLoad(
      "risk",
      () => api.adminExecutiveRisk(),
      (r) => setRisk(r?.executiveRisk || null)
    );

    // Security posture
    await safeLoad(
      "posture",
      () => api.postureSummary(),
      (r) => setPosture(r?.summary || r || null)
    );

    // Vulnerabilities
    await safeLoad(
      "vulns",
      () => api.vulnerabilities(),
      (r) => setVulns(Array.isArray(r?.vulnerabilities) ? r.vulnerabilities : Array.isArray(r) ? r : [])
    );

    // Threat feed (security events)
    await safeLoad(
      "threats",
      () => api.threatFeed(40),
      (r) => setThreats(Array.isArray(r?.events) ? r.events : Array.isArray(r) ? r : [])
    );

    // Incidents
    await safeLoad(
      "incidents",
      () => api.incidents(),
      (r) => setIncidents(Array.isArray(r?.incidents) ? r.incidents : Array.isArray(r) ? r : [])
    );

    // Subscriber growth
    await safeLoad(
      "growth",
      () => api.adminSubscriberGrowth(90),
      (r) => setGrowth(Array.isArray(r?.growth) ? r.growth : [])
    );

    // Revenue overlay
    await safeLoad(
      "overlay",
      () => api.adminRevenueRefundOverlay(90),
      (r) => setOverlay(r || null)
    );

    // Predictive churn
    await safeLoad(
      "churn",
      () => api.adminPredictiveChurn(),
      (r) => setChurn(r?.predictiveChurn || null)
    );

    // Refund/dispute timeline
    await safeLoad(
      "refundTimeline",
      () => api.adminRefundDisputeTimeline(),
      (r) => setRefundTimeline(Array.isArray(r?.timeline) ? r.timeline : [])
    );

    // Compliance history
    await safeLoad(
      "complianceHistory",
      () => api.adminComplianceHistory(14),
      (r) => setComplianceHistory(Array.isArray(r?.history) ? r.history : [])
    );

    // Autoprotect status (may not exist in your backend yet — we keep it soft)
    await safeLoad(
      "autoprotect",
      () => api.autoprotectStatus(),
      (r) => setAutoprotect(r || null)
    );

    if (!okMetrics) {
      setHardError("Some platform data could not be loaded. Your session or API may need attention.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vulnCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const v of vulns || []) {
      const sev = String(v?.severity || v?.level || "").toLowerCase();
      if (sev.includes("crit")) counts.critical += 1;
      else if (sev.includes("high")) counts.high += 1;
      else if (sev.includes("med")) counts.medium += 1;
      else if (sev.includes("low")) counts.low += 1;
    }
    return counts;
  }, [vulns]);

  const incidentCounts = useMemo(() => {
    const out = { open: 0, resolved: 0, high: 0 };
    for (const it of incidents || []) {
      const status = String(it?.status || "").toLowerCase();
      const sev = String(it?.severity || it?.priority || "").toLowerCase();
      if (status.includes("resolv") || status.includes("closed")) out.resolved += 1;
      else out.open += 1;
      if (sev.includes("high") || sev.includes("critical")) out.high += 1;
    }
    return out;
  }, [incidents]);

  async function toggleAutoprotect(nextEnabled) {
    try {
      if (nextEnabled) await api.autoprotectEnable();
      else await api.autoprotectDisable();
      await safeLoad("autoprotect", () => api.autoprotectStatus(), (r) => setAutoprotect(r || null));
    } catch (e) {
      setPanelError("autoprotect", e?.message || "Autoprotect action failed");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 14, opacity: 0.7 }}>Loading platform intelligence…</div>
        <div style={{ marginTop: 10, opacity: 0.5, fontSize: 12 }}>
          Executive metrics, security posture, threat feed, incidents, finance overlays…
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* TOP HEADER STRIP */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: ".12em", opacity: 0.55 }}>EXECUTIVE COMMAND CENTER</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>Administration Dashboard</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={loadAll}
            style={btnPrimary}
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* HARD ERROR BANNER (doesn’t stop page) */}
      {hardError && (
        <div style={bannerWarn}>
          <b>Heads up:</b> {hardError}
          <span style={{ opacity: 0.7, marginLeft: 10 }}>
            (Panels that fail will show “Unavailable” instead of breaking the dashboard.)
          </span>
        </div>
      )}

      {/* ======= LAYER 1: EXECUTIVE KPI GRID ======= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <KpiCard title="Total Users" value={metrics?.totalUsers ?? "—"} sub={panelErr.metrics ? "Unavailable" : "Live"} />
        <KpiCard title="Active Subscribers" value={metrics?.activeSubscribers ?? "—"} sub="Billing Intelligence" />
        <KpiCard title="Trial Users" value={metrics?.trialUsers ?? "—"} sub="Acquisition" />
        <KpiCard title="Locked Users" value={metrics?.lockedUsers ?? "—"} sub="Risk Pressure" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <KpiCard title="MRR (30d)" value={metrics ? `$${Number(metrics.MRR || 0).toFixed(2)}` : "—"} sub="Revenue Stream" />
        <KpiCard title="Total Revenue" value={metrics ? `$${Number(metrics.totalRevenue || 0).toFixed(2)}` : "—"} sub="Finance Ledger" />
        <KpiCard
          title="Churn Rate"
          value={metrics ? `${(Number(metrics.churnRate || 0) * 100).toFixed(2)}%` : "—"}
          sub="Subscriber Stability"
        />
        <KpiCard
          title="Predictive Churn"
          value={churn?.score != null ? `${Number(churn.score).toFixed(1)} / 100` : "—"}
          sub={churn?.level || panelErr.churn || "Unavailable"}
        />
      </div>

      {/* Executive risk meter */}
      <Panel title="Executive Risk Index" rightTag={risk?.level || (panelErr.risk ? "Unavailable" : "—")}>
        {panelErr.risk ? (
          <div style={muted}>{panelErr.risk}</div>
        ) : risk ? (
          <div>
            <div style={meterWrap}>
              <div
                style={{
                  ...meterFill,
                  width: `${Math.max(0, Math.min(100, Number(risk.riskIndex || 0)))}%`,
                  background:
                    risk.level === "CRITICAL"
                      ? "#ff3b30"
                      : risk.level === "ELEVATED"
                      ? "#f5b400"
                      : risk.level === "MODERATE"
                      ? "#ff9500"
                      : "#16c784",
                }}
              />
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Stat label="Risk" value={`${Number(risk.riskIndex || 0).toFixed(2)}%`} />
              <Stat label="Audit Chain" value={risk.signals?.auditOK ? "OK" : "FAIL"} />
              <Stat label="Revenue Drift" value={`${Number(risk.signals?.revenueDrift || 0).toFixed(2)}`} />
              <Stat label="Refund Ratio" value={`${Number(risk.signals?.refundsRatio || 0).toFixed(4)}`} />
              <Stat label="Dispute Ratio" value={`${Number(risk.signals?.disputesRatio || 0).toFixed(4)}`} />
            </div>
          </div>
        ) : (
          <div style={muted}>No risk data.</div>
        )}
      </Panel>

      {/* ======= LAYER 2: COMMAND CENTER (Split) ======= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel title="Security Posture" rightTag={panelErr.posture ? "Unavailable" : "Live"}>
            {panelErr.posture ? (
              <div style={muted}>{panelErr.posture}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                <MiniTile label="Posture Score" value={posture?.score ?? posture?.postureScore ?? "—"} />
                <MiniTile label="Checks Passing" value={posture?.passing ?? posture?.passingChecks ?? "—"} />
                <MiniTile label="Checks Failing" value={posture?.failing ?? posture?.failingChecks ?? "—"} />
                <MiniTile label="Last Updated" value={posture?.updatedAt ? new Date(posture.updatedAt).toLocaleString() : "—"} />
              </div>
            )}
          </Panel>

          <Panel title="Vulnerability Center" rightTag={panelErr.vulns ? "Unavailable" : `${(vulns || []).length} total`}>
            {panelErr.vulns ? (
              <div style={muted}>{panelErr.vulns}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                <MiniTile label="Critical" value={vulnCounts.critical} emphasis />
                <MiniTile label="High" value={vulnCounts.high} />
                <MiniTile label="Medium" value={vulnCounts.medium} />
                <MiniTile label="Low" value={vulnCounts.low} />
              </div>
            )}
          </Panel>

          <Panel title="Subscriber Growth (90d)" rightTag={panelErr.growth ? "Unavailable" : "Live"}>
            {panelErr.growth ? (
              <div style={muted}>{panelErr.growth}</div>
            ) : growth?.length ? (
              <MiniBarChart
                points={growth.map((g) => ({
                  label: g.date,
                  a: g.totalUsers,
                  b: g.activeSubscribers,
                }))}
                aLabel="Total Users"
                bLabel="Active Subscribers"
              />
            ) : (
              <div style={muted}>No growth points yet.</div>
            )}
          </Panel>

          <Panel title="Revenue vs Refunds/Disputes (90d)" rightTag={panelErr.overlay ? "Unavailable" : "Overlay"}>
            {panelErr.overlay ? (
              <div style={muted}>{panelErr.overlay}</div>
            ) : overlay?.totals ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                <MiniTile label="Revenue" value={`$${Number(overlay.totals.revenue || 0).toFixed(2)}`} />
                <MiniTile label="Refunds" value={`$${Number(overlay.totals.refunds || 0).toFixed(2)}`} />
                <MiniTile label="Disputes" value={`$${Number(overlay.totals.disputes || 0).toFixed(2)}`} />
              </div>
            ) : (
              <div style={muted}>No finance overlay data.</div>
            )}
          </Panel>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel title="Autoprotect" rightTag={panelErr.autoprotect ? "Unavailable" : "Control"}>
            {panelErr.autoprotect ? (
              <div style={muted}>
                {panelErr.autoprotect}
                <div style={{ marginTop: 8, opacity: 0.7 }}>
                  (If your backend doesn’t have /api/autoprotect yet, this is expected.)
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    Status:{" "}
                    <span style={{ opacity: 0.9 }}>
                      {autoprotect?.enabled === true ? "ENABLED" : autoprotect?.enabled === false ? "DISABLED" : "UNKNOWN"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    Automated protection controls (live toggle).
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnGhost} onClick={() => toggleAutoprotect(false)}>Disable</button>
                  <button style={btnPrimary} onClick={() => toggleAutoprotect(true)}>Enable</button>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Incident Overview" rightTag={panelErr.incidents ? "Unavailable" : "Live"}>
            {panelErr.incidents ? (
              <div style={muted}>{panelErr.incidents}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(140px,1fr))", gap: 12 }}>
                <MiniTile label="Open Incidents" value={incidentCounts.open} />
                <MiniTile label="Resolved" value={incidentCounts.resolved} />
                <MiniTile label="High/Critical" value={incidentCounts.high} emphasis />
                <MiniTile label="Total" value={(incidents || []).length} />
              </div>
            )}
          </Panel>

          <Panel title="Refund/Dispute Timeline" rightTag={panelErr.refundTimeline ? "Unavailable" : "Cumulative"}>
            {panelErr.refundTimeline ? (
              <div style={muted}>{panelErr.refundTimeline}</div>
            ) : refundTimeline?.length ? (
              <TinyTimeline
                points={refundTimeline.slice(-14).map((p) => ({
                  label: p.date,
                  a: p.cumulativeRefund || 0,
                  b: p.cumulativeDispute || 0,
                }))}
                aLabel="Refunds"
                bLabel="Disputes"
              />
            ) : (
              <div style={muted}>No timeline entries yet.</div>
            )}
          </Panel>

          <Panel title="Compliance History" rightTag={panelErr.complianceHistory ? "Unavailable" : "Audit"}>
            {panelErr.complianceHistory ? (
              <div style={muted}>{panelErr.complianceHistory}</div>
            ) : complianceHistory?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {complianceHistory.slice(0, 8).map((h, idx) => (
                  <div key={idx} style={rowLine}>
                    <div style={{ fontWeight: 800 }}>{h?.label || h?.title || "Compliance Snapshot"}</div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>
                      {h?.time ? new Date(h.time).toLocaleString() : "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={muted}>No compliance history yet.</div>
            )}
          </Panel>

          <Panel title="Threat Feed" rightTag={panelErr.threats ? "Unavailable" : "Live"}>
            {panelErr.threats ? (
              <div style={muted}>{panelErr.threats}</div>
            ) : (
              <ThreatFeed events={threats || []} />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ===================== UI COMPONENTS ===================== */

function Panel({ title, rightTag, children }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 11, letterSpacing: ".12em", opacity: 0.65 }}>{rightTag}</div>
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function KpiCard({ title, value, sub }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11, letterSpacing: ".14em", opacity: 0.6 }}>{title.toUpperCase()}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function MiniTile({ label, value, emphasis }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,.06)",
      background: "rgba(255,255,255,.03)",
      borderRadius: 12,
      padding: 12,
    }}>
      <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: ".10em" }}>{label.toUpperCase()}</div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: emphasis ? "#ff3b30" : "#fff" }}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,.06)",
      background: "rgba(255,255,255,.03)",
      borderRadius: 10,
      padding: "10px 12px",
      minWidth: 140
    }}>
      <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: ".08em" }}>{label.toUpperCase()}</div>
      <div style={{ marginTop: 6, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

/* ===================== CHARTS (NO LIBS) ===================== */

function MiniBarChart({ points, aLabel, bLabel }) {
  const safe = points.slice(-24);
  const maxA = Math.max(...safe.map((p) => Number(p.a || 0)), 1);
  const maxB = Math.max(...safe.map((p) => Number(p.b || 0)), 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, fontSize: 12, opacity: 0.7 }}>
        <div><b>{aLabel}</b></div>
        <div><b>{bLabel}</b></div>
      </div>

      <div style={{
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: `repeat(${safe.length}, minmax(6px, 1fr))`,
        gap: 4,
        alignItems: "end",
        height: 120,
      }}>
        {safe.map((p, i) => {
          const aH = Math.round((Number(p.a || 0) / maxA) * 110);
          const bH = Math.round((Number(p.b || 0) / maxB) * 110);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "stretch" }}>
              <div style={{ height: aH, borderRadius: 6, background: "rgba(94,198,255,.65)" }} />
              <div style={{ height: bH, borderRadius: 6, background: "rgba(122,162,255,.65)" }} />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, opacity: 0.55 }}>
        Showing last {safe.length} days (scaled).
      </div>
    </div>
  );
}

function TinyTimeline({ points, aLabel, bLabel }) {
  const safe = points.slice(-14);
  const max = Math.max(...safe.map((p) => Math.max(Number(p.a || 0), Number(p.b || 0))), 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, fontSize: 12, opacity: 0.7 }}>
        <div><b>{aLabel}</b></div>
        <div><b>{bLabel}</b></div>
      </div>

      <div style={{
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {safe.map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{p.label}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ height: 10, borderRadius: 999, width: `${Math.round((Number(p.a || 0) / max) * 100)}%`, background: "rgba(255,255,255,.55)" }} />
              <div style={{ height: 10, borderRadius: 999, width: `${Math.round((Number(p.b || 0) / max) * 100)}%`, background: "rgba(255,59,48,.45)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreatFeed({ events }) {
  const safe = (events || []).slice(0, 16);

  if (!safe.length) {
    return <div style={muted}>No events yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
      {safe.map((e, idx) => {
        const sev = String(e?.severity || e?.level || e?.type || "event").toUpperCase();
        const title = e?.title || e?.message || e?.name || "Security Event";
        const ts = e?.createdAt || e?.time || e?.ts;

        return (
          <div key={idx} style={{
            border: "1px solid rgba(255,255,255,.06)",
            background: "rgba(255,255,255,.03)",
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 12 }}>{title}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{ts ? new Date(ts).toLocaleString() : "—"}</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.65, letterSpacing: ".10em" }}>
              {sev}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== STYLES ===================== */

const muted = { opacity: 0.65, fontSize: 13 };

const meterWrap = {
  height: 12,
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,.08)",
};

const meterFill = {
  height: "100%",
  borderRadius: 999,
};

const bannerWarn = {
  border: "1px solid rgba(245,180,0,.35)",
  background: "rgba(245,180,0,.10)",
  padding: "12px 14px",
  borderRadius: 12,
  fontSize: 13,
};

const rowLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.06)",
  background: "rgba(255,255,255,.03)",
};

const btnPrimary = {
  border: "none",
  cursor: "pointer",
  padding: "10px 14px",
  borderRadius: 12,
  background: "#fff",
  color: "#000",
  fontWeight: 900,
};

const btnGhost = {
  border: "1px solid rgba(255,255,255,.18)",
  cursor: "pointer",
  padding: "10px 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  fontWeight: 800,
};
