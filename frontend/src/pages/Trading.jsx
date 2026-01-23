// frontend/src/pages/Trading.jsx
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
    learnStats: null,
    realized: null,
    costs: null,
    limits: null,
    owner: null,
    sizing: null,
    config: null
  });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  // ✅ UI Controls (owner settings)
  const [baselinePctUI, setBaselinePctUI] = useState(0.03); // 3%
  const [maxPctUI, setMaxPctUI] = useState(0.50);          // 50%
  const [maxTradesUI, setMaxTradesUI] = useState(40);
  const [configStatus, setConfigStatus] = useState("—");
  const [saving, setSaving] = useState(false);

  const [messages, setMessages] = useState(() => ([
    { from: "ai", text: "AutoProtect ready. Ask me about wins/losses, P&L, open position, and why I entered." }
  ]));
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
        const res = await fetch(`${base}/api/paper/status`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPaper(data);
        setPaperStatus("OK");

        // ✅ sync UI controls from backend (first time / whenever backend changes)
        if (data?.owner) {
          setBaselinePctUI(Number(data.owner.baselinePct ?? 0.03));
          setMaxPctUI(Number(data.owner.maxPct ?? 0.50));
          setMaxTradesUI(Number(data.owner.maxTradesPerDay ?? 40));
        }
      } catch {
        setPaperStatus("Error loading paper status");
      }
    };

    fetchStatus();
    t = setInterval(fetchStatus, 2000);
    return () => clearInterval(t);
  }, []);

  async function savePaperConfig() {
    const base = apiBase();
    if (!base) return;

    const baseline = clamp(Number(baselinePctUI), 0.001, 0.50);
    const maxPct = clamp(Number(maxPctUI), baseline, 0.50);
    const maxTrades = clamp(Number(maxTradesUI), 1, 500);

    setSaving(true);
    setConfigStatus("Saving…");

    try {
      const res = await fetch(`${base}/api/paper/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baselinePct: baseline,
          maxPct: maxPct,
          maxTradesPerDay: maxTrades
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setConfigStatus("Save failed: " + (data?.error || data?.message || `HTTP ${res.status}`));
      } else {
        setConfigStatus("Saved ✅");
        if (data?.snapshot) setPaper(data.snapshot);
      }
    } catch {
      setConfigStatus("Save failed: network error");
    } finally {
      setSaving(false);
      setTimeout(() => setConfigStatus("—"), 4000);
    }
  }

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
        paper
      };

      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const showRightPanel = showAI && !wideChart;

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
    const px = Number(t?.price);
    const usd = t?.usd;
    const cost = t?.cost;
    const profit = t?.profit;
    const holdMs = t?.holdMs;
    const exitReason = t?.exitReason || t?.note;

    if (type === "BUY") {
      const hold = t?.holdMs ? fmtDur(t.holdMs) : "—";
      return `${ts} • BUY ${sym} • ${strat} • Notional ${fmtMoneyCompact(usd, 2)} • Entry ${fmtMoney(px, 2)} • Entry cost ${fmtMoneyCompact(cost, 2)} • Planned hold ${hold}`;
    }

    if (type === "SELL") {
      const held = holdMs !== undefined ? fmtDur(holdMs) : "—";
      const pr = profit !== undefined ? fmtMoneyCompact(profit, 2) : "—";
      const rr = niceReason(exitReason);
      return `${ts} • SELL ${sym} • ${strat} • Exit ${fmtMoney(px, 2)} • Held ${held} • Result ${pr} • Exit: ${rr}`;
    }

    return `${ts} • ${type} ${sym}`;
  }

  // read-only sizing info from backend
  const tierBase = paper.sizing?.tierBase ?? null;
  const sizePct = paper.sizing?.sizePct ?? null;
  const forceBaseline = paper.limits?.forceBaseline ?? false;
  const lossesToday = paper.limits?.lossesToday ?? 0;
  const tradesToday = paper.limits?.tradesToday ?? 0;

  return (
    <div className="tradeWrap">
      <div className="card">
        <div className="tradeTop">
          <div>
            <h2 style={{ margin: 0 }}>Trading Room</h2>
            <small className="muted">Live feed + learning + scoreboard + history + owner controls.</small>
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
              <div style={{ marginTop: 6, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {feedStatus}
              </div>
              <small className="muted">Last: {fmtMoney(last, 2)}</small>
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
                <button className={showHistory ? "active" : ""} onClick={() => setShowHistory(v => !v)} style={{ width: "auto" }}>
                  History
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
        <div className="card tradeChart">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <b>{symbol}</b>
            <span className={`badge ${paper.running ? "ok" : ""}`}>Paper Trader: {paper.running ? "ON" : "OFF"}</span>
          </div>

          {/* ✅ Owner Controls */}
          <div className="card" style={{ marginTop: 12, borderColor: "rgba(43,213,118,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <b>Owner Controls (Paper)</b>
              <span className={`badge ${forceBaseline ? "" : "ok"}`}>
                Force Baseline: {forceBaseline ? "ON" : "OFF"}
              </span>
            </div>

            <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
              Trades today: <b>{tradesToday}</b> • Losses today: <b>{lossesToday}</b> •
              Tier base: <b>{tierBase != null ? fmtMoneyCompact(tierBase, 0) : "—"}</b> •
              Current size %: <b>{sizePct != null ? pct(sizePct, 1) : "—"}</b>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <div className="kpiBox">
                <div className="kpiLbl">Baseline % (min)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <input
                    type="range"
                    min={0.01}
                    max={0.10}
                    step={0.005}
                    value={baselinePctUI}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBaselinePctUI(v);
                      if (maxPctUI < v) setMaxPctUI(v);
                    }}
                    style={{ width: "100%" }}
                  />
                  <b style={{ width: 70, textAlign: "right" }}>{pct(baselinePctUI, 1)}</b>
                </div>
                <small className="muted">3% baseline is your “starting point”.</small>
              </div>

              <div className="kpiBox">
                <div className="kpiLbl">Max % (cap)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <input
                    type="range"
                    min={baselinePctUI}
                    max={0.50}
                    step={0.01}
                    value={maxPctUI}
                    onChange={(e) => setMaxPctUI(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <b style={{ width: 70, textAlign: "right" }}>{pct(maxPctUI, 0)}</b>
                </div>
                <small className="muted">Grows up to this cap when AI performs.</small>
              </div>

              <div className="kpiBox">
                <div className="kpiLbl">Trades / Day</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={maxTradesUI}
                    onChange={(e) => setMaxTradesUI(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <b style={{ width: 70, textAlign: "right" }}>{fmtNum(maxTradesUI, 0)}</b>
                </div>
                <small className="muted">Paper only for now (Live later).</small>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 12 }}>
              <div className="muted">Config: <b>{configStatus}</b></div>
              <button className={saving ? "" : "active"} disabled={saving} onClick={savePaperConfig} style={{ width: 170 }}>
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>

          {/* Learning + Decision */}
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
                <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {reason}
                </span>
              </div>
              <div className="kpiLbl">Reason</div>
            </div>
          </div>

          {/* Scoreboard */}
          <div style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 10
          }}>
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
          </div>

          {/* Costs */}
          <div style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10
          }}>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(feePaid, 2)}</div>
              <div className="kpiLbl">Fees Paid</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(slip, 2)}</div>
              <div className="kpiLbl">Slippage Cost</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{fmtMoneyCompact(spr, 2)}</div>
              <div className="kpiLbl">Spread Cost</div>
            </div>
          </div>

          {showMoney && (
            <div className="kpi" style={{ marginTop: 10 }}>
              <div>
                <b>{fmtMoneyCompact(cashBal, 2)}</b>
                <span>Cash (spendable)</span>
              </div>
              <div>
                <b>{fmtMoneyCompact(equity, 2)}</b>
                <span>Equity (marked)</span>
              </div>
              <div>
                <b>{fmtMoneyCompact(unreal, 2)}</b>
                <span>Unrealized P/L</span>
              </div>
              <div>
                <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{paperStatus}</b>
                <span>Status</span>
              </div>
            </div>
          )}

          {/* Open Position details */}
          {paper.position && (
            <div className="card" style={{ marginTop: 12, borderColor: "rgba(122,167,255,0.35)" }}>
              <b>Open Position</b>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
                <div>
                  <b>{paper.position.symbol}</b> • {paper.position.strategy || "—"} • Entry {fmtMoney(paper.position.entry, 2)}
                </div>
                <div>
                  Notional {fmtMoneyCompact(paper.position.entryNotionalUsd, 2)} • Qty {fmtNum(paper.position.qty, 6)}
                </div>
                <div>
                  Age {fmtDur(paper.position.ageMs)} • Remaining {paper.position.remainingMs !== null ? fmtDur(paper.position.remainingMs) : "—"}
                </div>
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

          {/* Trade Log */}
          {showTradeLog && (
            <div style={{ marginTop: 12 }}>
              <b>Trade Log</b>
              <div className="tableWrap" style={{ maxHeight: 320, overflow: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Strategy</th>
                      <th>Price</th>
                      <th>USD</th>
                      <th>Entry Cost</th>
                      <th>Held</th>
                      <th>Exit</th>
                      <th>Net P/L</th>
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
                          <td>{t.exitReason ? niceReason(t.exitReason) : (t.note ? niceReason(t.note) : "—")}</td>
                          <td>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
                        </tr>
                      ))}

                    {(!paper.trades || paper.trades.length === 0) && (
                      <tr><td colSpan="9" className="muted">No trades yet (it’s learning)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div style={{ marginTop: 12 }}>
              <b>History</b>
              <div className="muted" style={{ marginTop: 4 }}>
                Scroll to review every trade (entry, size, strategy, hold time, exit reason, result).
              </div>

              <div
                style={{
                  marginTop: 10,
                  maxHeight: 340,
                  overflow: "auto",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 12,
                  padding: 10,
                  background: "rgba(0,0,0,0.18)"
                }}
              >
                {historyItems.length === 0 && (
                  <div className="muted">No history yet.</div>
                )}

                {historyItems.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      lineHeight: 1.5
                    }}
                  >
                    {historyLine(t)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showRightPanel && (
          <div className="card tradeAI">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <b>AI Panel</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  Ask why it bought/sold • voice below
                </div>
              </div>
            </div>

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
                placeholder="Ask: why did you enter? what strategy? what’s next?"
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
                getContext={() => ({
                  symbol,
                  mode,
                  last,
                  paper
                })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
