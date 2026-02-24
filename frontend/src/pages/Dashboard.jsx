// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Executive Dashboard — Phase 7 + 8
// Deep Security Analytics + Governance Authority Layer

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
  const [vulns,setVulns]=useState([]);
  const [events,setEvents]=useState([]);

  // Governance
  const [users,setUsers]=useState([]);
  const [companies,setCompanies]=useState([]);
  const [notifications,setNotifications]=useState([]);

  const [lastUpdated,setLastUpdated]=useState(null);

  async function loadAll(){
    try{
      const [
        m,r,p,
        ps,v,e,
        u,c,n
      ]=await Promise.all([
        api.adminMetrics(),
        api.adminExecutiveRisk(),
        api.adminPredictiveChurn(),
        api.postureSummary(),
        api.vulnerabilities(),
        api.securityEvents(50),
        api.adminUsers(),
        api.adminCompanies(),
        api.adminNotifications()
      ]);

      setMetrics(m?.metrics||null);
      setRisk(r?.executiveRisk||null);
      setPredictive(p?.predictiveChurn||null);

      setPosture(ps?.summary||ps||null);
      setVulns(v?.vulnerabilities||v||[]);
      setEvents(e?.events||e||[]);

      setUsers(u?.users||[]);
      setCompanies(c?.companies||[]);
      setNotifications(n?.notifications||[]);

      setLastUpdated(new Date());

    }catch(err){
      console.error("Layer 7+8 load error:",err);
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    loadAll();
  },[]);

  const vulnCounts=useMemo(()=>{
    const map={critical:0,high:0,medium:0,low:0};
    for(const v of vulns){
      const s=(v.severity||"").toLowerCase();
      if(s.includes("crit")) map.critical++;
      else if(s.includes("high")) map.high++;
      else if(s.includes("med")) map.medium++;
      else map.low++;
    }
    return map;
  },[vulns]);

  const eventCounts=useMemo(()=>{
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

  const adminCount=users.filter(u=>u.role==="Admin").length;
  const financeCount=users.filter(u=>u.role==="Finance").length;
  const lockedCount=users.filter(u=>u.subscriptionStatus==="Locked").length;

  if(loading){
    return <div style={{padding:28}}>Loading Advanced Security Layer...</div>;
  }

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:22}}>

      {/* SECURITY POSTURE */}

      <Panel title="Security Posture Intelligence">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          <MiniStat label="Posture Score" value={posture?.score||posture?.postureScore||"—"}/>
          <MiniStat label="Total Vulnerabilities" value={vulns.length}/>
          <MiniStat label="Security Events" value={events.length}/>
        </div>
      </Panel>

      {/* VULNERABILITY HEAT MATRIX */}

      <Panel title="Vulnerability Heat Matrix">
        <HeatBar counts={vulnCounts}/>
      </Panel>

      {/* SECURITY EVENT DISTRIBUTION */}

      <Panel title="Security Event Severity Distribution">
        <HeatBar counts={eventCounts}/>
      </Panel>

      {/* GOVERNANCE */}

      <Panel title="Governance Authority">
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <MiniStat label="Companies" value={companies.length}/>
          <MiniStat label="Admins" value={adminCount}/>
          <MiniStat label="Finance Users" value={financeCount}/>
          <MiniStat label="Locked Accounts" value={lockedCount}/>
        </div>
      </Panel>

      {/* COMPANY CONTROL CENTER */}

      <Panel title="Company Control Center">
        <div style={{maxHeight:220,overflowY:"auto"}}>
          {companies.map((c,i)=>(
            <div key={i} style={row}>
              {c.name} — {c.status} — {c.tier}
            </div>
          ))}
        </div>
      </Panel>

      {/* SYSTEM NOTIFICATIONS */}

      <Panel title="System Notifications">
        <div style={{maxHeight:200,overflowY:"auto"}}>
          {notifications.slice(0,20).map((n,i)=>(
            <div key={i} style={row}>
              {n.message||n.title||"Notification"}
            </div>
          ))}
        </div>
      </Panel>

      {lastUpdated&&(
        <div style={{fontSize:12,opacity:.5}}>
          Last Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

    </div>
  );
}

/* COMPONENTS */

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

function MiniStat({label,value}){
  return(
    <div>
      <div style={{fontSize:12,opacity:.6}}>{label}</div>
      <div style={{fontWeight:900,fontSize:20}}>
        {value}
      </div>
    </div>
  );
}

function HeatBar({counts}){
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;

  return(
    <div style={{display:"flex",height:20,borderRadius:999,overflow:"hidden"}}>
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

const row={
  padding:"8px 0",
  borderBottom:"1px solid rgba(255,255,255,.06)",
  fontSize:13
};
