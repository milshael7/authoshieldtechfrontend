import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Trading.jsx
 * - Uses BACKEND WebSocket feed: /ws/market
 * - Builds live candles (5-second candles for visible movement)
 * - Includes Voice AI toggle (TTS + optional STT)
 * - Falls back to local demo ticks if WS can’t connect
 */

function canSTT() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function speakText(text) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function Trading({ user }) {
  // UI symbol names (Kraken-like)
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  // Backend currently streams these symbols from server.js:
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Live");

  const [feedStatus, setFeedStatus] = useState("Connecting…"); // Connected / Disconnected / Connecting…
  const [last, setLast] = useState(65300);
  const [ts, setTs] = useState(Date.now());

  // Voice + chat
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState(() => ([
    { from: "ai", text: "AI Panel ready. Toggle Voice ON to hear me speak back. Ask about risk rules, posture, and Sabbath pause." }
  ]));
  const [input, setInput] = useState("");
  const logRef = useRef(null);
  const sttSupported = useMemo(() => canSTT(), []);

  // Candle chart state
  const canvasRef = useRef(null);
  const [candles, setCandles] = useState(() => {
    // seed candles
    const base = 65300;
    const out = [];
    let p = base;
    let t = Math.floor(Date.now() / 1000);
    for (let i = 80; i > 0; i--) {
      const time = t - i * 5; // 5s candles for visible movement
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

  // Tick -> candle builder
  const applyTick = (price, nowMs) => {
    setLast(Number(price.toFixed(2)));
    setTs(nowMs);

    setCandles((prev) => {
      const bucketSec = 5; // fast candles so you SEE movement (later can be 60)
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

  // Connect to backend WS feed (fallback to demo if fails)
  useEffect(() => {
    let ws;
    let fallbackTimer;

    const apiBase = (import.meta.env.VITE_API_BASE || "").trim();
    const wsBase = apiBase
      .replace(/^https:\/\//i, "wss://")
      .replace(/^http:\/\//i, "ws://");

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

      ws.onopen = () => {
        setFeedStatus("Connected");
      };

      ws.onclose = () => {
        startFallback();
      };

      ws.onerror = () => {
        startFallback();
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // server sends: { type:'tick', symbol:'BTCUSDT', price, ts }
          if (msg?.type === "tick" && msg.symbol === wantedBackendSymbol) {
            applyTick(Number(msg.price), Number(msg.ts || Date.now()));
          }
        } catch {
          // ignore
        }
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

  // Draw candle chart
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

    // grid
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

    // price labels
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px system-ui";
    ctx.fillText(top.toFixed(2), 10, 14);
    ctx.fillText(bot.toFixed(2), 10, cssH - 8);

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

      // wick
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, highY);
      ctx.lineTo(x + candleW / 2, lowY);
      ctx.stroke();

      // body
      ctx.fillStyle = up ? "rgba(43,213,118,0.85)" : "rgba(255,90,95,0.85)";
      const y = Math.min(openY, closeY);
      const h = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x, y, candleW, h);

      x += candleW + gap;
    }

    // last price line
    const lastY = px(last);
    ctx.strokeStyle = "rgba(122,167,255,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(cssW, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(122,167,255,0.95)";
    ctx.fillText(last.toFixed(2), cssW - 80, lastY - 6);
  }, [candles, last]);

  const sendToAI = (text) => {
    const clean = (text || "").trim();
    if (!clean) return;

    setMessages(prev => [...prev, { from: "you", text: clean }]);

    const reply =
      `AutoProtect AI (demo): ${symbol} / ${mode}. ` +
      `Paper training runs all day. Live trades default to 2/day (owner can raise). ` +
      `Sabbath pause: Friday sundown → Saturday sundown (Iowa City).`;

    setTimeout(() => {
      setMessages(prev => [...prev, { from: "ai", text: reply }]);
      if (voiceOn) speakText(reply);
    }, 250);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      const text = e?.results?.[0]?.[0]?.transcript || "";
      sendToAI(text);
    };

    rec.start();
  };

  return (
    <div className="tradeWrap">
      <div className="card">
        <div className="tradeTop">
          <div>
            <h2 style={{ margin: 0 }}>Trading Terminal</h2>
            <small className="muted">Manager: terminal + AI guidance. Admin controls risk rules & live-trade limits.</small>
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
              <div style={{ marginTop: 6, fontWeight: 800 }}>{feedStatus}</div>
              <small className="muted">Last: {last.toLocaleString()}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="tradeGrid">
        {/* Chart */}
        <div className="card tradeChart">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b>{symbol}</b>
            <span className="badge ok">Candles: Live</span>
          </div>

          <div style={{ marginTop: 12, height: 560 }}>
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

          <div style={{ marginTop: 10 }}>
            <small className="muted">
              Next: wire risk rules + AI worker (paper all day, live 2/day) + Sabbath pause at Iowa City sunset.
            </small>
          </div>
        </div>

        {/* AI Panel */}
        <div className="card tradeAI">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <b>AI Panel</b>
              <div className="muted" style={{ fontSize: 12 }}>
                Chat + Trading Explain • {sttSupported ? "Voice supported" : "Voice may be limited on this browser"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`badge ${voiceOn ? "ok" : ""}`}>Voice: {voiceOn ? "ON" : "OFF"}</span>
              <button onClick={() => setVoiceOn(v => !v)} style={{ width: "auto" }}>
                Toggle Voice
              </button>
            </div>
          </div>

          <div className="chatLog" ref={logRef} style={{ marginTop: 12 }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                <b style={{ display: "block", marginBottom: 4 }}>{m.from === "you" ? "You" : "AutoProtect AI"}</b>
                <div>{m.text}</div>
              </div>
            ))}
          </div>

          <div className="chatBox">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about risk rules, entries/exits, posture, or Sabbath pause…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendToAI(input);
                  setInput("");
                }
              }}
            />
            <button
              style={{ width: 130 }}
              onClick={() => { sendToAI(input); setInput(""); }}
            >
              Send
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <button
              style={{ width: "auto" }}
              disabled={!sttSupported || listening}
              onClick={() => {
                if (!sttSupported) return;
                startVoice();
              }}
            >
              {listening ? "Listening…" : "🎙 Tap to speak"}
            </button>
            <small className="muted">
              If voice input doesn’t work on iPhone, we’ll still keep voice output + add a “tap to read out loud” button.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
