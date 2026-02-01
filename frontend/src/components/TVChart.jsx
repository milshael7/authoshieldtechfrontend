// frontend/src/components/TVChart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * TVChart.jsx (FULL DROP-IN)
 * What this fixes (in ONE file):
 * ✅ Left tool rail (always visible, desktop + iPhone)
 * ✅ Right price scale with FULL tick labels (the missing “numbers on the side”)
 * ✅ Bottom time scale (the missing “ruler” at the bottom)
 * ✅ Responsive + stable sizing (ResizeObserver, DPR scaling)
 * ✅ Candle rendering (no more placeholder-only look)
 *
 * Notes:
 * - This is a lightweight TradingView-style canvas chart (not the official TV widget).
 * - It’s designed to LOOK like the screenshot vibe: rails, scales, grid, candles.
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
  // nice number step: 1/2/5 * 10^k
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

export default function TVChart({ candles = [], height = 520, symbol = "BTCUSD", last = 0 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const [size, setSize] = useState({ w: 800, h: 520 });

  const safeHeight = Math.max(320, Number(height) || 520);

  // Pick a window of candles so it stays “exchange-like”
  const view = useMemo(() => {
    const arr = Array.isArray(candles) ? candles : [];
    // show roughly what fits nicely
    const maxBars = 160;
    return arr.length > maxBars ? arr.slice(arr.length - maxBars) : arr;
  }, [candles]);

  // responsive sizing (works on desktop + mobile)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.max(320, el.clientWidth || 800);
      const h = safeHeight;
      setSize({ w, h });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      try {
        ro.disconnect();
      } catch {}
      window.removeEventListener("resize", update);
    };
  }, [safeHeight]);

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

    // ---- layout regions ----
    const railW = 72; // space so candles don't hide behind left tools
    const rightScaleW = 78;
    const bottomScaleH = 30;
    const topPad = 10;
    const leftPad = railW + 10;
    const rightPad = rightScaleW + 10;
    const bottomPad = bottomScaleH + 10;

    const plotX0 = leftPad;
    const plotY0 = topPad;
    const plotW = Math.max(10, W - leftPad - rightPad);
    const plotH = Math.max(10, H - topPad - bottomPad);

    // background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, W, H);

    // subtle vignette glow like terminals
    const grd = ctx.createRadialGradient(W * 0.2, 0, 60, W * 0.2, 0, W * 0.9);
    grd.addColorStop(0, "rgba(122,167,255,0.10)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // panel lines (plot border)
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX0, plotY0, plotW, plotH);

    // ---- data bounds ----
    const arr = view;
    const lastNum = Number(last);
    const have = arr.length > 0;

    let minP = Infinity;
    let maxP = -Infinity;

    if (have) {
      for (const k of arr) {
        const hi = Number(k?.high);
        const lo = Number(k?.low);
        if (Number.isFinite(hi)) maxP = Math.max(maxP, hi);
        if (Number.isFinite(lo)) minP = Math.min(minP, lo);
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

    const pad = (maxP - minP) * 0.06 || 10;
    const top = maxP + pad;
    const bot = minP - pad;

    const py = (p) => {
      const r = (top - p) / (top - bot);
      return plotY0 + clamp(r, 0, 1) * plotH;
    };

    // ---- grid ----
    // horizontal grid aligns with price ticks
    const yTicks = buildTicks(bot, top, 7);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;

    for (const v of yTicks) {
      const y = py(v);
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
    }

    // vertical grid
    const vCount = 10;
    for (let i = 1; i < vCount; i++) {
      const x = plotX0 + (plotW * i) / vCount;
      ctx.beginPath();
      ctx.moveTo(x, plotY0);
      ctx.lineTo(x, plotY0 + plotH);
      ctx.stroke();
    }

    // ---- candles ----
    if (have) {
      const n = arr.length;
      const gap = 2;
      const cw = Math.max(4, Math.floor(plotW / n) - gap);
      const usable = cw + gap;
      let x = plotX0 + Math.max(0, plotW - usable * n) / 2;

      for (let i = 0; i < n; i++) {
        const k = arr[i];
        const o = Number(k?.open);
        const h = Number(k?.high);
        const l = Number(k?.low);
        const cl = Number(k?.close);
        if (![o, h, l, cl].every(Number.isFinite)) {
          x += usable;
          continue;
        }

        const up = cl >= o;
        const openY = py(o);
        const closeY = py(cl);
        const highY = py(h);
        const lowY = py(l);

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

        x += usable;
      }
    }

    // ---- last price line ----
    if (Number.isFinite(lastNum)) {
      const y = py(lastNum);
      ctx.strokeStyle = "rgba(122,167,255,0.75)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // label on right scale
      const label = fmtPrice(lastNum, 2);
      const boxW = 64 + Math.min(70, label.length * 7);
      const boxH = 22;
      const bx = plotX0 + plotW + 10;
      const by = clamp(y - boxH / 2, plotY0, plotY0 + plotH - boxH);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx, by, rightScaleW - 6, boxH);
      ctx.strokeStyle = "rgba(122,167,255,0.50)";
      ctx.strokeRect(bx, by, rightScaleW - 6, boxH);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(label, bx + 8, by + 15);
    }

    // ---- right price scale ticks (FULL) ----
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";

    for (const v of yTicks) {
      const y = py(v);
      if (y < plotY0 - 1 || y > plotY0 + plotH + 1) continue;

      // small tick mark
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.moveTo(plotX0 + plotW, y);
      ctx.lineTo(plotX0 + plotW + 6, y);
      ctx.stroke();

      const txt = fmtPrice(v, 2);
      ctx.fillText(txt, plotX0 + plotW + 10, y);
    }

    // ---- bottom time scale ----
    const axisY = plotY0 + plotH + 10;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(plotX0, axisY);
    ctx.lineTo(plotX0 + plotW, axisY);
    ctx.stroke();

    if (have) {
      const times = arr.map((cnd) => Number(cnd?.time)).filter(Number.isFinite);
      if (times.length) {
        const n = times.length;
        const approxLabels = Math.max(4, Math.min(8, Math.floor(plotW / 140)));
        const step = Math.max(1, Math.floor(n / approxLabels));

        ctx.fillStyle = "rgba(255,255,255,0.70)";
        ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.textBaseline = "top";

        for (let i = 0; i < n; i += step) {
          const t = times[i];
          const x = plotX0 + (plotW * i) / (n - 1 || 1);

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
    }

    // top-left header inside plot (symbol)
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(symbol, plotX0 + 10, plotY0 + 18);
  }, [size.w, size.h, view, safeHeight, symbol, last]);

  return (
    <div ref={wrapRef} style={wrap}>
      {/* TOOL RAIL (always visible) */}
      <div style={toolsRail} aria-hidden="true">
        <ToolBtn label="⌖" title="Crosshair" />
        <ToolBtn label="／" title="Trend line" />
        <ToolBtn label="⊥" title="Horizontal line" />
        <ToolBtn label="⇄" title="Pan" />
        <ToolBtn label="＋" title="Zoom in" />
        <ToolBtn label="－" title="Zoom out" />
      </div>

      {/* CHART AREA */}
      <div style={chartArea}>
        <canvas ref={canvasRef} />
        <div style={watermark}>AutoShield</div>
      </div>
    </div>
  );
}

function ToolBtn({ label, title }) {
  return (
    <div style={toolBtn} title={title}>
      {label}
    </div>
  );
}

/* ---------- styles ---------- */

const wrap = {
  position: "relative",
  width: "100%",
  minWidth: 0,

  // IMPORTANT: do NOT clip the tool rail
  overflow: "visible",

  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  boxShadow: "0 10px 22px rgba(0,0,0,.28)",
};

const chartArea = {
  position: "relative",
  borderRadius: 16,
  overflow: "hidden", // clip ONLY the canvas
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
  pointerEvents: "auto",
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
};

const watermark = {
  position: "absolute",
  left: 12,
  bottom: 10,
  zIndex: 10,
  fontWeight: 900,
  fontSize: 14,
  letterSpacing: 0.4,
  opacity: 0.55,
  padding: "6px 10px",
  borderRadius: 12,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.10)",
};
