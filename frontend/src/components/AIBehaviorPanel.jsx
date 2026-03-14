// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// PURPOSE: AI Behavior + Professional Trade Journal
// ============================================================

import React, { useMemo, useState, useEffect } from "react";

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

  function formatTime(ts){
    return new Date(ts).toLocaleTimeString();
  }

  /* ================= TRADE RECONSTRUCTION ================= */

  const closedTrades = useMemo(()=>{

    const result=[];
    let entry=null;

    trades.forEach(t=>{

      if(t.side==="BUY" || t.side==="SELL"){
        entry=t;
      }

      if(t.side==="CLOSE" && entry){

        result.push({
          entryPrice:entry.price,
          exitPrice:t.price,
          qty:t.qty,
          entryTime:entry.time,
          exitTime:t.time,
          pnl:t.pnl
        });

        entry=null;
      }

    });

    return result;

  },[trades]);

  /* ================= GROUP BY DAY ================= */

  const tradesByDay = useMemo(()=>{

    const grouped={};

    closedTrades.forEach(t=>{

      const day=new Date(t.exitTime).toDateString();

      if(!grouped[day]){
        grouped[day]={wins:[],losses:[]};
      }

      if(t.pnl>=0) grouped[day].wins.push(t);
      else grouped[day].losses.push(t);

    });

    return grouped;

  },[closedTrades]);

  /* ================= STATS ================= */

  const stats = useMemo(()=>{

    let wins=0;
    let losses=0;
    let pnl=0;

    closedTrades.forEach(t=>{
      pnl+=t.pnl;
      if(t.pnl>=0) wins++;
      else losses++;
    });

    return{
      wins,
      losses,
      pnl,
      total:closedTrades.length
    };

  },[closedTrades]);

  /* ================= CONFIDENCE ================= */

  const avgConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total=
      decisions.reduce((s,d)=>s+(d.confidence||0),0);

    return (total/decisions.length)*100;

  },[decisions]);

  const accuracy = stats.total
    ? (stats.wins/stats.total)*100
    : 0;

  /* ================= UI ================= */

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3>AI Behavior Intelligence</h3>

      <div>Average Confidence: {avgConfidence.toFixed(1)}%</div>
      <div>Accuracy: {accuracy.toFixed(1)}%</div>

      <div style={{marginTop:12}}>
        Trades Closed: {stats.total}
      </div>

      <div style={{color:"#22c55e"}}>
        Wins: {stats.wins}
      </div>

      <div style={{color:"#ef4444"}}>
        Losses: {stats.losses}
      </div>

      <div>
        Total PnL:
        <span style={{
          color:stats.pnl>=0?"#22c55e":"#ef4444"
        }}>
          ${stats.pnl.toFixed(2)}
        </span>
      </div>

      {/* ACTIVE TRADE */}

      {position && (

        <div style={{marginTop:20}}>

          <strong>ACTIVE TRADE</strong>

          <div>Entry: {position.entry}</div>
          <div>Size: {position.qty}</div>
          <div>Time Open: {formatDuration(duration)}</div>

        </div>

      )}

      {/* JOURNAL */}

      <div style={{marginTop:20}}>

        <strong>AI Trade Journal</strong>

        {Object.keys(tradesByDay).map(day=>(

          <div key={day} style={{marginTop:15}}>

            <div style={{opacity:.7}}>{day}</div>

            {/* WINS */}

            {tradesByDay[day].wins.length>0 &&(

              <div>

                <div style={{color:"#22c55e"}}>
                  WINNING TRADES
                </div>

                {tradesByDay[day].wins.map((t,i)=>(

                  <div key={i} style={{marginBottom:10}}>

                    <div>{formatTime(t.entryTime)}</div>

                    <div>
                      {t.entryPrice} → {t.exitPrice}
                    </div>

                    <div>Size: {t.qty}</div>

                    <div>
                      Duration: {formatDuration(t.exitTime - t.entryTime)}
                    </div>

                    <div style={{color:"#22c55e"}}>
                      WIN +{t.pnl.toFixed(2)}
                    </div>

                  </div>

                ))}

              </div>

            )}

            {/* LOSSES */}

            {tradesByDay[day].losses.length>0 &&(

              <div>

                <div style={{color:"#ef4444"}}>
                  LOSING TRADES
                </div>

                {tradesByDay[day].losses.map((t,i)=>(

                  <div key={i} style={{marginBottom:10}}>

                    <div>{formatTime(t.entryTime)}</div>

                    <div>
                      {t.entryPrice} → {t.exitPrice}
                    </div>

                    <div>Size: {t.qty}</div>

                    <div>
                      Duration: {formatDuration(t.exitTime - t.entryTime)}
                    </div>

                    <div style={{color:"#ef4444"}}>
                      LOSS {t.pnl.toFixed(2)}
                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        ))}

      </div>

    </div>

  );

}
