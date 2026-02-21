import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api";

/**
 * RevenueRefundOverlayChart
 * Layer 2 — Revenue vs Refund vs Dispute
 * Executive Financial Erosion Visibility
 */

export default function RefundDisputeChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  useEffect(() => {
    load();
    return cleanup;
  }, [days]);

  async function load() {
    try {
      setLoading(true);

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

      initChart(revenueData, refundData, disputeData);
    } catch (e) {
      console.error("RevenueRefundOverlay error:", e);
    } finally {
      setLoading(false);
    }
  }

  function initChart(revenueData, refundData, disputeData) {
    if (!containerRef.current) return;

    cleanup();

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
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
    });

    const revenueSeries = chartRef.current.addLineSeries({
      color: "#5EC6FF",
      lineWidth: 2,
    });

    const refundSeries = chartRef.current.addLineSeries({
      color: "#ff5a5f",
      lineWidth: 2,
    });

    const disputeSeries = chartRef.current.addLineSeries({
      color: "#ffd166",
      lineWidth: 2,
    });

    revenueSeries.setData(revenueData);
    refundSeries.setData(refundData);
    disputeSeries.setData(disputeData);

    window.addEventListener("resize", handleResize);
  }

  function handleResize() {
    if (!chartRef.current || !containerRef.current) return;

    chartRef.current.applyOptions({
      width: containerRef.current.clientWidth,
    });
  }

  function cleanup() {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    window.removeEventListener("resize", handleResize);
  }

  if (loading) {
    return (
      <div className="postureCard">
        <b>Revenue vs Refund Exposure</b>
        <div style={{ marginTop: 16 }}>
          Loading financial erosion analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <b>Revenue vs Refund / Dispute Overlay</b>
          <div className="muted" style={{ fontSize: 12 }}>
            Margin erosion visibility
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              className={`btn ${days === d ? "primary" : ""}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 20 }} />
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}
