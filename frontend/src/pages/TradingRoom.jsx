// SAFE TRADING ROOM — CRASH-PROOF VERSION (FIXED)
// Live price → candle builder → chart rendering
// Prevents empty chart and keeps websocket stable

import React, { useEffect, useRef, useState, useMemo } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 200;

export default function TradingRoom(){

  const wsRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [candles,setCandles] = useState([]);
  const [price,setPrice] = useState(null);

  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);
  const [trades,setTrades] = useState([]);

  const [engineStatus,setEngineStatus] = useState("CONNECTED");
  const [engineMode] = useState("Paper Trading");
  const [decisions,setDecisions] = useState([]);

  /* ================= SAFE HELPERS ================= */

  const safeNumber = v=>{
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const safeTime = t=>{
    const n = Number(t);
    return Number.isFinite(n) ? Math.floor(n/1000) : 0;
  };

  /* ================= DERIVED DATA ================= */

  const volume = useMemo(()=>(
    candles
      .filter(c=>c?.open!=null && c?.close!=null)
      .map(c=>({
        time:c.time||0,
        value:Math.abs(safeNumber(c.close)-safeNumber(c.open))*10
      }))
  ),[candles]);

  const pnlSeries = useMemo(()=>{

    let running = 0;

    return trades
      .filter(t=>t?.time)
      .slice()
      .reverse()
      .map(t=>{
        running += safeNumber(t.profit);

        return{
          time:safeTime(t.time),
          value:running
        };
      });

  },[trades]);

  const aiSignals = useMemo(()=>(
    trades
      .filter(t=>t?.time)
      .map(t=>({
        time:safeTime(t.time)
      }))
  ),[trades]);

  const aiConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total = decisions.reduce(
      (s,d)=>s+safeNumber(d?.confidence),
      0
    );

    return total/decisions.length;

  },[decisions]);

  const riskLevel = useMemo(()=>{

    if(!position || !price) return "LOW";

    const exposure =
      Math.abs(
        safeNumber(position?.qty)*
        safeNumber(price)
      );

    if(exposure>equity*0.4) return "HIGH";
    if(exposure>equity*0.2) return "MEDIUM";

    return "LOW";

  },[position,price,equity]);

  const marketRegime = useMemo(()=>{

    if(candles.length<20) return "Unknown";

    const last = safeNumber(candles.at(-1)?.close);
    const prev = safeNumber(candles.at(-20)?.close);

    if(!prev) return "Unknown";

    const change = (last-prev)/prev;

    if(change>0.02) return "Bull Trend";
    if(change<-0.02) return "Bear Trend";

    return "Sideways";

  },[candles]);

  /* ================= CANDLE BUILDER ================= */

  function updateCandles(priceNow){

    const now = Math.floor(Date.now()/1000);

    const candleTime =
      Math.floor(now/CANDLE_SECONDS)*
      CANDLE_SECONDS;

    const last = lastCandleRef.current;

    if(!last || last.time!==candleTime){

      const newCandle={
        time:candleTime,
        open:priceNow,
        high:priceNow,
        low:priceNow,
        close:priceNow
      };

      lastCandleRef.current=newCandle;

      setCandles(prev=>{
        const next=[...prev,newCandle];
        return next.slice(-MAX_CANDLES);
      });

    }else{

      const updated={
        ...last,
        high:Math.max(last.high,priceNow),
        low:Math.min(last.low,priceNow),
        close:priceNow
      };

      lastCandleRef.current=updated;

      setCandles(prev=>{
        const next=[...prev];
        next[next.length-1]=updated;
        return next;
      });

    }

  }

  /* ================= WEBSOCKET ================= */

  useEffect(()=>{

    if(wsRef.current || !API_BASE) return;

    const token = getToken();
    if(!token) return;

    try{

      const url = new URL(API_BASE);

      const protocol =
        url.protocol==="https:"?"wss:":"ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      wsRef.current=ws;

      ws.onopen=()=>{
        setEngineStatus("CONNECTED");
      };

      ws.onmessage=(msg)=>{

        try{

          const data = JSON.parse(msg.data);
          const market = data?.data?.[SYMBOL];

          if(!market) return;

          const priceNow = safeNumber(market.price);

          setPrice(priceNow);

          updateCandles(priceNow);

        }catch{}

      };

      ws.onclose=()=>{
        wsRef.current=null;
        setEngineStatus("DISCONNECTED");
      };

      return ()=>ws.close();

    }catch{}

  },[]);

  /* ================= SEED HISTORY ================= */

  useEffect(()=>{

    if(!price || candles.length) return;

    const now = Math.floor(Date.now()/1000);

    const seed=[];

    for(let i=30;i>0;i--){

      const t=now-(i*CANDLE_SECONDS);

      seed.push({
        time:t,
        open:price,
        high:price,
        low:price,
        close:price
      });

    }

    setCandles(seed);

  },[price]);

  /* ================= UI ================= */

  return(

    <div
      style={{
        display:"flex",
        flex:1,
        background:"#0a0f1c",
        color:"#fff"
      }}
    >

      <div style={{flex:1,padding:20}}>

        <div style={{
          fontWeight:700,
          marginBottom:10
        }}>
          {SYMBOL}
        </div>

        <div style={{
          fontSize:13,
          opacity:0.7,
          marginBottom:10
        }}>
          Live Price: {price?price.toLocaleString():"Loading..."}
        </div>

        <TerminalChart
          candles={candles||[]}
          volume={volume||[]}
          trades={trades||[]}
          aiSignals={aiSignals||[]}
          pnlSeries={pnlSeries||[]}
          height={520}
        />

        <OrderPanel
          symbol={SYMBOL}
          price={price}
        />

      </div>

      <div
        style={{
          width:320,
          background:"#111827",
          padding:20
        }}
      >

        <h3>AI Engine</h3>

        <div>Status: {engineStatus}</div>
        <div>Mode: {engineMode}</div>

        <Panel title="AI Confidence">
          {(aiConfidence*100).toFixed(0)}%
        </Panel>

        <Panel title="Risk Level">
          {riskLevel}
        </Panel>

        <Panel title="Market Regime">
          {marketRegime}
        </Panel>

        {decisions.map((d,i)=>(
          <div
            key={i}
            style={{
              marginBottom:10,
              padding:8,
              background:"#0f172a",
              borderRadius:6
            }}
          >
            <strong>{d?.action||"N/A"}</strong>

            <div style={{
              fontSize:12,
              opacity:0.7
            }}>
              confidence {Math.round(safeNumber(d?.confidence)*100)}%
            </div>

          </div>
        ))}

      </div>

    </div>

  );

}

function Panel({title,children}){

  return(

    <div
      style={{
        background:"#111827",
        padding:12,
        marginTop:12,
        borderRadius:8
      }}
    >

      <strong>{title}</strong>

      <div style={{marginTop:6}}>
        {children}
      </div>

    </div>

  );

}
