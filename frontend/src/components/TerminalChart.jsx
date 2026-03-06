// frontend/src/components/TerminalChart.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { createChart } from "lightweight-charts";

/**
 * TerminalChart — PRO Trading Chart
 * Supports:
 * ✔ Candles
 * ✔ Volume
 * ✔ Entry/Exit markers
 * ✔ AI signals
 * ✔ PnL overlay
 */

export default function TerminalChart({
  candles = [],
  volume = [],
  trades = [],
  aiSignals = [],
  pnlSeries = [],
  height = 520,
  accent = "rgba(122,167,255,0.85)",
}) {
  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const pnlSeriesRef = useRef(null);

  /* ================= NORMALIZE DATA ================= */

  const data = useMemo(() => {
    return (candles || [])
      .map((c) => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }))
      .filter((c) => Number.isFinite(c.time));
  }, [candles]);

  const volumeData = useMemo(() => {
    return (volume || []).map((v) => ({
      time: Number(v.time),
      value: Number(v.value),
      color: v.color || "rgba(59,130,246,.45)",
    }));
  }, [volume]);

  const pnlData = useMemo(() => {
    return (pnlSeries || []).map((p) => ({
      time: Number(p.time),
      value: Number(p.value),
    }));
  }, [pnlSeries]);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    try {
      if (chartRef.current) chartRef.current.remove();
    } catch {}

    const chart = createChart(el, {
      height,
      layout: {
        background: { color: "rgba(0,0,0,0.18)" },
        textColor: "rgba(255,255,255,0.78)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
      },
    });

    /* ================= CANDLES ================= */

    const candleSeries = chart.addCandlestickSeries({
      upColor: "rgba(43,213,118,0.85)",
      downColor: "rgba(255,90,95,0.85)",
      borderUpColor: "rgba(43,213,118,0.85)",
      borderDownColor: "rgba(255,90,95,0.85)",
      wickUpColor: "rgba(255,255,255,0.55)",
      wickDownColor: "rgba(255,255,255,0.55)",
    });

    candleSeries.applyOptions({
      priceLineVisible: true,
      priceLineColor: accent,
    });

    /* ================= VOLUME ================= */

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    /* ================= PNL LINE ================= */

    const pnlSeriesLine = chart.addLineSeries({
      color: "#facc15",
      lineWidth: 2,
      priceScaleId: "left",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    pnlSeriesRef.current = pnlSeriesLine;

    /* INITIAL DATA */

    if (data.length) {
      candleSeries.setData(data);
      chart.timeScale().fitContent();
    }

    if (volumeData.length) {
      volumeSeries.setData(volumeData);
    }

    if (pnlData.length) {
      pnlSeriesLine.setData(pnlData);
    }

    /* ================= RESIZE ================= */

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      chart.applyOptions({ width: Math.floor(rect.width), height });
    });

    ro.observe(el);

    return () => {
      try {
        ro.disconnect();
      } catch {}
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
    };
  }, [height]);

  /* ================= UPDATE DATA ================= */

  useEffect(() => {
    candleSeriesRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    volumeSeriesRef.current?.setData(volumeData);
  }, [volumeData]);

  useEffect(() => {
    pnlSeriesRef.current?.setData(pnlData);
  }, [pnlData]);

  /* ================= ENTRY / EXIT MARKERS ================= */

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const markers = (trades || []).map((t) => ({
      time: Number(t.time),
      position: t.side === "BUY" ? "belowBar" : "aboveBar",
      color: t.side === "BUY" ? "#22c55e" : "#ef4444",
      shape: t.side === "BUY" ? "arrowUp" : "arrowDown",
      text: t.side,
    }));

    candleSeriesRef.current.setMarkers(markers);
  }, [trades]);

  /* ================= AI SIGNAL OVERLAY ================= */

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const markers = (aiSignals || []).map((s) => ({
      time: Number(s.time),
      position: "aboveBar",
      color: "#facc15",
      shape: "circle",
      text: "AI",
    }));

    candleSeriesRef.current.setMarkers(markers);
  }, [aiSignals]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        overflow: "hidden",
        background: "rgba(0,0,0,0.18)",
      }}
    />
  );
}
