// frontend/src/pages/ScanCredits.jsx
// Scan Credits — Plan Intelligence • Usage Awareness • Upgrade Optimized

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../lib/api";

export default function ScanCredits() {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const token = getToken();

      const [billingRes, scansRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE}/api/billing/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE}/api/me/scans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!billingRes.ok || !scansRes.ok) {
        throw new Error("Failed to load credit data");
      }

      const billingData = await billingRes.json();
      const scansData = await scansRes.json();

      setSubscription(billingData.subscription || null);
      setScans(scansData.scans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= PLAN LOGIC ================= */

  const planTier =
    subscription?.companyPlan?.tier ||
    (subscription?.status === "Active" ? "individual" : "trial");

  const includedScans = useMemo(() => {
    switch (planTier) {
      case "enterprise":
        return 999;
      case "mid":
        return 10;
      case "small":
        return 5;
      case "micro":
        return 2;
      case "individual":
        return 1;
      default:
        return 0;
    }
  }, [planTier]);

  const usedScans = scans.filter(
    (s) => s.status === "completed"
  ).length;

  const remaining =
    includedScans === 999
      ? "Unlimited"
      : Math.max(includedScans - usedScans, 0);

  const lowCredit =
    typeof remaining === "number" && remaining <= 1;

  /* ================= RENDER ================= */

  return (
    <div className="pageWrap">
      <div className="pageTop">
        <h2>Scan Credits</h2>
        <button
          className="secondaryBtn"
          onClick={() => navigate("/user/run-scan")}
        >
          Run Scan
        </button>
      </div>

      {loading && <p>Loading credit details...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && subscription && (
        <div className="creditCard">

          <div className="creditRow">
            <strong>Plan:</strong>
            <span>{planTier}</span>
          </div>

          <div className="creditRow">
            <strong>Status:</strong>
            <span>{subscription.status}</span>
          </div>

          <div className="creditRow">
            <strong>Included Scans:</strong>
            <span>
              {includedScans === 999
                ? "Unlimited"
                : includedScans}
            </span>
          </div>

          <div className="creditRow">
            <strong>Used Scans:</strong>
            <span>{usedScans}</span>
          </div>

          <div className="creditRow highlight">
            <strong>Remaining:</strong>
            <span>{remaining}</span>
          </div>

          {lowCredit && (
            <div className="upgradeNotice">
              <p>
                You are low on scan credits. Upgrade your plan to
                unlock more scans.
              </p>
              <button
                className="primaryBtn"
                onClick={() => navigate("/user/billing")}
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
