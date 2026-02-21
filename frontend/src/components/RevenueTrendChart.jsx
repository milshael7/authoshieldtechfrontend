import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

/**
 * RevenueTrendChart
 * Executive Revenue Timeline Visualization
 */

export default function RevenueTrendChart() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.adminComplianceHistory(60);
        const history = res?.history || [];

        const formatted = history
          .map((snap) => ({
            time: snap.generatedAt.slice(0, 10),
            value:
              snap?.financialIntegrity?.internalRevenue
                ?.totalRevenueCalculated || 0,
          }))
          .sort((a, b) =>
            a.time > b.time ? 1 : -1
          );

        initChart(formatted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  function initChart(data) {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 260,
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
    });

    seriesRef.current = chartRef.current.addLineSeries({
      color: "#5EC6FF",
      lineWidth: 2,
    });

    seriesRef.current.setData(data);

    window.addEventListener("resize", handleResize);
  }

  function handleResize() {
    if (!chartRef.current || !chartContainerRef.current) return;

    chartRef.current.applyOptions({
      width: chartContainerRef.current.clientWidth,
    });
  }

  if (loading) {
    return (
      <div className="postureCard">
        <b>Revenue Trend</b>
        <div style={{ marginTop: 16 }}>Loading revenue timeline…</div>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Revenue Trend</b>
        <small className="muted">
          Based on Compliance Snapshots
        </small>
      </div>

      <div style={{ height: 18 }} />

      <div
        ref={chartContainerRef}
        style={{ width: "100%" }}
      />
    </div>
  );
}
