// frontend/src/components/ExecutiveRiskBanner.jsx
// Global Executive Command Banner — Reactive Command Edition

import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function ExecutiveRiskBanner() {
  const [data, setData] = useState(null);
  const [severity, setSeverity] = useState("stable");
  const previousSeverity = useRef("stable");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [riskRes, churnRes] = await Promise.all([
          api.adminExecutiveRisk(),
          api.adminPredictiveChurn(),
        ]);

        if (!alive) return;

        const executiveRisk = riskRes?.executiveRisk || null;
        const predictiveChurn = churnRes?.predictiveChurn || null;

        const risk = executiveRisk?.riskIndex ?? 0;
        const churn = predictiveChurn?.score ?? 0;

        const nextSeverity =
          risk >= 75 || churn >= 75
            ? "critical"
            : risk >= 50 || churn >= 50
            ? "elevated"
            : "stable";

        // Broadcast only if changed
        if (previousSeverity.current !== nextSeverity) {
          window.dispatchEvent(
            new CustomEvent("executive:severity-change", {
              detail: { severity: nextSeverity },
            })
          );

          previousSeverity.current = nextSeverity;
        }

        setSeverity(nextSeverity);
        setData({ executiveRisk, predictiveChurn });
      } catch (e) {
        console.error("ExecutiveRiskBanner error:", e);
      }
    }

    load();
    const t = setInterval(load, 15000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Soft page overlay for CRITICAL
  useEffect(() => {
    const body = document.body;

    if (severity === "critical") {
      body.classList.add("executive-critical");
    } else {
      body.classList.remove("executive-critical");
    }

    return () => {
      body.classList.remove("executive-critical");
    };
  }, [severity]);

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

  const toneClass =
    severity === "critical"
      ? "bannerCritical pulse"
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
