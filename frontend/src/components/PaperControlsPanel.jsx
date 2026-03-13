import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function PaperControlsPanel() {

  const [cfg,setCfg] = useState({
    baselinePct:1,
    maxPct:5,
    maxTradesPerDay:6
  });

  const [status,setStatus] = useState(null);

  const [engine,setEngine] = useState("UNKNOWN");

  const [ownerKey,setOwnerKey] = useState("");

  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);

  /* ================= LOAD ================= */

  async function load(){

    setLoading(true);

    try{

      const [c,s] = await Promise.all([
        api.paperGetConfig(),
        api.paperStatus()
      ]);

      if(c){

        setCfg({
          baselinePct:Number(c.baselinePct ?? 1),
          maxPct:Number(c.maxPct ?? 5),
          maxTradesPerDay:Number(c.maxTradesPerDay ?? 6)
        });

      }

      setStatus(s || null);

      if(s?.engine){
        setEngine(String(s.engine).toUpperCase());
      } else {
        setEngine("RUNNING");
      }

    }
    catch(err){

      console.error("paper control load error:",err);

      setEngine("UNKNOWN");

    }
    finally{

      setLoading(false);

    }

  }

  useEffect(()=>{ load(); },[]);

  /* ================= UTIL ================= */

  const clamp = (n,min,max)=>{

    const x = Number(n);

    if(!Number.isFinite(x)) return min;

    return Math.max(min,Math.min(max,x));

  };

  /* ================= SAVE ================= */

  async function save(){

    if(!ownerKey.trim()){

      return alert("Missing OWNER key. Paste it in the Owner Key box first.");

    }

    const payload = {

      baselinePct: clamp(cfg.baselinePct,0,100),

      maxPct: clamp(cfg.maxPct,0,100),

      maxTradesPerDay:
        Math.floor(clamp(cfg.maxTradesPerDay,0,200))

    };

    if(payload.baselinePct > payload.maxPct){

      return alert("baselinePct cannot be bigger than maxPct.");

    }

    setSaving(true);

    try{

      await api.paperSetConfig(payload,ownerKey.trim());

      await load();

      alert("Saved.");

    }
    catch(err){

      alert(err.message || "Save failed");

    }
    finally{

      setSaving(false);

    }

  }

  /* ================= UI ================= */

  return(

    <div className="card">

      <h3>AI Trading Controls (Paper)</h3>

      <small>
        Controls how aggressive the paper trader can be. Owner key required to change settings.
      </small>

      <div style={{height:12}}/>

      <b>Engine Status</b>

      <div style={{height:6}}/>

      <small>
        {engine}
      </small>

      <div style={{height:16}}/>

      {loading && <p><small>Loading…</small></p>}

      {!loading && (

        <>

          <div className="form">

            <label>Owner Key (required to save)</label>

            <input
              value={ownerKey}
              onChange={(e)=>setOwnerKey(e.target.value)}
              placeholder="paste x-owner-key here"
            />

            <label>Baseline % (starting position size)</label>

            <input
              type="number"
              step="0.1"
              value={cfg.baselinePct}
              onChange={(e)=>setCfg({...cfg,baselinePct:e.target.value})}
              placeholder="e.g. 1"
            />

            <label>Max % (never exceed this size)</label>

            <input
              type="number"
              step="0.1"
              value={cfg.maxPct}
              onChange={(e)=>setCfg({...cfg,maxPct:e.target.value})}
              placeholder="e.g. 5"
            />

            <label>Max trades per day</label>

            <input
              type="number"
              step="1"
              value={cfg.maxTradesPerDay}
              onChange={(e)=>setCfg({...cfg,maxTradesPerDay:e.target.value})}
              placeholder="e.g. 6"
            />

            <button
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save settings"}
            </button>

          </div>

          <div style={{height:16}}/>

          <b>Status</b>

          <div style={{height:8}}/>

          <div className="tableWrap">

            <table className="table">

              <tbody>

                <tr>
                  <td><small>Balance</small></td>
                  <td><small>{status?.balance ?? "—"}</small></td>
                </tr>

                <tr>
                  <td><small>PNL</small></td>
                  <td><small>{status?.pnl ?? "—"}</small></td>
                </tr>

                <tr>
                  <td><small>Wins</small></td>
                  <td><small>{status?.wins ?? "—"}</small></td>
                </tr>

                <tr>
                  <td><small>Losses</small></td>
                  <td><small>{status?.losses ?? "—"}</small></td>
                </tr>

                <tr>
                  <td><small>Trades Today</small></td>
                  <td><small>{status?.tradesToday ?? "—"}</small></td>
                </tr>

              </tbody>

            </table>

          </div>

          <div style={{height:10}}/>

          <button
            onClick={load}
            style={{width:"auto",minWidth:140}}
          >
            Refresh status
          </button>

        </>

      )}

    </div>

  );

}
