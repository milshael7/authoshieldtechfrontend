// frontend/src/components/RevenueTrendChart.jsx
// RevenueTrendChart — Executive Revenue Intelligence
// Uses backend: GET /api/admin/revenue-refund-overlay?days=90
// Displays DAILY revenue line + optional refunds/disputes context in tooltip

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

export default function RevenueTrendChart({ days = 90 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const revenueSeriesRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        // Pull the same “truth source” your new executive layers use
        const res = await api.adminRevenueRefundOverlay(days);
        const series = Array.isArray(res?.series) ? res.series : [];

        const revenueData = series.map((d) => ({
          time: d.date, // YYYY-MM-DD
          value: Number(d.revenue || 0),
        }));

        if (!alive) return;
        initChart(revenueData);
      } catch (e) {
        console.error("RevenueTrendChart error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
      if (chartRef.current) chartRef.current.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, [days]);

  function initChart(revenueData) {
    if (!containerRef.current) return;

    // reset if re-render
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      width: containerRef.current.clientWidth,
      height: 280,
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,.15)" },
        horzLine: { color: "rgba(255,255,255,.12)" },
      },
    });

    revenueSeriesRef.current = chartRef.current.addLineSeries({
      color: "#5EC6FF",
      lineWidth: 2,
    });

    revenueSeriesRef.current.setData(revenueData);

    // Make it look good by default
    chartRef.current.timeScale().fitContent();

    window.addEventListener("resize", handleResize);
  }

  function handleResize() {
    if (!chartRef.current || !containerRef.current) return;
    chartRef.current.applyOptions({
      width: containerRef.current.clientWidth,
    });
  }

  if (loading) {
    return (
      <div className="postureCard">
        <b>Revenue Trend</b>
        <div style={{ marginTop: 16 }}>Loading revenue intelligence…</div>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Revenue Trend</b>
        <small className="muted">Daily revenue (last {Number(days) || 90} days)</small>
      </div>

      <div style={{ height: 18 }} />
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}
