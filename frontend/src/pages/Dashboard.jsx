// frontend/src/pages/Dashboard.jsx
// FULL ADMIN GLOBAL DASHBOARD — PLATFORM OVERSIGHT

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {

  const [loading,setLoading]=useState(true);

  const [metrics,setMetrics]=useState(null);
  const [risk,setRisk]=useState(null);
  const [predictive,setPredictive]=useState(null);

  const [events,setEvents]=useState([]);
  const [incidents,setIncidents]=useState([]);

  const [lastUpdated,setLastUpdated]=useState(null);

  async function loadAll(){
    try{
      const [
        m,r,p,
        e,i
      ]=await Promise.all([
        api.adminMetrics(),
        api.adminExecutiveRisk(),
        api.adminPredictiveChurn(),
        api.securityEvents(50),
        api.incidents()
      ]);

      setMetrics(m?.metrics||m||null);
      setRisk(r?.executiveRisk||r||null);
      setPredictive(p?.predictiveChurn||p||null);

      setEvents(e?.events||e||[]);
      setIncidents(i?.incidents||i||[]);

      setLastUpdated(new Date());

    }catch(err){
      console.error("Dashboard load error:",err);
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    loadAll();
    const interval=setInterval(loadAll,15000);
    return ()=>clearInterval(interval);
  },[]);

  const openIncidents=incidents.filter(i=>i.status!=="Closed");

  const severityMap=useMemo(()=>{
    const map={critical:0,high:0,medium:0,low:0};
    events.forEach(e=>{
      const s=(e.severity||"").toLowerCase();
      if(s.includes("crit")) map.critical++;
      else if(s.includes("high")) map.high++;
      else if(s.includes("med")) map.medium++;
      else map.low++;
    });
    return map;
  },[events]);

  if(loading){
    return <div style={{padding:28}}>Loading Platform Intelligence...</div>;
  }

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:22}}>

      {/* ================= EXECUTIVE METRICS ================= */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
        gap:16
      }}>
        <MetricCard label="Total Companies" value={metrics?.totalCompanies||0}/>
        <MetricCard label="Total Users" value={metrics?.totalUsers||0}/>
        <MetricCard label="Executive Risk" value={risk?.score||risk||0}/>
        <MetricCard label="Predictive Churn" value={predictive?.rate||predictive||0}/>
      </div>

      {/* ================= THREAT OVERVIEW ================= */}
      <Panel title="Global Threat Overview">
        <SeverityBar counts={severityMap}/>
        <div style={{marginTop:12}}>
          Open Incidents: <strong>{openIncidents.length}</strong>
        </div>
      </Panel>

      {/* ================= LIVE EVENTS ================= */}
      <Panel title="Live Security Events">
        <div style={{maxHeight:260,overflowY:"auto"}}>
          {events.slice(0,30).map((e,i)=>(
            <div key={i} style={eventRow(e.severity)}>
              <strong>{e.severity||"INFO"}</strong>
              <span style={{marginLeft:12}}>
                {e.message||e.description||"Security Event"}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ================= INCIDENT CENTER ================= */}
      <Panel title="Incident Command Center">
        <div style={{maxHeight:260,overflowY:"auto"}}>
          {incidents.slice(0,20).map((inc,i)=>(
            <div key={i} style={incidentRow(inc.status)}>
              <strong>{inc.title||"Untitled Incident"}</strong>
              <span style={{marginLeft:12}}>
                {inc.severity||"Unknown"} — {inc.status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {lastUpdated&&(
        <div style={{fontSize:12,opacity:.5}}>
          Auto Refreshed: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

    </div>
  );
}

/* ================= COMPONENTS ================= */

function MetricCard({label,value}){
  return(
    <div style={{
      padding:18,
      borderRadius:14,
      background:"rgba(255,255,255,.03)",
      border:"1px solid rgba(255,255,255,.08)"
    }}>
      <div style={{opacity:.6,fontSize:12}}>
        {label}
      </div>
      <div style={{fontSize:26,fontWeight:900,marginTop:6}}>
        {value}
      </div>
    </div>
  );
}

function Panel({title,children}){
  return(
    <div style={{
      padding:18,
      borderRadius:14,
      background:"rgba(255,255,255,.03)",
      border:"1px solid rgba(255,255,255,.08)"
    }}>
      <div style={{fontWeight:900,marginBottom:12}}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SeverityBar({counts}){
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;

  return(
    <div style={{display:"flex",height:18,borderRadius:999,overflow:"hidden"}}>
      {Object.entries(counts).map(([k,v],i)=>(
        <div
          key={i}
          style={{
            width:`${(v/total)*100}%`,
            background:
              k==="critical"?"#ff3b30":
              k==="high"?"#ff9500":
              k==="medium"?"#f5b400":
              "#16c784"
          }}
        />
      ))}
    </div>
  );
}

function eventRow(severity){
  const color=
    String(severity).toLowerCase().includes("crit")?"#ff3b30":
    String(severity).toLowerCase().includes("high")?"#ff9500":
    String(severity).toLowerCase().includes("med")?"#f5b400":
    "#16c784";

  return{
    padding:"8px 0",
    borderBottom:"1px solid rgba(255,255,255,.06)",
    fontSize:13,
    color
  };
}

function incidentRow(status){
  const color=
    status==="Open"?"#ff3b30":
    status==="Investigating"?"#ff9500":
    status==="Resolved"?"#16c784":
    "#fff";

  return{
    padding:"8px 0",
    borderBottom:"1px solid rgba(255,255,255,.06)",
    fontSize:13,
    color
  };
}
