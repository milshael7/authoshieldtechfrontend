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

function gradeFromScore(score){
  if(score >= 90) return "A";
  if(score >= 80) return "B";
  if(score >= 65) return "C";
  return "D";
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
        setStatus("LIVE");
      }catch(e){
        setStatus("ERROR");
      }
    }

    load();
    t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const domains = useMemo(() => posture?.domains || [], [posture]);
  const maxIssues = useMemo(() => Math.max(1, ...domains.map(d => Number(d.issues)||0)), [domains]);

  /* =============================
     SCORE ENGINE
     ============================= */

  const scoreData = useMemo(() => {
    if(!domains.length){
      return { score: 0, avgCoverage: 0, totalIssues: 0, grade: "—" };
    }

    const avgCoverage =
      domains.reduce((a,b)=>a+Number(b.coverage||0),0)/domains.length;

    const totalIssues =
      domains.reduce((a,b)=>a+Number(b.issues||0),0);

    // Issue pressure reduces score slightly
    const issuePenalty = Math.min(totalIssues * 1.5, 25);

    const score = clamp(avgCoverage - issuePenalty, 0, 100);

    return {
      score: Math.round(score),
      avgCoverage: Math.round(avgCoverage),
      totalIssues,
      grade: gradeFromScore(score)
    };

  }, [domains]);

  /* =============================
     RADAR DRAW
     ============================= */

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

    const bg = ctx.createLinearGradient(0,0,0,cssH);
    bg.addColorStop(0,"rgba(20,25,35,0.7)");
    bg.addColorStop(1,"rgba(10,14,20,0.9)");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,cssW,cssH);

    const n = domains.length || 6;
    const cx = cssW * 0.5;
    const cy = cssH * 0.55;
    const R  = Math.min(cssW, cssH) * 0.34;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for(let k=1;k<=5;k++){
      const r = (R*k)/5;
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

    for(let i=0;i<n;i++){
      const a = (Math.PI*2*i)/n - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
      ctx.stroke();
    }

    if(!domains.length){
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px system-ui";
      ctx.fillText("No posture data yet.", 20, 30);
      return;
    }

    ctx.fillStyle = "rgba(122,167,255,0.25)";
    ctx.strokeStyle = "rgba(122,167,255,0.95)";
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

    for(let i=0;i<n;i++){
      const d = domains[i];
      const cov = clamp((Number(d.coverage)||0)/100, 0, 1);
      const issues = clamp(Number(d.issues)||0, 0, 999);
      const a = (Math.PI*2*i)/n - Math.PI/2;

      const x = cx + Math.cos(a)*R*cov;
      const y = cy + Math.sin(a)*R*cov;
      const sz = 3 + (issues/maxIssues)*6;

      ctx.fillStyle = issues > 0 ? "#ff5a5f" : "#2bd576";
      ctx.beginPath();
      ctx.arc(x,y,sz,0,Math.PI*2);
      ctx.fill();
    }

  }, [domains, maxIssues]);

  return (
    <div className="card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <b>Security Command Score</b>
          <div className="muted" style={{fontSize:12}}>
            Avg Coverage: {scoreData.avgCoverage}% • Issues: {scoreData.totalIssues}
          </div>
        </div>

        <span className={`badge ${status==="LIVE"?"ok":""}`}>
          {status}
        </span>
      </div>

      <div style={{marginTop:14,height:380}}>
        <canvas
          ref={canvasRef}
          style={{
            width:"100%",
            height:"100%",
            borderRadius:18,
            border:"1px solid rgba(255,255,255,0.10)"
          }}
        />
      </div>

      <div style={{
        marginTop:18,
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center"
      }}>
        <div>
          <div style={{fontSize:14}}>Overall Security Score</div>
          <div style={{fontSize:28,fontWeight:900}}>
            {scoreData.score}/100
          </div>
        </div>

        <div style={{
          fontSize:36,
          fontWeight:900,
          color:
            scoreData.grade === "A" ? "#2bd576" :
            scoreData.grade === "B" ? "#5EC6FF" :
            scoreData.grade === "C" ? "#ffd166" :
            "#ff5a5f"
        }}>
          {scoreData.grade}
        </div>
      </div>
    </div>
  );
}
