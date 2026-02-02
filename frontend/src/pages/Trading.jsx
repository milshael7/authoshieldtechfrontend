// frontend/src/pages/Trading.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";
import TVChart from "../components/TVChart";

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

// Breakpoint: keep consistent + safe
const MOBILE_BP = 980;

export default function Trading({ user }) {
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  // --- Responsive / “Facebook style” tabs inside Trading ---
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= MOBILE_BP;
  });

  const TABS = useMemo(
    () => [
      { id: "terminal", label: "Terminal" }, // chart + market + ai (desktop style), mobile keeps it clean
      { id: "chart", label: "Chart" },
      { id: "log", label: "Log" },
      { id: "history", label: "History" },
      { id: "ai", label: "AI" },
      { id: "controls", label: "Controls" },
    ],
    []
  );

  const [tab, setTab] = useState("terminal");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BP);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- Trading state ---
  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper");
  const [feedStatus, setFeedStatus] = useState("Connecting…");
  const [last, setLast] = useState(65300);

  // panels toggles (desktop uses them; mobile uses tab)
  const [showMoney, setShowMoney] = useState(true);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  // Trading Controls panel
  const [showControls, setShowControls] = useState(true);
  const [ownerKey, setOwnerKey] = useState(() => localStorage.getItem(OWNER_KEY_LS) || "");
  const [resetKey, setResetKey] = useState(() => localStorage.getItem(RESET_KEY_LS) || "");
  const [cfgStatus, setCfgStatus] = useState("—");
  const [cfgBusy, setCfgBusy] = useState(false);

  // Local editable config (separate so polling doesn't clobber typing)
  const [cfgForm, setCfgForm] = useState({
    baselinePct: 0.02,
    maxPct: 0.05,
    maxTradesPerDay: 12,
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

  // Candle data for the chart
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
        while (next.length > 180) next.shift();
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

  // Load paper config once
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

  // Derived stats
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
      return `${ts} • BUY ${sym} • ${strat} • Notional ${fmtMoneyCompact(
        usd,
        2
      )} • Entry ${fmtMoney(pxv, 2)} • Entry cost ${fmtMoneyCompact(cost, 2)} • Planned hold ${hold}`;
    }

    if (type === "SELL") {
      const held = holdMs !== undefined ? fmtDur(holdMs) : "—";
      const pr = profit !== undefined ? fmtMoneyCompact(profit, 2) : "—";
      const rr = niceReason(exitReason);
      return `${ts} • SELL ${sym} • ${strat} • Exit ${fmtMoney(pxv, 2)} • Held ${held} • Result ${pr} • Exit: ${rr}`;
    }

    return `${ts} • ${type} ${sym}`;
  }

  const baselineUsd = useMemo(() => Math.max(0, equity * toNum(cfgForm.baselinePct, 0)), [cfgForm.baselinePct, equity]);
  const maxUsd = useMemo(() => Math.max(0, equity * toNum(cfgForm.maxPct, 0)), [cfgForm.maxPct, equity]);

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
        headers: { "Content-Type": "application/json", "x-reset-key": String(resetKey) },
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

  // Desktop right panel logic
  const showRightPanelDesktop = showAI && !wideChart;

  // --- Styles ---
  const baseCard = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(8px)",
  };

  const headerBar = { ...baseCard, padding: 14, marginBottom: 12 };

  const pill = {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    minWidth: 140,
  };

  const btn = (active = false) => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "rgba(122,167,255,0.22)" : "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    width: "auto",
  });

  const chip = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 12,
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  const kpiGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
    marginTop: 10,
  };

  const kpiBox = {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    minWidth: 0,
  };

  const kpiVal = {
    fontWeight: 900,
    fontSize: 18,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const kpiLbl = { marginTop: 6, fontSize: 12, opacity: 0.75 };

  // Chart height: mobile uses shorter; desktop can be tall
  const chartHeight = wideChart ? 640 : isMobile ? 420 : 560;

  // ------------------------------------------------------------
  // “Facebook-style” inside Trading:
  // Mobile shows ONE section at a time (tabs).
  // Desktop can show multi-column “Terminal”.
  // ------------------------------------------------------------
  const renderControlsPanel = () => {
    if (!(isMobile ? tab === "controls" : showControls)) return null;

    return (
      <div style={{ ...baseCard, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <b style={{ fontSize: 14 }}>AI Trading Controls (Paper)</b>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
              Equity: <b>{fmtMoneyCompact(equity, 2)}</b> • Win rate: <b>{(winRate * 100).toFixed(0)}%</b> • Config:{" "}
              <b>{cfgStatus}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn(false)} onClick={savePaperConfig} disabled={cfgBusy} type="button">
              {cfgBusy ? "Working…" : "Save Controls"}
            </button>
            <button style={btn(false)} onClick={resetPaper} disabled={cfgBusy} type="button">
              Reset Paper (key)
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          <div style={{ ...baseCard, background: "rgba(0,0,0,.18)", padding: 12 }}>
            <b style={{ fontSize: 13 }}>Trade Size</b>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
              Baseline % = normal size. Max % = ceiling size. Estimated USD uses current equity.
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Baseline %</div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={cfgForm.baselinePct}
                  onChange={(e) => setCfgForm((p) => ({ ...p, baselinePct: toNum(e.target.value, 0) }))}
                  style={inputStyle}
                  placeholder="0.02 = 2%"
                />
                <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                  Est. baseline amount: <b>{fmtMoneyCompact(baselineUsd, 2)}</b>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Max %</div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={cfgForm.maxPct}
                  onChange={(e) => setCfgForm((p) => ({ ...p, maxPct: toNum(e.target.value, 0) }))}
                  style={inputStyle}
                  placeholder="0.05 = 5%"
                />
                <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                  Est. max amount: <b>{fmtMoneyCompact(maxUsd, 2)}</b>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Max trades/day</div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="1000"
                  value={cfgForm.maxTradesPerDay}
                  onChange={(e) => setCfgForm((p) => ({ ...p, maxTradesPerDay: toInt(e.target.value, 1) }))}
                  style={inputStyle}
                  placeholder="12"
                />
                <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                  This prevents overtrading and helps reduce one-sided losing.
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...baseCard, background: "rgba(0,0,0,.18)", padding: 12 }}>
            <b style={{ fontSize: 13 }}>Keys</b>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Owner key</div>
                <input value={ownerKey} onChange={(e) => setOwnerKey(e.target.value)} style={inputStyle} placeholder="x-owner-key" />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Reset key</div>
                <input value={resetKey} onChange={(e) => setResetKey(e.target.value)} style={inputStyle} placeholder="x-reset-key" />
              </div>
              <div style={{ marginTop: 4, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
                Tip: If saving fails, backend rejected <b>x-owner-key</b>.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMarketPanel = () => {
    // Mobile: show market in Terminal tab only (keeps phone clean)
    if (isMobile && tab !== "terminal") return null;

    // Desktop: market hidden only when wideChart
    if (!isMobile && wideChart) return null;

    return (
      <div style={{ ...baseCard, padding: 12, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <b style={{ fontSize: 13 }}>Market</b>
          <span style={chip}>{symbol}</span>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <div style={kpiBox}>
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Last</div>
            <div style={{ ...kpiVal, marginTop: 6 }}>{fmtMoney(last, 2)}</div>
          </div>

          <div style={kpiBox}>
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Feed</div>
            <div style={{ marginTop: 6, fontWeight: 900 }}>{feedStatus}</div>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>Paper: {paper.running ? "ON" : "OFF"}</div>
          </div>

          {showMoney && (
            <div style={kpiBox}>
              <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Balances</div>
              <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 12, opacity: 0.9 }}>
                <div>Cash: <b>{fmtMoneyCompact(cashBal, 2)}</b></div>
                <div>Equity: <b>{fmtMoneyCompact(equity, 2)}</b></div>
                <div>Unrealized: <b>{fmtMoneyCompact(unreal, 2)}</b></div>
                <div>Status: <b>{paperStatus}</b></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChartPanel = () => {
    if (isMobile && !["terminal", "chart"].includes(tab)) return null;

    return (
      <div style={{ ...baseCard, padding: 12, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <b style={{ fontSize: 14 }}>{symbol}</b>
            <span style={chip}>Decision: <b style={{ marginLeft: 6 }}>{decision}</b></span>
            <span style={chip}>Conf: <b style={{ marginLeft: 6 }}>{pct(conf, 0)}</b></span>
            <span style={chip}>Ticks: <b style={{ marginLeft: 6 }}>{fmtCompact(ticksSeen, 0)}</b></span>
          </div>
          <span style={{ ...chip, maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis" }} title={reason}>
            Reason: <b style={{ marginLeft: 6 }}>{reason}</b>
          </span>
        </div>

        <div style={kpiGrid}>
          <div style={kpiBox}><div style={kpiVal}>{fmtCompact(wins, 0)}</div><div style={kpiLbl}>Wins</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtCompact(losses, 0)}</div><div style={kpiLbl}>Losses</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtMoneyCompact(grossProfit, 2)}</div><div style={kpiLbl}>Total Gain</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtMoneyCompact(grossLoss, 2)}</div><div style={kpiLbl}>Total Loss</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtMoneyCompact(net, 2)}</div><div style={kpiLbl}>Net P&L</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtMoneyCompact(feePaid, 2)}</div><div style={kpiLbl}>Fees</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtMoneyCompact(slip, 2)}</div><div style={kpiLbl}>Slippage</div></div>
          <div style={kpiBox}><div style={kpiVal}>{fmtMoneyCompact(spr, 2)}</div><div style={kpiLbl}>Spread</div></div>
        </div>

        {paper.position && (
          <div style={{ ...baseCard, borderColor: "rgba(122,167,255,0.35)", padding: 12, marginTop: 12 }}>
            <b>Open Position</b>
            <div style={{ marginTop: 8, opacity: 0.85, fontSize: 12, lineHeight: 1.6 }}>
              <div>
                <b>{paper.position.symbol}</b> • {paper.position.strategy || "—"} • Entry {fmtMoney(paper.position.entry, 2)}
              </div>
              <div>
                Notional {fmtMoneyCompact(paper.position.usd ?? paper.position.entryNotionalUsd, 2)} • Qty {fmtNum(paper.position.qty, 6)}
              </div>
              <div>
                Age {fmtDur(paper.position.ageMs)} • Remaining{" "}
                {paper.position.remainingMs !== null ? fmtDur(paper.position.remainingMs) : "—"}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, minWidth: 0 }}>
          <TVChart candles={candles} height={chartHeight} symbol={symbol} last={last} />
        </div>
      </div>
    );
  };

  const renderTradeLogPanel = () => {
    if (!(isMobile ? tab === "log" : showTradeLog)) return null;

    return (
      <div style={{ ...baseCard, padding: 12, minWidth: 0 }}>
        <b>Trade Log</b>
        <div style={{ marginTop: 10, maxHeight: isMobile ? 520 : 320, overflow: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
                {["Time", "Type", "Strategy", "Price", "USD", "Entry Cost", "Held", "Exit", "Net P/L"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.10)", opacity: 0.85 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(paper.trades || [])
                .slice()
                .reverse()
                .slice(0, 50)
                .map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={td}>{t.time ? new Date(t.time).toLocaleTimeString() : "—"}</td>
                    <td style={td}>{t.type || "—"}</td>
                    <td style={td}>{t.strategy || "—"}</td>
                    <td style={td}>{fmtMoney(t.price, 2)}</td>
                    <td style={td}>{t.usd !== undefined ? fmtMoneyCompact(t.usd, 2) : "—"}</td>
                    <td style={td}>{t.cost !== undefined ? fmtMoneyCompact(t.cost, 2) : "—"}</td>
                    <td style={td}>{t.holdMs !== undefined ? fmtDur(t.holdMs) : "—"}</td>
                    <td style={td}>{t.exitReason ? niceReason(t.exitReason) : t.note ? niceReason(t.note) : "—"}</td>
                    <td style={td}>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
                  </tr>
                ))}

              {(!paper.trades || paper.trades.length === 0) && (
                <tr>
                  <td style={td} colSpan={9}>No trades yet (it’s learning)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHistoryPanel = () => {
    if (!(isMobile ? tab === "history" : showHistory)) return null;

    return (
      <div style={{ ...baseCard, padding: 12, minWidth: 0 }}>
        <b>History</b>
        <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
          Scroll to review how every trade happened (entry, size, strategy, hold time, exit reason, result).
        </div>

        <div style={{ marginTop: 10, maxHeight: isMobile ? 620 : 340, overflow: "auto", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: 10, background: "rgba(0,0,0,0.18)" }}>
          {historyItems.length === 0 && <div style={{ opacity: 0.75 }}>No history yet.</div>}

          {historyItems.map((t, idx) => (
            <div key={idx} style={{ padding: "8px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", lineHeight: 1.5, fontSize: 12, opacity: 0.95 }}>
              {historyLine(t)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAIPanel = () => {
    if (!(isMobile ? tab === "ai" : showRightPanelDesktop)) return null;

    return (
      <div style={{ ...baseCard, padding: 12, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <b style={{ fontSize: 13 }}>AI Assistant</b>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Ask why it bought/sold • voice below</div>
          </div>
        </div>

        <div
          ref={logRef}
          style={{
            marginTop: 12,
            height: isMobile ? 420 : 360,
            overflow: "auto",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.18)",
            padding: 10,
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                padding: "10px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: m.from === "you" ? "rgba(122,167,255,0.10)" : "transparent",
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <b style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                {m.from === "you" ? "You" : "AutoProtect"}
              </b>
              <div style={{ fontSize: 12, opacity: 0.95, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{m.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
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
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            style={{ ...btn(false), minWidth: 110 }}
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
    );
  };

  // Desktop layout columns
  const desktopCols = useMemo(() => {
    if (wideChart) return "1fr";
    return showRightPanelDesktop ? "320px 1fr 360px" : "320px 1fr";
  }, [wideChart, showRightPanelDesktop]);

  // Mobile layout = always 1 column
  const gridCols = isMobile ? "1fr" : desktopCols;

  return (
    <div style={{ padding: 12, minWidth: 0 }}>
      {/* ======= TOP HEADER ======= */}
      <div style={headerBar}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, letterSpacing: 0.2 }}>Trading</h2>
              <span style={chip}>Feed: <b style={{ marginLeft: 6 }}>{feedStatus}</b></span>
              <span style={chip}>Last: <b style={{ marginLeft: 6 }}>{fmtMoney(last, 2)}</b></span>
              <span style={chip}>Paper: <b style={{ marginLeft: 6 }}>{paper.running ? "ON" : "OFF"}</b></span>
            </div>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
              Terminal + chart + paper trader + AI (mobile clean / desktop powerful).
            </div>
          </div>

          {/* Right-side controls (still available, but mobile stays simple) */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={pill}>
              <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Mode</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button style={btn(mode === "Live")} onClick={() => setMode("Live")} type="button">Live</button>
                <button style={btn(mode === "Paper")} onClick={() => setMode("Paper")} type="button">Paper</button>
              </div>
            </div>

            <div style={pill}>
              <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Symbol</div>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                }}
              >
                {UI_SYMBOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {!isMobile && (
              <div style={pill}>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Panels</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button style={btn(showMoney)} onClick={() => setShowMoney((v) => !v)} type="button">Money</button>
                  <button style={btn(showTradeLog)} onClick={() => setShowTradeLog((v) => !v)} type="button">Log</button>
                  <button style={btn(showHistory)} onClick={() => setShowHistory((v) => !v)} type="button">History</button>
                  <button style={btn(showControls)} onClick={() => setShowControls((v) => !v)} type="button">Controls</button>
                  <button style={btn(showAI)} onClick={() => setShowAI((v) => !v)} type="button">AI</button>
                  <button style={btn(wideChart)} onClick={() => setWideChart((v) => !v)} type="button">Wide</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Trading “file cabinet” tabs (mobile-first) */}
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);

                // keep desktop toggles in sync when clicking tabs (helps)
                if (t.id === "log") setShowTradeLog(true);
                if (t.id === "history") setShowHistory(true);
                if (t.id === "ai") setShowAI(true);
                if (t.id === "controls") setShowControls(true);
              }}
              style={btn(tab === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls panel (mobile shows only on Controls tab; desktop uses toggle) */}
      {renderControlsPanel()}

      {/* ======= MAIN LAYOUT ======= */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12, alignItems: "start", minWidth: 0 }}>
        {/* Desktop left: Market. Mobile: only inside Terminal tab */}
        {!isMobile && renderMarketPanel()}
        {isMobile && tab === "terminal" && renderMarketPanel()}

        {/* Center: Chart (Terminal + Chart tab) */}
        {renderChartPanel()}

        {/* Desktop right: AI (toggle). Mobile: AI tab */}
        {!isMobile && renderAIPanel()}
        {isMobile && tab === "ai" && renderAIPanel()}

        {/* Mobile: Log/History appear as their own pages. Desktop: appear below chart via toggles */}
        {isMobile ? (
          <>
            {renderTradeLogPanel()}
            {renderHistoryPanel()}
          </>
        ) : (
          <>
            {/* Desktop: show Log/History under the chart by rendering them after chart in same column */}
            <div style={{ gridColumn: wideChart ? "1 / -1" : "2 / 3", minWidth: 0 }}>
              {showTradeLog && renderTradeLogPanel()}
              {showHistory && renderHistoryPanel()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  padding: "10px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
};

const td = {
  padding: 10,
  verticalAlign: "top",
  opacity: 0.92,
};
