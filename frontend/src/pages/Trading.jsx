Bet — resend your current trading.jsx and I’ll finish it clean.

But so you don’t have to wait on me to “guess” what you already changed, here’s what I’m gonna do the right way:
	1.	You paste your current trading.jsx (exactly what’s in GitHub right now).
	2.	I’ll send you back ONE full finished trading.jsx you can replace بالكامل (no small edits).

In the meantime (so you can see what “finished” looks like), here’s the completed Trading.jsx version that includes:
	•	✅ Paper stats + learning stats (ticks/confidence/decision/reason)
	•	✅ Market WS feed
	•	✅ AI chat + VoiceAI
	•	✅ Stage C Live Trading panel (status + toggle mode + dry-run + arm/disarm + test order)
	•	✅ Fixes the “invalid token” pain by attaching a token if you have one saved

✅ FULL src/pages/trading.jsx (replace whole file)

import React, { useEffect, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim()
  );
}

// ---- auth helpers (prevents "invalid token" if your backend expects auth) ----
function getToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("access_token") ||
      ""
    );
  } catch {
    return "";
  }
}

function authHeaders(extra = {}) {
  const t = getToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra
  };
}

// ---- number formatting ----
function fmtNum(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
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

function pct(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}

export default function Trading({ user }) {
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper");
  const [feedStatus, setFeedStatus] = useState("Connecting…");
  const [last, setLast] = useState(65300);

  const [showMoney, setShowMoney] = useState(true);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  // ---- paper status ----
  const [paper, setPaper] = useState({
    running: false,
    balance: 0,
    pnl: 0,
    trades: [],
    position: null,
    learnStats: null,
    limits: null,
    config: null,
  });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  // ---- live status (Stage C) ----
  const [live, setLive] = useState({
    ok: false,
    enabled: false,
    dryRun: true,
    armed: false,
    keysPresent: false,
    exchange: "kraken",
    note: "",
  });
  const [liveStatus, setLiveStatus] = useState("Loading…");
  const [liveMsg, setLiveMsg] = useState("");

  // ---- AI chat ----
  const [messages, setMessages] = useState(() => ([
    { from: "ai", text: "AutoProtect ready. Ask me about learning stats, paper trades, and risk rules." }
  ]));
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  // ---- chart ----
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
          close: price
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

  // ---- WS market feed ----
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
          if (msg?.type === "tick" && msg.symbol === wantedBackendSymbol) {
            applyTick(Number(msg.price), Number(msg.ts || Date.now()));
          }
        } catch {}
      };
    } catch {
      startFallback();
    }

    return () => {
      try { if (ws) ws.close(); } catch {}
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
        const res = await fetch(`${base}/api/paper/status`, {
          headers: authHeaders(),
          // keep cookies if you use them; harmless otherwise
          credentials: "include",
        });
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

  // ---- live status polling (Stage C) ----
  useEffect(() => {
    let t;
    const base = apiBase();
    if (!base) {
      setLiveStatus("Missing VITE_API_BASE");
      return;
    }

    const fetchLive = async () => {
      try {
        const res = await fetch(`${base}/api/live/status`, {
          headers: authHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLive({ ...live, ...data });
        setLiveStatus("OK");
      } catch (e) {
        setLiveStatus("Error loading live status");
      }
    };

    fetchLive();
    t = setInterval(fetchLive, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const highs = view.map(c => c.high);
    const lows = view.map(c => c.low);
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

  // ---- AI chat (backend) ----
  async function sendToAI(text) {
    const clean = (text || "").trim();
    if (!clean) return;

    setMessages(prev => [...prev, { from: "you", text: clean }]);

    const base = apiBase();
    if (!base) {
      setMessages(prev => [...prev, { from: "ai", text: "Backend URL missing. Set VITE_API_BASE on Vercel." }]);
      return;
    }

    try {
      const context = {
        symbol,
        mode,
        last,
        paper: {
          running: paper.running,
          balance: paper.balance,
          pnl: paper.pnl,
          tradesCount: paper.trades?.length || 0,
          ticksSeen: paper.learnStats?.ticksSeen ?? paper.ticksSeen ?? 0,
          confidence: paper.learnStats?.confidence ?? paper.confidence ?? 0,
          decision: paper.learnStats?.decision ?? paper.decision ?? "WAIT",
          decisionReason: paper.learnStats?.lastReason ?? paper.decisionReason ?? "—",
        },
        live: {
          enabled: !!live.enabled,
          dryRun: !!live.dryRun,
          armed: !!live.armed,
          keysPresent: !!live.keysPresent,
        }
      };

      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ message: clean, context })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setMessages(prev => [...prev, { from: "ai", text: "AI error: " + msg }]);
        return;
      }

      const reply = data?.reply ?? "(No reply from AI)";
      setMessages(prev => [...prev, { from: "ai", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { from: "ai", text: "Network error talking to AI backend." }]);
    }
  }

  // ---- Live actions (Stage C) ----
  async function liveAction(path, body = {}) {
    const base = apiBase();
    if (!base) return setLiveMsg("Missing VITE_API_BASE");
    setLiveMsg("Working…");
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLiveMsg(data?.error || data?.message || `HTTP ${res.status}`);
        return;
      }
      setLiveMsg(data?.message || "OK");
    } catch {
      setLiveMsg("Network error");
    }
  }

  const showRightPanel = showAI && !wideChart;

  const ticksSeen = paper.learnStats?.ticksSeen ?? 0;
  const conf = paper.learnStats?.confidence ?? 0;
  const decision = paper.learnStats?.decision ?? "WAIT";
  const reason = paper.learnStats?.lastReason ?? "—";

  return (
    <div className="tradeWrap">
      <div className="card">
        <div className="tradeTop">
          <div>
            <h2 style={{ margin: 0 }}>Trading Terminal</h2>
            <small className="muted">Paper learning + Live readiness • everything visible, no guessing.</small>
          </div>

          <div className="actions">
            <div className="pill">
              <small>Mode</small>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className={mode === "Live" ? "active" : ""} onClick={() => setMode("Live")}>Live</button>
                <button className={mode === "Paper" ? "active" : ""} onClick={() => setMode("Paper")}>Paper</button>
              </div>
            </div>

            <div className="pill">
              <small>Symbol</small>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ marginTop: 6 }}>
                {UI_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="pill">
              <small>Feed</small>
              <div style={{ marginTop: 6, fontWeight: 800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {feedStatus}
              </div>
              <small className="muted">Last: {fmtCompact(last, 2)}</small>
            </div>

            <div className="pill">
              <small>Panels</small>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <button className={showMoney ? "active" : ""} onClick={() => setShowMoney(v => !v)} style={{ width: "auto" }}>
                  Money
                </button>
                <button className={showTradeLog ? "active" : ""} onClick={() => setShowTradeLog(v => !v)} style={{ width: "auto" }}>
                  Log
                </button>
                <button className={showAI ? "active" : ""} onClick={() => setShowAI(v => !v)} style={{ width: "auto" }}>
                  AI
                </button>
                <button className={wideChart ? "active" : ""} onClick={() => setWideChart(v => !v)} style={{ width: "auto" }}>
                  Wide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tradeGrid" style={{ gridTemplateColumns: showRightPanel ? "1.8fr 1fr" : "1fr" }}>
        {/* LEFT */}
        <div className="card tradeChart">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <b>{symbol}</b>
            <span className={`badge ${paper.running ? "ok" : ""}`}>Paper Trader: {paper.running ? "ON" : "OFF"}</span>
          </div>

          {/* Learning strip */}
          <div style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10
          }}>
            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(ticksSeen, 0)}</div>
              <div className="kpiLbl">Ticks Seen</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{pct(conf, 0)}</div>
              <div className="kpiLbl">Confidence</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{decision}</div>
              <div className="kpiLbl">Decision</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal" title={reason} style={{ fontSize: 14 }}>
                <span style={{ display:"block", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {reason}
                </span>
              </div>
              <div className="kpiLbl">Reason</div>
            </div>
          </div>

          {showMoney && (
            <div className="kpi">
              <div>
                <b>${fmtCompact(paper.balance || 0, 2)}</b>
                <span>Paper Balance</span>
              </div>
              <div>
                <b>${fmtCompact(paper.pnl || 0, 2)}</b>
                <span>P / L</span>
              </div>
              <div>
                <b>{fmtCompact(paper.trades?.length || 0, 0)}</b>
                <span>Recent Trades</span>
              </div>
              <div>
                <b style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{paperStatus}</b>
                <span>Status</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12, height: 520 }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.20)"
              }}
            />
          </div>

          {showTradeLog && (
            <div style={{ marginTop: 12 }}>
              <b>Trade Log</b>
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paper.trades || []).slice().reverse().slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <td>{new Date(t.time).toLocaleTimeString()}</td>
                        <td>{t.type}</td>
                        <td>{fmtNum(t.price, 2)}</td>
                        <td>{t.profit !== undefined ? fmtNum(t.profit, 2) : "-"}</td>
                      </tr>
                    ))}
                    {(!paper.trades || paper.trades.length === 0) && (
                      <tr><td colSpan="4" className="muted">No trades yet (it’s learning)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        {showRightPanel && (
          <div className="card tradeAI">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <b>AI Panel</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  Chat + Voice + Live control panel (Stage C)
                </div>
              </div>
            </div>

            {/* LIVE panel (Stage C) */}
            <div style={{ marginTop: 12 }} className="pill">
              <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center" }}>
                <b>Live Trading</b>
                <span className={`badge ${live.keysPresent ? "ok" : "warn"}`}>
                  Keys: {live.keysPresent ? "Present" : "Missing"}
                </span>
              </div>

              <div style={{ marginTop: 8, fontSize: 13, opacity: .9 }}>
                <div>Status: <b>{liveStatus}</b></div>
                <div>Enabled: <b>{String(!!live.enabled)}</b> • Dry-run: <b>{String(!!live.dryRun)}</b> • Armed: <b>{String(!!live.armed)}</b></div>
                {live.note ? <div className="muted">{live.note}</div> : null}
              </div>

              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:10 }}>
                <button style={{ width:"auto" }} onClick={() => liveAction("/api/live/mode", { enabled: true })}>
                  Enable Live
                </button>
                <button style={{ width:"auto" }} onClick={() => liveAction("/api/live/mode", { enabled: false })}>
                  Disable Live
                </button>
                <button style={{ width:"auto" }} onClick={() => liveAction("/api/live/dryrun", { dryRun: true })}>
                  Dry-run ON
                </button>
                <button style={{ width:"auto" }} onClick={() => liveAction("/api/live/dryrun", { dryRun: false })}>
                  Dry-run OFF
                </button>
                <button style={{ width:"auto" }} onClick={() => liveAction("/api/live/arm", { armed: true })}>
                  ARM
                </button>
                <button style={{ width:"auto" }} onClick={() => liveAction("/api/live/arm", { armed: false })}>
                  DISARM
                </button>
                <button
                  style={{ width:"auto" }}
                  onClick={() => liveAction("/api/live/order", {
                    symbol: UI_TO_BACKEND[symbol] || symbol,
                    side: "BUY",
                    usd: 50
                  })}
                >
                  Test Buy $50
                </button>
              </div>

              {liveMsg ? <div className="muted" style={{ marginTop: 8 }}>{liveMsg}</div> : null}
            </div>

            <div className="chatLog" ref={logRef} style={{ marginTop: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                  <b style={{ display: "block", marginBottom: 4 }}>{m.from === "you
