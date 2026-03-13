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
  const initializedRef = useRef(false);

  /* ================= SANITIZE CANDLES ================= */

  const candleData = useMemo(() => {

    const cleaned = candles
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

    cleaned.sort((a,b)=>a.time-b.time);

    return cleaned;

  }, [candles]);

  /* ================= CHART INIT ================= */

  useEffect(() => {

    const el = wrapRef.current;
    if (!el) return;

    if (chartRef.current) return;

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
        borderColor: "rgba(148,163,184,.15)",
        autoScale: true,
        scaleMargins: {
          top: 0.25,
          bottom: 0.25
        }
      },

      crosshair: {
        mode: CrosshairMode.Normal
      },

      timeScale: {
        borderColor: "rgba(148,163,184,.15)",
        timeVisible: true,
        barSpacing: 10,
        minBarSpacing: 6,
        rightBarOffset: 8,
        shiftVisibleRangeOnNewBar: false,
        rightBarStaysOnScroll: true,
        fixLeftEdge: false
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
      initializedRef.current = false;

    };

  }, [height]);

  /* ================= EDGE DETECTION ================= */

  function isAtRightEdge(chart){

    try{

      const range =
        chart.timeScale().getVisibleLogicalRange();

      if(!range) return true;

      return range.to >= candleData.length - 5;

    }catch{

      return true;

    }

  }

  /* ================= DATA UPDATE ================= */

  useEffect(() => {

    const series = candleSeriesRef.current;
    const chart = chartRef.current;

    if (!series || !chart) return;
    if (!candleData.length) return;

    const last = candleData[candleData.length - 1];

    if (lastTimeRef.current === null) {

      series.setData(candleData);

      lastTimeRef.current = last.time;

      if (!initializedRef.current && candleData.length > 20) {

        chart.timeScale().fitContent();

        initializedRef.current = true;

      }

      return;

    }

    if (last.time >= lastTimeRef.current) {

      series.update(last);

      lastTimeRef.current = last.time;

      if (isAtRightEdge(chart)) {
        chart.timeScale().scrollToRealTime();
      }

      return;

    }

    series.setData(candleData);

    lastTimeRef.current = last.time;

  }, [candleData]);

  /* ================= MARKERS ================= */

  useEffect(() => {

    if (!candleSeriesRef.current) return;

    const markers = [

      /* ===== EXECUTED TRADES ===== */

      ...trades.map(t => {

        const time = Number(t?.time);
        if (!Number.isFinite(time)) return null;

        const side =
          t.side || t.action || "";

        if(side === "BUY"){
          return {
            time,
            position:"belowBar",
            color:"#22c55e",
            shape:"arrowUp",
            text:"BUY"
          };
        }

        if(side === "SELL"){
          return {
            time,
            position:"aboveBar",
            color:"#ef4444",
            shape:"arrowDown",
            text:"SELL"
          };
        }

        return null;

      }).filter(Boolean),

      /* ===== AI DECISIONS ===== */

      ...aiSignals.map(s => {

        const time = Number(s?.time);
        if (!Number.isFinite(time)) return null;

        const action = s.action || "";

        if(action === "BUY"){
          return {
            time,
            position:"belowBar",
            color:"#4ade80",
            shape:"arrowUp",
            text:"AI BUY"
          };
        }

        if(action === "SELL"){
          return {
            time,
            position:"aboveBar",
            color:"#f87171",
            shape:"arrowDown",
            text:"AI SELL"
          };
        }

        return {
          time,
          position:"aboveBar",
          color:"#facc15",
          shape:"circle",
          text:"AI"
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
