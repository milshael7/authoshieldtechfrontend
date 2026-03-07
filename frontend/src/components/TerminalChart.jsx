import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

/**
 * TerminalChart — Institutional Trading Chart
 */

export default function TerminalChart({
  candles = [],
  volume = [],
  trades = [],
  aiSignals = [],
  pnlSeries = [],
  height = 520,
  accent = "rgba(122,167,255,0.85)",
}) {

  const wrapRef = useRef(null);
  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const pnlSeriesRef = useRef(null);
  const trendSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);

  const lineSeriesRef = useRef(null);
  const areaSeriesRef = useRef(null);

  const [chartType,setChartType] = useState("candles");
  const [showTrend,setShowTrend] = useState(true);
  const [showEMA,setShowEMA] = useState(true);

  /* ================= NORMALIZE ================= */

  const candleData = useMemo(()=>{

    return candles.map(c=>({
      time:Number(c.time),
      open:Number(c.open),
      high:Number(c.high),
      low:Number(c.low),
      close:Number(c.close)
    }));

  },[candles]);

  const lineData = useMemo(()=>{

    return candleData.map(c=>({
      time:c.time,
      value:c.close
    }));

  },[candleData]);

  const volumeData = useMemo(()=>{

    return volume.map(v=>({
      time:Number(v.time),
      value:Number(v.value),
      color:v.color || "rgba(100,116,139,.45)"
    }));

  },[volume]);

  const pnlData = useMemo(()=>{

    return pnlSeries.map(p=>({
      time:Number(p.time),
      value:Number(p.value)
    }));

  },[pnlSeries]);

  /* ================= TREND (SMA 20) ================= */

  const trendData = useMemo(()=>{

    if(candleData.length<20) return [];

    const out=[];

    for(let i=20;i<candleData.length;i++){

      const slice=candleData.slice(i-20,i);

      const avg =
        slice.reduce((s,c)=>s+c.close,0)/
        slice.length;

      out.push({
        time:candleData[i].time,
        value:avg
      });

    }

    return out;

  },[candleData]);

  /* ================= EMA 50 ================= */

  const emaData = useMemo(()=>{

    if(candleData.length<50) return [];

    const out=[];
    const k = 2/(50+1);

    let ema=candleData[0].close;

    candleData.forEach(c=>{

      ema = c.close*k + ema*(1-k);

      out.push({
        time:c.time,
        value:ema
      });

    });

    return out;

  },[candleData]);

  /* ================= MARKERS ================= */

  const markers = useMemo(()=>{

    const tradeMarkers = trades.map(t=>({

      time:Number(t.time),
      position:t.side==="BUY"?"belowBar":"aboveBar",
      color:t.side==="BUY"?"#22c55e":"#ef4444",
      shape:t.side==="BUY"?"arrowUp":"arrowDown",
      text:t.side

    }));

    const aiMarkers = aiSignals.map(s=>({

      time:Number(s.time),
      position:"aboveBar",
      color:"#facc15",
      shape:"circle",
      text:"AI"

    }));

    return [...tradeMarkers,...aiMarkers];

  },[trades,aiSignals]);

  /* ================= CHART INIT ================= */

  useEffect(()=>{

    const el = wrapRef.current;
    if(!el) return;

    try{
      chartRef.current?.remove();
    }catch{}

    const chart = createChart(el,{

      height,

      layout:{
        background:{color:"#0b1220"},
        textColor:"#9ca3af"
      },

      grid:{
        vertLines:{color:"rgba(148,163,184,.05)"},
        horzLines:{color:"rgba(148,163,184,.05)"}
      },

      rightPriceScale:{
        borderColor:"rgba(148,163,184,.15)"
      },

      crosshair:{
        mode:CrosshairMode.Normal
      },

      timeScale:{
        borderColor:"rgba(148,163,184,.15)",
        timeVisible:true
      }

    });

    /* SERIES */

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor:"#22c55e",
      downColor:"#ef4444",
      borderUpColor:"#22c55e",
      borderDownColor:"#ef4444",
      wickUpColor:"#22c55e",
      wickDownColor:"#ef4444"
    });

    lineSeriesRef.current =
      chart.addLineSeries({color:"#60a5fa",lineWidth:2});

    areaSeriesRef.current =
      chart.addAreaSeries({
        topColor:"rgba(96,165,250,.35)",
        bottomColor:"rgba(96,165,250,.02)",
        lineColor:"#60a5fa",
        lineWidth:2
      });

    volumeSeriesRef.current =
      chart.addHistogramSeries({
        priceFormat:{type:"volume"},
        priceScaleId:"",
        scaleMargins:{top:0.82,bottom:0}
      });

    pnlSeriesRef.current =
      chart.addLineSeries({
        color:"#facc15",
        lineWidth:2,
        priceScaleId:"left"
      });

    trendSeriesRef.current =
      chart.addLineSeries({
        color:"#38bdf8",
        lineWidth:2
      });

    emaSeriesRef.current =
      chart.addLineSeries({
        color:"#a78bfa",
        lineWidth:2
      });

    chartRef.current=chart;

    chart.timeScale().fitContent();

    /* RESIZE OBSERVER */

    const ro = new ResizeObserver(entries=>{

      const rect = entries[0].contentRect;

      chart.applyOptions({
        width:rect.width,
        height
      });

    });

    ro.observe(el);

    return ()=>{

      try{ro.disconnect()}catch{}
      try{chart.remove()}catch{}

    };

  },[height]);

  /* ================= DATA ================= */

  useEffect(()=>{

    if(chartType==="candles")
      candleSeriesRef.current?.setData(candleData);

    if(chartType==="line")
      lineSeriesRef.current?.setData(lineData);

    if(chartType==="area")
      areaSeriesRef.current?.setData(lineData);

  },[candleData,lineData,chartType]);

  useEffect(()=>{
    volumeSeriesRef.current?.setData(volumeData);
  },[volumeData]);

  useEffect(()=>{
    pnlSeriesRef.current?.setData(pnlData);
  },[pnlData]);

  useEffect(()=>{

    if(showTrend)
      trendSeriesRef.current?.setData(trendData);
    else
      trendSeriesRef.current?.setData([]);

  },[trendData,showTrend]);

  useEffect(()=>{

    if(showEMA)
      emaSeriesRef.current?.setData(emaData);
    else
      emaSeriesRef.current?.setData([]);

  },[emaData,showEMA]);

  useEffect(()=>{
    candleSeriesRef.current?.setMarkers(markers);
  },[markers]);

  /* ================= UI ================= */

  return(

    <div style={{width:"100%"}}>

      {/* TOOLBAR */}

      <div style={{
        display:"flex",
        gap:8,
        marginBottom:6
      }}>

        <button onClick={()=>setChartType("candles")}>📊</button>
        <button onClick={()=>setChartType("line")}>📈</button>
        <button onClick={()=>setChartType("area")}>≈</button>

        <button onClick={()=>setShowTrend(v=>!v)}>SMA</button>
        <button onClick={()=>setShowEMA(v=>!v)}>EMA</button>

      </div>

      {/* CHART */}

      <div
        ref={wrapRef}
        style={{
          width:"100%",
          height,
          borderRadius:14,
          border:"1px solid rgba(148,163,184,.15)",
          overflow:"hidden",
          background:"#0b1220"
        }}
      />

    </div>

  );

}
