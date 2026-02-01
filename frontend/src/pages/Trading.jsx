// frontend/src/pages/Trading.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim();
}

// ---- number formatting ----
function fmtNum(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtMoney(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return "$" + x.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtCompact(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax >= 1e12) return (x / 1e12).toFixed(digits) + "t";
  if (ax >= 1e9) return (x / 1e9).toFixed(digits) + "b";
  if (ax >= 1e6) return (x / 1e6).toFixed(digits) + "m";
  if (ax >= 1e3) return (x / 1e3).toFixed(digits) + "k";
  return fmtNum(x, digits);
}
function fmtMoneyCompact(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (ax >= 1e12) return `${sign}$${(ax / 1e12).toFixed(digits)}t`;
  if (ax >= 1e9) return `${sign}$${(ax / 1e9).toFixed(digits)}b`;
  if (ax >= 1e6) return `${sign}$${(ax / 1e6).toFixed(digits)}m`;
  if (ax >= 1e3) return `${sign}$${(ax / 1e3).toFixed(digits)}k`;
  return fmtMoney(x, digits);
}
function pct(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}
function fmtDur(ms) {
  const x = Number(ms);
  if (!Number.isFinite(x) || x < 0) return "—";
  if (x < 1000) return `${Math.round(x)}ms`;
  const s = Math.floor(x / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}
function niceReason(r) {
  const x = String(r || "").toLowerCase();
  if (!x) return "—";
  if (x.includes("take_profit") || x === "tp_hit") return "Take Profit";
  if (x.includes("stop_loss") || x === "sl_hit") return "Stop Loss";
  if (x.includes("expiry") || x.includes("expired") || x.includes("time")) return "Time Expired";
  return r;
}
function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}
function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const OWNER_KEY_LS = "as_owner_key";
const RESET_KEY_LS = "as_reset_key";

export default function Trading({ user }) {
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper");
  const [feedStatus, setFeedStatus] = useState("Connecting…");
  const [last, setLast] = useState(65300);

  const [showMoney, setShowMoney] = useState(true);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  // ✅ Trading Controls panel
  const [showControls, setShowControls] = useState(true);
  const [ownerKey, setOwnerKey] = useState(() => localStorage.getItem(OWNER_KEY_LS) || "");
  const [resetKey, setResetKey] = useState(() => localStorage.getItem(RESET_KEY_LS) || "");
  const [cfgStatus, setCfgStatus] = useState("—");
  const [cfgBusy, setCfgBusy] = useState(false);

  // Local editable config (separate so polling doesn't clobber typing)
  const [cfgForm, setCfgForm] = useState({
    baselinePct: 0.02, // 2%
    maxPct: 0.05, // 5%
    maxTradesPerDay: 12, // 12 trades/day
  });

  const [paper, setPaper] = useState({
    running: false,
    cashBalance: 0,
    equity: 0,
    pnl: 0,
    unrealizedPnL: 0,
    trades: [],
    position: null,
    learnStats: null,
    realized: null,
    costs: null,
    limits: null,
    config: null,
  });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  const [messages, setMessages] = useState(() => [
    { from: "ai", text: "AutoProtect ready. Ask me about wins/losses, P&L, open position, and why I entered." },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  const canvasRef = useRef(null);
  const [candles, setCandles] = useState(() => {
    const base = 65300;
    const out = [];
    let p = base;
    let t = Math.floor(Date.now() / 1000);
    for (let i = 80; i > 0; i--) {
      const time = t - i * 5;
      const o = p;
      const move = (Math.random() - 0.5) * 60;
      const c = o + move;
      const hi = Math.max(o, c) + Math.random() * 30;
      const lo = Math.min(o, c) - Math.random() * 30;
      out.push({ time, open: o, high: hi, low: lo, close: c });
      p = c;
    }
    return out;
  });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const applyTick = (price, nowMs) => {
    setLast(Number(price.toFixed(2)));
    setCandles((prev) => {
      const bucketSec = 5;
      const nowSec = Math.floor(nowMs / 1000);
      const bucketTime = Math.floor(nowSec / bucketSec) * bucketSec;

      const next = [...prev];
      const lastC = next[next.length - 1];

      if (!lastC || lastC.time !== bucketTime) {
        const o = lastC ? lastC.close : price;
        next.push({
          time: bucketTime,
          open: o,
          high: Math.max(o, price),
          low: Math.min(o, price),
          close: price,
        });
        while (next.length > 120) next.shift();
        return next;
      }

      lastC.high = Math.max(lastC.high, price);
      lastC.low = Math.min(lastC.low, price);
      lastC.close = price;
      next[next.length - 1] = { ...lastC };
      return next;
    });
  };

  // ---- WebSocket feed ----
  useEffect(() => {
    let ws;
    let fallbackTimer;

    const base = apiBase();
    const wsBase = base
      ? base.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://")
      : "";

    const wantedBackendSymbol = UI_TO_BACKEND[symbol] || symbol;

    const startFallback = () => {
      setFeedStatus("Disconnected (demo fallback)");
      let price = last || (symbol === "ETHUSD" ? 3500 : 65300);
      fallbackTimer = setInterval(() => {
        const delta = (Math.random() - 0.5) * (symbol === "ETHUSD" ? 6 : 40);
        price = Math.max(1, price + delta);
        applyTick(price, Date.now());
      }, 900);
    };

    try {
      if (!wsBase) {
        startFallback();
        return () => clearInterval(fallbackTimer);
      }

      setFeedStatus("Connecting…");
      ws = new WebSocket(`${wsBase}/ws/market`);
      ws.onopen = () => setFeedStatus("Connected");
      ws.onclose = () => startFallback();
      ws.onerror = () => startFallback();

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const isTick = msg?.type === "tick" || (msg && msg.symbol && msg.price);
          if (isTick && msg.symbol === wantedBackendSymbol) {
            applyTick(Number(msg.price), Number(msg.ts || Date.now()));
          }
        } catch {}
      };
    } catch {
      startFallback();
    }

    return () => {
      try {
        if (ws) ws.close();
      } catch {}
      clearInterval(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // ---- paper status polling ----
  useEffect(() => {
    let t;
    const base = apiBase();
    if (!base) {
      setPaperStatus("Missing VITE_API_BASE");
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${base}/api/paper/status`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPaper(data);
        setPaperStatus("OK");
      } catch {
        setPaperStatus("Error loading paper status");
      }
    };

    fetchStatus();
    t = setInterval(fetchStatus, 2000);
    return () => clearInterval(t);
  }, []);

  // ✅ Load paper config once (sync form once, no clobber while typing)
  useEffect(() => {
    const base = apiBase();
    if (!base) return;

    let cancelled = false;

    const loadCfg = async () => {
      try {
        const res = await fetch(`${base}/api/paper/config`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        const cfg = data?.owner || data?.config || data || {};
        if (cancelled) return;

        setCfgForm((prev) => ({
          baselinePct: Number.isFinite(Number(cfg.baselinePct)) ? Number(cfg.baselinePct) : prev.baselinePct,
          maxPct: Number.isFinite(Number(cfg.maxPct)) ? Number(cfg.maxPct) : prev.maxPct,
          maxTradesPerDay: Number.isFinite(Number(cfg.maxTradesPerDay))
            ? Number(cfg.maxTradesPerDay)
            : prev.maxTradesPerDay,
        }));

        setCfgStatus("Loaded");
      } catch (e) {
        if (!cancelled) setCfgStatus(e?.message || "Failed to load");
      }
    };

    loadCfg();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- draw candles ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = (cssH * i) / 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    const view = candles.slice(-80);
    if (!view.length) return;

    const highs = view.map((c) => c.high);
    const lows = view.map((c) => c.low);
    const maxP = Math.max(...highs);
    const minP = Math.min(...lows);

    const pad = (maxP - minP) * 0.06 || 10;
    const top = maxP + pad;
    const bot = minP - pad;

    const px = (p) => {
      const r = (top - p) / (top - bot);
      return clamp(r, 0, 1) * (cssH - 20) + 10;
    };

    const w = cssW;
    const n = view.length;
    const gap = 2;
    const candleW = Math.max(4, Math.floor((w - 20) / n) - gap);
    let x = 10;

    for (let i = 0; i < n; i++) {
      const c = view[i];
      const openY = px(c.open);
      const closeY = px(c.close);
      const highY = px(c.high);
      const lowY = px(c.low);

      const up = c.close >= c.open;

      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, highY);
      ctx.lineTo(x + candleW / 2, lowY);
      ctx.stroke();

      ctx.fillStyle = up ? "rgba(43,213,118,0.85)" : "rgba(255,90,95,0.85)";
      const y = Math.min(openY, closeY);
      const h = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x, y, candleW, h);

      x += candleW + gap;
    }

    const lastY = px(last);
    ctx.strokeStyle = "rgba(122,167,255,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(cssW, lastY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [candles, last]);

  async function sendToAI(text) {
    const clean = (text || "").trim();
    if (!clean) return;

    setMessages((prev) => [...prev, { from: "you", text: clean }]);

    const base = apiBase();
    if (!base) {
      setMessages((prev) => [...prev, { from: "ai", text: "Backend URL missing. Set VITE_API_BASE on Vercel." }]);
      return;
    }

    try {
      const context = {
        symbol,
        mode,
        last,
        paper: {
          running: paper.running,
          cashBalance: paper.cashBalance,
          equity: paper.equity,
          pnl: paper.pnl,
          unrealizedPnL: paper.unrealizedPnL,
          wins: paper.realized?.wins ?? 0,
          losses: paper.realized?.losses ?? 0,
          grossProfit: paper.realized?.grossProfit ?? 0,
          grossLoss: paper.realized?.grossLoss ?? 0,
          net: paper.realized?.net ?? paper.pnl ?? 0,
          feePaid: paper.costs?.feePaid ?? 0,
          slippageCost: paper.costs?.slippageCost ?? 0,
          spreadCost: paper.costs?.spreadCost ?? 0,
          ticksSeen: paper.learnStats?.ticksSeen ?? 0,
          confidence: paper.learnStats?.confidence ?? 0,
          decision: paper.learnStats?.decision ?? "WAIT",
          decisionReason: paper.learnStats?.lastReason ?? "—",
          position: paper.position || null,
          config: paper.owner || paper.config || null,
        },
      };

      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: clean, context }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setMessages((prev) => [...prev, { from: "ai", text: "AI error: " + msg }]);
        return;
      }

      const reply = data?.reply ?? "(No reply from AI)";
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "ai", text: "Network error talking to AI backend." }]);
    }
  }

  const ticksSeen = paper.learnStats?.ticksSeen ?? 0;
  const conf = paper.learnStats?.confidence ?? 0;
  const decision = paper.learnStats?.decision ?? "WAIT";
  const reason = paper.learnStats?.lastReason ?? "—";

  const wins = paper.realized?.wins ?? 0;
  const losses = paper.realized?.losses ?? 0;
  const grossProfit = paper.realized?.grossProfit ?? 0;
  const grossLoss = paper.realized?.grossLoss ?? 0;
  const net = paper.realized?.net ?? paper.pnl ?? 0;

  const feePaid = paper.costs?.feePaid ?? 0;
  const slip = paper.costs?.slippageCost ?? 0;
  const spr = paper.costs?.spreadCost ?? 0;

  const cashBal = paper.cashBalance ?? 0;
  const equity = paper.equity ?? cashBal;
  const unreal = paper.unrealizedPnL ?? 0;

  const historyItems = (paper.trades || []).slice().reverse().slice(0, 240);

  function historyLine(t) {
    const ts = t?.time ? new Date(t.time).toLocaleTimeString() : "—";
    const sym = t?.symbol || "—";
    const type = t?.type || "—";
    const strat = t?.strategy ? String(t.strategy) : "—";
    const pxv = Number(t?.price);
    const usd = t?.usd;
    const cost = t?.cost;
    const profit = t?.profit;
    const holdMs = t?.holdMs;
    const exitReason = t?.exitReason || t?.note;

    if (type === "BUY") {
      const hold = t?.holdMs ? fmtDur(t.holdMs) : "—";
      return `${ts} • BUY ${sym} • ${strat} • Notional ${fmtMoneyCompact(usd, 2)} • Entry ${fmtMoney(
        pxv,
        2
      )} • Entry cost ${fmtMoneyCompact(cost, 2)} • Planned hold ${hold}`;
    }

    if (type === "SELL") {
      const held = holdMs !== undefined ? fmtDur(holdMs) : "—";
      const pr = profit !== undefined ? fmtMoneyCompact(profit, 2) : "—";
      const rr = niceReason(exitReason);
      return `${ts} • SELL ${sym} • ${strat} • Exit ${fmtMoney(pxv, 2)} • Held ${held} • Result ${pr} • Exit: ${rr}`;
    }

    return `${ts} • ${type} ${sym}`;
  }

  // ✅ Derived “amount” display based on equity
  const baselineUsd = useMemo(() => {
    const bp = toNum(cfgForm.baselinePct, 0);
    return Math.max(0, equity * bp);
  }, [cfgForm.baselinePct, equity]);

  const maxUsd = useMemo(() => {
    const mp = toNum(cfgForm.maxPct, 0);
    return Math.max(0, equity * mp);
  }, [cfgForm.maxPct, equity]);

  // ✅ Save config (one-shot)
  const savePaperConfig = async () => {
    const base = apiBase();
    if (!base) return alert("Missing VITE_API_BASE");

    const baselinePct = clamp(toNum(cfgForm.baselinePct, 0.02), 0, 1);
    const maxPct = clamp(toNum(cfgForm.maxPct, 0.05), 0, 1);
    const maxTradesPerDay = clamp(toInt(cfgForm.maxTradesPerDay, 12), 1, 1000);

    if (maxPct < baselinePct) return alert("Max % must be >= Baseline %");

    setCfgBusy(true);
    setCfgStatus("Saving…");
    try {
      localStorage.setItem(OWNER_KEY_LS, ownerKey || "");

      const res = await fetch(`${base}/api/paper/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ownerKey ? { "x-owner-key": String(ownerKey) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ baselinePct, maxPct, maxTradesPerDay }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setCfgStatus("Saved ✅");

      setPaper((prev) => ({
        ...prev,
        config: { ...(prev.config || {}), baselinePct, maxPct, maxTradesPerDay },
      }));
    } catch (e) {
      setCfgStatus("Save failed");
      alert(e?.message || "Failed to save config");
    } finally {
      setCfgBusy(false);
      setTimeout(() => setCfgStatus((s) => (s === "Saved ✅" ? "OK" : s)), 800);
    }
  };

  // ✅ Reset paper session (one-shot)
  const resetPaper = async () => {
    const base = apiBase();
    if (!base) return alert("Missing VITE_API_BASE");
    if (!resetKey) return alert("Enter reset key first.");

    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Reset paper trading stats + trades?")) return;

    setCfgBusy(true);
    try {
      localStorage.setItem(RESET_KEY_LS, resetKey || "");

      const res = await fetch(`${base}/api/paper/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reset-key": String(resetKey),
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      alert("Paper reset ✅");
    } catch (e) {
      alert(e?.message || "Reset failed");
    } finally {
      setCfgBusy(false);
    }
  };

  const winRate = useMemo(() => {
    const w = Number(wins) || 0;
    const l = Number(losses) || 0;
    const total = w + l;
    if (!total) return 0;
    return w / total;
  }, [wins, losses]);

  // ✅ Right sidebar only if AI visible and not wide-chart
  const showRightPanel = showAI && !wideChart;

  // ✅ Layout columns (now we actually apply styles.css grid feel)
  const layoutCols = useMemo(() => {
    if (wideChart) return "1fr";
    if (showRightPanel) return "1.35fr 0.9fr"; // chart + AI terminal
    return "1fr"; // chart only
  }, [wideChart, showRightPanel]);

  return (
    <div className="tradeWrap">
      {/* ======= TOP HEADER ======= */}
      <div className="card tradeTop">
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, letterSpacing: 0.2 }}>Trading Room</h2>

            <span className="badge">
              Feed: <b>{feedStatus}</b>
            </span>

            <span className="badge">
              Last: <b>{fmtMoney(last, 2)}</b>
            </span>

            <span className={`badge ${paper.running ? "ok" : "warn"}`}>
              Paper: <b>{paper.running ? "ON" : "OFF"}</b>
            </span>
          </div>

          <div style={{ marginTop: 6 }}>
            <small>Live feed + candles + paper trader + AI explanations.</small>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="pill">
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>Mode</div>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className={mode === "Live" ? "active" : ""} onClick={() => setMode("Live")} type="button">
                Live
              </button>
              <button className={mode === "Paper" ? "active" : ""} onClick={() => setMode("Paper")} type="button">
                Paper
              </button>
            </div>
          </div>

          <div className="pill">
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>Symbol</div>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ marginTop: 8 }}>
              {UI_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="pill">
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>Panels</div>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className={showMoney ? "active" : ""} onClick={() => setShowMoney((v) => !v)} type="button">
                Money
              </button>
              <button className={showTradeLog ? "active" : ""} onClick={() => setShowTradeLog((v) => !v)} type="button">
                Log
              </button>
              <button className={showHistory ? "active" : ""} onClick={() => setShowHistory((v) => !v)} type="button">
                History
              </button>
              <button className={showControls ? "active" : ""} onClick={() => setShowControls((v) => !v)} type="button">
                Controls
              </button>
              <button className={showAI ? "active" : ""} onClick={() => setShowAI((v) => !v)} type="button">
                AI
              </button>
              <button className={wideChart ? "active" : ""} onClick={() => setWideChart((v) => !v)} type="button">
                Wide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======= CONTROLS ======= */}
      {showControls && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <b style={{ fontSize: 14 }}>AI Trading Controls (Paper)</b>
              <div style={{ marginTop: 6 }}>
                <small>
                  Equity: <b>{fmtMoneyCompact(equity, 2)}</b> • Win rate: <b>{(winRate * 100).toFixed(0)}%</b> • Config:{" "}
                  <b>{cfgStatus}</b>
                </small>
              </div>
            </div>

            <div className="actions" style={{ minWidth: 320 }}>
              <button onClick={savePaperConfig} disabled={cfgBusy} type="button">
                {cfgBusy ? "Working…" : "Save Controls"}
              </button>
              <button onClick={resetPaper} disabled={cfgBusy} type="button">
                Reset Paper (key)
              </button>
            </div>
          </div>

          <div className="grid" style={{ marginTop: 14 }}>
            <div className="card" style={{ padding: 12 }}>
              <b style={{ fontSize: 13 }}>Trade Size</b>
              <div style={{ marginTop: 6 }}>
                <small>Baseline % = normal size. Max % = ceiling. Estimated USD uses current equity.</small>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Baseline %</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={cfgForm.baselinePct}
                    onChange={(e) => setCfgForm((p) => ({ ...p, baselinePct: toNum(e.target.value, 0) }))}
                    placeholder="0.02 = 2%"
                  />
                  <small>
                    Est. baseline amount: <b>{fmtMoneyCompact(baselineUsd, 2)}</b>
                  </small>
                </div>

                <div>
                  <label style={labelStyle}>Max %</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={cfgForm.maxPct}
                    onChange={(e) => setCfgForm((p) => ({ ...p, maxPct: toNum(e.target.value, 0) }))}
                    placeholder="0.05 = 5%"
                  />
                  <small>
                    Est. max amount: <b>{fmtMoneyCompact(maxUsd, 2)}</b>
                  </small>
                </div>

                <div>
                  <label style={labelStyle}>Max trades/day</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="1000"
                    value={cfgForm.maxTradesPerDay}
                    onChange={(e) => setCfgForm((p) => ({ ...p, maxTradesPerDay: toInt(e.target.value, 1) }))}
                    placeholder="12"
                  />
                  <small>This prevents overtrading and helps reduce one-sided losing.</small>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <b style={{ fontSize: 13 }}>Keys</b>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Owner key</label>
                  <input value={ownerKey} onChange={(e) => setOwnerKey(e.target.value)} placeholder="x-owner-key" />
                </div>
                <div>
                  <label style={labelStyle}>Reset key</label>
                  <input value={resetKey} onChange={(e) => setResetKey(e.target.value)} placeholder="x-reset-key" />
                </div>
                <small>
                  Tip: If saving fails, backend rejected <b>x-owner-key</b>.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= MAIN TERMINAL GRID ======= */}
      <div
        className="tradeGrid"
        style={{
          gridTemplateColumns: layoutCols,
          marginTop: 14,
        }}
      >
        {/* ======= CHART / STATS PANEL ======= */}
        <div className="card tradeChart">
          {/* Top row: decision */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="badge">{symbol}</span>
              <span className="badge">
                Decision: <b>{decision}</b>
              </span>
              <span className="badge">
                Conf: <b>{pct(conf, 0)}</b>
              </span>
              <span className="badge">
                Ticks: <b>{fmtCompact(ticksSeen, 0)}</b>
              </span>
            </div>

            <span className="badge" title={reason} style={{ maxWidth: 520, overflow: "hidden", textOverflow: "ellipsis" }}>
              Reason: <b>{reason}</b>
            </span>
          </div>

          {/* KPI grid (NOW USING CSS .kpi/.kpiBox styles you already wrote) */}
          <div className="kpi" style={{ marginTop: 12 }}>
            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(wins, 0)}</div>
              <div className="kpiLbl">Wins</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(losses, 0)}</div>
              <div className="kpiLbl">Losses</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(grossProfit, 2)}</div>
              <div className="kpiLbl">Total Gain</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(grossLoss, 2)}</div>
              <div className="kpiLbl">Total Loss</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(net, 2)}</div>
              <div className="kpiLbl">Net P&L</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(feePaid, 2)}</div>
              <div className="kpiLbl">Fees</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(slip, 2)}</div>
              <div className="kpiLbl">Slippage</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(spr, 2)}</div>
              <div className="kpiLbl">Spread</div>
            </div>
          </div>

          {showMoney && (
            <div className="card" style={{ marginTop: 14, padding: 12 }}>
              <b style={{ fontSize: 13 }}>Balances</b>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <small>
                  Cash: <b>{fmtMoneyCompact(cashBal, 2)}</b>
                </small>
                <small>
                  Equity: <b>{fmtMoneyCompact(equity, 2)}</b>
                </small>
                <small>
                  Unrealized: <b>{fmtMoneyCompact(unreal, 2)}</b>
                </small>
                <small>
                  Status: <b>{paperStatus}</b>
                </small>
              </div>
            </div>
          )}

          {paper.position && (
            <div className="card" style={{ marginTop: 14, padding: 12, borderColor: "rgba(122,167,255,0.35)" }}>
              <b>Open Position</b>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <small>
                  <b>{paper.position.symbol}</b> • {paper.position.strategy || "—"} • Entry{" "}
                  <b>{fmtMoney(paper.position.entry, 2)}</b>
                </small>
                <small>
                  Notional <b>{fmtMoneyCompact(paper.position.usd ?? paper.position.entryNotionalUsd, 2)}</b> • Qty{" "}
                  <b>{fmtNum(paper.position.qty, 6)}</b>
                </small>
                <small>
                  Age <b>{fmtDur(paper.position.ageMs)}</b> • Remaining{" "}
                  <b>{paper.position.remainingMs !== null ? fmtDur(paper.position.remainingMs) : "—"}</b>
                </small>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ marginTop: 14, height: wideChart ? 620 : 520 }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.20)",
                display: "block",
              }}
            />
          </div>

          {/* Trade Log */}
          {showTradeLog && (
            <div style={{ marginTop: 14 }}>
              <b>Trade Log</b>
              <div className="tableWrap" style={{ marginTop: 10 }}>
                <table className="table tableSticky">
                  <thead>
                    <tr>
                      {["Time", "Type", "Strategy", "Price", "USD", "Entry Cost", "Held", "Exit", "Net P/L"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(paper.trades || [])
                      .slice()
                      .reverse()
                      .slice(0, 24)
                      .map((t, i) => (
                        <tr key={i}>
                          <td>{t.time ? new Date(t.time).toLocaleTimeString() : "—"}</td>
                          <td>{t.type || "—"}</td>
                          <td>{t.strategy || "—"}</td>
                          <td>{fmtMoney(t.price, 2)}</td>
                          <td>{t.usd !== undefined ? fmtMoneyCompact(t.usd, 2) : "—"}</td>
                          <td>{t.cost !== undefined ? fmtMoneyCompact(t.cost, 2) : "—"}</td>
                          <td>{t.holdMs !== undefined ? fmtDur(t.holdMs) : "—"}</td>
                          <td>{t.exitReason ? niceReason(t.exitReason) : t.note ? niceReason(t.note) : "—"}</td>
                          <td>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
                        </tr>
                      ))}

                    {(!paper.trades || paper.trades.length === 0) && (
                      <tr>
                        <td colSpan={9}>No trades yet (it’s learning)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div style={{ marginTop: 14 }}>
              <b>History</b>
              <div style={{ marginTop: 6 }}>
                <small>Scroll to review how every trade happened (entry, size, strategy, hold time, exit reason, result).</small>
              </div>

              <div className="card" style={{ marginTop: 10, padding: 10, maxHeight: 340, overflow: "auto" }}>
                {historyItems.length === 0 && <div className="muted">No history yet.</div>}

                {historyItems.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      lineHeight: 1.5,
                      fontSize: 12,
                      opacity: 0.95,
                    }}
                  >
                    {historyLine(t)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ======= AI TERMINAL PANEL ======= */}
        {showRightPanel && (
          <div className="card tradeAI">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <b style={{ fontSize: 13 }}>AI Assistant</b>
                <div style={{ marginTop: 4 }}>
                  <small>Ask why it bought/sold • voice below</small>
                </div>
              </div>

              <span className="badge ok">AutoProtect</span>
            </div>

            <div ref={logRef} className="chatLog" style={{ marginTop: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                  <b style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                    {m.from === "you" ? "You" : "AutoProtect"}
                  </b>
                  <div style={{ fontSize: 12, opacity: 0.95, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="chatBox">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask: why did you enter? what strategy? what’s next?"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendToAI(input);
                    setInput("");
                  }
                }}
              />
              <button
                style={{ width: 120 }}
                onClick={() => {
                  sendToAI(input);
                  setInput("");
                }}
                type="button"
              >
                Send
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <VoiceAI title="AutoProtect Voice" endpoint="/api/ai/chat" getContext={() => ({ symbol, mode, last, paper })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, opacity: 0.75, fontWeight: 900, display: "block", marginBottom: 6 };
