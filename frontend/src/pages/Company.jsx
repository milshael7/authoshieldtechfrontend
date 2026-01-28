import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function calcScore({ summary, checks }) {
  const list = checks?.checks || [];
  if (!list.length) return 60;

  let base = 82;
  for (const c of list) {
    if (c.status === 'danger') base -= 22;
    else if (c.status === 'warn') base -= 12;
    else if (c.status === 'ok') base += 2;
  }

  const notes = summary?.totals?.notifications ?? 0;
  const audit = summary?.totals?.auditEvents ?? 0;

  base -= Math.min(18, Math.floor(notes / 6));
  base -= Math.min(12, Math.floor(audit / 40));

  return clamp(base, 0, 100);
}

export default function Company({ user }) {
  const [company, setCompany] = useState(null);
  const [notes, setNotes] = useState([]);
  const [memberId, setMemberId] = useState('');

  // ✅ posture data
  const [postureSummary, setPostureSummary] = useState(null);
  const [postureChecks, setPostureChecks] = useState(null);
  const [postureRecent, setPostureRecent] = useState(null);
  const [postureErr, setPostureErr] = useState('');

  const load = async () => {
    const [c, n] = await Promise.all([
      api.companyMe(),
      api.companyNotifications(),
    ]);
    setCompany(c);
    setNotes(n || []);
  };

  const loadPosture = async () => {
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(40),
      ]);
      setPostureSummary(s);
      setPostureChecks(c);
      setPostureRecent(r);
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture data');
    }
  };

  const loadAll = async () => {
    await Promise.all([load(), loadPosture()]);
  };

  useEffect(() => { loadAll().catch(e => alert(e.message)); }, []);

  const add = async () => {
    try {
      await api.companyAddMember(memberId);
      setMemberId('');
      await loadAll();
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    try {
      await api.companyRemoveMember(id);
      await loadAll();
    } catch (e) { alert(e.message); }
  };

  const markRead = async (id) => {
    try {
      await api.companyMarkRead(id);
      await load();
    } catch (e) { alert(e.message); }
  };

  const score = calcScore({ summary: postureSummary, checks: postureChecks });

  const coverage = [
    { label: 'Threat', val: clamp(score - 8, 0, 100) },
    { label: 'Vuln', val: clamp(score - 16, 0, 100) },
    { label: 'Access', val: clamp(score - 6, 0, 100) },
    { label: 'Data', val: clamp(score - 14, 0, 100) },
  ];

  return (
    <div className="grid">

      {/* ✅ Posture dashboard header (company vibe) */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="postureWrap">

          <div className="postureCard">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Company Security Posture</b>
                <small>
                  {company ? company.name : 'Company'} • Scope: {postureSummary?.scope?.type || '—'} • Updated:{' '}
                  {postureSummary?.time ? new Date(postureSummary.time).toLocaleString() : '—'}
                </small>
              </div>

              <div className="postureScore">
                <div className="scoreRing">{score}</div>
                <div className="scoreMeta">
                  <b>Overall Score</b>
                  <span>{score >= 80 ? 'Healthy' : (score >= 60 ? 'Watch' : 'At Risk')}</span>
                </div>
                <button onClick={loadPosture}>Refresh</button>
              </div>
            </div>

            {postureErr && <p className="error" style={{ marginTop: 10 }}>{postureErr}</p>}

            <div className="meter" aria-hidden="true">
              <div style={{ width: `${score}%` }} />
            </div>

            <div className="coverGrid">
              {coverage.map(x => (
                <div key={x.label}>
                  <div className="coverItemTop">
                    <b>{x.label} Coverage</b>
                    <small>{x.val}%</small>
                  </div>
                  <div className="coverBar" aria-hidden="true">
                    <div style={{ width: `${x.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />

            <b style={{ display: 'block', marginBottom: 8 }}>Recommended checks</b>
            <div className="list">
              {(postureChecks?.checks || []).slice(0, 4).map(c => (
                <div className="card" key={c.id} style={{ background: 'rgba(0,0,0,.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div>
                      <b>{c.title}</b>
                      <div><small>{c.message}</small></div>
                    </div>
                    <span className={`badge ${c.status === 'ok' ? 'ok' : (c.status === 'danger' ? 'danger' : 'warn')}`}>
                      {String(c.status || '').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {(!postureChecks?.checks || postureChecks.checks.length === 0) && (
                <small className="muted">No checks yet.</small>
              )}
            </div>
          </div>

          <div className="postureCard radarBox">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Signal Radar</b>
                <small>MVP visual (real signals later)</small>
              </div>
            </div>

            <div className="radar" />

            <div style={{ height: 12 }} />
            <b style={{ display: 'block', marginBottom: 8 }}>Recent activity</b>

            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Action/Title</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const a = (postureRecent?.audit || []).slice(0, 8).map(x => ({
                      t: x.at || x.time || x.createdAt,
                      type: 'audit',
                      label: x.action || 'event'
                    }));
                    const n = (postureRecent?.notifications || []).slice(0, 8).map(x => ({
                      t: x.createdAt || x.at || x.time,
                      type: 'note',
                      label: x.title || 'notification'
                    }));

                    const merged = [...a, ...n]
                      .filter(x => x.t)
                      .sort((p, q) => new Date(q.t) - new Date(p.t))
                      .slice(0, 10);

                    if (merged.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="muted">No recent activity yet.</td>
                        </tr>
                      );
                    }

                    return merged.map((x, idx) => (
                      <tr key={idx}>
                        <td><small>{new Date(x.t).toLocaleString()}</small></td>
                        <td><small>{x.type}</small></td>
                        <td><small>{x.label}</small></td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Existing Company UI (kept) */}
      <div className="card">
        <h2>Company Workspace</h2>
        {company && (
          <>
            <div className="pill">
              <b>{company.name}</b> <span className="badge">{company.sizeTier}</span>
            </div>
            <div style={{ height: 10 }} />
            <small>
              Companies manage members and view aggregate posture. Companies cannot force AutoProtect on members.
            </small>
          </>
        )}
      </div>

      <div className="card">
        <h3>Members</h3>
        <small>Add/remove by userId (starter). Later becomes invite-by-email.</small>
        <div style={{ height: 10 }} />
        <div className="row">
          <div className="col">
            <input
              placeholder="Member userId"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
            />
          </div>
          <div className="col">
            <button onClick={add}>Add member</button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {company && (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr><th>UserId</th><th>Action</th></tr>
              </thead>
              <tbody>
                {(company.members || []).map(id => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td><button onClick={() => remove(id)}>Remove</button></td>
                  </tr>
                ))}
                {(company.members || []).length === 0 && (
                  <tr><td colSpan={2} className="muted">No members yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

    </div>
  );
}
