// ==========================================================
// FILE: frontend/src/pages/TradingRoom.jsx
// MODULE: Trading Room
// PURPOSE: Live market dashboard + AI paper trading interface
//
// MAINTENANCE NOTES:
// - Active AI trade now passed into AIBehaviorPanel
// - Enables live "Active Trade" display + duration timer
// - Chart logic, websocket logic, and candle structure remain unchanged
//
// IMPORTANT:
// If the AIBehaviorPanel active trade stops displaying,
// confirm the prop `position={position}` is still passed.
// ==========================================================

import React, { useEffect, useRef, useState, useMemo } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 500;

/* ================= GLOBAL CACHE ================= */

if (!window.__TRADING_CACHE__) {
  window.__TRADING_CACHE__ = {
    candles: [],
    lastCandle: null
  };
}

/* ================= VALIDATION ================= */

function isValidCandle(c){
  return (
    Number.isFinite(c?.time) &&
    Number.isFinite(c?.open) &&
    Number.isFinite(c?.high) &&
    Number.isFinite(c?.low) &&
    Number.isFinite(c?.close)
  );
}

function storageKey(){
  return `trading_candles_${SYMBOL}`;
}

function loadPersisted(){
  try{
    const raw = localStorage.getItem(storageKey());
    if(!raw) return [];

    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCandle);
  }catch{
    return [];
  }
}

function savePersisted(candles){
  try{
    const clean = candles.filter(isValidCandle);

    localStorage.setItem(
      storageKey(),
      JSON.stringify(clean.slice(-MAX_CANDLES))
    );
  }catch{}
}

function mergeHistory(existing,incoming){

  const map = new Map();

  existing
    .filter(isValidCandle)
    .forEach(c => map.set(c.time,c));

  incoming
    .filter(isValidCandle)
    .forEach(c => map.set(c.time,c));

  return Array.from(map.values())
    .sort((a,b)=>a.time-b.time)
    .slice(-MAX_CANDLES);
}

