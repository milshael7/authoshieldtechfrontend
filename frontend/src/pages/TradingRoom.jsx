import React, { useEffect, useRef, useState, useMemo } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";
const CANDLE_SECONDS = 60;

/* ================= GLOBAL CACHE ================= */
/* Keeps candles alive even when page changes */

if (!window.__TRADING_CACHE__) {
  window.__TRADING_CACHE__ = {
    candles: [],
    lastCandle: null
  };
}

export default function TradingRoom(){

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);

  const lastCandleRef = useRef(window.__TRADING_CACHE__.lastCandle);

  const [candles,setCandles] = useState(
    window.__TRADING_CACHE__.candles
  );

  const [price,setPrice] = useState(null);

  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);
  const [trades,setTrades] = useState([]);

  const [decisions,setDecisions] = useState([]);

  const token = getToken();

  /* ================= MARKET WEBSOCKET ================= */

  useEffect(()=>{

    if(marketWsRef.current) return;

    try{

      const url = new URL(API_BASE);
      const protocol = url.protocol==="https:"?"wss:":"ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      marketWsRef.current = ws;

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

      ws.onclose = ()=>{

        marketWsRef.current = null;

      };

    }catch{}

  },[]);

  /* ================= PAPER ENGINE WEBSOCKET ================= */

  useEffect(()=>{

    if(paperWsRef.current) return;

    try{

      const url = new URL(API_BASE);
      const protocol = url.protocol==="https:"?"wss:":"ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
      );

      paperWsRef.current = ws;

      ws.onmessage = (msg)=>{

        try{

          const data = JSON.parse(msg.data);

          if(data?.channel !== "paper") return;

          const snap = data.snapshot || {};
          const dec = data.decisions || [];

          setEquity(Number(snap.equity || 0));

          setWallet({
            usd:Number(snap.cashBalance || 0),
            btc:Number(snap.position?.qty || 0)
          });

          setPosition(snap.position || null);
          setTrades(snap.trades || []);
          setDecisions(dec);

        }catch{}

      };

      ws.onclose = ()=>{

        paperWsRef.current = null;

      };

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

      const updated=[...candles.slice(-200),newCandle];

      window.__TRADING_CACHE__.candles = updated;
      window.__TRADING_CACHE__.lastCandle = newCandle;

      setCandles(updated);

    }else{

      const updated={
        ...last,
        high:Math.max(last.high,priceNow),
        low:Math.min(last.low,priceNow),
        close:priceNow
      };

      lastCandleRef.current=updated;

      const arr=[...candles];
      arr[arr.length-1]=updated;

      window.__TRADING_CACHE__.candles = arr;
      window.__TRADING_CACHE__.lastCandle = updated;

      setCandles(arr);

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

      {/* ================= AI ENGINE PANEL ================= */}

      <div style={{
        width:280,
        padding:16,
        background:"#111827",
        overflowY:"auto"
      }}>

        <h3>AI Engine</h3>

        <div>Equity: ${equity.toFixed(2)}</div>
        <div>Cash: ${wallet.usd.toFixed(2)}</div>

        <div style={{marginTop:10}}>
          AI Confidence: {(aiConfidence*100).toFixed(0)}%
        </div>

        {/* ================= SIGNAL STREAM ================= */}

        <div style={{marginTop:20}}>

          <strong>AI Signal Stream</strong>

          <div style={{marginTop:10}}>

            {decisions.slice(-8).reverse().map((d,i)=>(

              <div key={i} style={{
                borderBottom:"1px solid rgba(255,255,255,.05)",
                padding:"6px 0",
                fontSize:12
              }}>

                <div style={{
                  color:
                    d.action==="BUY" ? "#22c55e" :
                    d.action==="SELL" ? "#ef4444" :
                    "#9ca3af"
                }}>
                  {d.action}
                </div>

                <div>
                  conf {(Number(d.confidence||0)*100).toFixed(0)}%
                </div>

                {d.riskPct &&
                  <div>
                    risk {(Number(d.riskPct)*100).toFixed(2)}%
                  </div>
                }

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}
