// frontend/src/pages/Trading.jsx
import React, { useEffect, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function apiBase() {
  return ((import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "")).trim();
}

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
function fmtMoneyCompact(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (ax >= 1e6) return `${sign}$${(ax / 1e6).toFixed(digits)}m`;
  if (ax >= 1e3) return `${sign}$${(ax / 1e3).toFixed(digits)}k`;
  return fmtMoney(x, digits);
}
function pct(n, digits = 1) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}
function fmtDur(ms) {
  const x = Number(ms);
  if (!Number.isFinite(x) || x < 0) return "—";
  const s = Math.floor(x / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${String(rs).padStart(2, "0")}s`;
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
  const [showHistory, setShowHistory] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  const [paper, setPaper] = useState({
    running: false,
    cashBalance: 0,
    equity: 0,
    pnl: 0,
    unrealizedPnL: 0,
    trades: [],
    position: null,
    realized: null,
    costs: null,
    limits: null,
    owner: null,
    sizing: null
  });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  // owner controls (UI)
  const [cfgBaseline, setCfgBaseline] = useState(0.03);
  const [cfgMaxPct, setCfgMaxPct] = useState(0.5);
  const [cfgMaxTrades, setCfgMaxTrades] = useState(40);
  const [cfgMsg, setCfgMsg] = useState("");

  const [messages, setMessages] = useState(() => ([
    { from: "ai", text: "AutoProtect ready. Ask me about: why it entered, sizing %, and trade history." }
  ]));
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  // auto-scroll chat
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  // market demo candles (same as before)
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

  // websocket feed
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

  // paper polling
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

        // sync owner controls UI to backend once (when available)
        if (data?.owner) {
          setCfgBaseline(Number(data.owner.baselinePct ?? 0.03));
          setCfgMaxPct(Number(data.owner.maxPct ?? 0.5));
          setCfgMaxTrades(Number(data.owner.maxTradesPerDay ?? 40));
        }
      } catch {
        setPaperStatus("Error loading paper status");
      }
    };

    fetchStatus();
    t = setInterval(fetchStatus, 2000);
    return () => clearInterval(t);
  }, []);

  // draw candles
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

    const view = candles.slice(-80);
    if (!view.length) return;

    const highs = view.map(c => c.high);
    const lows = view.map(c => c.low);
    const maxP = Math.max(...highs);
    const minP = Math.min(...lows);
    const pad = (maxP - minP) * 0.06 || 10;
    const top = maxP + pad;
    const bot = minP - pad;

    const py = (p) => {
      const r = (top - p) / (top - bot);
      return clamp(r, 0, 1) * (cssH - 20) + 10;
    };

    const gap = 2;
    const candleW = Math.max(4, Math.floor((cssW - 20) / view.length) - gap);
    let x = 10;

    for (let i = 0; i < view.length; i++) {
      const c = view[i];
      const openY = py(c.open);
      const closeY = py(c.close);
      const highY = py(c.high);
      const lowY = py(c.low);

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

    const lastY = py(last);
    ctx.strokeStyle = "rgba(122,167,255,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(cssW, lastY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [candles, last]);

  async function applyOwnerConfig() {
    const base = apiBase();
    if (!base) return;

    setCfgMsg("Applying…");
    try {
      const res = await fetch(`${base}/api/paper/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baselinePct: Number(cfgBaseline),
          maxPct: Number(cfgMaxPct),
          maxTradesPerDay: Number(cfgMaxTrades)
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setCfgMsg("✅ Saved");
      setTimeout(() => setCfgMsg(""), 1500);
    } catch (e) {
      setCfgMsg("❌ " + (e?.message || "Failed"));
    }
  }

  async function sendToAI(text) {
    const clean = (text || "").trim();
    if (!clean) return;

    setMessages(prev => [...prev, { from: "you", text: clean }]);

    const base = apiBase();
    if (!base) {
      setMessages(prev => [...prev, { from: "ai", text: "Backend URL missing. Set VITE_API_BASE." }]);
      return;
    }

    try {
      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: clean, context: { symbol, mode, last, paper } })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages(prev => [...prev, { from: "ai", text: "AI error: " + (data?.error || `HTTP ${res.status}`) }]);
        return;
      }

      setMessages(prev => [...prev, { from: "ai", text: data?.reply ?? "(No reply)" }]);
    } catch {
      setMessages(prev => [...prev, { from: "ai", text: "Network error talking to AI backend." }]);
    }
  }

  const showRightPanel = showAI && !wideChart;

  const wins = paper.realized?.wins ?? 0;
  const losses = paper.realized?.losses ?? 0;
  const gain = paper.realized?.grossProfit ?? 0;
  const lossAmt = paper.realized?.grossLoss ?? 0;
  const net = paper.realized?.net ?? paper.pnl ?? 0;

  const cash = paper.cashBalance ?? 0;
  const equity = paper.equity ?? cash;
  const unreal = paper.unrealizedPnL ?? 0;

  const sizing = paper.sizing || {};
  const history = (paper.trades || []).slice().reverse().slice(0, 240);

  // text-style history line
  function historyLine(t) {
    const ts = t?.time ? new Date(t.time).toLocaleTimeString() : "—";
    const sym = t?.symbol || "—";
    const type = t?.type || "—";
    const strat = t?.strategy || "—";
    const px = t?.price;

    if (type === "BUY") {
      return `${ts} — ENTER • ${sym} • ${strat} • Size ${fmtMoneyCompact(t?.usd, 2)} • Entry ${fmtMoney(px, 2)} • Cost ${fmtMoneyCompact(t?.cost, 2)} • Hold ${t?.holdMs ? fmtDur(t.holdMs) : "—"} • ${t?.note || ""}`;
    }

    if (type === "SELL") {
      return `${ts} — EXIT • ${sym} • ${strat} • Exit ${fmtMoney(px, 2)} • Held ${t?.holdMs ? fmtDur(t.holdMs) : "—"} • Result ${fmtMoneyCompact(t?.profit, 2)} • Reason ${(t?.exitReason || "—")}`;
    }

    return `${ts} — ${type} ${sym}`;
  }

  return (
    <div className="tradeWrap">
      <div className="card">
        <div className="tradeTop">
          <div>
            <h2 style={{ margin: 0 }}>Trading Room</h2>
            <small className="muted">Live feed + scoreboard + owner controls + text history.</small>
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
              <small>Panels</small>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <button className={showMoney ? "active" : ""} onClick={() => setShowMoney(v => !v)} style={{ width: "auto" }}>Money</button>
                <button className={showTradeLog ? "active" : ""} onClick={() => setShowTradeLog(v => !v)} style={{ width: "auto" }}>Log</button>
                <button className={showHistory ? "active" : ""} onClick={() => setShowHistory(v => !v)} style={{ width: "auto" }}>History</button>
                <button className={showAI ? "active" : ""} onClick={() => setShowAI(v => !v)} style={{ width: "auto" }}>AI</button>
                <button className={wideChart ? "active" : ""} onClick={() => setWideChart(v => !v)} style={{ width: "auto" }}>Wide</button>
              </div>
            </div>

            <div className="pill">
              <small>Feed</small>
              <div style={{ marginTop: 6, fontWeight: 800 }}>
                {feedStatus}
              </div>
              <small className="muted">Last: {fmtMoney(last, 2)}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="tradeGrid" style={{ gridTemplateColumns: showRightPanel ? "1.8fr 1fr" : "1fr" }}>
        <div className="card tradeChart">
          {/* Scoreboard */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
            <div className="kpiBox"><div className="kpiVal">{fmtNum(wins, 0)}</div><div className="kpiLbl">Wins</div></div>
            <div className="kpiBox"><div className="kpiVal">{fmtNum(losses, 0)}</div><div className="kpiLbl">Losses</div></div>
            <div className="kpiBox"><div className="kpiVal">{fmtMoneyCompact(gain, 2)}</div><div className="kpiLbl">Total Gain</div></div>
            <div className="kpiBox"><div className="kpiVal">{fmtMoneyCompact(lossAmt, 2)}</div><div className="kpiLbl">Total Loss</div></div>
            <div className="kpiBox"><div className="kpiVal">{fmtMoneyCompact(net, 2)}</div><div className="kpiLbl">Net P&L</div></div>
          </div>

          {/* Money */}
          {showMoney && (
            <div className="kpi" style={{ marginTop: 10 }}>
              <div><b>{fmtMoneyCompact(cash, 2)}</b><span>Cash</span></div>
              <div><b>{fmtMoneyCompact(equity, 2)}</b><span>Equity</span></div>
              <div><b>{fmtMoneyCompact(unreal, 2)}</b><span>Unrealized</span></div>
              <div><b>{paperStatus}</b><span>Status</span></div>
            </div>
          )}

          {/* ✅ OWNER CONTROLS */}
          <div className="card" style={{ marginTop: 12, borderColor: "rgba(43,213,118,0.25)" }}>
            <b>Owner Controls</b>
            <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
              Current sizing: Tier {fmtMoneyCompact(sizing.tierBase, 0)} • Size {pct(sizing.sizePct, 1)} • Est. USD {fmtMoneyCompact(sizing.sizeUsd, 2)}
            </div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <div className="kpiBox">
                <div className="kpiLbl">Baseline %</div>
                <input value={cfgBaseline} onChange={(e)=>setCfgBaseline(e.target.value)} placeholder="0.03" />
              </div>
              <div className="kpiBox">
                <div className="kpiLbl">Max %</div>
                <input value={cfgMaxPct} onChange={(e)=>setCfgMaxPct(e.target.value)} placeholder="0.50" />
              </div>
              <div className="kpiBox">
                <div className="kpiLbl">Trades / Day</div>
                <input value={cfgMaxTrades} onChange={(e)=>setCfgMaxTrades(e.target.value)} placeholder="40" />
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={applyOwnerConfig} style={{ width: 160 }}>Apply</button>
              <div className="muted">{cfgMsg}</div>
            </div>
          </div>

          {/* Chart */}
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

          {/* Trade Log Table */}
          {showTradeLog && (
            <div style={{ marginTop: 12 }}>
              <b>Trade Log</b>
              <div className="tableWrap" style={{ maxHeight: 320, overflow: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th><th>Type</th><th>Symbol</th><th>Strategy</th><th>USD</th><th>Price</th><th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paper.trades || []).slice().reverse().slice(0, 30).map((t, i) => (
                      <tr key={i}>
                        <td>{t.time ? new Date(t.time).toLocaleTimeString() : "—"}</td>
                        <td>{t.type || "—"}</td>
                        <td>{t.symbol || "—"}</td>
                        <td>{t.strategy || "—"}</td>
                        <td>{t.usd !== undefined ? fmtMoneyCompact(t.usd, 2) : "—"}</td>
                        <td>{t.price !== undefined ? fmtMoney(t.price, 2) : "—"}</td>
                        <td>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ✅ TEXT HISTORY (message style) */}
          {showHistory && (
            <div style={{ marginTop: 12 }}>
              <b>History (Text)</b>
              <div className="muted" style={{ marginTop: 4 }}>
                This is the “message-style” log: entry → size → exit → result.
              </div>

              <div style={{
                marginTop: 10,
                maxHeight: 360,
                overflow: "auto",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: 10,
                background: "rgba(0,0,0,0.18)"
              }}>
                {history.length === 0 && <div className="muted">No history yet.</div>}

                {history.map((t, idx) => (
                  <div key={idx} style={{
                    padding: "8px 8px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    lineHeight: 1.5
                  }}>
                    {historyLine(t)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        {showRightPanel && (
          <div className="card tradeAI">
            <b>AI Panel</b>

            <div className="chatLog" ref={logRef} style={{ marginTop: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                  <b style={{ display: "block", marginBottom: 4 }}>{m.from === "you" ? "You" : "AutoProtect"}</b>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="chatBox">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask: why did you enter? what size %? what tier?"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendToAI(input);
                    setInput("");
                  }
                }}
              />
              <button style={{ width: 130 }} onClick={() => { sendToAI(input); setInput(""); }}>
                Send
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <VoiceAI
                title="AutoProtect Voice"
                endpoint="/api/ai/chat"
                getContext={() => ({ symbol, mode, last, paper })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
