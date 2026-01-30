// frontend/src/pages/Company.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

export default function Company({ user }) {
  const [company, setCompany] = useState(null);
  const [notes, setNotes] = useState([]);
  const [memberId, setMemberId] = useState('');

  // Posture
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loadingPosture, setLoadingPosture] = useState(true);
  const [postureErr, setPostureErr] = useState('');

  const load = async () => {
    const [c, n] = await Promise.all([
      api.companyMe(),
      api.companyNotifications(),
    ]);
    setCompany(c || null);
    setNotes(n || []);
  };

  const loadPosture = async () => {
    setLoadingPosture(true);
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(40),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture');
    } finally {
      setLoadingPosture(false);
    }
  };

  useEffect(() => {
    load().catch(e => alert(e.message));
    loadPosture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    try {
      await api.companyAddMember(memberId);
      setMemberId('');
      await load();
      await loadPosture();
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    try {
      await api.companyRemoveMember(id);
      await load();
      await loadPosture();
    } catch (e) { alert(e.message); }
  };

  const markRead = async (id) => {
    try {
      await api.companyMarkRead(id);
      await load();
      await loadPosture();
    } catch (e) { alert(e.message); }
  };

  // simple score (MVP)
  const score = (() => {
    if (!checks || checks.length === 0) return 80;
    const ok = checks.filter(x => x.status === 'ok').length;
    const warn = checks.filter(x => x.status === 'warn').length;
    const danger = checks.filter(x => x.status === 'danger').length;
    let s = 92 + ok * 3 - warn * 6 - danger * 12;
    // company accounts usually rely on member posture; keep it slightly stricter
    if (!user?.autoprotectEnabled) s -= 6;
    return Math.max(10, Math.min(99, Math.round(s)));
  })();

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Company Workspace</h2>
        {company && (
          <>
            <div className="pill">
              <b>{company.name}</b> <span className="badge">{company.sizeTier}</span>
            </div>
            <div style={{ height: 10 }} />
            <small>
              Company tools: manage members + view aggregate posture.
              AutoProtect is typically per-user; company can’t force it on members (MVP rule).
            </small>
          </>
        )}
        <div style={{ height: 10 }} />
        <button onClick={loadPosture} disabled={loadingPosture}>
          {loadingPosture ? 'Refreshing posture…' : 'Refresh posture'}
        </button>
        {postureErr && <p className="error" style={{ marginTop: 10 }}>{postureErr}</p>}
      </div>

      {/* Posture dashboard */}
      <div className="postureWrap" style={{ gridColumn: '1 / -1' }}>
        <div className="postureCard">
          <div className="postureTop">
            <div className="postureTitle">
              <b>Company Security Posture</b>
              <small>
                Scope: {summary?.scope?.type || 'company'} • Users: {summary?.totals?.users ?? '—'} • Events: {summary?.totals?.auditEvents ?? '—'} • Alerts: {summary?.totals?.notifications ?? '—'}
              </small>
            </div>

            <div className="postureScore">
              <div className="scoreRing">{score}</div>
              <div className="scoreMeta">
                <b>Aggregate posture</b>
                <span>MVP score (we’ll replace with real coverage)</span>
              </div>
            </div>
          </div>

          <div className="meter" aria-hidden="true">
            <div style={{ width: `${score}%` }} />
          </div>

          <div className="coverGrid">
            <div>
              <div className="coverItemTop">
                <b>Member Coverage</b>
                <small>{company?.members?.length ? 'Growing' : 'Starter'}</small>
              </div>
              <div className="coverBar"><div style={{ width: company?.members?.length ? '72%' : '48%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Alerts Handling</b>
                <small>Starter</small>
              </div>
              <div className="coverBar"><div style={{ width: '58%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Access Control</b>
                <small>Good</small>
              </div>
              <div className="coverBar"><div style={{ width: '70%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Incident Readiness</b>
                <small>Starter</small>
              </div>
              <div className="coverBar"><div style={{ width: '55%' }} /></div>
            </div>
          </div>

          <div style={{ height: 14 }} />
          <b>Signal Radar (visual)</b>
          <div style={{ height: 8 }} />
          <div className="radar" />
          <div style={{ height: 8 }} />
          <small>Next step: company-scoped alerts + real event categories.</small>
        </div>

        <div className="postureCard">
          <b>Checks</b>
          <div style={{ height: 10 }} />

          {loadingPosture && <p><small>Loading checks…</small></p>}

          {!loadingPosture && checks.length === 0 && (
            <p><small>No checks yet.</small></p>
          )}

          {!loadingPosture && checks.length > 0 && (
            <ul className="list">
              {checks.slice(0, 6).map(ch => (
                <li key={ch.id}>
                  <span className={`dot ${ch.status || 'info'}`} aria-hidden="true" />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <b>{ch.title}</b>
                      <small>{new Date(ch.at || Date.now()).toLocaleString()}</small>
                    </div>
                    <div><small>{ch.message}</small></div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ height: 14 }} />
          <b>Recent activity</b>
          <div style={{ height: 10 }} />

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {[...(recent.notifications || []).slice(0, 8).map(n => ({
                  at: n.createdAt || n.at,
                  type: `NOTIFY:${n.severity || 'info'}`,
                  msg: n.title ? `${n.title} — ${n.message || ''}` : (n.message || ''),
                })),
                ...(recent.audit || []).slice(0, 8).map(a => ({
                  at: a.at,
                  type: `AUDIT:${a.action || 'event'}`,
                  msg: `${a.targetType || ''}${a.targetId ? ':' + a.targetId : ''}`,
                }))].slice(0, 12).map((x, i) => (
                  <tr key={i}>
                    <td><small>{x.at ? new Date(x.at).toLocaleString() : '—'}</small></td>
                    <td><small>{x.type}</small></td>
                    <td><small>{x.msg}</small></td>
                  </tr>
                ))}

                {(recent.notifications || []).length === 0 && (recent.audit || []).length === 0 && !loadingPosture && (
                  <tr><td colSpan={3}><small className="muted">No items.</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Members */}
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
            <button onClick={add} disabled={!memberId.trim()}>Add member</button>
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
                    <td><small>{id}</small></td>
                    <td><button onClick={() => remove(id)}>Remove</button></td>
                  </tr>
                ))}
                {(company.members || []).length === 0 && (
                  <tr><td colSpan={2}><small className="muted">No members yet.</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>
    </div>
  );
}
