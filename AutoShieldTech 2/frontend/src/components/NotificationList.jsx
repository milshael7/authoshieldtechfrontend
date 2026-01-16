import React from 'react';
import ReadAloud from './ReadAloud.jsx';
import ShareSnippet from './ShareSnippet.jsx';

export default function NotificationList({ items=[], onRead }) {
  return (
    <div className="card">
      <h3>Notifications</h3>
      {items.length===0 && <small>No notifications yet.</small>}
      {items.map(n=>(
        <div key={n.id} className="pill" style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}>
            <div>
              <b>{n.title}</b>{" "}
              <span className={`badge ${n.severity==='warning'?'warn':n.severity==='danger'?'danger':'ok'}`}>{n.severity}</span>
              <div><small>{new Date(n.at).toLocaleString()}</small></div>
            </div>
            <div className="actions" style={{maxWidth:320}}>
              <ReadAloud text={`${n.title}. ${n.message}`} />
              <ShareSnippet text={`${n.title}\n\n${n.message}`} />
              {!n.read && <button onClick={()=>onRead(n.id)}>✓ Mark read</button>}
            </div>
          </div>
          <div style={{marginTop:8,color:'var(--muted)'}}>{n.message}</div>
        </div>
      ))}
    </div>
  );
}
