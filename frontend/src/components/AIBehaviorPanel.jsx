// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// MODULE: AI Behavior Intelligence Panel
//
// PURPOSE
// Provide real-time intelligence about AI trading behavior.
//
// PANEL STRUCTURE
// ------------------------------------------------------------
// TOP (FIXED)
//   - AI Analytics
//   - Trade Performance
//   - Daily Performance
//   - Active Trade Monitor
//
// BOTTOM (SCROLLABLE)
//   - Winning Trades Panel
//   - Losing Trades Panel
//
// MAINTENANCE RULES
// ------------------------------------------------------------
// 1. Top analytics must NEVER scroll.
// 2. Only the trade journal panels may scroll.
// 3. Trade data must be protected against null values.
// 4. Trades must be sorted newest first.
//
// REQUIRED TRADE STRUCTURE
// { symbol, side, price, qty, pnl, time }
//
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null,
  position = null
}) {

/* ================= ACTIVE TRADE TIMER ================= */

const [duration,setDuration] = useState(0);

useEffect(()=>{

  if(!position?.time) return;

  const timer=setInterval(()=>{
    setDuration(Date.now() - position.time);
  },1000);

  return ()=>clearInterval(timer);

},[position]);

function formatDuration(ms){

  const s=Math.floor(ms/1000);
  const m=Math.floor(s/60);
  const sec=s%60;

  return `${m}m ${sec}s`;

}

/* ================= CLOSED TRADES ================= */

const closedTrades = useMemo(()=>{

  return trades
    .filter(t=>t?.side==="CLOSE")
    .sort((a,b)=>(b.time||0)-(a.time||0));

},[trades]);

/* ================= WIN / LOSS SPLIT ================= */

const winningTrades = useMemo(()=>{

  return closedTrades.filter(
    t=>Number(t?.pnl||0)>=0
  );

},[closedTrades]);

const losingTrades = useMemo(()=>{

  return closedTrades.filter(
    t=>Number(t?.pnl||0)<0
  );

},[closedTrades]);

/* ================= TRADE STATS ================= */

const tradeStats = useMemo(()=>{

  let wins=0;
  let losses=0;
  let pnl=0;

  closedTrades.forEach(t=>{

    const p=Number(t?.pnl||0);

    pnl+=p;

    if(p>0) wins++;
    else if(p<0) losses++;

  });

  return{
    wins,
    losses,
    pnl,
    total:closedTrades.length
  };

},[closedTrades]);

/* ================= DAILY STATS ================= */

const dailyStats = useMemo(()=>{

  const today=new Date().toDateString();

  const todayTrades=closedTrades.filter(t=>{

    if(!t?.time) return false;

    return new Date(t.time).toDateString()===today;

  });

  let wins=0;
  let losses=0;
  let pnl=0;

  todayTrades.forEach(t=>{

    const p=Number(t?.pnl||0);

    pnl+=p;

    if(p>0) wins++;
    else if(p<0) losses++;

  });

  return{
    trades:todayTrades.length,
    wins,
    losses,
    pnl
  };

},[closedTrades]);

/* ================= AI CONFIDENCE ================= */

const avgConfidence = useMemo(()=>{

  if(!decisions?.length) return 0;

  const total=
    decisions.reduce((s,d)=>s+(d?.confidence||0),0);

  return (total/decisions.length)*100;

},[decisions]);

/* ================= ACCURACY ================= */

const accuracy = useMemo(()=>{

  if(!tradeStats.total) return 0;

  return (tradeStats.wins/tradeStats.total)*100;

},[tradeStats]);

/* ================= UI ================= */

return(

<div style={{
  background:"#111827",
  padding:20,
  borderRadius:12,
  border:"1px solid rgba(255,255,255,.08)"
}}>

<h3>AI Behavior Intelligence</h3>

{/* ================= ANALYTICS ================= */}

<div style={{marginTop:10}}>
<strong>Average AI Confidence:</strong> {avgConfidence.toFixed(1)}%
</div>

<div>
<strong>AI Accuracy:</strong> {accuracy.toFixed(1)}%
</div>

{/* ================= TRADE PERFORMANCE ================= */}

<div style={{marginTop:12}}>

<strong>Trade Performance</strong>

<div>Trades Closed: {tradeStats.total}</div>

<div style={{color:"#22c55e"}}>
Wins: {tradeStats.wins}
</div>

<div style={{color:"#ef4444"}}>
Losses: {tradeStats.losses}
</div>

<div>
Total PnL:
<span style={{
color:tradeStats.pnl>=0?"#22c55e":"#ef4444"
}}>
 {" "} ${tradeStats.pnl.toFixed(2)}
</span>
</div>

</div>

{/* ================= DAILY PERFORMANCE ================= */}

<div style={{marginTop:14}}>

<strong>Daily Performance</strong>

<div>Trades Today: {dailyStats.trades}</div>

<div style={{color:"#22c55e"}}>
Wins Today: {dailyStats.wins}
</div>

<div style={{color:"#ef4444"}}>
Losses Today: {dailyStats.losses}
</div>

<div>
Daily PnL:
<span style={{
color:dailyStats.pnl>=0?"#22c55e":"#ef4444"
}}>
 {" "} ${dailyStats.pnl.toFixed(2)}
</span>
</div>

</div>

{/* ================= ACTIVE TRADE ================= */}

{position && (

<div style={{
marginTop:20,
padding:12,
background:"#1f2937",
borderRadius:8
}}>

<strong>Active Trade Monitor</strong>

<div>Market: {position.symbol || "UNKNOWN"}</div>
<div>Entry Price: {position.entry}</div>
<div>Position Size: {position.qty}</div>
<div>Time Open: {formatDuration(duration)}</div>

</div>

)}

{/* ================= TRADE JOURNAL ================= */}

<div style={{
display:"flex",
gap:20,
marginTop:25
}}>

{/* ================= WINNING TRADES ================= */}

<div style={{flex:1}}>

<h4 style={{color:"#22c55e"}}>Winning Trades</h4>

<div style={{
maxHeight:300,
overflowY:"auto"
}}>

{winningTrades.length===0 && (
<div style={{opacity:.6}}>No winning trades yet</div>
)}

{winningTrades.map((t,i)=>(

<div key={i} style={{
background:"rgba(34,197,94,.08)",
padding:8,
marginBottom:8,
borderRadius:6
}}>

<div>{new Date(t.time).toLocaleString()}</div>
<div>Market: {t.symbol || "UNKNOWN"}</div>
<div>PnL: +{Number(t.pnl||0).toFixed(2)}</div>

</div>

))}

</div>

</div>

{/* ================= LOSING TRADES ================= */}

<div style={{flex:1}}>

<h4 style={{color:"#ef4444"}}>Losing Trades</h4>

<div style={{
maxHeight:300,
overflowY:"auto"
}}>

{losingTrades.length===0 && (
<div style={{opacity:.6}}>No losing trades</div>
)}

{losingTrades.map((t,i)=>(

<div key={i} style={{
background:"rgba(239,68,68,.08)",
padding:8,
marginBottom:8,
borderRadius:6
}}>

<div>{new Date(t.time).toLocaleString()}</div>
<div>Market: {t.symbol || "UNKNOWN"}</div>
<div>PnL: {Number(t.pnl||0).toFixed(2)}</div>

</div>

))}

</div>

</div>

</div>

</div>

);

}
