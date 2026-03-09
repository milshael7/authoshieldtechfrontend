import React, { useEffect, useRef, useState, useMemo } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";
const CANDLE_SECONDS = 60;
const MAX_CANDLES = 500;
const STORAGE_KEY = "trading_candles_BTC";

/* ================= GLOBAL CACHE ================= */

if (!window.__TRADING_CACHE__) {
  window.__TRADING_CACHE__ = {
    candles: [],
    lastCandle: null
  };
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePersisted(candles) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(candles.slice(-MAX_CANDLES))
    );
  } catch {}
}

export default function TradingRoom() {

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);

  const persisted = loadPersisted();

  const lastCandleRef = useRef(
    window.__TRADING_CACHE__.lastCandle ||
    persisted[persisted.length - 1] ||
    null
  );

  const [candles, setCandles] = useState(
    window.__TRADING_CACHE__.candles.length
      ? window.__TRADING_CACHE__.candles
      : persisted
  );

  const [price, setPrice] = useState(null);
  const [equity, setEquity] = useState(0);
  const [wallet, setWallet] = useState({ usd: 0, btc: 0 });
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);

  /* ================= CANDLE BUILDER ================= */

  function updateCandles(priceNow) {

    if (!Number.isFinite(priceNow)) return;

    const now = Math.floor(Date.now() / 1000);
    const candleTime =
      Math.floor(now / CANDLE_SECONDS) * CANDLE_SECONDS;

    const last = lastCandleRef.current;

    setCandles(prev => {

      let next;

      if (!last || last.time !== candleTime) {

        const newCandle = {
          time: candleTime,
          open: priceNow,
          high: priceNow,
          low: priceNow,
          close: priceNow
        };

        lastCandleRef.current = newCandle;
        next = [...prev.slice(-MAX_CANDLES), newCandle];

      } else {

        const updated = {
          ...last,
          high: Math.max(last.high, priceNow),
          low: Math.min(last.low, priceNow),
          close: priceNow
        };

        lastCandleRef.current = updated;

        next = [...prev];
        next[next.length - 1] = updated;
      }

      window.__TRADING_CACHE__.candles = next;
      window.__TRADING_CACHE__.lastCandle = lastCandleRef.current;

      savePersisted(next);

      return next;
    });
  }

  /* ================= MARKET WS ================= */

  useEffect(() => {

    const token = getToken();
    if (!token) return;
    if (marketWsRef.current) return;

    try {

      const url = new URL(API_BASE);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      marketWsRef.current = ws;

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          const market = data?.data?.[SYMBOL];
          if (!market) return;

          const p = Number(market.price);
          if (!Number.isFinite(p)) return;

          setPrice(p);
          updateCandles(p);

        } catch {}
      };

      ws.onclose = () => {
        marketWsRef.current = null;
      };

    } catch {}

    return () => {
      if (marketWsRef.current) {
        marketWsRef.current.close();
        marketWsRef.current = null;
      }
    };

  }, []);

  /* ================= PAPER WS ================= */

  useEffect(() => {

    const token = getToken();
    if (!token) return;
    if (paperWsRef.current) return;

    try {

      const url = new URL(API_BASE);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
      );

      paperWsRef.current = ws;

      ws.onmessage = (msg) => {

        try {

          const data = JSON.parse(msg.data);
          if (data?.channel !== "paper") return;

          const snap = data.snapshot || {};
          const dec = data.decisions || [];

          setEquity(Number(snap.equity || 0));

          setWallet({
            usd: Number(snap.cashBalance || 0),
            btc: Number(snap.position?.qty || 0)
          });

          setPosition(snap.position || null);
          setTrades(snap.trades || []);
          setDecisions(dec);

        } catch {}
      };

      ws.onclose = () => {
        paperWsRef.current = null;
      };

    } catch {}

    return () => {
      if (paperWsRef.current) {
        paperWsRef.current.close();
        paperWsRef.current = null;
      }
    };

  }, []);

  /* ================= DERIVED ================= */

  const pnlSeries = useMemo(() => {
    let running = 0;
    return trades.map(t => {
      running += Number(t.profit || 0);
      return {
        time: Math.floor(Number(t.time) / 1000),
        value: running
      };
    });
  }, [trades]);

  const aiSignals = useMemo(() => {
    return trades.map(t => ({
      time: Math.floor(Number(t.time) / 1000)
    }));
  }, [trades]);

  const aiConfidence = useMemo(() => {
    if (!decisions.length) return 0;
    const total =
      decisions.reduce((s, d) => s + Number(d.confidence || 0), 0);
    return total / decisions.length;
  }, [decisions]);

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", flex: 1, background: "#0a0f1c", color: "#fff" }}>

      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ fontWeight: 700 }}>{SYMBOL}</div>

        <div style={{ opacity: .7 }}>
          Live Price: {price ? price.toLocaleString() : "Connecting..."}
        </div>

        {/* DO NOT RENDER CHART UNTIL PRICE EXISTS */}

        {price && candles.length > 0 ? (

          <TerminalChart
            candles={candles}
            trades={trades}
            aiSignals={aiSignals}
            pnlSeries={pnlSeries}
          />

        ) : (

          <div style={{ padding: 40, opacity: .6 }}>
            Connecting to market feed...
          </div>

        )}

      </div>

      <div style={{ width: 240 }}>
        <OrderPanel symbol={SYMBOL} price={price} />
      </div>

      <div style={{
        width: 180,
        padding: 16,
        background: "#111827",
        overflowY: "auto"
      }}>
        <h3>AI Engine</h3>

        <div>Equity: ${equity.toFixed(2)}</div>
        <div>Cash: ${wallet.usd.toFixed(2)}</div>

        <div style={{ marginTop: 10 }}>
          AI Confidence: {(aiConfidence * 100).toFixed(0)}%
        </div>
      </div>

    </div>
  );
}
