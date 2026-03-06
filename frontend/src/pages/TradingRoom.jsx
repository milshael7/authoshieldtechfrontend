// ============================================================
// TRADING ROOM — REALTIME MARKET + PAPER ENGINE (STABLE)
// ROUTE-SAFE • NO REDIRECTS • LIVE CANDLES • WS-OWNED
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

export default function TradingRoom() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

  const [price, setPrice] = useState(0);
  const [equity, setEquity] = useState(0);
  const [wallet, setWallet] = useState({ usd: 0, btc: 0 });
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0f1626" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    loadCandles();

    const resize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  /* ================= LOAD CANDLES ================= */

  async function loadCandles() {
    try {
      const res = await fetch(
        `${API_BASE}/api/market/candles?symbol=${SYMBOL}`,
        { headers: authHeader() }
      );
      const data = await res.json();
      if (!data?.ok) return;

      const candles = data.candles.map((c) => ({
        time: Math.floor(c.time / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      seriesRef.current?.setData(candles);
    } catch {}
  }

  /* ================= LIVE WS ================= */

  useEffect(() => {
    const token = getToken();
    if (!token || !API_BASE) return;

    const url = new URL(API_BASE);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${url.host}/ws/market?token=${encodeURIComponent(
      token
    )}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "tick" && data.symbol === SYMBOL) {
          setPrice(data.price);
          seriesRef.current?.update({
            time: Math.floor(data.ts / 1000),
            open: data.price,
            high: data.price,
            low: data.price,
            close: data.price,
          });
        }
      } catch {}
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, []);

  /* ================= PAPER ACCOUNT ================= */

  async function loadPaper() {
    try {
      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: authHeader(),
      });
      const data = await res.json();
      if (!data?.ok) return;

      const snap = data.snapshot;
      setEquity(snap.equity);
      setWallet({
        usd: snap.cashBalance,
        btc: snap.position?.qty || 0,
      });
      setPosition(snap.position || null);
      setTrades((snap.trades || []).slice(-10).reverse());
    } catch {}
  }

  useEffect(() => {
    loadPaper();
    const loop = setInterval(loadPaper, 4000);
    return () => clearInterval(loop);
  }, []);

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", flex: 1, background: "#0a0f1c", color: "#fff" }}>
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700 }}>AI Trading Desk • {SYMBOL}</div>
        <div style={{ opacity: 0.7 }}>Live Price: {price}</div>

        <div
          ref={containerRef}
          style={{ flex: 1, marginTop: 10, background: "#111827", borderRadius: 10 }}
        />

        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          <Panel title="Wallet">
            USD: ${wallet.usd.toFixed(2)} <br />
            BTC: {wallet.btc.toFixed(6)}
          </Panel>
          <Panel title="Equity">${equity.toFixed(2)}</Panel>
          <Panel title="Open Position" flex={2}>
            {position ? `${position.qty} @ ${position.entry}` : "No position"}
          </Panel>
        </div>

        <Panel title="Recent Trades" style={{ marginTop: 20 }}>
          {trades.map((t, i) => (
            <div key={i}>
              {t.side} {t.qty} @ {t.price}
            </div>
          ))}
        </Panel>
      </div>

      <div style={{ width: 320, background: "#111827", padding: 20 }}>
        <h3>AI Engine</h3>
        <div>Status: CONNECTED</div>
        <div>Mode: Paper Trading</div>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Panel({ title, children, flex = 1, style = {} }) {
  return (
    <div style={{ flex, background: "#111827", padding: 15, ...style }}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}
