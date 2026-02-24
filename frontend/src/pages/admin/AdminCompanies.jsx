import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

// --------------------------------------------------
// Admin Companies Room
// --------------------------------------------------
// Admin ONLY
// Global visibility
// Stable response handling
// Future-safe structure
// --------------------------------------------------

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------------
  // Load companies
  // -----------------------------------------------
  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");

      const res = await api.adminCompanies();

      // FIXED: correct response shape
      setCompanies(res?.companies || []);
    } catch (e) {
      setError(e?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  // -----------------------------------------------
  // Create company
  // -----------------------------------------------
  async function createCompany(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);

      await api.adminCreateCompany({
        name: name.trim(),
      });

      setName("");
      await loadCompanies();
    } catch (e) {
      alert(e?.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  }

  // -----------------------------------------------
  // Render
  // -----------------------------------------------
  if (loading) {
    return <div className="card">Loading companies…</div>;
  }

  if (error) {
    return <div className="card error">{error}</div>;
  }

  return (
    <div className="page">
      <h2>Admin · Companies</h2>

      {/* ================= CREATE COMPANY ================= */}
      <div className="card">
        <form onSubmit={createCompany} className="row">
          <input
            placeholder="New company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      </div>

      {/* ================= COMPANIES TABLE ================= */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Members</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.members?.length || 0}</td>
                <td>{c.tier || "Standard"}</td>
                <td>{c.status || "Active"}</td>
                <td>
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <div className="muted" style={{ marginTop: 16 }}>
            No companies created yet.
          </div>
        )}
      </div>
    </div>
  );
}
