import React, { useEffect, useState } from "react";
import axios from "axios";

/*
  Autodev 6.5 Control Center
  Real Backend Integration
  Role-Based Behavior
*/

export default function InstalledTools() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allowed, setAllowed] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [limit, setLimit] = useState(0);
  const [companies, setCompanies] = useState([]);

  async function loadStatus() {
    try {
      const res = await axios.get("/api/autoprotect/status");
      const data = res.data?.autodev;

      setAllowed(data.allowed);
      setEnabled(data.enabled);
      setLimit(data.limit === "unlimited" ? "unlimited" : Number(data.limit));
      setCompanies(data.activeCompanies || []);
      setLoading(false);
    } catch (e) {
      setError("Failed to load Autodev status");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function toggleAutodev() {
    try {
      if (enabled) {
        await axios.post("/api/autoprotect/disable");
      } else {
        await axios.post("/api/autoprotect/enable");
      }
      loadStatus();
    } catch {
      setError("Action failed");
    }
  }

  async function attachCompany() {
    const companyId = prompt("Enter Company ID to protect:");
    if (!companyId) return;

    try {
      await axios.post("/api/autoprotect/attach", { companyId });
      loadStatus();
    } catch (e) {
      alert(e.response?.data?.error || "Attach failed");
    }
  }

  async function detachCompany(companyId) {
    try {
      await axios.post("/api/autoprotect/detach", { companyId });
      loadStatus();
    } catch {
      alert("Detach failed");
    }
  }

  if (loading) return <div className="postureCard">Loading Autodev...</div>;
  if (error) return <div className="postureCard">{error}</div>;

  if (!allowed) {
    return (
      <div className="postureCard">
        <h3>Autodev 6.5</h3>
        <p>This account is not eligible for Autodev automation.</p>
      </div>
    );
  }

  const usage =
    limit === "unlimited"
      ? "Unlimited"
      : `${companies.length} / ${limit}`;

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Autodev 6.5 Control Center</h3>
        <small className="muted">
          Automated defense orchestration engine
        </small>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="toolHeader">
          <div>
            <div className="toolTitle">
              Status: {enabled ? "ACTIVE" : "INACTIVE"}
            </div>
            <div className="toolCategory">
              Company Limit: {usage}
            </div>
          </div>

          <button
            className={`btn ${enabled ? "warn" : "ok"}`}
            onClick={toggleAutodev}
          >
            {enabled ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      <div>
        <h4>Protected Companies</h4>

        {companies.length === 0 && (
          <div className="toolDesc">
            No companies currently attached.
          </div>
        )}

        {companies.map((id) => (
          <div key={id} className="toolCard">
            <div className="toolHeader">
              <div>
                <div className="toolTitle">{id}</div>
                <div className="toolCategory">Protected</div>
              </div>

              <button
                className="btn warn"
                onClick={() => detachCompany(id)}
              >
                Detach
              </button>
            </div>
          </div>
        ))}

        {enabled && (limit === "unlimited" || companies.length < limit) && (
          <div style={{ marginTop: 20 }}>
            <button className="btn ok" onClick={attachCompany}>
              Attach Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
