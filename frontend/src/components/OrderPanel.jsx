import React, { useState, useEffect } from "react";
import { getToken } from "../lib/api.js";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

export default function OrderPanel({ symbol="BTCUSDT", price=0 }) {

  const [side,setSide] = useState("BUY");
  const [orderType,setOrderType] = useState("MARKET");

  const [size,setSize] = useState("");
  const [limitPrice,setLimitPrice] = useState("");
  const [stopLoss,setStopLoss] = useState("");
  const [takeProfit,setTakeProfit] = useState("");
  const [risk,setRisk] = useState("");

  const [mode,setMode] = useState("paper");

  const [loading,setLoading] = useState(false);
  const [msg,setMsg] = useState("");

  /* ================= AUTH ================= */

  function authHeader(){
    const token = getToken();
    return token ? { Authorization:`Bearer ${token}` } : {};
  }

  function safeNumber(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /* ================= LOAD TRADING MODE ================= */

  useEffect(()=>{

    async function loadMode(){

      try{

        const res = await fetch(
          `${API_BASE}/api/ai/config`,
          { headers:authHeader() }
        );

        const data = await res.json();

        const cfg = data?.config || {};
        setMode(cfg.tradingMode || "paper");

      }catch{}

    }

    loadMode();

  },[]);

  /* AUTO FILL LIMIT PRICE */

  useEffect(()=>{
    if(orderType==="LIMIT" && price && !limitPrice){
      setLimitPrice(price.toString());
    }
  },[orderType,price]);

  /* ================= SUBMIT ORDER ================= */

  async function submitOrder(){

    if(!size){
      setMsg("Enter position size");
      return;
    }

    const qty = safeNumber(size);

    if(qty <= 0){
      setMsg("Invalid size");
      return;
    }

    setLoading(true);
    setMsg("");

    try{

      const res = await fetch(
        `${API_BASE}/api/paper/order`,   // ✅ FIXED ENDPOINT
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            ...authHeader()
          },
          body:JSON.stringify({

            symbol,
            side,
            qty,

            price:
              orderType==="LIMIT"
              ? safeNumber(limitPrice)
              : safeNumber(price),

            stopLoss:
              stopLoss ? safeNumber(stopLoss) : null,

            takeProfit:
              takeProfit ? safeNumber(takeProfit) : null,

            risk:
              risk ? safeNumber(risk)/100 : 0.01

          })
        }
      );

      const data = await res.json();

      if(!data?.ok){

        setMsg(data?.error || "Order rejected");

      }else{

        setMsg("Order executed (paper)");

        setSize("");
        setLimitPrice("");
        setStopLoss("");
        setTakeProfit("");
        setRisk("");

      }

    }catch{

      setMsg("Network error");

    }

    setLoading(false);

  }

  return(

    <div style={{
      width:270,
      background:"#111827",
      padding:16,
      borderLeft:"1px solid rgba(255,255,255,.06)",
      display:"flex",
      flexDirection:"column",
      gap:10
    }}>

      <div style={{fontWeight:700,fontSize:14}}>
        {symbol}
      </div>

      <div style={{fontSize:12,opacity:.7}}>
        Market Price: {price ? price.toLocaleString() : "Loading..."}
      </div>

      <div style={{
        fontSize:11,
        padding:"4px 8px",
        borderRadius:6,
        background:"rgba(59,130,246,.15)"
      }}>
        MODE: {mode.toUpperCase()}
      </div>

      <div style={{display:"flex",gap:6}}>

        <button
          onClick={()=>setSide("BUY")}
          style={{
            flex:1,
            background:side==="BUY"?"#16a34a":"#1f2937",
            border:"none",
            padding:"8px 0",
            color:"#fff",
            borderRadius:6
          }}
        >
          BUY
        </button>

        <button
          onClick={()=>setSide("SELL")}
          style={{
            flex:1,
            background:side==="SELL"?"#dc2626":"#1f2937",
            border:"none",
            padding:"8px 0",
            color:"#fff",
            borderRadius:6
          }}
        >
          SELL
        </button>

      </div>

      <Input label="Position Size" value={size} setValue={setSize} placeholder="0.01"/>

      {orderType==="LIMIT" && (
        <Input label="Limit Price" value={limitPrice} setValue={setLimitPrice} placeholder="Enter price"/>
      )}

      <Input label="Stop Loss" value={stopLoss} setValue={setStopLoss} placeholder="Optional"/>
      <Input label="Take Profit" value={takeProfit} setValue={setTakeProfit} placeholder="Optional"/>
      <Input label="Risk %" value={risk} setValue={setRisk} placeholder="1"/>

      <button
        onClick={submitOrder}
        disabled={loading}
        style={{
          marginTop:6,
          background:"#2563eb",
          border:"none",
          padding:"10px 0",
          borderRadius:6,
          color:"#fff",
          fontWeight:600
        }}
      >
        {loading ? "Sending..." : `Execute ${side}`}
      </button>

      {msg && (
        <div style={{fontSize:12,opacity:.7}}>
          {msg}
        </div>
      )}

    </div>

  );

}

function Input({label,value,setValue,placeholder}){

  return(

    <div>

      <div style={{fontSize:11,opacity:.6}}>
        {label}
      </div>

      <input
        value={value}
        onChange={e=>setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width:"100%",
          padding:8,
          marginTop:4,
          background:"#020617",
          border:"1px solid rgba(255,255,255,.08)",
          borderRadius:6,
          color:"#fff"
        }}
      />

    </div>

  );

}
