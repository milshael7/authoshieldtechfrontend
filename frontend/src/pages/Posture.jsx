import React, { useEffect, useMemo, useState } from "react";
import { api, getSavedUser } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function scoreFrom(checks = []) {
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c?.status === "ok") return s + 1;
    if (c?.status === "warn") return s + 0.5;
    return s;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

/* ================= PAGE ================= */

export default function Posture() {
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();
  const isIndividual = role === "individual";

  const [summary, setSummary] = useState({});
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /* ===== AUTOPROTECT STATE ===== */

  const [autoStatus, setAutoStatus] = useState(null);
  const [autoLoading, setAutoLoading] = useState(false);

  /* ================= LOAD SECURITY ================= */

  async function loadSecurity() {
    try {
      const [s, c] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.postureChecks().catch(() => ({})),
      ]);

      setSummary(s || {});
      setChecks(c?.checks || []);
    } catch {
      setErr("Failed to load security posture");
      setSummary({});
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= LOAD AUTOPROTECT ================= */

  async function loadAutoStatus() {
    if (!isIndividual) return;

    try {
      const data = await api.autoprotectStatus();
      setAutoStatus(data);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadSecurity();
    loadAutoStatus();
  }, []);

  /* ================= TOGGLE ================= */

  async function toggleAutoProtect() {
    if (!isIndividual) return;

    setAutoLoading(true);

    try {
      if (autoStatus?.status === "ACTIVE") {
        await api.autoprotectDisable();
      } else {
        await api.autoprotectEnable();
      }

      await loadAutoStatus();
    } catch (e) {
      alert(e.message || "AutoProtect update failed");
    } finally {
      setAutoLoading(false);
    }
  }

  /* ================= COMPUTED ================= */

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const activeJobs = autoStatus?.activeJobs || 0;
  const activeLimit = autoStatus?.activeLimit || 10;
  const limitReached = activeJobs >= activeLimit;

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ================= AUTOPROTECT ================= */}
      {isIndividual && autoStatus && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ margin: 0 }}>AutoProtect</h2>

          <div style={{ marginTop: 14 }}>
            Status:{" "}
            <strong
              style={{
                color:
                  autoStatus.status === "ACTIVE"
                    ? "#5EC6FF"
                    : "#ff4d4d",
              }}
            >
              {autoStatus.status}
            </strong>
          </div>

          <div style={{ marginTop: 12 }}>
            Active Jobs:{" "}
            <strong>
              {activeJobs} / {activeLimit}
            </strong>
          </div>

          {limitReached && (
            <div style={{ marginTop: 10, color: "#ffb347" }}>
              Active job limit reached (10).
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            Next Billing:{" "}
            <strong>
              {autoStatus.nextBillingDate
                ? new Date(autoStatus.nextBillingDate).toLocaleDateString()
                : "—"}
            </strong>
          </div>

          <div style={{ marginTop: 12 }}>
            Monthly Price:{" "}
            <strong>${autoStatus.price || 550}</strong>
          </div>

          <button
            className="btn"
            style={{ marginTop: 18 }}
            onClick={toggleAutoProtect}
            disabled={autoLoading}
          >
            {autoLoading
              ? "Updating..."
              : autoStatus.status === "ACTIVE"
              ? "Disable AutoProtect"
              : "Enable AutoProtect"}
          </button>

          <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>
            AutoProtect covers up to 10 active jobs at a time.
          </div>
        </div>
      )}

      {/* ================= GLOBAL ================= */}
      {!isIndividual && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 20,
          }}
        >
          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>Global Companies</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {summary.totalCompanies ?? 0}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>Global Users</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {summary.totalUsers ?? 0}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>System Health</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {pct(score)}%
            </div>
          </div>
        </div>
      )}

      {/* ================= SECURITY OVERVIEW ================= */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ margin: 0 }}>Security Overview</h2>

        <div
          style={{
            marginTop: 20,
            height: 10,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct(score)}%`,
              height: "100%",
              background:
                "linear-gradient(90deg,#5EC6FF,#7aa2ff)",
            }}
          />
        </div>
      </div>

      {err && (
        <div style={{ color: "#ff4d4d" }}>{err}</div>
      )}
    </div>
  );
}
