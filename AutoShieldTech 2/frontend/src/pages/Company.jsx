import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

export default function Company({ user }) {
  const [company,setCompany]=useState(null);
  const [notes,setNotes]=useState([]);
  const [memberId,setMemberId]=useState('');

  const load=async()=>{ setCompany(await api.companyMe()); setNotes(await api.companyNotifications()); };
  useEffect(()=>{ load().catch(e=>alert(e.message)); }, []);

  const add=async()=>{ try{ await api.companyAddMember(memberId); setMemberId(''); await load(); }catch(e){ alert(e.message);} };
  const remove=async(id)=>{ try{ await api.companyRemoveMember(id); await load(); }catch(e){ alert(e.message);} };
  const markRead=async(id)=>{ try{ await api.companyMarkRead(id); await load(); }catch(e){ alert(e.message);} };

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2>Company Workspace</h2>
          {company && (
            <>
              <div className="pill"><b>{company.name}</b> <span className="badge">{company.sizeTier}</span></div>
              <div style={{height:10}} />
              <small>Companies manage members and view aggregate posture. Companies cannot force AutoProtect on members.</small>
            </>
          )}
        </div>

        <div style={{height:16}} />
        <div className="card">
          <h3>Members</h3>
          <small>Add/remove by userId (starter). Later becomes invite-by-email.</small>
          <div style={{height:10}} />
          <div className="row">
            <div className="col"><input placeholder="Member userId" value={memberId} onChange={e=>setMemberId(e.target.value)} /></div>
            <div className="col"><button onClick={add}>Add member</button></div>
          </div>
          <div style={{height:12}} />
          {company && (
            <table className="table">
              <thead><tr><th>UserId</th><th>Action</th></tr></thead>
              <tbody>{(company.members||[]).map(id=>(<tr key={id}><td>{id}</td><td><button onClick={()=>remove(id)}>Remove</button></td></tr>))}</tbody>
            </table>
          )}
        </div>
      </div>

      <div className="col">
        <NotificationList items={notes} onRead={markRead} />
      </div>
    </div>
  );
}
