// frontend/src/components/TVChart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * TVChart.jsx (FULL DROP-IN, WORKING TOOLS)
 * ✅ Exchange-style canvas chart
 * ✅ Right price scale tick labels
 * ✅ Bottom time scale
 * ✅ Working tools:
 *    - Zoom in/out
 *    - Pan (drag)
 *    - Crosshair
 *    - Horizontal line (click)
 *    - Trend line (click-drag)
 *    - Reset view
 *
 * Notes:
 * - Lightweight “TradingView-like” look. Not the official TV widget.
 * - Built to be stable on iPhone + desktop.
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function fmtPrice(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtTime(tsSec) {
  const d = new Date(tsSec * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function niceStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const n = rawStep / pow;
  let m = 1;
  if (n >= 5) m = 5;
  else if (n >= 2) m = 2;
  else m = 1;
  return m * pow;
}
function buildTicks(min, max, targetCount = 7) {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const raw = span / targetCount;
  const step = niceStep(raw);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;

  const out = [];
  for (let v = start; v <= end + step * 0.5; v += step) out.push(v);
  return out;
}

export default function TVChart({
  candles = [],
  height = 520,
  symbol = "BTCUSD",
  last = 0,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const safeHeight = Math.max(320, Number(height) || 520);

  // ---- viewport sizing
  const [size, setSize] = useState({ w: 800, h: safeHeight });

  // ---- tool states
  const [tool, setTool] = useState("crosshair"); // crosshair | pan | hline | trend
  const [crosshairOn, setCrosshairOn] = useState(true);

  // ---- chart interaction states
  const [bars, setBars] = useState(90); // zoom level: visible candles
  const [offset, setOffset] = useState(0); // pan offset in candles (0 = latest)
  const [drag, setDrag] = useState(null); // { x0, offset0 } for pan
  const [mouse, setMouse] = useState(null); // { x, y } in plot coords

  // ---- drawing objects
  const [hLines, setHLines] = useState([]); // [{ price }]
  const [tLines, setTLines] = useState([]); // [{ x1Idx, p1, x2Idx, p2 }]
  const [trendDraft, setTrendDraft] = useState(null); // { idx1, p1, idx2, p2, dragging }

  // responsive sizing
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.max(320, el.clientWidth || 800);
      const h = safeHeight;
      setSize({ w, h });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      try {
        ro.disconnect();
      } catch {}
      window.removeEventListener("resize", update);
    };
  }, [safeHeight]);

  // normalize input candles
  const data = useMemo(() => {
    const arr = Array.isArray(candles) ? candles : [];
    // keep only valid candles
    return arr
      .map((c) => ({
        time: Number(c?.time),
        open: Number(c?.open),
        high: Number(c?.high),
        low: Number(c?.low),
        close: Number(c?.close),
      }))
      .filter(
        (c) =>
          Number.isFinite(c.time) &&
          [c.open, c.high, c.low, c.close].every(Number.isFinite)
      );
  }, [candles]);

  // compute visible window based on zoom + pan
  const view = useMemo(() => {
    const n = data.length;
    if (!n) return [];

    const b = clamp(bars, 30, 240);
    const maxOffset = Math.max(0, n - b);
    const o = clamp(offset, 0, maxOffset);

    const end = n - o;
    const start = Math.max(0, end - b);
    return data.slice(start, end);
  }, [data, bars, offset]);

  // reset view to latest
  const resetView = () => {
    setBars(90);
    setOffset(0);
  };

  // handlers for tool buttons
  const zoomIn = () => setBars((b) => clamp(Math.round(b * 0.85), 30, 240));
  const zoomOut = () => setBars((b) => clamp(Math.round(b * 1.15), 30, 240));

  // draw
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = Math.floor(size.w);
    const H = Math.floor(size.h);

    c.width = Math.floor(W * dpr);
    c.height = Math.floor(H * dpr);
    c.style.width = "100%";
    c.style.height = `${H}px`;

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // regions
    const railW = 72;
    const rightScaleW = 84;
    const bottomScaleH = 32;

    const topPad = 10;
    const leftPad = railW + 10;
    const rightPad = rightScaleW + 10;
    const bottomPad = bottomScaleH + 12;

    const plotX0 = leftPad;
    const plotY0 = topPad;
    const plotW = Math.max(10, W - leftPad - rightPad);
    const plotH = Math.max(10, H - topPad - bottomPad);

    // background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, W, H);

    // glow
    const glow = ctx.createRadialGradient(W * 0.2, 0, 60, W * 0.2, 0, W * 0.9);
    glow.addColorStop(0, "rgba(122,167,255,0.12)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // bounds
    const have = view.length > 0;
    const lastNum = Number(last);

    let minP = Infinity;
    let maxP = -Infinity;

    if (have) {
      for (const k of view) {
        minP = Math.min(minP, k.low);
        maxP = Math.max(maxP, k.high);
      }
    }
    if (Number.isFinite(lastNum)) {
      minP = Math.min(minP, lastNum);
      maxP = Math.max(maxP, lastNum);
    }
    if (!Number.isFinite(minP) || !Number.isFinite(maxP) || minP === maxP) {
      minP = Number.isFinite(lastNum) ? lastNum - 100 : 0;
      maxP = Number.isFinite(lastNum) ? lastNum + 100 : 1;
    }

    const pad = (maxP - minP) * 0.07 || 10;
    const top = maxP + pad;
    const bot = minP - pad;

    const py = (p) => {
      const r = (top - p) / (top - bot);
      return plotY0 + clamp(r, 0, 1) * plotH;
    };
    const px = (i) => {
      const n = Math.max(1, view.length);
      return plotX0 + (plotW * i) / (n - 1 || 1);
    };

    // plot border
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX0, plotY0, plotW, plotH);

    // grid
    const yTicks = buildTicks(bot, top, 7);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (const v of yTicks) {
      const y = py(v);
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
    }
    const vCount = 10;
    for (let i = 1; i < vCount; i++) {
      const x = plotX0 + (plotW * i) / vCount;
      ctx.beginPath();
      ctx.moveTo(x, plotY0);
      ctx.lineTo(x, plotY0 + plotH);
      ctx.stroke();
    }

    // candles
    if (have) {
      const n = view.length;
      const gap = 2;
      const cw = Math.max(4, Math.floor(plotW / n) - gap);
      const usable = cw + gap;

      let startX = plotX0 + Math.max(0, plotW - usable * n) / 2;

      for (let i = 0; i < n; i++) {
        const k = view[i];
        const x = startX + i * usable;

        const up = k.close >= k.open;
        const openY = py(k.open);
        const closeY = py(k.close);
        const highY = py(k.high);
        const lowY = py(k.low);

        // wick
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(x + cw / 2, highY);
        ctx.lineTo(x + cw / 2, lowY);
        ctx.stroke();

        // body
        ctx.fillStyle = up ? "rgba(43,213,118,0.85)" : "rgba(255,90,95,0.85)";
        const by = Math.min(openY, closeY);
        const bh = Math.max(2, Math.abs(closeY - openY));
        ctx.fillRect(x, by, cw, bh);
      }
    }

    // last price line
    if (Number.isFinite(lastNum)) {
      const y = py(lastNum);
      ctx.strokeStyle = "rgba(122,167,255,0.75)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // label on right
      const label = fmtPrice(lastNum, 2);
      const boxH = 22;
      const bx = plotX0 + plotW + 10;
      const by = clamp(y - boxH / 2, plotY0, plotY0 + plotH - boxH);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx, by, rightScaleW - 8, boxH);
      ctx.strokeStyle = "rgba(122,167,255,0.45)";
      ctx.strokeRect(bx, by, rightScaleW - 8, boxH);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + 8, by + boxH / 2);
    }

    // right price scale ticks
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";
    for (const v of yTicks) {
      const y = py(v);
      if (y < plotY0 - 1 || y > plotY0 + plotH + 1) continue;

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.moveTo(plotX0 + plotW, y);
      ctx.lineTo(plotX0 + plotW + 6, y);
      ctx.stroke();

      ctx.fillText(fmtPrice(v, 2), plotX0 + plotW + 10, y);
    }

    // bottom time scale
    const axisY = plotY0 + plotH + 10;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(plotX0, axisY);
    ctx.lineTo(plotX0 + plotW, axisY);
    ctx.stroke();

    if (have) {
      const n = view.length;
      const approxLabels = Math.max(4, Math.min(8, Math.floor(plotW / 140)));
      const step = Math.max(1, Math.floor(n / approxLabels));
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textBaseline = "top";

      for (let i = 0; i < n; i += step) {
        const t = view[i].time;
        const x = px(i);

        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.beginPath();
        ctx.moveTo(x, plotY0 + plotH);
        ctx.lineTo(x, plotY0 + plotH + 6);
        ctx.stroke();

        const lbl = fmtTime(t);
        const tw = ctx.measureText(lbl).width;
        ctx.fillText(lbl, clamp(x - tw / 2, plotX0, plotX0 + plotW - tw), plotY0 + plotH + 10);
      }
    }

    // ---- draw horizontal lines
    if (hLines.length) {
      for (const hl of hLines) {
        const y = py(hl.price);
        ctx.strokeStyle = "rgba(255,209,102,0.70)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(plotX0, y);
        ctx.lineTo(plotX0 + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255,209,102,0.90)";
        ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.textBaseline = "middle";
        ctx.fillText(fmtPrice(hl.price, 2), plotX0 + 10, y);
      }
    }

    // ---- draw trend lines
    const drawTrend = (ln, alpha = 0.9) => {
      const n = view.length;
      if (!n) return;
      const x1 = px(clamp(ln.x1Idx, 0, n - 1));
      const x2 = px(clamp(ln.x2Idx, 0, n - 1));
      const y1 = py(ln.p1);
      const y2 = py(ln.p2);

      ctx.strokeStyle = `rgba(122,167,255,${alpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    for (const ln of tLines) drawTrend(ln, 0.85);
    if (trendDraft) drawTrend(trendDraft, 0.65);

    // ---- crosshair
    if (crosshairOn && mouse) {
      const mx = mouse.x;
      const my = mouse.y;
      if (mx >= plotX0 && mx <= plotX0 + plotW && my >= plotY0 && my <= plotY0 + plotH) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);

        ctx.beginPath();
        ctx.moveTo(plotX0, my);
        ctx.lineTo(plotX0 + plotW, my);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mx, plotY0);
        ctx.lineTo(mx, plotY0 + plotH);
        ctx.stroke();

        ctx.setLineDash([]);

        // price label on right
        const priceAtY = top - ((my - plotY0) / plotH) * (top - bot);
        const lbl = fmtPrice(priceAtY, 2);
        const boxH = 20;
        const bx = plotX0 + plotW + 10;
        const by = clamp(my - boxH / 2, plotY0, plotY0 + plotH - boxH);

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(bx, by, 72, boxH);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.strokeRect(bx, by, 72, boxH);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, bx + 8, by + boxH / 2);
      }
    }

    // header in plot
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(symbol, plotX0 + 10, plotY0 + 18);
  }, [size.w, size.h, view, symbol, last, crosshairOn, mouse, hLines, tLines, trendDraft, safeHeight]);

  // pointer events -> map to plot
  const onPointerMove = (e) => {
    const el = canvasRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMouse({ x, y });

    // pan dragging
    if (tool === "pan" && drag) {
      const dx = x - drag.x0;
      const perCandle = Math.max(4, (size.w - 72 - 84 - 30) / Math.max(30, view.length));
      const deltaCandles = Math.round(dx / perCandle);
      setOffset(() => clamp(drag.offset0 - deltaCandles, 0, Math.max(0, data.length - bars)));
    }

    // trend draft dragging
    if (tool === "trend" && trendDraft?.dragging) {
      const idx2 = xToIndex(x);
      const p2 = yToPrice(y);
      setTrendDraft((d) => (d ? { ...d, idx2, p2 } : d));
    }
  };

  const onPointerLeave = () => {
    setMouse(null);
    setDrag(null);
    if (trendDraft?.dragging) setTrendDraft((d) => (d ? { ...d, dragging: false } : d));
  };

  const onPointerDown = (e) => {
    const el = canvasRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pan") {
      setDrag({ x0: x, offset0: offset });
      return;
    }

    if (tool === "hline") {
      const price = yToPrice(y);
      if (Number.isFinite(price)) setHLines((prev) => [...prev, { price }]);
      return;
    }

    if (tool === "trend") {
      const idx1 = xToIndex(x);
      const p1 = yToPrice(y);
      setTrendDraft({ x1Idx: idx1, p1, x2Idx: idx1, p2: p1, dragging: true });
      return;
    }
  };

  const onPointerUp = (e) => {
    const el = canvasRef.current;
    if (!el) return;
    try {
      el.releasePointerCapture?.(e.pointerId);
    } catch {}

    setDrag(null);

    if (tool === "trend" && trendDraft) {
      // finalize if meaningful
      const ok =
        Number.isFinite(trendDraft.p1) &&
        Number.isFinite(trendDraft.p2) &&
        Math.abs(trendDraft.x2Idx - trendDraft.x1Idx) >= 1;

      if (ok) {
        setTLines((prev) => [
          ...prev,
          {
            x1Idx: trendDraft.x1Idx,
            p1: trendDraft.p1,
            x2Idx: trendDraft.x2Idx,
            p2: trendDraft.p2,
          },
        ]);
      }
      setTrendDraft(null);
    }
  };

  // convert mouse x to candle index in current view
  const xToIndex = (x) => {
    const W = size.w;
    const railW = 72;
    const rightScaleW = 84;
    const leftPad = railW + 10;
    const rightPad = rightScaleW + 10;
    const plotW = Math.max(10, W - leftPad - rightPad);
    const plotX0 = leftPad;

    const n = Math.max(1, view.length);
    const r = (x - plotX0) / plotW;
    return clamp(Math.round(r * (n - 1)), 0, n - 1);
  };

  // convert mouse y to price using current bounds of view
  const yToPrice = (y) => {
    // rebuild bounds similar to draw
    if (!view.length) return NaN;

    let minP = Infinity;
    let maxP = -Infinity;
    for (const k of view) {
      minP = Math.min(minP, k.low);
      maxP = Math.max(maxP, k.high);
    }
    const lastNum = Number(last);
    if (Number.isFinite(lastNum)) {
      minP = Math.min(minP, lastNum);
      maxP = Math.max(maxP, lastNum);
    }
    if (!Number.isFinite(minP) || !Number.isFinite(maxP) || minP === maxP) return NaN;

    const pad = (maxP - minP) * 0.07 || 10;
    const top = maxP + pad;
    const bot = minP - pad;

    const H = size.h;
    const bottomScaleH = 32;
    const topPad = 10;
    const bottomPad = bottomScaleH + 12;
    const plotH = Math.max(10, H - topPad - bottomPad);
    const plotY0 = topPad;

    const r = clamp((y - plotY0) / plotH, 0, 1);
    const p = top - r * (top - bot);
    return p;
  };

  return (
    <div ref={wrapRef} style={wrap}>
      {/* LEFT TOOL RAIL (REAL) */}
      <div style={toolsRail}>
        <ToolBtn active={tool === "crosshair"} label="⌖" title="Crosshair" onClick={() => setTool("crosshair")} />
        <ToolBtn active={tool === "pan"} label="⇄" title="Pan (drag)" onClick={() => setTool("pan")} />
        <ToolBtn active={tool === "trend"} label="／" title="Trend line (drag)" onClick={() => setTool("trend")} />
        <ToolBtn active={tool === "hline"} label="⊥" title="Horizontal line (click)" onClick={() => setTool("hline")} />
        <ToolBtn label="＋" title="Zoom in" onClick={zoomIn} />
        <ToolBtn label="－" title="Zoom out" onClick={zoomOut} />
        <ToolBtn label="⟲" title="Reset view" onClick={resetView} />
        <ToolBtn
          active={crosshairOn}
          label="✣"
          title="Toggle crosshair"
          onClick={() => setCrosshairOn((v) => !v)}
        />
      </div>

      {/* CHART AREA */}
      <div style={chartArea}>
        <canvas
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          style={{ display: "block", touchAction: tool === "pan" ? "none" : "manipulation" }}
        />
        {/* subtle watermark */}
        <div style={watermark}>AutoShield</div>
      </div>
    </div>
  );
}

function ToolBtn({ label, title, onClick, active }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        ...toolBtn,
        borderColor: active ? "rgba(122,167,255,0.55)" : toolBtn.borderColor,
        background: active ? "rgba(122,167,255,0.18)" : toolBtn.background,
      }}
    >
      {label}
    </button>
  );
}

/* ---------- styles ---------- */

const wrap = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  overflow: "visible",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  boxShadow: "0 10px 22px rgba(0,0,0,.28)",
};

const chartArea = {
  position: "relative",
  borderRadius: 16,
  overflow: "hidden",
};

const toolsRail = {
  position: "absolute",
  left: 12,
  top: 12,
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.20)",
  backdropFilter: "blur(8px)",
};

const toolBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 900,
  userSelect: "none",
  cursor: "pointer",
};

const watermark = {
  position: "absolute",
  left: 12,
  bottom: 10,
  zIndex: 10,
  fontWeight: 900,
  fontSize: 14,
  letterSpacing: 0.4,
  opacity: 0.45,
  padding: "6px 10px",
  borderRadius: 12,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.10)",
};
