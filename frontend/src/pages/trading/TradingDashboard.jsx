import React, { useEffect, useState } from "react";

const API = process.env.REACT_APP_API || "http://localhost:5000";

export default function TradingDashboard(){

  const [snapshot,setSnapshot] = useState({});
  const [decisions,setDecisions] = useState([]);
  const [price,setPrice] = useState(null);
  const [loading,setLoading] = useState(true);

  const tenantId = "default";

/* =========================================================
FETCH SNAPSHOT
========================================================= */

  async function fetchSnapshot(){

    try{

      const res = await fetch(
        `${API}/api/trading/snapshot?tenantId=${tenantId}`
      );

      const data = await res.json();

      if(data?.snapshot){
        setSnapshot(data.snapshot);
      }

    }catch(err){
      console.log("snapshot error",err);
    }

  }

/* =========================================================
FETCH DECISIONS
========================================================= */

  async function fetchDecisions(){

    try{

      const res = await fetch(
        `${API}/api/trading/decisions?tenantId=${tenantId}`
      );

      const data = await res.json();

      if(Array.isArray(data)){
        setDecisions(data.reverse());
      }

    }catch(err){
      console.log("decisions error",err);
    }

  }

/* =========================================================
FETCH PRICE
========================================================= */

  async function fetchPrice(){

    try{

      const res = await fetch(
        `${API}/api/trading/price?tenantId=${tenantId}`
      );

      const data = await res.json();

      if(data?.price !== undefined){
        setPrice(data.price);
      }

    }catch(err){
      console.log("price error",err);
    }

  }

/* =========================================================
AUTO REFRESH
========================================================= */

  useEffect(()=>{

    async function load(){

      await Promise.all([
        fetchSnapshot(),
        fetchDecisions(),
        fetchPrice()
      ]);

      setLoading(false);

    }

    load();

    const interval = setInterval(load,2000);

    return ()=>clearInterval(interval);

  },[]);

/* =========================================================
RENDER
========================================================= */

  if(loading){
    return <div style={{padding:40}}>Loading trading dashboard...</div>;
  }

  return(

    <div style={{padding:40,fontFamily:"Arial"}}>

      <h1>AI Trading Dashboard</h1>

{/* =========================================================
ACCOUNT
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Account</h2>

        <div>Equity: ${Number(snapshot?.equity || 0).toFixed(2)}</div>
        <div>Cash: ${Number(snapshot?.cashBalance || 0).toFixed(2)}</div>
        <div>Peak Equity: ${Number(snapshot?.peakEquity || 0).toFixed(2)}</div>

      </div>

{/* =========================================================
POSITION
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Open Position</h2>

        {snapshot?.position ? (

          <div>

            <div>Symbol: {snapshot.position.symbol}</div>
            <div>Entry: {snapshot.position.entry}</div>
            <div>Quantity: {snapshot.position.qty}</div>

          </div>

        ) : (

          <div style={{color:"#777"}}>No open position</div>

        )}

      </div>

{/* =========================================================
MARKET
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Market</h2>

        <div>
          Last Price: {price ? price : "waiting for price feed..."}
        </div>

      </div>

{/* =========================================================
AI DECISIONS
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>AI Decisions</h2>

        {decisions.length === 0 && (
          <div style={{color:"#777"}}>
            Waiting for AI engine decisions...
          </div>
        )}

        <table border="1" cellPadding="6">

          <thead>

            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Price</th>
              <th>Risk %</th>
            </tr>

          </thead>

          <tbody>

            {decisions.slice(0,20).map((d,i)=>(
              <tr key={i}>

                <td>
                  {new Date(d.time).toLocaleTimeString()}
                </td>

                <td>{d.action}</td>

                <td>{d.price}</td>

                <td>{((d.riskPct || 0)*100).toFixed(2)}%</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

{/* =========================================================
TRADES
========================================================= */}

      <div style={{marginTop:20}}>

        <h2>Recent Trades</h2>

        {(!snapshot?.trades || snapshot.trades.length===0) && (
          <div style={{color:"#777"}}>
            No trades yet
          </div>
        )}

        <table border="1" cellPadding="6">

          <thead>

            <tr>
              <th>Time</th>
              <th>PnL</th>
            </tr>

          </thead>

          <tbody>

            {snapshot?.trades?.slice(-20).map((t,i)=>(
              <tr key={i}>

                <td>
                  {new Date(t.time).toLocaleTimeString()}
                </td>

                <td style={{
                  color: t.pnl >=0 ? "green":"red"
                }}>
                  {Number(t.pnl || 0).toFixed(2)}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}
