import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

// --------------------------------------------------
// Admin Users Room
// --------------------------------------------------
// Rules:
// - Admin ONLY
// - Read + controlled actions
// - No room leakage
// - Stable structure (no future refactors needed)
// --------------------------------------------------

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------------
  // Load all users (admin scope)
  // -----------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await api.adminUsers();
        if (mounted) setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load users");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  // -----------------------------------------------
  // Admin actions
  // -----------------------------------------------
  async function rotateId(userId) {
    if (!window.confirm("Rotate this user's platform ID? This forces re-auth.")) return;
    try {
      await api.adminRotateUserId(userId);
      alert("Platform ID rotated.");
    } catch (e) {
      alert(e?.message || "Rotation failed");
    }
  }

  async function toggleAutoProtect(user) {
    try {
      await api.adminUpdateSubscription(user.id, {
        autoprotectEnabled: !user.autoprotechEnabled,
      });
      alert("AutoProtect updated.");
      // refresh list
      const refreshed = await api.adminUsers();
      setUsers(refreshed);
    } catch (e) {
      alert(e?.message || "Update failed");
    }
  }

  // -----------------------------------------------
  // Render
  // -----------------------------------------------
  if (loading) return <div className="card">Loading users…</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="page">
      <h2>Admin · Users</h2>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>AutoProtect</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.companyId || "—"}</td>
                <td>{u.subscriptionStatus || "active"}</td>
                <td>
                  {u.role === "Individual"
                    ? u.autoprotechEnabled
                      ? "Enabled"
                      : "Disabled"
                    : "N/A"}
                </td>
                <td className="actions">
                  <button onClick={() => rotateId(u.id)}>
                    Rotate ID
                  </button>

                  {u.role === "Individual" && (
                    <button onClick={() => toggleAutoProtect(u)}>
                      {u.autoprotechEnabled ? "Disable AP" : "Enable AP"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="muted">No users found.</div>
        )}
      </div>
    </div>
  );
}
