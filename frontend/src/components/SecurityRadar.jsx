import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function apiBase() {
  return ((import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim());
}

function fmtPct(n){
  const x = Number(n);
  if(!Number.isFinite(x)) return "—";
  return `${Math.round(x)}%`;
}

export default function SecurityRadar(){
  const [status, setStatus] = useState("Loading…");
  const [posture, setPosture] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let t;
    const base = apiBase();
    if(!base){ setStatus("Missing VITE_API_BASE"); return; }

    async function load(){
      try{
        const res = await fetch(`${base}/api/security/posture`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if(!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        setPosture(data.posture);
        setStatus("OK");
      }catch(e){
        setStatus(`Error: ${e?.message || "failed"}`);
      }
    }

    load();
    t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const domains = useMemo(() => posture?.domains || [], [posture]);
  const maxIssues = useMemo(() => Math.max(1, ...domains.map(d => Number(d.issues)||0)), [domains]);

  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0,0,cssW,cssH);

    // background panel
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0,0,cssW,cssH);

    const n = domains.length || 9;
    const cx = cssW * 0.50;
    const cy = cssH * 0.52;
    const R  = Math.min(cssW, cssH) * 0.32;

    // grid rings
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for(let k=1;k<=5;k++){
      const r = (R * k)/5;
      ctx.beginPath();
      for(let i=0;i<n;i++){
        const a = (Math.PI*2*i)/n - Math.PI/2;
        const x = cx + Math.cos(a)*r;
        const y = cy + Math.sin(a)*r;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // axes
    for(let i=0;i<n;i++){
      const a = (Math.PI*2*i)/n - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
      ctx.stroke();
    }

    if(!domains.length){
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("No posture data yet.", 16, 24);
      return;
    }

    // polygon (coverage)
    ctx.fillStyle = "rgba(122,167,255,0.18)";
    ctx.strokeStyle = "rgba(122,167,255,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const d = domains[i];
      const cov = clamp((Number(d.coverage)||0)/100, 0, 1);
      const a = (Math.PI*2*i)/n - Math.PI/2;
      const x = cx + Math.cos(a)*R*cov;
      const y = cy + Math.sin(a)*R*cov;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // points (issues)
    for(let i=0;i<n;i++){
      const d = domains[i];
      const cov = clamp((Number(d.coverage)||0)/100, 0, 1);
      const issues = clamp(Number(d.issues)||0, 0, 999);
      const a = (Math.PI*2*i)/n - Math.PI/2;

      const x = cx + Math.cos(a)*R*cov;
      const y = cy + Math.sin(a)*R*cov;

      const sz = 3 + (issues/maxIssues)*6;

      ctx.fillStyle = issues > 0 ? "rgba(255,90,95,0.95)" : "rgba(43,213,118,0.95)";
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI*2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // title
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Security Coverage Map", 16, 24);

    // legend
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Blue shape = coverage • Red/Green dots = issues", 16, 44);

  }, [domains, maxIssues]);

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:10}}>
        <div>
          <b>Coverage & Issues by Security Control</b>
          <div className="muted" style={{fontSize:12}}>
            Status: {status}{posture?.updatedAt ? ` • Updated: ${new Date(posture.updatedAt).toLocaleTimeString()}` : ""}
          </div>
        </div>
        <span className={`badge ${status==="OK" ? "ok" : ""}`}>{status==="OK" ? "LIVE" : "…"}</span>
      </div>

      <div style={{marginTop:12, height:360}}>
        <canvas ref={canvasRef} style={{width:"100%", height:"100%", borderRadius:14, border:"1px solid rgba(255,255,255,0.10)"}} />
      </div>

      <div style={{marginTop:12}}>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Control</th>
                <th>Coverage</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.key}>
                  <td>{d.label}</td>
                  <td>{fmtPct(d.coverage)}</td>
                  <td>{d.issues}</td>
                </tr>
              ))}
              {domains.length === 0 && (
                <tr><td colSpan="3" className="muted">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
