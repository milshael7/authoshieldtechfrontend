import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../../components/TerminalChart";
import { getToken } from "../../lib/api.js";
import "../../styles/terminal.css";

const SYMBOL_GROUPS = {
  Crypto: ["BTCUSDT","ETHUSDT","SOLUSDT"],
  Forex: ["EURUSD","GBPUSD"],
  Indices: ["SPX","NASDAQ"],
  Commodities: ["GOLD"]
};

const ALL_SYMBOLS = Object.values(SYMBOL_GROUPS).flat();

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 500;
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

/* ================= GLOBAL CACHE ================= */

if (!window.__MARKET_CACHE__) {
  window.__MARKET_CACHE__ = {};
}

function getStorageKey(symbol) {
  return `market_candles_${symbol}`;
}

function loadPersisted(symbol) {
  try {
    const raw = localStorage.getItem(getStorageKey(symbol));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePersisted(symbol, candles) {
  try {
    localStorage.setItem(
      getStorageKey(symbol),
      JSON.stringify(candles.slice(-MAX_CANDLES))
    );
  } catch {}
}

function ensureSymbolCache(symbol) {
  if (!window.__MARKET_CACHE__[symbol]) {
    window.__MARKET_CACHE__[symbol] = {
      candles: [],
      lastCandle: null
    };
  }
  return window.__MARKET_CACHE__[symbol];
}

export default function Market() {

  const wsRef = useRef(null);
  const symbolRef = useRef(ALL_SYMBOLS[0]);

  const [symbol, setSymbol] = useState(ALL_SYMBOLS[0]);

  const initialCache = ensureSymbolCache(ALL_SYMBOLS[0]);
  const initialPersisted = loadPersisted(ALL_SYMBOLS[0]);

  const lastCandleRef = useRef(
    initialCache.lastCandle ||
    initialPersisted[initialPersisted.length - 1] ||
    null
  );

  const [candles, setCandles] = useState(
    initialCache.candles.length
      ? initialCache.candles
      : initialPersisted
  );

  const [price, setPrice] = useState(null);

  function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function syncCache(sym, nextCandles, lastCandle) {
    const cache = ensureSymbolCache(sym);
    cache.candles = nextCandles;
    cache.lastCandle = lastCandle;
    savePersisted(sym, nextCandles);
  }

  function updateCandles(sym, priceNow) {
    if (!Number.isFinite(priceNow)) return;

    const now = Math.floor(Date.now() / 1000);
    const candleTime = Math.floor(now / CANDLE_SECONDS) * CANDLE_SECONDS;

    setCandles(prev => {
      const currentSymbol = symbolRef.current;
      if (sym !== currentSymbol) return prev;

      const last = lastCandleRef.current;
      let next;
      let nextLast;

      if (!last || last.time !== candleTime) {
        nextLast = {
          time: candleTime,
          open: priceNow,
          high: priceNow,
          low: priceNow,
          close: priceNow
        };

        next = [...prev.slice(-MAX_CANDLES), nextLast];
      } else {
        nextLast = {
          ...last,
          high: Math.max(last.high, priceNow),
          low: Math.min(last.low, priceNow),
          close: priceNow
        };

        if (prev.length === 0) {
          next = [nextLast];
        } else {
          next = [...prev];
          next[next.length - 1] = nextLast;
        }
      }

      lastCandleRef.current = nextLast;
      syncCache(sym, next, nextLast);

      return next;
    });
  }

  async function loadHistory(sym) {
    if (!API_BASE) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/market/candles/${sym}?limit=${MAX_CANDLES}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      if (!data?.ok || !Array.isArray(data.candles)) return;

      const formatted = data.candles
        .map(c => {
          const time = toNumber(c?.time);
          const open = toNumber(c?.open);
          const high = toNumber(c?.high);
          const low = toNumber(c?.low);
          const close = toNumber(c?.close);

          if (
            time === null ||
            open === null ||
            high === null ||
            low === null ||
            close === null
          ) {
            return null;
          }

          return { time, open, high, low, close };
        })
        .filter(Boolean)
        .sort((a, b) => a.time - b.time)
        .slice(-MAX_CANDLES);

      if (!formatted.length) return;
      if (symbolRef.current !== sym) return;

      const nextLast = formatted[formatted.length - 1];
      lastCandleRef.current = nextLast;
      syncCache(sym, formatted, nextLast);
      setCandles(formatted);
    } catch {}
  }

  /* ================= SYMBOL SWITCH ================= */

  useEffect(() => {
    symbolRef.current = symbol;

    const cache = ensureSymbolCache(symbol);
    const persisted = loadPersisted(symbol);

    const nextCandles =
      cache.candles.length ? cache.candles : persisted;

    const nextLast =
      cache.lastCandle ||
      nextCandles[nextCandles.length - 1] ||
      null;

    lastCandleRef.current = nextLast;
    setCandles(nextCandles);

    loadHistory(symbol);
  }, [symbol]);

  /* ================= MARKET WS ================= */

  useEffect(() => {
    if (!API_BASE) return;

    const token = getToken();
    if (!token) return;
    if (wsRef.current) return;

    try {
      const url = new URL(API_BASE);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      wsRef.current = ws;

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          const currentSymbol = symbolRef.current;
          const market = data?.data?.[currentSymbol];
          if (!market) return;

          const priceNow = toNumber(market.price);
          if (priceNow === null) return;

          setPrice(priceNow);
          updateCandles(currentSymbol, priceNow);
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

    } catch {}

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <div className="terminalRoot">

      <header className="tvTopBar">
        <div className="tvTopLeft">
          <select
            className="tvSelect"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {Object.entries(SYMBOL_GROUPS).map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="tvTopRight">
          <div style={{ fontWeight: 600 }}>
            {symbol} — {price ? price.toLocaleString() : "Loading"}
          </div>
        </div>
      </header>

      <main className="tvChartArea">
        <TerminalChart
          candles={candles}
          volume={[]}
          trades={[]}
          aiSignals={[]}
          pnlSeries={[]}
          height={520}
        />
      </main>

    </div>
  );
}
