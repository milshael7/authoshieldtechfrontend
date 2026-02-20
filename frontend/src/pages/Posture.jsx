import React, { useEffect, useMemo, useState } from "react";
import { api, getSavedUser } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
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
  const [autoEnabled, setAutoEnabled] = useState(
    !!user?.autoprotectEnabled
  );

  const AUTOPROTECT_LIMIT = 10;

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const [s, c] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.postureChecks().catch(() => ({})),
      ]);

      setSummary(s || {});
      setChecks(safeArray(c?.checks));
    } catch {
      setErr("Failed to load security posture");
      setSummary({});
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const severityCounts = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 };
    safeArray(checks).forEach((c) => {
      if (base[c?.severity] !== undefined) {
        base[c.severity]++;
      }
    });
    return base;
  }, [checks]);

  const protectedJobs = isIndividual
    ? Math.min(checks.length, AUTOPROTECT_LIMIT)
    : checks.length;

  const limitReached =
    isIndividual && checks.length > AUTOPROTECT_LIMIT;

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ================= AUTOPROTECT CARD (INDIVIDUAL ONLY) ================= */}
      {isIndividual && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ margin: 0 }}>AutoProtect Control</h2>

          <div style={{ marginTop: 14, opacity: 0.75 }}>
            Status:{" "}
            <strong style={{ color: autoEnabled ? "#5EC6FF" : "#ff4d4d" }}>
              {autoEnabled ? "Active" : "Disabled"}
            </strong>
          </div>

          <div style={{ marginTop: 12 }}>
            Protected Jobs:{" "}
            <strong>
              {protectedJobs} / {AUTOPROTECT_LIMIT}
            </strong>
          </div>

          {limitReached && (
            <div style={{ marginTop: 12, color: "#ffb347" }}>
              Limit reached. Jobs above 10 require manual handling.
            </div>
          )}

          <button
            className="btn"
            style={{ marginTop: 18 }}
            onClick={() => setAutoEnabled(!autoEnabled)}
          >
            {autoEnabled ? "Disable AutoProtect" : "Enable AutoProtect"}
          </button>

          <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>
            AutoProtect automatically handles up to 10 active jobs.
            Additional jobs remain manual.
          </div>
        </div>
      )}

      {/* ================= GLOBAL STRIP (ADMIN/MANAGER ONLY) ================= */}
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

        <div style={{ marginTop: 14, opacity: 0.7 }}>
          Infrastructure operational readiness
        </div>
      </div>

      {err && (
        <div style={{ color: "#ff4d4d" }}>{err}</div>
      )}
    </div>
  );
}
