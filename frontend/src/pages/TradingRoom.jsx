// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — REALTIME MARKET + PAPER ENGINE (ENTERPRISE)
// Uses TerminalChart component
// Stable websocket + clean architecture
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../components/TerminalChart";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";
const CANDLE_SECONDS = 60;
const MAX_CANDLES = 200;

export default function TradingRoom() {

  const wsRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(null);

  const [equity, setEquity] = useState(0);
  const [wallet, setWallet] = useState({ usd: 0, btc: 0 });
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);

  const [engineStatus, setEngineStatus] = useState("CONNECTED");
  const [engineMode, setEngineMode] = useState("Paper Trading");

  /* ================= LOAD HISTORICAL ================= */

  async function loadCandles() {
    try {

      const res = await fetch(
        `${API_BASE}/api/market/candles?symbol=${SYMBOL}&limit=${MAX_CANDLES}`,
        { headers: authHeader() }
      );

      const data = await res.json();
      if (!data?.ok) return;

      const formatted = (data.candles || []).map(c => ({
        time: c.time,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close)
      }));

      if (formatted.length) {
        lastCandleRef.current = formatted[formatted.length - 1];
      }

      setCandles(formatted);

    } catch {}

  }

  useEffect(() => {
    loadCandles();
  }, []);

  /* ================= LIVE WEBSOCKET ================= */

  useEffect(() => {

    if (wsRef.current) return;

    const token = getToken();
    if (!token || !API_BASE) return;

    const url = new URL(API_BASE);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";

    const wsUrl =
      `${protocol}//${url.host}/ws/market?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (msg) => {

      try {

        const data = JSON.parse(msg.data);

        if (data.type !== "tick" || data.symbol !== SYMBOL) return;

        setPrice(Number(data.price));

        const ts = Math.floor(data.ts / 1000);
        const bucket = Math.floor(ts / CANDLE_SECONDS) * CANDLE_SECONDS;

        let candle = lastCandleRef.current;

        if (!candle || candle.time !== bucket) {

          candle = {
            time: bucket,
            open: data.price,
            high: data.price,
            low: data.price,
            close: data.price
          };

          setCandles(prev => {
            const updated = [...prev, candle];
            return updated.slice(-MAX_CANDLES);
          });

        } else {

          candle = {
            ...candle,
            high: Math.max(candle.high, data.price),
            low: Math.min(candle.low, data.price),
            close: data.price
          };

          setCandles(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = candle;
            return copy;
          });

        }

        lastCandleRef.current = candle;

      } catch {}

    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      try { ws.close(); } catch {}
      wsRef.current = null;
    };

  }, []);

  /* ================= PAPER ACCOUNT ================= */

  async function loadPaper() {

    try {

      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: authHeader()
      });

      const data = await res.json();
      if (!data?.ok) return;

      const snap = data.snapshot || {};

      setEquity(Number(snap.equity || 0));

      setWallet({
        usd: Number(snap.cashBalance || 0),
        btc: Number(snap.position?.qty || 0)
      });

      setPosition(snap.position || null);

      setTrades((snap.trades || []).slice(-10).reverse());

      if (snap.mode === "live") {
        setEngineMode("Live Trading");
      } else {
        setEngineMode("Paper Trading");
      }

    } catch {}

  }

  useEffect(() => {

    loadPaper();

    const loop = setInterval(loadPaper, 4000);

    return () => clearInterval(loop);

  }, []);

  /* ================= UI ================= */

  return (

    <div style={{
      display: "flex",
      flex: 1,
      background: "#0a0f1c",
      color: "#fff"
    }}>

      {/* LEFT PANEL */}

      <div style={{
        flex: 1,
        padding: 20,
        display: "flex",
        flexDirection: "column"
      }}>

        <div style={{ fontWeight: 700 }}>
          AI Trading Desk • {SYMBOL}
        </div>

        <div style={{ opacity: 0.7 }}>
          Live Price: {price ? price.toLocaleString() : "Loading..."}
        </div>

        {/* CHART */}

        <TerminalChart
          candles={candles}
          height={460}
        />

        {/* ACCOUNT */}

        <div style={{
          display: "flex",
          gap: 20,
          marginTop: 20
        }}>

          <Panel title="Wallet">
            USD: ${wallet.usd.toFixed(2)} <br />
            BTC: {wallet.btc.toFixed(6)}
          </Panel>

          <Panel title="Equity">
            ${equity.toFixed(2)}
          </Panel>

          <Panel title="Open Position" flex={2}>
            {position
              ? `${position.qty} @ ${position.entry}`
              : "No position"}
          </Panel>

        </div>

        {/* TRADES */}

        <Panel title="Recent Trades" style={{ marginTop: 20 }}>
          {trades.length === 0 && (
            <div style={{ opacity: 0.6 }}>
              No trades yet
            </div>
          )}

          {trades.map((t, i) => (
            <div key={i}>
              {t.side} {t.qty} @ {t.price}
            </div>
          ))}
        </Panel>

      </div>

      {/* RIGHT PANEL */}

      <div style={{
        width: 320,
        background: "#111827",
        padding: 20
      }}>

        <h3>AI Engine</h3>

        <div>Status: {engineStatus}</div>
        <div>Mode: {engineMode}</div>

        <div style={{ marginTop: 20, opacity: 0.7 }}>
          Live decision stream will appear here.
        </div>

      </div>

    </div>

  );

}

/* ================= HELPERS ================= */

function authHeader() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function Panel({ title, children, flex = 1, style = {} }) {

  return (

    <div style={{
      flex,
      background: "#111827",
      padding: 15,
      borderRadius: 8,
      ...style
    }}>

      <h4>{title}</h4>

      {children}

    </div>

  );

}
