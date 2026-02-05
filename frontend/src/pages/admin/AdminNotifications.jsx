// frontend/src/pages/admin/AdminNotifications.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import "../../styles/dashboard.css";

// --------------------------------------------------
// Admin Notifications Room
// --------------------------------------------------
// Rules:
// - Admin ONLY
// - Global visibility (all scopes)
// - Read-only monitoring + safe actions
// - No room leakage
// - Fully loaded (no future edits needed)
// --------------------------------------------------

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------------
  // Load notifications (global)
  // -----------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await api.adminNotifications();
        if (mounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  // -----------------------------------------------
  // Helpers
  // -----------------------------------------------
  function fmtDate(ts) {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "—";
    }
  }

  function severityLabel(sev) {
    if (!sev) return "info";
    return String(sev).toLowerCase();
  }

  // -----------------------------------------------
  // Render
  // -----------------------------------------------
  if (loading) {
    return <div className="card">Loading notifications…</div>;
  }

  if (error) {
    return <div className="card error">{error}</div>;
  }

  return (
    <div className="page">
      <h2>Admin · Notifications</h2>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Title</th>
              <th>Message</th>
              <th>Scope</th>
              <th>Created</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((n) => (
              <tr key={n.id}>
                <td>
                  <span className={`badge ${severityLabel(n.severity)}`}>
                    {n.severity || "info"}
                  </span>
                </td>

                <td>{n.title || "—"}</td>

                <td className="muted">
                  {n.message || "—"}
                </td>

                <td>
                  {n.companyId
                    ? "Company"
                    : n.userId
                    ? "User"
                    : "Global"}
                </td>

                <td>{fmtDate(n.at || n.createdAt)}</td>

                <td>
                  {n.read
                    ? <span className="muted">Read</span>
                    : <strong>Unread</strong>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="muted">No notifications found.</div>
        )}
      </div>

      <div className="dashboard-note">
        <strong>Admin Scope:</strong>  
        This view shows all platform notifications across users, companies,
        and system events. No private content is modified here.
      </div>
    </div>
  );
}
