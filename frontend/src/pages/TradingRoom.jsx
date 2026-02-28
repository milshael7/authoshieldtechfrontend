// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — ENTERPRISE DASHBOARD v3 (UI MATCHED)
// Chart Dominant • Full Tool Rails • Bottom Terminal Tabs
// Execute Order Panel (toggle + draggable) • AI Ops • Activity
//
// SAFETY / ARCHITECTURAL NOTES (DO NOT "CLEAN UP" THESE):
// 1) WS URL is same-origin (/ws/market) on purpose so Vercel↔Render proxy works.
//    Do NOT hardcode backend host for WS or you will break production routing.
// 2) Snapshot polling is REQUIRED fallback even when WS is "working".
//    Some hosts idle WS or drop frames — polling keeps UI alive.
// 3) Role guard stays (Admin owns; Manager supervised view).
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, req, api } from "../lib/api.js";
import { Navigate } from "react-router-dom";
import "../styles/terminal.css";

/* ================= WS URL (SAME ORIGIN) ================= */
/*
ARCHITECTURAL LOCK:
Using same-origin WS path so reverse proxies remain transparent.
*/
function buildWsUrl() {
  const token = getToken();
  if (!token) return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${window.location.host}/ws/market?token=${encodeURIComponent(
    token
  )}`;
}

/* ================= SMALL HELPERS ================= */

function n(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function fmtPct(v) {
  return `${(n(v, 0) * 100).toFixed(1)}%`;
}

function fmtMoney(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "—";
  return `$${x.toLocaleString()}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function TradingRoom() {
  /* ================= ROLE SAFETY ================= */
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();

  // Admin routes already protect this, but keep guard safe + non-breaking.
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  /* ================= REFS ================= */

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const candleDataRef = useRef([]);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  /* ================= UI STATE ================= */

  // Top selections (visual parity to your picture)
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");

  // Panels / tabs
  const [bottomTab, setBottomTab] = useState("positions"); // positions | orders | history | account
  const [rightTab, setRightTab] = useState("dashboard"); // dashboard | ai | activity

  // Execute Order panel (toggle + draggable)
  const [execOpen, setExecOpen] = useState(true);
  const [execDocked, setExecDocked] = useState(true); // dock right vs floating
  const [execPos, setExecPos] = useState({ x: 720, y: 92 });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Order fields
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("LIMIT"); // MARKET | LIMIT | STOP
  const [qty, setQty] = useState(1000);
  const [limitPrice, setLimitPrice] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const [toast, setToast] = useState("");

  /* ================= DATA ================= */

  const [snapshot, setSnapshot] = useState({});
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState("");

  const [signals, setSignals] = useState([]);
  const [ticks, setTicks] = useState([]); // lightweight activity (last few)

  const lastPrice = useMemo(() => {
    // try multiple known shapes
    return (
      snapshot?.lastPrice ??
      snapshot?.price ??
      snapshot?.market?.last ??
      (ticks[0]?.price ?? null)
    );
  }, [snapshot, ticks]);

  const lastVolume = useMemo(() => {
    return snapshot?.volume ?? snapshot?.market?.volume ?? null;
  }, [snapshot]);

  /* ================= SNAPSHOT (FALLBACK LAYER) ================= */
  /*
  ARCHITECTURAL LOCK:
  Snapshot polling ensures UI stays populated if WS disconnects / idles.
  Do NOT remove polling.
  */
  async function loadSnapshot() {
    try {
      setSnapshotError("");
      setSnapshotLoading(true);

      // Prefer explicit api method if it exists, otherwise fall back to req() paths.
      let data = {};
      if (typeof api?.tradingLiveSnapshot === "function") {
        data = await api.tradingLiveSnapshot();
      } else {
        // Try common backend paths (graceful 404 returns {} in your req layer).
        data =
          (await req("/api/trading/live-snapshot")) ||
          (await req("/api/trading/snapshot")) ||
          (await req("/api/market/snapshot")) ||
          {};
      }

      setSnapshot(data || {});
    } catch (e) {
      setSnapshotError(e?.message || "Snapshot failed");
    } finally {
      setSnapshotLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshot();
    pollRef.current = setInterval(loadSnapshot, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,.92)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.06)" },
        horzLines: { color: "rgba(255,255,255,.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.10)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,.15)" },
        horzLine: { color: "rgba(255,255,255,.15)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chartRef.current?.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  /* ================= LIVE WS ================= */
  /*
  ARCHITECTURAL LOCK:
  Live tick + ai_signal stream powers real-time visibility.
  Do NOT remove WS logic.
  */
  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg?.type === "tick") {
          updateCandle(msg.price, msg.ts);

          setTicks((prev) => {
            const next = [
              {
                ts: msg.ts,
                price: n(msg.price),
                symbol: msg.symbol || symbol,
              },
              ...prev,
            ].slice(0, 25);
            return next;
          });
        }

        if (msg?.type === "ai_signal") {
          setSignals((prev) =>
            [
              {
                action: msg.action,
                confidence: msg.confidence,
                edge: msg.edge,
                ts: msg.ts,
              },
              ...prev,
            ].slice(0, 30)
          );
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };

    return () => {
      try {
        ws.close();
      } catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  function updateCandle(price, ts) {
    if (!seriesRef.current) return;

    const time = Math.floor(n(ts) / 1000);
    const p = n(price);

    if (!Number.isFinite(time) || !Number.isFinite(p)) return;

    const last = candleDataRef.current[candleDataRef.current.length - 1];

    if (!last || time > last.time) {
      const candle = { time, open: p, high: p, low: p, close: p };
      candleDataRef.current.push(candle);
      seriesRef.current.update(candle);
    } else {
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.close = p;
      seriesRef.current.update(last);
    }
  }

  /* ================= EXEC PANEL DRAG ================= */

  function startDrag(e) {
    if (execDocked) return; // docked means no drag
    setDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragging) return;
      const nx = e.clientX - dragOffsetRef.current.x;
      const ny = e.clientY - dragOffsetRef.current.y;
      setExecPos({ x: clamp(nx, 40, window.innerWidth - 360), y: clamp(ny, 40, window.innerHeight - 240) });
    }

    function onUp() {
      if (!dragging) return;
      setDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  /* ================= ORDER ACTION (SAFE) ================= */

  async function placeOrder() {
    try {
      setToast("");

      const payload = {
        symbol,
        side,
        type: orderType,
        quantity: n(qty),
        price: limitPrice ? n(limitPrice) : undefined,
        takeProfit: takeProfit ? n(takeProfit) : undefined,
        stopLoss: stopLoss ? n(stopLoss) : undefined,
        mode: "paper",
      };

      // Try api function if exists; otherwise fallback to req.
      let res = {};
      if (typeof api?.placePaperOrder === "function") {
        res = await api.placePaperOrder(payload);
      } else {
        res =
          (await req("/api/trading/paper/order", { method: "POST", body: payload })) ||
          (await req("/api/trading/order", { method: "POST", body: payload })) ||
          {};
      }

      setToast(res?.message || "Order submitted (paper).");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e?.message || "Order failed.");
      setTimeout(() => setToast(""), 3000);
    }
  }

  /* ================= STYLES ================= */

  const shell = {
    padding: 14,
    display: "grid",
    gridTemplateColumns: "56px 1fr 360px",
    gridTemplateRows: "50px 1fr 190px",
    gap: 12,
    height: "calc(100vh - 60px)",
  };

  const panelCard = {
    background: "rgba(0,0,0,.30)",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 14,
    backdropFilter: "blur(10px)",
  };

  const btn = {
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  };

  const ghostBtn = {
    ...btn,
    background: "transparent",
  };

  /* ================= RENDER ================= */

  return (
    <div className="terminalRoot" style={{ padding: 10 }}>
      {/* ===== TOP TOOLBAR (like your picture) ===== */}
      <div
        style={{
          ...panelCard,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          height: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={ghostBtn} title="Menu">☰</button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{
                ...btn,
                padding: "8px 10px",
                appearance: "none",
              }}
            >
              <option>EURUSD</option>
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
              <option>XAUUSD</option>
            </select>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                ...btn,
                padding: "8px 10px",
                appearance: "none",
              }}
            >
              <option>1D</option>
              <option>4H</option>
              <option>1H</option>
              <option>15M</option>
              <option>5M</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button style={ghostBtn} title="Crosshair">⌖</button>
            <button style={ghostBtn} title="Indicators">∿</button>
            <button style={ghostBtn} title="Replay">⟲</button>
            <button style={ghostBtn} title="Settings">⚙</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {snapshotLoading ? "Loading…" : snapshotError ? "Snapshot Error" : "Paper Trading"}
          </div>

          <button
            style={btn}
            onClick={() => {
              setExecOpen((v) => !v);
              setExecDocked(true);
            }}
            title="Toggle Execute Order"
          >
            Execute Order
          </button>

          <button style={{ ...btn, background: "rgba(34,197,94,.14)", borderColor: "rgba(34,197,94,.40)" }}>
            Publish
          </button>
        </div>
      </div>

      {/* ===== MAIN DASHBOARD GRID ===== */}
      <div style={shell}>
        {/* ===== LEFT TOOL RAIL (like your picture) ===== */}
        <div
          style={{
            ...panelCard,
            gridRow: "2 / span 2",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 10,
            gap: 10,
          }}
        >
          {["↖", "✎", "╱", "T", "⌁", "⎘", "⤢", "⊕", "⚲", "⌂", "👁"].map((ic, idx) => (
            <button key={idx} style={{ ...ghostBtn, width: 40, height: 36 }} title="Tool">
              {ic}
            </button>
          ))}
        </div>

        {/* ===== CHART AREA ===== */}
        <div
          style={{
            ...panelCard,
            gridColumn: "2",
            gridRow: "2",
            position: "relative",
            overflow: "hidden",
            padding: 10,
          }}
        >
          {/* Header inside chart area (matches “Euro / U.S. Dollar …” feeling) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 6px 10px" }}>
            <div style={{ fontWeight: 900, letterSpacing: ".02em" }}>
              {symbol} <span style={{ opacity: 0.6, fontWeight: 700 }}>• {timeframe} • PAPER</span>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, opacity: 0.8 }}>
              <span>Last: {lastPrice == null ? "—" : n(lastPrice).toFixed(4)}</span>
              <span>Vol: {lastVolume == null ? "—" : n(lastVolume).toLocaleString()}</span>
            </div>
          </div>

          <div
            ref={chartContainerRef}
            style={{
              width: "100%",
              height: "calc(100% - 40px)",
            }}
          />

          {/* Right-side “price badges” style */}
          <div style={{ position: "absolute", right: 10, top: 64, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ ...panelCard, padding: "8px 10px", borderRadius: 999, fontSize: 12 }}>
              {symbol} • {lastPrice == null ? "—" : n(lastPrice).toFixed(4)}
            </div>
            <div style={{ ...panelCard, padding: "8px 10px", borderRadius: 999, fontSize: 12, opacity: 0.85 }}>
              Volume • {lastVolume == null ? "—" : n(lastVolume).toLocaleString()}
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div
              style={{
                position: "absolute",
                left: 16,
                bottom: 16,
                ...panelCard,
                padding: "10px 12px",
                fontSize: 12,
              }}
            >
              {toast}
            </div>
          )}
        </div>

        {/* ===== RIGHT SIDE PANEL (tabs like your pic’s side utilities) ===== */}
        <div
          style={{
            ...panelCard,
            gridColumn: "3",
            gridRow: "2",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button style={rightTab === "dashboard" ? btn : ghostBtn} onClick={() => setRightTab("dashboard")}>
              Dashboard
            </button>
            <button style={rightTab === "ai" ? btn : ghostBtn} onClick={() => setRightTab("ai")}>
              AI Ops
            </button>
            <button style={rightTab === "activity" ? btn : ghostBtn} onClick={() => setRightTab("activity")}>
              Activity
            </button>
          </div>

          {rightTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ ...panelCard, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Account Equity</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  {fmtMoney(snapshot?.equity ?? snapshot?.account?.equity)}
                </div>
              </div>

              <div style={{ ...panelCard, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Open Profit</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {fmtMoney(snapshot?.openProfit ?? snapshot?.account?.openProfit)}
                </div>
              </div>

              <div style={{ ...panelCard, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Positions</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {Array.isArray(snapshot?.positions) ? snapshot.positions.length : 0}
                </div>
              </div>

              <button style={btn} onClick={loadSnapshot} disabled={snapshotLoading}>
                {snapshotLoading ? "Refreshing…" : "Refresh Snapshot"}
              </button>

              {snapshotError && (
                <div style={{ color: "#ff5a5f", fontSize: 12 }}>
                  {snapshotError}
                </div>
              )}
            </div>
          )}

          {rightTab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ ...panelCard, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Mode</div>
                <div style={{ fontWeight: 900 }}>PAPER TRADING</div>
              </div>

              <div style={{ ...panelCard, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Last Signal</div>
                <div style={{ fontWeight: 900 }}>
                  {signals[0]?.action || "—"} • {signals[0] ? fmtPct(signals[0].confidence) : "—"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  Edge: {signals[0] ? n(signals[0].edge).toFixed(2) : "—"}
                </div>
              </div>

              <div style={{ ...panelCard, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Supervision</div>
                <div style={{ fontWeight: 900 }}>
                  Admin-owned • Manager-supervised
                </div>
              </div>
            </div>
          )}

          {rightTab === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
              <div style={{ fontWeight: 900, opacity: 0.9 }}>Signal Feed</div>
              {(signals || []).map((s, i) => (
                <div key={i} style={{ ...panelCard, padding: 10, fontSize: 12 }}>
                  <div style={{ fontWeight: 900 }}>
                    {s.action} • {fmtPct(s.confidence)}
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    Edge {n(s.edge).toFixed(2)} • {s.ts ? new Date(n(s.ts)).toLocaleTimeString() : ""}
                  </div>
                </div>
              ))}

              <div style={{ fontWeight: 900, opacity: 0.9, marginTop: 10 }}>Ticks</div>
              {(ticks || []).slice(0, 10).map((t, i) => (
                <div key={i} style={{ ...panelCard, padding: 10, fontSize: 12 }}>
                  {t.symbol} • {n(t.price).toFixed(4)} •{" "}
                  {t.ts ? new Date(n(t.ts)).toLocaleTimeString() : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== BOTTOM TERMINAL (tabs like your picture) ===== */}
        <div
          style={{
            ...panelCard,
            gridColumn: "2 / span 2",
            gridRow: "3",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            {[
              ["positions", "Positions"],
              ["orders", "Orders"],
              ["history", "History"],
              ["account", "Account"],
            ].map(([k, label]) => (
              <button
                key={k}
                style={bottomTab === k ? btn : ghostBtn}
                onClick={() => setBottomTab(k)}
              >
                {label}
              </button>
            ))}

            <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div style={{ overflow: "auto", fontSize: 12 }}>
            {bottomTab === "positions" && (
              <>
                {Array.isArray(snapshot?.positions) && snapshot.positions.length ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ opacity: 0.7 }}>
                        <th align="left">Symbol</th>
                        <th align="left">Side</th>
                        <th align="right">Qty</th>
                        <th align="right">Entry</th>
                        <th align="right">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.positions.map((p, i) => (
                        <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                          <td>{p.symbol || symbol}</td>
                          <td>{p.side || "—"}</td>
                          <td align="right">{n(p.quantity ?? p.qty).toLocaleString()}</td>
                          <td align="right">{p.entryPrice != null ? n(p.entryPrice).toFixed(4) : "—"}</td>
                          <td align="right">{p.pnl != null ? fmtMoney(p.pnl) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ opacity: 0.7 }}>No open positions</div>
                )}
              </>
            )}

            {bottomTab === "orders" && (
              <>
                {Array.isArray(snapshot?.orders) && snapshot.orders.length ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ opacity: 0.7 }}>
                        <th align="left">Symbol</th>
                        <th align="left">Type</th>
                        <th align="left">Side</th>
                        <th align="right">Qty</th>
                        <th align="right">Price</th>
                        <th align="left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.orders.map((o, i) => (
                        <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                          <td>{o.symbol || symbol}</td>
                          <td>{o.type || "—"}</td>
                          <td>{o.side || "—"}</td>
                          <td align="right">{n(o.quantity ?? o.qty).toLocaleString()}</td>
                          <td align="right">{o.price != null ? n(o.price).toFixed(4) : "—"}</td>
                          <td>{o.status || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ opacity: 0.7 }}>No orders</div>
                )}
              </>
            )}

            {bottomTab === "history" && (
              <>
                {Array.isArray(snapshot?.history) && snapshot.history.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {snapshot.history.slice(0, 20).map((h, i) => (
                      <div key={i} style={{ ...panelCard, padding: 10 }}>
                        <div style={{ fontWeight: 900 }}>
                          {h.action || "EVENT"} • {h.symbol || symbol}
                        </div>
                        <div style={{ opacity: 0.75 }}>
                          {h.ts ? new Date(n(h.ts)).toLocaleString() : ""} •{" "}
                          {h.detail ? String(h.detail) : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ opacity: 0.7 }}>No history</div>
                )}
              </>
            )}

            {bottomTab === "account" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <div style={{ ...panelCard, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Balance</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {fmtMoney(snapshot?.balance ?? snapshot?.account?.balance)}
                  </div>
                </div>

                <div style={{ ...panelCard, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Equity</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {fmtMoney(snapshot?.equity ?? snapshot?.account?.equity)}
                  </div>
                </div>

                <div style={{ ...panelCard, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Margin Used</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {fmtMoney(snapshot?.marginUsed ?? snapshot?.account?.marginUsed)}
                  </div>
                </div>

                <div style={{ ...panelCard, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Open Profit</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {fmtMoney(snapshot?.openProfit ?? snapshot?.account?.openProfit)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== EXECUTE ORDER PANEL ===== */}
        {execOpen && (
          <div
            style={{
              position: execDocked ? "absolute" : "fixed",
              right: execDocked ? 18 : "auto",
              top: execDocked ? 86 : execPos.y,
              left: execDocked ? "auto" : execPos.x,
              width: 340,
              zIndex: 9999,
              ...panelCard,
              padding: 14,
              cursor: execDocked ? "default" : dragging ? "grabbing" : "grab",
            }}
          >
            {/* Drag header */}
            <div
              onMouseDown={startDrag}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 10,
                userSelect: "none",
              }}
              title={execDocked ? "Docked" : "Drag to move"}
            >
              <div style={{ fontWeight: 950, letterSpacing: ".02em" }}>
                Execute Order
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  style={ghostBtn}
                  onClick={() => setExecDocked((v) => !v)}
                  title={execDocked ? "Float panel" : "Dock panel"}
                >
                  {execDocked ? "⇱" : "⇲"}
                </button>
                <button style={ghostBtn} onClick={() => setExecOpen(false)} title="Close">
                  ✕
                </button>
              </div>
            </div>

            {/* BUY / SELL */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{
                  ...btn,
                  flex: 1,
                  borderColor: side === "BUY" ? "rgba(34,197,94,.55)" : "rgba(255,255,255,.14)",
                  background: side === "BUY" ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.06)",
                }}
                onClick={() => setSide("BUY")}
              >
                BUY
              </button>
              <button
                style={{
                  ...btn,
                  flex: 1,
                  borderColor: side === "SELL" ? "rgba(239,68,68,.55)" : "rgba(255,255,255,.14)",
                  background: side === "SELL" ? "rgba(239,68,68,.14)" : "rgba(255,255,255,.06)",
                }}
                onClick={() => setSide("SELL")}
              >
                SELL
              </button>
            </div>

            {/* MARKET / LIMIT / STOP */}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {["MARKET", "LIMIT", "STOP"].map((t) => (
                <button
                  key={t}
                  style={orderType === t ? btn : ghostBtn}
                  onClick={() => setOrderType(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Fields like the picture */}
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Order Price</div>
                <input
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={orderType === "MARKET" ? "Market" : "Enter price"}
                  disabled={orderType === "MARKET"}
                  style={{
                    width: "100%",
                    padding: "10px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "rgba(0,0,0,.25)",
                    color: "rgba(255,255,255,.92)",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Quantity</div>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "rgba(0,0,0,.25)",
                    color: "rgba(255,255,255,.92)",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Take Profit</div>
                  <input
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="Optional"
                    style={{
                      width: "100%",
                      padding: "10px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.14)",
                      background: "rgba(0,0,0,.25)",
                      color: "rgba(255,255,255,.92)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Stop Loss</div>
                  <input
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Optional"
                    style={{
                      width: "100%",
                      padding: "10px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.14)",
                      background: "rgba(0,0,0,.25)",
                      color: "rgba(255,255,255,.92)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              style={{
                ...btn,
                width: "100%",
                marginTop: 14,
                borderColor: side === "BUY" ? "rgba(34,197,94,.55)" : "rgba(239,68,68,.55)",
                background: side === "BUY" ? "rgba(34,197,94,.18)" : "rgba(239,68,68,.18)",
              }}
              onClick={placeOrder}
            >
              Confirm {side}
            </button>

            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.65 }}>
              Mode: PAPER • Owner: ADMIN • Supervisor: MANAGER
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
