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

  /* ================= STRICT SANITIZATION ================= */

  const candleData = useMemo(() => {

    return candles
      .map(c => {

        const time = Number(c?.time);
        const open = Number(c?.open);
        const high = Number(c?.high);
        const low = Number(c?.low);
        const close = Number(c?.close);

        if (
          !Number.isFinite(time) ||
          !Number.isFinite(open) ||
          !Number.isFinite(high) ||
          !Number.isFinite(low) ||
          !Number.isFinite(close)
        ) {
          return null;
        }

        return { time, open, high, low, close };

      })
      .filter(Boolean);

  }, [candles]);

  const volumeData = useMemo(() => {

    return volume
      .map(v => {

        const time = Number(v?.time);
        const value = Number(v?.value);

        if (!Number.isFinite(time) || !Number.isFinite(value)) {
          return null;
        }

        return {
          time,
          value,
          color: v?.color || "rgba(100,116,139,.45)"
        };

      })
      .filter(Boolean);

  }, [volume]);

  const pnlData = useMemo(() => {

    return pnlSeries
      .map(p => {

        const time = Number(p?.time);
        const value = Number(p?.value);

        if (!Number.isFinite(time) || !Number.isFinite(value)) {
          return null;
        }

        return { time, value };

      })
      .filter(Boolean);

  }, [pnlSeries]);

  /* ================= CHART INIT ================= */

  useEffect(() => {

    const el = wrapRef.current;
    if (!el) return;

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

    if (lastTimeRef.current === null) {
      series.setData(candleData);
      lastTimeRef.current = last.time;
      chartRef.current?.timeScale().fitContent();
      return;
    }

    if (last.time > lastTimeRef.current) {
      series.update(last);
      lastTimeRef.current = last.time;
      return;
    }

    if (last.time === lastTimeRef.current) {
      series.update(last);
      return;
    }

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
      ...trades.map(t => {
        const time = Number(t?.time);
        if (!Number.isFinite(time)) return null;

        return {
          time,
          position: t.side === "BUY" ? "belowBar" : "aboveBar",
          color: t.side === "BUY" ? "#22c55e" : "#ef4444",
          shape: t.side === "BUY" ? "arrowUp" : "arrowDown",
          text: t.side
        };
      }).filter(Boolean),

      ...aiSignals.map(s => {
        const time = Number(s?.time);
        if (!Number.isFinite(time)) return null;

        return {
          time,
          position: "aboveBar",
          color: "#facc15",
          shape: "circle",
          text: "AI"
        };
      }).filter(Boolean)
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
