// frontend/src/pages/company/CompanyScans.jsx
// Company Scan Board — Multi-Tenant Visibility • Severity Filter • Enterprise View

import React, { useEffect, useState, useMemo } from "react";
import { getToken } from "../../lib/api";

export default function CompanyScans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [memberFilter, setMemberFilter] = useState("");

  useEffect(() => {
    loadScans();
  }, []);

  async function loadScans() {
    try {
      const token = getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/me/scans`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to load scans");

      const data = await res.json();
      setScans(data.scans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= FILTER LOGIC ================= */

  const members = [
    ...new Set(scans.map((s) => s.email).filter(Boolean)),
  ];

  const filteredScans = useMemo(() => {
    if (!memberFilter) return scans;
    return scans.filter((s) => s.email === memberFilter);
  }, [scans, memberFilter]);

  const groupedBySeverity = useMemo(() => {
    const groups = {
      High: [],
      Moderate: [],
      Low: [],
    };

    filteredScans.forEach((scan) => {
      const level =
        scan.result?.overview?.riskLevel || "Low";

      if (groups[level]) {
        groups[level].push(scan);
      } else {
        groups.Low.push(scan);
      }
    });

    return groups;
  }, [filteredScans]);

  /* ================= HELPERS ================= */

  function renderStatus(status) {
    switch (status) {
      case "awaiting_payment":
        return <span className="badge warn">Awaiting Payment</span>;
      case "running":
        return <span className="badge info">Running</span>;
      case "completed":
        return <span className="badge ok">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  }

  /* ================= RENDER ================= */

  return (
    <div className="pageWrap">
      <div className="pageTop">
        <h2>Company Scan Board</h2>
      </div>

      {loading && <p>Loading company scans...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <>
          {/* MEMBER FILTER */}
          <div className="filterBar">
            <label>Filter by Member:</label>
            <select
              value={memberFilter}
              onChange={(e) =>
                setMemberFilter(e.target.value)
              }
            >
              <option value="">All Members</option>
              {members.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          {/* SEVERITY GROUPS */}
          {["High", "Moderate", "Low"].map(
            (severity) =>
              groupedBySeverity[severity]?.length > 0 && (
                <div
                  key={severity}
                  className="severityGroup"
                >
                  <h3>
                    {severity} Risk (
                    {groupedBySeverity[severity].length})
                  </h3>

                  {groupedBySeverity[severity].map(
                    (scan) => (
                      <div
                        key={scan.id}
                        className="scanCard"
                      >
                        <div className="scanHeader">
                          <div>
                            <strong>
                              {scan.toolName}
                            </strong>
                            <small>
                              {scan.email}
                            </small>
                          </div>
                          {renderStatus(scan.status)}
                        </div>

                        <div className="scanBody">
                          <p>
                            Risk Score:{" "}
                            {
                              scan.result?.overview
                                ?.riskScore
                            }
                          </p>
                        </div>

                        {scan.status ===
                          "completed" && (
                          <button
                            className="secondaryBtn"
                            onClick={() =>
                              setSelectedReport(
                                scan
                              )
                            }
                          >
                            View Report
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              )
          )}
        </>
      )}

      {/* REPORT MODAL */}
      {selectedReport && (
        <div className="modalOverlay">
          <div className="modalCard">
            <h3>
              {selectedReport.toolName} Report
            </h3>

            <p>
              <strong>Risk Score:</strong>{" "}
              {
                selectedReport.result?.overview
                  ?.riskScore
              }
            </p>

            <p>
              <strong>Risk Level:</strong>{" "}
              {
                selectedReport.result?.overview
                  ?.riskLevel
              }
            </p>

            <ul>
              {selectedReport.result?.findings?.map(
                (f, i) => (
                  <li key={i}>{f}</li>
                )
              )}
            </ul>

            <button
              className="primaryBtn"
              onClick={() =>
                setSelectedReport(null)
              }
              style={{ marginTop: 20 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
