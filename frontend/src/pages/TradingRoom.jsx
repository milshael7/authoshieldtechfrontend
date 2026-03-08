import React, { useEffect, useRef, useState, useMemo } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";
const CANDLE_SECONDS = 60;

export default function TradingRoom(){

  const wsRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [candles,setCandles] = useState([]);
  const [price,setPrice] = useState(null);

  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);
  const [trades,setTrades] = useState([]);

  const [decisions,setDecisions] = useState([]);

  const token = getToken();

  /* ================= PAPER SNAPSHOT ================= */

  async function loadPaperState(){

    try{

      const res = await fetch(
        `${API_BASE}/api/paper/status`,
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if(!data?.ok) return;

      const snap = data.snapshot || {};

      setEquity(Number(snap.equity || 0));
      setWallet({
        usd:Number(snap.cashBalance || 0),
        btc:Number(snap.position?.qty || 0)
      });

      setPosition(snap.position || null);
      setTrades(snap.trades || []);

    }catch{}

  }

  async function loadDecisions(){

    try{

      const res = await fetch(
        `${API_BASE}/api/paper/decisions`,
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if(data?.ok){
        setDecisions(data.decisions || []);
      }

    }catch{}

  }

  /* ================= LOAD SNAPSHOT LOOP ================= */

  useEffect(()=>{

    loadPaperState();
    loadDecisions();

    const loop = setInterval(()=>{

      loadPaperState();
      loadDecisions();

    },3000);

    return ()=>clearInterval(loop);

  },[]);

  /* ================= MARKET WEBSOCKET ================= */

  useEffect(()=>{

    if(wsRef.current) return;

    try{

      const url = new URL(API_BASE);
      const protocol = url.protocol==="https:"?"wss:":"ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      wsRef.current = ws;

      ws.onmessage = (msg)=>{

        try{

          const data = JSON.parse(msg.data);
          const market = data?.data?.[SYMBOL];

          if(!market) return;

          const p = Number(market.price);

          setPrice(p);

          updateCandles(p);

        }catch{}

      };

      return ()=>ws.close();

    }catch{}

  },[]);

  /* ================= CANDLE BUILDER ================= */

  function updateCandles(priceNow){

    const now = Math.floor(Date.now()/1000);
    const candleTime =
      Math.floor(now/CANDLE_SECONDS)*CANDLE_SECONDS;

    const last = lastCandleRef.current;

    if(!last || last.time !== candleTime){

      const newCandle={
        time:candleTime,
        open:priceNow,
        high:priceNow,
        low:priceNow,
        close:priceNow
      };

      lastCandleRef.current=newCandle;

      setCandles(prev=>[...prev.slice(-200),newCandle]);

    }else{

      const updated={
        ...last,
        high:Math.max(last.high,priceNow),
        low:Math.min(last.low,priceNow),
        close:priceNow
      };

      lastCandleRef.current=updated;

      setCandles(prev=>{
        const arr=[...prev];
        arr[arr.length-1]=updated;
        return arr;
      });

    }

  }

  /* ================= DERIVED ================= */

  const pnlSeries = useMemo(()=>{

    let running=0;

    return trades.map(t=>{

      running += Number(t.profit || 0);

      return{
        time:Math.floor(Number(t.time)/1000),
        value:running
      };

    });

  },[trades]);

  const aiSignals = useMemo(()=>{

    return trades.map(t=>({
      time:Math.floor(Number(t.time)/1000)
    }));

  },[trades]);

  const aiConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total =
      decisions.reduce(
        (s,d)=>s+Number(d.confidence || 0),
        0
      );

    return total/decisions.length;

  },[decisions]);

  /* ================= UI ================= */

  return(

    <div style={{
      display:"flex",
      flex:1,
      background:"#0a0f1c",
      color:"#fff"
    }}>

      <div style={{flex:1,padding:20}}>

        <div style={{fontWeight:700}}>
          {SYMBOL}
        </div>

        <div style={{opacity:.7}}>
          Live Price:
          {price ? price.toLocaleString() : "Loading"}
        </div>

        <TerminalChart
          candles={candles}
          trades={trades}
          aiSignals={aiSignals}
          pnlSeries={pnlSeries}
        />

      </div>

      <OrderPanel
        symbol={SYMBOL}
        price={price}
      />

      <div style={{
        width:260,
        padding:16,
        background:"#111827"
      }}>

        <h3>AI Engine</h3>

        <div>Equity: ${equity.toFixed(2)}</div>
        <div>Cash: ${wallet.usd.toFixed(2)}</div>

        <div style={{marginTop:10}}>
          AI Confidence:
          {(aiConfidence*100).toFixed(0)}%
        </div>

      </div>

    </div>

  );

}
