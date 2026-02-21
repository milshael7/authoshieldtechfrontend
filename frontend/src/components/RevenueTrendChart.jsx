import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

/**
 * RevenueRefundOverlayChart
 * Executive Finance Intelligence — Daily Overlay
 * Revenue vs Refunds vs Disputes (daily totals)
 */

export default function RevenueRefundOverlayChart({ days = 90 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const revenueSeriesRef = useRef(null);
  const refundSeriesRef = useRef(null);
  const disputeSeriesRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await api.adminRevenueRefundOverlay(days);
        const series = res?.series || [];

        const revenueData = series.map((d) => ({
          time: d.date,
          value: Number(d.revenue || 0),
        }));

        const refundData = series.map((d) => ({
          time: d.date,
          value: Number(d.refunds || 0),
        }));

        const disputeData = series.map((d) => ({
          time: d.date,
          value: Number(d.disputes || 0),
        }));

        if (!alive) return;
        initChart(revenueData, refundData, disputeData);
      } catch (e) {
        console.error("RevenueRefundOverlayChart error:", e);
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

  function initChart(revenueData, refundData, disputeData) {
    if (!containerRef.current) return;

    // reset if remounting
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
      height: 300,
      rightPriceScale: { borderColor: "rgba(255,255,255,.1)" },
      timeScale: { borderColor: "rgba(255,255,255,.1)" },
    });

    revenueSeriesRef.current = chartRef.current.addLineSeries({
      color: "#5EC6FF",
      lineWidth: 2,
    });

    refundSeriesRef.current = chartRef.current.addLineSeries({
      color: "#ff5a5f",
      lineWidth: 2,
    });

    disputeSeriesRef.current = chartRef.current.addLineSeries({
      color: "#ffd166",
      lineWidth: 2,
    });

    revenueSeriesRef.current.setData(revenueData);
    refundSeriesRef.current.setData(refundData);
    disputeSeriesRef.current.setData(disputeData);

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
        <b>Revenue vs Refund/Dispute Overlay</b>
        <div style={{ marginTop: 16 }}>
          Loading daily overlay analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Revenue vs Refund/Dispute Overlay</b>
        <small className="muted">
          Daily totals (last {Number(days) || 90} days)
        </small>
      </div>

      <div style={{ height: 18 }} />
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}