function toNumber(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function TradingRoom(){

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);

  const lastCandleRef = useRef(null);
  const engineStartRef = useRef(null);

  const [candles,setCandles] = useState([]);
  const [price,setPrice] = useState(null);

  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);

  const [trades,setTrades] = useState([]);
  const [decisions,setDecisions] = useState([]);

  const [memory,setMemory] = useState(null);

  const [engineUptime,setEngineUptime] = useState("0s");

  /* ================= RESTORE CANDLES ================= */

  useEffect(()=>{

    const cache = window.__TRADING_CACHE__;
    const persisted = loadPersisted();

    const next = cache.candles.length ? cache.candles : persisted;

    const last = cache.lastCandle || next[next.length-1] || null;

    lastCandleRef.current = last;

    setCandles(next);

  },[]);

  /* ================= LOAD MEMORY ================= */

  async function loadMemory(){

    const token=getToken();
    if(!token || !API_BASE) return;

    try{

      const res=await fetch(
        `${API_BASE}/api/brain/snapshot`,
        {headers:{Authorization:`Bearer ${token}`}}
      );

      const data=await res.json();

      if(data) setMemory(data);

    }catch{}

  }

  useEffect(()=>{
    loadMemory();
  },[]);

  /* ================= ENGINE UPTIME ================= */

  useEffect(()=>{

    const timer=setInterval(()=>{

      if(!engineStartRef.current) return;

      const diff=Date.now()-engineStartRef.current;

      const sec=Math.floor(diff/1000)%60;
      const min=Math.floor(diff/60000)%60;
      const hr=Math.floor(diff/3600000);

      setEngineUptime(`${hr}h ${min}m ${sec}s`);

    },1000);

    return ()=>clearInterval(timer);

  },[]);

  /* ================= LOAD HISTORY ================= */

  async function loadHistory(){

    const token=getToken();
    if(!token || !API_BASE) return;

    try{

      const res=await fetch(
        `${API_BASE}/api/market/candles/${SYMBOL}?limit=${MAX_CANDLES}`,
        {headers:{Authorization:`Bearer ${token}`}}
      );

      const data=await res.json();

      if(!data?.ok || !Array.isArray(data.candles)) return;

      const formatted=data.candles
        .map(c=>({
          time:Number(c.time),
          open:Number(c.open),
          high:Number(c.high),
          low:Number(c.low),
          close:Number(c.close)
        }))
        .filter(isValidCandle)
        .slice(-MAX_CANDLES);

      if(!formatted.length) return;

      setCandles(prev => {

        const merged = mergeHistory(prev, formatted);

        const last = merged[merged.length-1];

        lastCandleRef.current = last;

        window.__TRADING_CACHE__.candles = merged;
        window.__TRADING_CACHE__.lastCandle = last;

        savePersisted(merged);

        return merged;

      });

    }catch{}
  }

  useEffect(()=>{loadHistory()},[]);

  /* ================= CANDLE UPDATE ================= */

  function updateCandles(priceNow){

    if(!Number.isFinite(priceNow) || priceNow <= 0){
      return;
    }

    const now=Math.floor(Date.now()/1000);
    const candleTime=Math.floor(now/CANDLE_SECONDS)*CANDLE_SECONDS;

    const last=lastCandleRef.current;

    setCandles(prev=>{

      let next;
      let nextLast;

      if(!last || last.time!==candleTime){

        nextLast={
          time:candleTime,
          open:priceNow,
          high:priceNow,
          low:priceNow,
          close:priceNow
        };

        next=[...prev.slice(-MAX_CANDLES),nextLast];

      }else{

        nextLast={
          ...last,
          high:Math.max(last.high,priceNow),
          low:Math.min(last.low,priceNow),
          close:priceNow
        };

        next=[...prev];
        next[next.length-1]=nextLast;

      }

      if(!isValidCandle(nextLast)) return prev;

      lastCandleRef.current=nextLast;

      window.__TRADING_CACHE__.candles = next;
      window.__TRADING_CACHE__.lastCandle = nextLast;

      savePersisted(next);

      return next;

    });

  }

  /* ================= MARKET WS ================= */

  function connectMarket(){

    const token=getToken();
    if(!token || !API_BASE) return;

    const url=new URL(API_BASE);
    const protocol=url.protocol==="https:"?"wss:":"ws:";

    const ws=new WebSocket(
      `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
    );

    marketWsRef.current=ws;

    ws.onmessage=(msg)=>{

      try{

        const packet=JSON.parse(msg.data);

        if(packet.channel!=="market") return;

        const market=packet?.data?.[SYMBOL];
        if(!market) return;

        const p=toNumber(market.price);
        if(p===null) return;

        setPrice(p);

        updateCandles(p);

      }catch{}

    };

  }

  /* ================= PAPER WS ================= */

  function connectPaper(){

    const token=getToken();
    if(!token || !API_BASE) return;

    const url=new URL(API_BASE);
    const protocol=url.protocol==="https:"?"wss:":"ws:";

    const ws=new WebSocket(
      `${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
    );

    paperWsRef.current=ws;

    ws.onmessage=(msg)=>{

      try{

        const data=JSON.parse(msg.data);

        if(data.channel!=="paper") return;

        if(!engineStartRef.current){
          engineStartRef.current=data.engineStart||Date.now();
        }

        const snap=data.snapshot||{};

        setEquity(Number(snap.equity||0));

        setWallet({
          usd:Number(snap.cashBalance||0),
          btc:Number(snap.position?.qty||0)
        });

        setPosition(snap.position||null);
        setTrades(snap.trades||[]);
        setDecisions(snap.decisions||[]);

      }catch{}

    };

  }

  useEffect(()=>{

    connectMarket();
    connectPaper();

  },[]);

  /* ================= AI METRICS ================= */

  const aiConfidence=useMemo(()=>{

    if(!decisions.length) return 0;

    const total=decisions.reduce(
      (s,d)=>s+Number(d.confidence||0),0
    );

    return total/decisions.length;

  },[decisions]);

  /* ================= UI ================= */

  return(

    <div style={{display:"flex",flex:1,background:"#0a0f1c",color:"#fff"}}>

      <div style={{flex:1,padding:20}}>

        <div style={{fontWeight:700}}>{SYMBOL}</div>

        <div style={{opacity:.7}}>
          Live Price: {price ? price.toLocaleString() : "Loading"}
        </div>

        <TerminalChart
          candles={candles}
          trades={trades}
          pnlSeries={trades}
        />

        {/* ================= AI BEHAVIOR PANEL ================= */}

        <div style={{marginTop:20}}>
          <AIBehaviorPanel
            trades={trades}
            decisions={decisions}
            memory={memory}
            position={position}   // ⭐ enables active trade display
          />
        </div>

      </div>

      <div style={{width:240}}>
        <OrderPanel symbol={SYMBOL} price={price}/>
      </div>

    </div>

  );

}
