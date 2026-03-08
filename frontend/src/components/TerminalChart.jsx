import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

export default function TerminalChart({
  candles = [],
  volume = [],
  trades = [],
  aiSignals = [],
  pnlSeries = [],
  height = 520
}) {

  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const pnlSeriesRef = useRef(null);

  const lastTimeRef = useRef(null);

  /* ================= NORMALIZE DATA ================= */

  const candleData = useMemo(() => {
    return candles.map(c => ({
      time: Number(c.time),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close)
    }));
  }, [candles]);

  const volumeData = useMemo(() => {
    return volume.map(v => ({
      time: Number(v.time),
      value: Number(v.value),
      color: v.color || "rgba(100,116,139,.45)"
    }));
  }, [volume]);

  const pnlData = useMemo(() => {
    return pnlSeries.map(p => ({
      time: Number(p.time),
      value: Number(p.value)
    }));
  }, [pnlSeries]);

  /* ================= CHART INIT ================= */

  useEffect(() => {

    const el = wrapRef.current;
    if (!el) return;

    // Remove previous instance safely
    try { chartRef.current?.remove(); } catch {}

    const chart = createChart(el, {
      height,
      width: el.clientWidth,
      layout: {
        background: { color: "#0b1220" },
        textColor: "#9ca3af"
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,.05)" },
        horzLines: { color: "rgba(148,163,184,.05)" }
      },
      rightPriceScale: {
        borderColor: "rgba(148,163,184,.15)"
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      timeScale: {
        borderColor: "rgba(148,163,184,.15)",
        timeVisible: true
      }
    });

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444"
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      scaleMargins: { top: 0.82, bottom: 0 }
    });

    pnlSeriesRef.current = chart.addLineSeries({
      color: "#facc15",
      lineWidth: 2,
      priceScaleId: "left"
    });

    chartRef.current = chart;

    // Resize handling
    const ro = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      try {
        chart.resize(rect.width, height);
        chart.timeScale().fitContent();
      } catch {}
    });

    ro.observe(el);

    return () => {
      try { ro.disconnect(); } catch {}
      try { chart.remove(); } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      pnlSeriesRef.current = null;
      lastTimeRef.current = null;
    };

  }, [height]);

  /* ================= SAFE DATA UPDATE ================= */

  useEffect(() => {

    const series = candleSeriesRef.current;
    if (!series) return;

    if (!candleData.length) {
      lastTimeRef.current = null;
      return;
    }

    const last = candleData[candleData.length - 1];

    // First load or reset
    if (lastTimeRef.current === null) {
      series.setData(candleData);
      lastTimeRef.current = last.time;
      chartRef.current?.timeScale().fitContent();
      return;
    }

    // Safe ordering logic

    if (last.time > lastTimeRef.current) {
      series.update(last);
      lastTimeRef.current = last.time;
      return;
    }

    if (last.time === lastTimeRef.current) {
      series.update(last);
      return;
    }

    // Time went backwards → full reset
    if (last.time < lastTimeRef.current) {
      series.setData(candleData);
      lastTimeRef.current = last.time;
      chartRef.current?.timeScale().fitContent();
    }

  }, [candleData]);

  useEffect(() => {
    volumeSeriesRef.current?.setData(volumeData);
  }, [volumeData]);

  useEffect(() => {
    pnlSeriesRef.current?.setData(pnlData);
  }, [pnlData]);

  useEffect(() => {

    if (!candleSeriesRef.current) return;

    const markers = [
      ...trades.map(t => ({
        time: Number(t.time),
        position: t.side === "BUY" ? "belowBar" : "aboveBar",
        color: t.side === "BUY" ? "#22c55e" : "#ef4444",
        shape: t.side === "BUY" ? "arrowUp" : "arrowDown",
        text: t.side
      })),
      ...aiSignals.map(s => ({
        time: Number(s.time),
        position: "aboveBar",
        color: "#facc15",
        shape: "circle",
        text: "AI"
      }))
    ];

    try {
      candleSeriesRef.current.setMarkers(markers);
    } catch {}

  }, [trades, aiSignals]);

  return (
    <div style={{ width: "100%" }}>
      <div
        ref={wrapRef}
        style={{
          width: "100%",
          height,
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,.15)",
          overflow: "hidden",
          background: "#0b1220"
        }}
      />
    </div>
  );
}
