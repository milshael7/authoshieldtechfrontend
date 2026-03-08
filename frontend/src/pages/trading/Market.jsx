import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import TerminalChart from "../../components/TerminalChart";
import "../../styles/terminal.css";

/**
 * Market.jsx — INTERNAL MULTI-ASSET MARKET PANEL
 * FIXED: live candle updates instead of static candles
 */

const SYMBOL_GROUPS = {
  Crypto: ["BTCUSDT","ETHUSDT","SOLUSDT"],
  Forex: ["EURUSD","GBPUSD"],
  Indices: ["SPX","NASDAQ"],
  Commodities: ["GOLD"]
};

const ALL_SYMBOLS = Object.values(SYMBOL_GROUPS).flat();

const SNAP_POS = { x: 16, y: 110 };
const SNAP_DELAY = 2200;

/* timeframe → seconds */
const TF_SECONDS = {
  "1":60,
  "5":300,
  "15":900,
  "60":3600,
  "D":86400
};

export default function Market({
  mode="paper",
  dailyLimit=5,
  tradesUsed=0
}){

  const [symbol,setSymbol] = useState(ALL_SYMBOLS[0]);
  const [tf,setTf] = useState("1");
  const [side,setSide] = useState("BUY");

  const [panelOpen,setPanelOpen] = useState(false);
  const [docked,setDocked] = useState(true);
  const [pos,setPos] = useState(SNAP_POS);

  const dragData = useRef({x:0,y:0,dragging:false});
  const snapTimer = useRef(null);

  const limitReached = tradesUsed >= dailyLimit;

  /* ================= CHART STATE ================= */

  const [candles,setCandles] = useState([]);
  const [volume,setVolume] = useState([]);
  const [trades,setTrades] = useState([]);
  const [aiSignals,setAiSignals] = useState([]);
  const [pnlSeries,setPnlSeries] = useState([]);

  /* ================= INITIAL CANDLES ================= */

  useEffect(()=>{

    const interval = TF_SECONDS[tf] || 60;

    let price =
      symbol==="BTCUSDT" ? 65000 :
      symbol==="ETHUSDT" ? 3500 :
      symbol==="SOLUSDT" ? 150 :
      100;

    const fake=[];

    for(let i=0;i<120;i++){

      const open = price;
      const move = (Math.random()-0.5) * price * 0.01;
      const close = open + move;

      const high = Math.max(open,close) + Math.random()*price*0.003;
      const low = Math.min(open,close) - Math.random()*price*0.003;

      price = close;

      fake.push({
        time: Math.floor(Date.now()/1000) - ((120-i)*interval),
        open,
        high,
        low,
        close
      });

    }

    setCandles(fake);

  },[symbol,tf]);

  /* ================= LIVE PRICE ENGINE ================= */

  useEffect(()=>{

    const timer = setInterval(()=>{

      setCandles(prev=>{

        if(prev.length===0) return prev;

        const last = prev[prev.length-1];

        const move =
          (Math.random()-0.5) * last.close * 0.002;

        const newClose = last.close + move;

        const newCandle = {

          time: Math.floor(Date.now()/1000),

          open: last.close,
          high: Math.max(last.close,newClose),
          low: Math.min(last.close,newClose),
          close: newClose

        };

        return [...prev.slice(-119), newCandle];

      });

    },2000);

    return ()=>clearInterval(timer);

  },[symbol,tf]);

  /* ================= DRAG LOGIC ================= */

  const clampToViewport = useCallback((x,y)=>{

    const padding=12;
    const maxX=window.innerWidth-340;
    const maxY=window.innerHeight-420;

    return{
      x:Math.max(padding,Math.min(maxX,x)),
      y:Math.max(padding,Math.min(maxY,y))
    };

  },[]);

  const startDrag = useCallback((e)=>{

    const t = e.touches ? e.touches[0] : e;

    dragData.current={
      dragging:true,
      x:t.clientX-pos.x,
      y:t.clientY-pos.y
    };

    setDocked(false);
    clearTimeout(snapTimer.current);

  },[pos]);

  const onMove = useCallback((e)=>{

    if(!dragData.current.dragging) return;

    const t = e.touches ? e.touches[0] : e;

    const newPos = clampToViewport(
      t.clientX-dragData.current.x,
      t.clientY-dragData.current.y
    );

    setPos(newPos);

  },[clampToViewport]);

  const endDrag = useCallback(()=>{

    if(!dragData.current.dragging) return;

    dragData.current.dragging=false;

    snapTimer.current=setTimeout(()=>{

      setDocked(true);
      setPos(SNAP_POS);

    },SNAP_DELAY);

  },[]);

  useEffect(()=>{

    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",endDrag);
    window.addEventListener("touchmove",onMove);
    window.addEventListener("touchend",endDrag);

    return()=>{

      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",endDrag);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("touchend",endDrag);
      clearTimeout(snapTimer.current);

    };

  },[onMove,endDrag]);

  function togglePanel(){

    if(limitReached) return;

    clearTimeout(snapTimer.current);

    setPanelOpen(v=>!v);
    setDocked(true);
    setPos(SNAP_POS);

  }

  /* ================= UI ================= */

  return(

    <div className={`terminalRoot ${mode==="live"?"liveMode":""}`}>

      <div className={`marketBanner ${mode==="live"?"warn":""}`}>

        <b>Mode:</b> {mode.toUpperCase()} •
        <b> Trades Used:</b> {tradesUsed}/{dailyLimit}

        {limitReached &&
          <span className="warnText">
            {" "}— Daily trade limit reached
          </span>
        }

      </div>

      <header className="tvTopBar">

        <div className="tvTopLeft">

          <select
            className="tvSelect"
            value={symbol}
            onChange={(e)=>setSymbol(e.target.value)}
          >

            {Object.entries(SYMBOL_GROUPS).map(([group,list])=>(
              <optgroup key={group} label={group}>
                {list.map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            ))}

          </select>

          <div className="tvTfRow">

            {["1","5","15","60","D"].map(x=>(
              <button
                key={x}
                className={tf===x?"tvPill active":"tvPill"}
                onClick={()=>setTf(x)}
              >
                {x}
              </button>
            ))}

          </div>

        </div>

        <div className="tvTopRight">

          <button
            className="tvPrimary"
            onClick={togglePanel}
            disabled={limitReached}
          >
            Prepare Trade
          </button>

        </div>

      </header>

      <div className={`tvBody ${panelOpen && docked ? "withPanel" : ""}`}>

        <main className="tvChartArea">

          <div className="internalChart">

            <div className="chartHeader">
              <strong>{symbol}</strong>
              <span className="tfLabel">{tf}</span>
            </div>

            <div className="chartCanvas">

              <TerminalChart
                candles={candles}
                volume={volume}
                trades={trades}
                aiSignals={aiSignals}
                pnlSeries={pnlSeries}
                height={520}
              />

            </div>

          </div>

        </main>

      </div>

    </div>

  );

}
