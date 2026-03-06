// frontend/src/pages/user/Managed.jsx
// ======================================================
// MANAGED COMPANIES — INDIVIDUAL USER VIEW
// External organizations user has delegated access to
// Read-only • No tenant control • No admin authority
// ======================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { req, getSavedUser } from "../../lib/api.js";

/* ================= HELPERS ================= */

const arr = (v) => (Array.isArray(v) ? v : []);

/* ================= PAGE ================= */

export default function Managed() {
  const user = useMemo(() => getSavedUser(), []);

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadManaged = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      /**
       * Backend-safe:
       * - If managedCompanies already embedded on user → use that
       * - If endpoint exists → hydrate details
       */
      if (arr(user?.managedCompanies).length === 0) {
        setCompanies([]);
      } else {
        const res = await req("/api/company/managed", { silent: true });
        setCompanies(arr(res?.companies || res));
      }
    } catch {
      // graceful fallback (NO HARD FAILURE)
      setCompanies(arr(user?.managedCompanies));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadManaged();
  }, [loadManaged]);

  /* ================= DERIVED ================= */

  const count = companies.length;
  const limit = 10;

  /* ================= UI ================= */

  return (
    <div className="grid">
      {/* ================= HEADER ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Managed External Companies</h2>

        <div style={{ opacity: 0.6, fontSize: 13 }}>
          Organizations you have delegated visibility into
        </div>

        <div style={{ marginTop: 14 }}>
          <b>{count}</b> / {limit} slots used
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={loadManaged} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {err && (
          <div className="error" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}
      </div>

      {/* ================= LIST ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>Organizations</h3>

        {companies.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            {loading
              ? "Loading…"
              : "No managed organizations assigned."}
          </div>
        )}

        {companies.length > 0 && (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Access Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={c.id || i}>
                    <td>{c.name || "—"}</td>
                    <td>{c.role || "Advisor"}</td>
                    <td>{c.scope || "Read-only"}</td>
                    <td style={{ opacity: 0.8 }}>
                      {c.active === false ? "Inactive" : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.5 }}>
          Managed access does not grant administrative or tenant control.
        </div>
      </div>

      {/* ================= UPGRADE ================= */}
      {count >= limit && (
        <div className="card">
          <h3>Upgrade Required</h3>
          <p style={{ opacity: 0.7 }}>
            You’ve reached the maximum number of managed organizations.
          </p>
          <button onClick={() => (window.location.href = "/pricing")}>
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
