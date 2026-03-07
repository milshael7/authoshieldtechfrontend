// ============================================================
// TRADING ROOM — INSTITUTIONAL LIVE DESK
// Real-time market snapshot feed + AI desk
// ============================================================

import React, { useEffect, useRef, useState, useMemo } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 200;

export default function TradingRoom() {

  const wsRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [candles,setCandles] = useState([]);
  const [price,setPrice] = useState(null);

  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);
  const [trades,setTrades] = useState([]);

  const [engineStatus,setEngineStatus] = useState("CONNECTED");
  const [engineMode,setEngineMode] = useState("Paper Trading");

  const [decisions,setDecisions] = useState([]);

  /* =========================================================
  CHART DATA
  ========================================================= */

  const volume = useMemo(()=>{

    return candles.map(c=>({
      time:c.time,
      value:Math.abs(c.close-c.open)*10
    }));

  },[candles]);

  const pnlSeries = useMemo(()=>{

    let running=0;

    return trades.slice().reverse().map(t=>{

      running += Number(t.profit||0);

      return{
        time:Math.floor(t.time/1000),
        value:running
      };

    });

  },[trades]);

  const aiSignals = useMemo(()=>{

    return trades.map(t=>({
      time:Math.floor(t.time/1000)
    }));

  },[trades]);

  /* =========================================================
  AI METRICS
  ========================================================= */

  const aiConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total =
      decisions.reduce(
        (s,d)=>s+(d.confidence||0),0
      );

    return total/decisions.length;

  },[decisions]);

  const riskLevel = useMemo(()=>{

    if(!position || !price) return "LOW";

    const exposure =
      Math.abs(position.qty*price);

    if(exposure>equity*0.4) return "HIGH";
    if(exposure>equity*0.2) return "MEDIUM";

    return "LOW";

  },[position,price,equity]);

  const marketRegime = useMemo(()=>{

    if(candles.length<20) return "Unknown";

    const last =
      candles[candles.length-1].close;

    const prev =
      candles[candles.length-20].close;

    const change =
      (last-prev)/prev;

    if(change>0.02) return "Bull Trend";
    if(change<-0.02) return "Bear Trend";

    return "Sideways";

  },[candles]);

  /* =========================================================
  LOAD HISTORICAL CANDLES
  ========================================================= */

  async function loadCandles(){

    try{

      const res =
        await fetch(
          `${API_BASE}/api/market/candles?symbol=${SYMBOL}&limit=${MAX_CANDLES}`,
          {headers:authHeader()}
        );

      const data = await res.json();

      if(!data?.ok) return;

      const formatted =
        data.candles.map(c=>({

          time:c.time,
          open:Number(c.open),
          high:Number(c.high),
          low:Number(c.low),
          close:Number(c.close)

        }));

      if(formatted.length)
        lastCandleRef.current =
          formatted[formatted.length-1];

      setCandles(formatted);

    }catch{}

  }

  useEffect(()=>{
    loadCandles();
  },[]);

  /* =========================================================
  MARKET WEBSOCKET
  ========================================================= */

  useEffect(()=>{

    if(wsRef.current) return;

    const token = getToken();
    if(!token || !API_BASE) return;

    const url = new URL(API_BASE);

    const protocol =
      url.protocol==="https:"?"wss:":"ws:";

    const ws = new WebSocket(
      `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
    );

    wsRef.current = ws;

    ws.onopen = ()=>{
      setEngineStatus("CONNECTED");
    };

    ws.onmessage = (msg)=>{

      try{

        const data = JSON.parse(msg.data);

        if(data.channel!=="market") return;
        if(data.type!=="snapshot") return;

        const market = data.data;
        const node = market[SYMBOL];

        if(!node) return;

        const priceNow = Number(node.price);

        setPrice(priceNow);

        const ts = Math.floor(data.ts/1000);

        const bucket =
          Math.floor(ts/CANDLE_SECONDS) *
          CANDLE_SECONDS;

        let candle = lastCandleRef.current;

        if(!candle || candle.time!==bucket){

          candle = {
            time:bucket,
            open:priceNow,
            high:priceNow,
            low:priceNow,
            close:priceNow
          };

          setCandles(prev =>
            [...prev,candle].slice(-MAX_CANDLES)
          );

        }
        else{

          candle = {
            ...candle,
            high:Math.max(candle.high,priceNow),
            low:Math.min(candle.low,priceNow),
            close:priceNow
          };

          setCandles(prev=>{

            const copy=[...prev];
            copy[copy.length-1]=candle;
            return copy;

          });

        }

        lastCandleRef.current=candle;

      }catch{}

    };

    ws.onclose = ()=>{
      wsRef.current=null;
      setEngineStatus("DISCONNECTED");
    };

    return ()=>ws.close();

  },[]);

  /* =========================================================
  PAPER SNAPSHOT
  ========================================================= */

  async function loadPaper(){

    try{

      const res =
        await fetch(
          `${API_BASE}/api/paper/snapshot`,
          {headers:authHeader()}
        );

      const data = await res.json();

      if(!data?.ok) return;

      const snap = data.snapshot;

      setEquity(Number(snap.equity||0));

      setWallet({
        usd:Number(snap.cashBalance||0),
        btc:Number(snap.position?.qty||0)
      });

      setPosition(snap.position||null);

      setTrades(
        (snap.trades||[])
          .slice(-10)
          .reverse()
      );

    }catch{}

  }

  useEffect(()=>{

    loadPaper();

    const loop =
      setInterval(loadPaper,4000);

    return ()=>clearInterval(loop);

  },[]);

  /* =========================================================
  AI SNAPSHOT
  ========================================================= */

  async function loadAI(){

    try{

      const res =
        await fetch(
          `${API_BASE}/api/trading/ai/snapshot`,
          {headers:authHeader()}
        );

      const data = await res.json();

      if(data?.snapshot?.decisions){

        setDecisions(
          data.snapshot.decisions
            .slice(-12)
            .reverse()
        );

      }

    }catch{}

  }

  useEffect(()=>{

    loadAI();

    const loop =
      setInterval(loadAI,4000);

    return ()=>clearInterval(loop);

  },[]);

  /* =========================================================
  UI
  ========================================================= */

  return(

    <div style={{
      display:"flex",
      flex:1,
      background:"#0a0f1c",
      color:"#fff"
    }}>

      {/* LEFT PANEL */}

      <div style={{
        flex:1,
        padding:20,
        display:"flex",
        flexDirection:"column"
      }}>

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
          Live Price: {price?.toLocaleString()||"Loading..."}
        </div>

        <div style={{
          display:"flex",
          gap:12,
          flex:1
        }}>

          {/* CHART */}

          <div style={{
            flex:1,
            border:"1px solid rgba(255,255,255,.08)",
            borderRadius:10,
            overflow:"hidden"
          }}>

            <TerminalChart
              candles={candles}
              volume={volume}
              trades={trades}
              aiSignals={aiSignals}
              pnlSeries={pnlSeries}
              height={520}
            />

          </div>

          {/* ORDER PANEL */}

          <OrderPanel
            symbol={SYMBOL}
            price={price}
          />

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div style={{
        width:320,
        background:"#111827",
        padding:20
      }}>

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

        <h4 style={{marginTop:20}}>
          AI Decisions
        </h4>

        {decisions.map((d,i)=>(
          <div key={i}
            style={{
              marginBottom:10,
              padding:8,
              background:"#0f172a",
              borderRadius:6
            }}
          >

            <strong>{d.action}</strong>

            <div style={{
              fontSize:12,
              opacity:0.7
            }}>
              confidence {Math.round((d.confidence||0)*100)}%
            </div>

          </div>
        ))}

      </div>

    </div>

  );

}

/* ========================================================= */

function authHeader(){

  const token = getToken();

  return token
    ? {Authorization:`Bearer ${token}`}
    : {};

}

function Panel({title,children}){

  return(

    <div style={{
      background:"#111827",
      padding:12,
      marginTop:12,
      borderRadius:8
    }}>
      <strong>{title}</strong>
      <div style={{marginTop:6}}>
        {children}
      </div>
    </div>

  );

}
