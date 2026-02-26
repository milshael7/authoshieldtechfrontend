import React, { useEffect, useState } from "react";

export default function SystemStatusIndicator() {
  const [status, setStatus] = useState("loading");
  // loading | healthy | degraded | critical

  useEffect(() => {
    let mounted = true;

    async function checkSystem() {
      const base = import.meta.env.VITE_API_BASE?.trim();

      if (!base) {
        if (mounted) setStatus("critical");
        return;
      }

      try {
        const res = await fetch(
          `${base.replace(/\/+$/, "")}/health`,
          { method: "GET" }
        );

        if (!res.ok) {
          if (mounted) setStatus("critical");
          return;
        }

        const data = await res.json();

        const securityStatus = data?.systemState?.securityStatus;

        if (securityStatus === "secure") {
          if (mounted) setStatus("healthy");
        } else if (securityStatus === "compromised") {
          if (mounted) setStatus("critical");
        } else {
          if (mounted) setStatus("degraded");
        }

      } catch {
        if (mounted) setStatus("critical");
      }
    }

    checkSystem();
    const interval = setInterval(checkSystem, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const color =
    status === "healthy"
      ? "#16c784"
      : status === "degraded"
      ? "#f5b400"
      : status === "critical"
      ? "#ff3b30"
      : "#888";

  const label =
    status === "healthy"
      ? "All systems operational"
      : status === "degraded"
      ? "System partially degraded"
      : status === "critical"
      ? "System compromised or offline"
      : "Checking system...";

  return (
    <div
      title={label}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        transition: "all .3s ease",
      }}
    />
  );
}
