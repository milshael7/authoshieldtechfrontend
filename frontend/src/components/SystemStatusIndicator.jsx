import React, { useEffect, useState } from "react";

export default function SystemStatusIndicator() {
  const [status, setStatus] = useState("loading"); // loading | green | yellow | red

  useEffect(() => {
    let mounted = true;

    async function checkSystem() {
      const base = import.meta.env.VITE_API_BASE?.trim();
      if (!base) {
        if (mounted) setStatus("red");
        return;
      }

      try {
        // Step 1: Health check
        const healthRes = await fetch(`${base.replace(/\/+$/, "")}/health`, {
          method: "GET",
        });

        if (!healthRes.ok) {
          if (mounted) setStatus("red");
          return;
        }

        // Step 2: Optional deeper check
        const healthData = await healthRes.json();

        if (healthData?.systemState?.securityStatus) {
          if (mounted) setStatus("green");
        } else {
          if (mounted) setStatus("yellow");
        }

      } catch (err) {
        if (mounted) setStatus("red");
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
    status === "green"
      ? "#16c784"
      : status === "yellow"
      ? "#f5b400"
      : status === "red"
      ? "#ff3b30"
      : "#888";

  return (
    <div
      title={`Backend status: ${status}`}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        transition: "background .3s ease",
      }}
    />
  );
}
