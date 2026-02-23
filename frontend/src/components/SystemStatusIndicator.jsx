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
        const healthRes = await fetch(
          `${base.replace(/\/+$/, "")}/health`,
          { method: "GET" }
        );

        if (!healthRes.ok) {
          if (mounted) setStatus("critical");
          return;
        }

        const data = await healthRes.json();

        if (data?.level === "healthy") {
          if (mounted) setStatus("healthy");
        } 
        else if (data?.level === "degraded") {
          if (mounted) setStatus("degraded");
        } 
        else {
          if (mounted) setStatus("critical");
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
      ? "System offline or critical failure"
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
