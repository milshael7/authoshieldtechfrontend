// frontend/src/components/ExecutiveRiskBanner.jsx
// Global Executive Command Banner

import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ExecutiveRiskBanner() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [riskRes, churnRes] = await Promise.all([
          api.adminExecutiveRisk(),
          api.adminPredictiveChurn(),
        ]);

        if (!alive) return;

        setData({
          executiveRisk: riskRes?.executiveRisk || null,
          predictiveChurn: churnRes?.predictiveChurn || null,
        });
      } catch (e) {
        console.error("ExecutiveRiskBanner error:", e);
      }
    }

    load();

    const t = setInterval(load, 15000); // refresh every 15s
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!data) {
    return (
      <div className="executiveBanner loading">
        Loading executive risk intelligence…
      </div>
    );
  }

  const risk = data.executiveRisk?.riskIndex ?? 0;
  const churn = data.predictiveChurn?.score ?? 0;
  const auditOK = data.executiveRisk?.signals?.auditOK ?? true;
  const drift = data.executiveRisk?.signals?.revenueDrift ?? 0;

  const severity =
    risk >= 75 || churn >= 75
      ? "critical"
      : risk >= 50 || churn >= 50
      ? "elevated"
      : "stable";

  const toneClass =
    severity === "critical"
      ? "bannerCritical"
      : severity === "elevated"
      ? "bannerElevated"
      : "bannerStable";

  return (
    <div className={`executiveBanner ${toneClass}`}>
      <div className="bannerBlock">
        <small>Executive Risk</small>
        <b>{risk}</b>
      </div>

      <div className="bannerBlock">
        <small>Churn Risk</small>
        <b>{churn}</b>
      </div>

      <div className="bannerBlock">
        <small>Revenue Drift</small>
        <b>{drift}</b>
      </div>

      <div className="bannerBlock">
        <small>Audit Integrity</small>
        <b>{auditOK ? "Verified" : "Failure"}</b>
      </div>

      <div className="bannerStatus">
        {severity.toUpperCase()} PLATFORM STATE
      </div>
    </div>
  );
}
