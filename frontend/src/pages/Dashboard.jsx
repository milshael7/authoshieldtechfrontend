// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Dashboard — SOC + Incident Command Layer

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {

  const [loading,setLoading]=useState(true);

  // Executive
  const [metrics,setMetrics]=useState(null);
  const [risk,setRisk]=useState(null);
  const [predictive,setPredictive]=useState(null);

  // Security
  const [posture,setPosture]=useState(null);
  const [events,setEvents]=useState([]);
  const [vulns,setVulns]=useState([]);

  // Incidents
  const [incidents,setIncidents]=useState([]);

  const [lastUpdated,setLastUpdated]=useState(null);

  async function loadAll(){
    try{
      const [
        m,r,p,
        ps,e,v,
        i
      ]=await Promise.all([
        api.adminMetrics(),
        api.adminExecutiveRisk(),
        api.adminPredictiveChurn(),
        api.postureSummary(),
        api.securityEvents(50),
        api.vulnerabilities(),
        api.incidents()
      ]);

      setMetrics(m?.metrics||null);
      setRisk(r?.executiveRisk||null);
      setPredictive(p?.predictiveChurn||null);

      setPosture(ps?.summary||ps||null);
      setEvents(e?.events||e||[]);
      setVulns(v?.vulnerabilities||v||[]);

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
    const interval=setInterval(loadAll,15000); // 🔥 live refresh every 15s
    return ()=>clearInterval(interval);
  },[]);

  const eventSeverity=useMemo(()=>{
    const map={critical:0,high:0,medium:0,low:0};
    for(const e of events){
      const s=(e.severity||e.level||"").toLowerCase();
      if(s.includes("crit")) map.critical++;
      else if(s.includes("high")) map.high++;
      else if(s.includes("med")) map.medium++;
      else map.low++;
    }
    return map;
  },[events]);

  const openIncidents=incidents.filter(i=>i.status!=="Closed");

  if(loading){
    return <div style={{padding:28}}>Loading SOC Layer...</div>;
  }

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:22}}>

      {/* ================= SOC THREAT STREAM ================= */}

      <Panel title="Live Threat Intelligence (Auto-Refreshing)">
        <SeverityBar counts={eventSeverity}/>
        <div style={{marginTop:14,maxHeight:240,overflowY:"auto"}}>
          {events.slice(0,30).map((e,i)=>(
            <div key={i} style={eventRow(e.severity||e.level)}>
              <strong>{e.severity||e.level||"INFO"}</strong>
              <span style={{marginLeft:12}}>
                {e.message||e.description||"Security Event"}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ================= INCIDENT COMMAND CENTER ================= */}

      <Panel title="Incident Command Center">
        <div style={{marginBottom:10}}>
          Open Incidents: <strong>{openIncidents.length}</strong>
        </div>

        <div style={{maxHeight:220,overflowY:"auto"}}>
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
