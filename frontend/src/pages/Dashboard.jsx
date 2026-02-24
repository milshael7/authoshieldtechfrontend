// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Executive Dashboard — Phase 3 + 4
// Operational + Live Mode Upgrade

import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js";

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard() {

  const [loading,setLoading]=useState(true);
  const [metrics,setMetrics]=useState(null);
  const [risk,setRisk]=useState(null);
  const [vulns,setVulns]=useState([]);
  const [incidents,setIncidents]=useState([]);
  const [threats,setThreats]=useState([]);
  const [autoprotect,setAutoprotect]=useState(null);

  const [liveMode,setLiveMode]=useState(false);
  const [lastUpdated,setLastUpdated]=useState(null);

  const [showIncidentModal,setShowIncidentModal]=useState(false);
  const [showVulnList,setShowVulnList]=useState(false);

  const previousThreatCount=useRef(0);
  const [threatPulse,setThreatPulse]=useState(false);

  /* ================= LOAD ALL ================= */

  async function loadAll(){
    try{
      const [
        m,
        r,
        v,
        i,
        t,
        ap
      ]=await Promise.all([
        api.adminMetrics(),
        api.adminExecutiveRisk(),
        api.vulnerabilities(),
        api.incidents(),
        api.threatFeed(25),
        api.autoprotectStatus().catch(()=>null)
      ]);

      setMetrics(m?.metrics||null);
      setRisk(r?.executiveRisk||null);
      setVulns(Array.isArray(v?.vulnerabilities)?v.vulnerabilities:Array.isArray(v)?v:[]);
      setIncidents(Array.isArray(i?.incidents)?i.incidents:Array.isArray(i)?i:[]);
      setThreats(Array.isArray(t?.events)?t.events:Array.isArray(t)?t:[]);
      setAutoprotect(ap||null);

      if(previousThreatCount.current && t?.events?.length>previousThreatCount.current){
        setThreatPulse(true);
        setTimeout(()=>setThreatPulse(false),1500);
      }

      previousThreatCount.current=t?.events?.length||0;
      setLastUpdated(new Date());
    }catch(e){
      console.error(e);
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    loadAll();
  },[]);

  useEffect(()=>{
    if(!liveMode) return;
    const id=setInterval(loadAll,30000);
    return()=>clearInterval(id);
  },[liveMode]);

  /* ================= AUTOPROTECT ================= */

  async function toggleAutoprotect(){
    if(!autoprotect) return;
    const confirm=window.confirm("Confirm Autoprotect toggle?");
    if(!confirm) return;

    try{
      if(autoprotect.enabled) await api.autoprotectDisable();
      else await api.autoprotectEnable();
      await loadAll();
    }catch(e){
      alert("Autoprotect action failed");
    }
  }

  /* ================= INCIDENT CREATE ================= */

  async function createIncident(data){
    try{
      await api.createIncident(data);
      setShowIncidentModal(false);
      await loadAll();
    }catch(e){
      alert("Incident creation failed");
    }
  }

  if(loading){
    return <div style={{padding:28}}>Loading Command Center...</div>;
  }

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:20}}>

      {/* HEADER */}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:12,opacity:.6}}>EXECUTIVE COMMAND CENTER</div>
          <div style={{fontSize:22,fontWeight:900}}>
            Admin Dashboard
            {liveMode && <span style={{marginLeft:12,fontSize:12,color:"#16c784"}}>● LIVE</span>}
          </div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button style={btnGhost} onClick={()=>setLiveMode(v=>!v)}>
            {liveMode?"Disable Live":"Enable Live"}
          </button>
          <button style={btnPrimary} onClick={loadAll}>Refresh</button>
        </div>
      </div>

      {/* KPI */}

      <div style={grid4}>
        <Card title="Total Users" value={metrics?.totalUsers}/>
        <Card title="Active Subscribers" value={metrics?.activeSubscribers}/>
        <Card title="MRR" value={`$${metrics?.MRR||0}`}/>
        <Card title="Churn" value={`${((metrics?.churnRate||0)*100).toFixed(2)}%`}/>
      </div>

      {/* RISK */}

      {risk&&(
        <Panel title="Executive Risk Index">
          <RiskMeter risk={risk}/>
        </Panel>
      )}

      {/* SECURITY */}

      <Panel title="Vulnerability Center" right={
        <button style={btnGhost} onClick={()=>setShowVulnList(v=>!v)}>
          {showVulnList?"Hide":"View All"}
        </button>
      }>
        <div style={{fontSize:18,fontWeight:800}}>
          {vulns.length} Total Vulnerabilities
        </div>

        {showVulnList&&(
          <div style={{marginTop:12,maxHeight:260,overflowY:"auto"}}>
            {vulns.slice(0,50).map((v,i)=>(
              <div key={i} style={listRow}>
                {v.title||v.name||"Vulnerability"} — {v.severity||"Unknown"}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* INCIDENTS */}

      <Panel title="Incident Center" right={
        <button style={btnPrimary} onClick={()=>setShowIncidentModal(true)}>
          Create Incident
        </button>
      }>
        <div style={{fontSize:18,fontWeight:800}}>
          {incidents.length} Incidents Logged
        </div>
      </Panel>

      {/* THREAT FEED */}

      <Panel title="Threat Feed" pulse={threatPulse}>
        <div style={{maxHeight:220,overflowY:"auto"}}>
          {threats.map((t,i)=>(
            <div key={i} style={listRow}>
              {t.title||t.message||"Security Event"}
            </div>
          ))}
        </div>
      </Panel>

      {/* AUTOPROTECT */}

      <Panel title="Autoprotect Control">
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div>Status: {autoprotect?.enabled?"ENABLED":"DISABLED"}</div>
          <button style={btnPrimary} onClick={toggleAutoprotect}>
            Toggle
          </button>
        </div>
      </Panel>

      {showIncidentModal&&(
        <IncidentModal
          onClose={()=>setShowIncidentModal(false)}
          onSubmit={createIncident}
        />
      )}

      {lastUpdated&&(
        <div style={{fontSize:12,opacity:.5}}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Card({title,value}){
  return(
    <div style={card}>
      <div style={{fontSize:12,opacity:.6}}>{title}</div>
      <div style={{fontSize:24,fontWeight:900,marginTop:6}}>
        {value??"—"}
      </div>
    </div>
  );
}

function Panel({title,children,right,pulse}){
  return(
    <div style={{
      ...card,
      border:pulse?"1px solid #16c784":"1px solid rgba(255,255,255,.06)"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontWeight:900}}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function RiskMeter({risk}){
  const width=Math.min(100,Math.max(0,risk.riskIndex||0));
  return(
    <div>
      <div style={meterWrap}>
        <div style={{
          ...meterFill,
          width:`${width}%`,
          background:risk.level==="CRITICAL"?"#ff3b30":"#16c784"
        }}/>
      </div>
      <div style={{marginTop:8}}>
        {width}% — {risk.level}
      </div>
    </div>
  );
}

function IncidentModal({onClose,onSubmit}){
  const [title,setTitle]=useState("");
  const [severity,setSeverity]=useState("Medium");

  return(
    <div style={modalOverlay}>
      <div style={modalBox}>
        <div style={{fontWeight:900,fontSize:18}}>Create Incident</div>

        <input
          placeholder="Title"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          style={input}
        />

        <select
          value={severity}
          onChange={e=>setSeverity(e.target.value)}
          style={input}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button
            style={btnPrimary}
            onClick={()=>onSubmit({title,severity})}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const grid4={
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
  gap:14
};

const card={
  padding:18,
  borderRadius:14,
  background:"rgba(255,255,255,.03)",
  border:"1px solid rgba(255,255,255,.06)"
};

const meterWrap={
  height:12,
  background:"rgba(255,255,255,.06)",
  borderRadius:999,
  overflow:"hidden"
};

const meterFill={
  height:"100%",
  borderRadius:999
};

const listRow={
  padding:"8px 0",
  borderBottom:"1px solid rgba(255,255,255,.05)",
  fontSize:13
};

const modalOverlay={
  position:"fixed",
  inset:0,
  background:"rgba(0,0,0,.6)",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  zIndex:9999
};

const modalBox={
  background:"#111",
  padding:24,
  borderRadius:14,
  width:360,
  display:"flex",
  flexDirection:"column",
  gap:12
};

const input={
  padding:10,
  borderRadius:8,
  border:"1px solid rgba(255,255,255,.2)",
  background:"rgba(255,255,255,.05)",
  color:"#fff"
};

const btnPrimary={
  padding:"8px 14px",
  borderRadius:10,
  background:"#fff",
  color:"#000",
  fontWeight:800,
  border:"none",
  cursor:"pointer"
};

const btnGhost={
  padding:"8px 14px",
  borderRadius:10,
  background:"transparent",
  color:"#fff",
  border:"1px solid rgba(255,255,255,.2)",
  cursor:"pointer"
};
