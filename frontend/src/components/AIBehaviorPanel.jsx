// frontend/src/components/AIBehaviorPanel.jsx
// ============================================================
// AI BEHAVIOR PANEL — AI PERFORMANCE INTELLIGENCE v6
//
// FEATURES
// - Live AI statistics
// - Active trade display (current position)
// - Daily performance metrics
// - AI learning memory tracking
// - Trade journal grouped by day
//
// IMPORTANT MAINTENANCE NOTES
// - Top statistics must always match journal totals
// - Active trade uses state.position from TradingRoom
// - Closed trades use side === "CLOSE"
// - Journal shows entry → exit format
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

      const diff = Date.now() - position.time;
      setDuration(diff);

    },1000);

    return ()=>clearInterval(timer);

  },[position]);

  function formatDuration(ms){

    const s = Math.floor(ms/1000);
    const m = Math.floor(s/60);
    const sec = s % 60;

    return `${m}m ${sec}s`;

  }

  /* ================= CLOSED TRADES ================= */

  const closedTrades = useMemo(()=>{
    return trades.filter(t => t.side === "CLOSE");
  },[trades]);

  /* ================= TRADE STATS ================= */

  const tradeStats = useMemo(()=>{

    let wins=0;
    let losses=0;
    let pnl=0;

    closedTrades.forEach(t=>{

      const p = Number(t.pnl||0);

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

  /* ================= DAILY PERFORMANCE ================= */

  const dailyStats = useMemo(()=>{

    const today = new Date().toDateString();

    const todayTrades = closedTrades.filter(t=>{

      if(!t.time) return false;

      return new Date(t.time).toDateString()===today;

    });

    let wins=0;
    let losses=0;
    let pnl=0;

    todayTrades.forEach(t=>{

      const p = Number(t.pnl||0);

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

  /* ================= TRADE JOURNAL ================= */

  const tradesByDay = useMemo(()=>{

    const grouped={};

    closedTrades.forEach(t=>{

      if(!t.time) return;

      const day=new Date(t.time).toDateString();

      if(!grouped[day])
        grouped[day]=[];

      grouped[day].push(t);

    });

    return grouped;

  },[closedTrades]);

  /* ================= AI CONFIDENCE ================= */

  const avgConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total =
      decisions.reduce((sum,d)=>sum+(d.confidence||0),0);

    return (total/decisions.length)*100;

  },[decisions]);

  /* ================= ACCURACY ================= */

  const accuracy = useMemo(()=>{

    if(!tradeStats.total) return 0;

    return (tradeStats.wins/tradeStats.total)*100;

  },[tradeStats]);

  /* ================= AI LEARNING ================= */

  const learning = useMemo(()=>{

    if(!memory){
      return{
        signals:0,
        trades:trades.length,
        market:0
      };
    }

    return{
      signals:memory.signalsStored||0,
      trades:memory.tradesStored||trades.length,
      market:memory.marketStatesStored||0
    };

  },[memory,trades]);

  /* ================= UI ================= */

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3 style={{marginBottom:16}}>
        AI Behavior Intelligence
      </h3>

      {/* ================= CONFIDENCE ================= */}

      <div style={{marginBottom:10}}>
        <strong>Average AI Confidence:</strong>{" "}
        {avgConfidence.toFixed(1)}%
      </div>

      <div style={{marginBottom:10}}>
        <strong>AI Accuracy:</strong>{" "}
        {accuracy.toFixed(1)}%
      </div>

      {/* ================= TRADE PERFORMANCE ================= */}

      <div style={{marginTop:12}}>

        <strong>Trade Performance</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Trades Closed:</span>
          <span>{tradeStats.total}</span>

          <span>Wins:</span>
          <span style={{color:"#22c55e"}}>
            {tradeStats.wins}
          </span>

          <span>Losses:</span>
          <span style={{color:"#ef4444"}}>
            {tradeStats.losses}
          </span>

          <span>Total PnL:</span>
          <span style={{
            color:tradeStats.pnl>=0?"#22c55e":"#ef4444"
          }}>
            ${tradeStats.pnl.toFixed(2)}
          </span>

        </div>

      </div>

      {/* ================= ACTIVE TRADE ================= */}

      {position && (

        <div style={{marginTop:18}}>

          <strong>Active Trade</strong>

          <div style={{
            marginTop:8,
            fontSize:13,
            lineHeight:"18px"
          }}>

            <div>
              Entry Price: {position.entry}
            </div>

            <div>
              Size: {position.qty}
            </div>

            <div>
              Duration: {formatDuration(duration)}
            </div>

          </div>

        </div>

      )}

      {/* ================= DAILY PERFORMANCE ================= */}

      <div style={{marginTop:18}}>

        <strong>Daily Performance</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Trades Today:</span>
          <span>{dailyStats.trades}</span>

          <span>Wins Today:</span>
          <span style={{color:"#22c55e"}}>
            {dailyStats.wins}
          </span>

          <span>Losses Today:</span>
          <span style={{color:"#ef4444"}}>
            {dailyStats.losses}
          </span>

          <span>Daily PnL:</span>
          <span style={{
            color:dailyStats.pnl>=0?"#22c55e":"#ef4444"
          }}>
            ${dailyStats.pnl.toFixed(2)}
          </span>

        </div>

      </div>

      {/* ================= AI LEARNING ================= */}

      <div style={{marginTop:18}}>

        <strong>AI Learning Memory</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Signals Learned:</span>
          <span>{learning.signals}</span>

          <span>Trades Learned:</span>
          <span>{learning.trades}</span>

          <span>Market States:</span>
          <span>{learning.market}</span>

        </div>

      </div>

      {/* ================= TRADE JOURNAL ================= */}

      <div style={{marginTop:18}}>

        <strong>AI Trade Journal</strong>

        {Object.keys(tradesByDay).map(day=>(

          <div key={day} style={{marginTop:10}}>

            <div style={{opacity:.7, marginBottom:6}}>
              {day}
            </div>

            {tradesByDay[day].slice(-10).map((t,i)=>(

              <div
                key={i}
                style={{
                  display:"flex",
                  justifyContent:"space-between",
                  fontSize:13,
                  borderBottom:"1px solid rgba(255,255,255,.05)",
                  padding:"4px 0"
                }}
              >

                <span>
                  {t.entry} → {t.price}
                </span>

                <span>
                  {t.qty}
                </span>

                <span style={{
                  color:t.pnl>=0?"#22c55e":"#ef4444"
                }}>
                  {t.pnl>0?"WIN":"LOSS"} {Number(t.pnl).toFixed(2)}
                </span>

              </div>

            ))}

          </div>

        ))}

      </div>

    </div>

  );

}
