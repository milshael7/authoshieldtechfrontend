import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function scoreFrom(checks = []) {
  // simple MVP scoring: ok=1, warn=0.5, danger=0
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c.status === 'ok') return s + 1;
    if (c.status === 'warn') return s + 0.5;
    return s + 0;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

export default function Posture() {
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(50),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      setErr(e?.message || 'Failed to load posture');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  // “coverage” bars (MVP placeholders you can wire later to real signals)
  const cover = useMemo(() => {
    const base = [
      { name: 'Endpoint', val: 72 },
      { name: 'Identity', val: 64 },
      { name: 'Email', val: 58 },
      { name: 'Cloud', val: 61 },
    ];
    // tiny nudge using score so it feels dynamic
    return base.map(x => ({ ...x, val: pct(x.val * 0.7 + score * 0.3) }));
  }, [score]);

  const meterWidth = { width: `${pct(score)}%` };

  return (
    <div className="postureWrap">
      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>Security Posture</b>
            <small>
              {summary?.scope?.type ? `Scope: ${summary.scope.type}` : 'Scope: —'} •
              {' '}Last update: {new Date().toLocaleTimeString()}
            </small>
          </div>

          <div className="postureScore">
            <div className="scoreRing">{pct(score)}</div>
            <div className="scoreMeta">
              <b>Overall Score</b>
              <span>{loading ? 'Loading…' : (err ? 'Error' : 'MVP estimate')}</span>
            </div>
          </div>
        </div>

        <div className="meter" aria-hidden="true">
          <div style={meterWidth}></div>
        </div>

        {err && <p className="error" style={{ marginTop: 12 }}>{err}</p>}

        <div className="coverGrid">
          {cover.map((x) => (
            <div key={x.name}>
              <div className="coverItemTop">
                <b>{x.name} Coverage</b>
                <small>{pct(x.val)}%</small>
              </div>
              <div className="coverBar" aria-hidden="true">
                <div style={{ width: `${pct(x.val)}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <div className="card" style={{ background: 'rgba(0,0,0,.18)' }}>
          <h3 style={{ marginTop: 0 }}>Recommended Actions</h3>
          {checks.length === 0 && <p><small>{loading ? 'Loading…' : 'No checks yet.'}</small></p>}
          <ul className="list">
            {checks.slice(0, 6).map(c => (
              <li key={c.id}>
                <span className={`dot ${c.status || 'info'}`} aria-hidden="true"></span>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <b>{c.title}</b>
                    <small>{new Date(c.at || Date.now()).toLocaleString()}</small>
                  </div>
                  <div><small>{c.message}</small></div>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ height: 10 }} />
          <button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      <div className="postureCard radarBox">
        <div className="postureTop">
          <div className="postureTitle">
            <b>Threat Radar (MVP)</b>
            <small>Visual placeholder — we’ll connect real telemetry later.</small>
          </div>
        </div>

        <div className="radar" aria-hidden="true"></div>

        <div style={{ height: 14 }} />

        <div className="card" style={{ background: 'rgba(0,0,0,.18)' }}>
          <h3 style={{ marginTop: 0 }}>Recent Events</h3>

          <p style={{ margin: '8px 0 6px' }}><small><b>Notifications</b></small></p>
          {recent.notifications.length === 0 && <p><small>{loading ? 'Loading…' : 'No notifications.'}</small></p>}
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr><th>Time</th><th>Severity</th><th>Title</th></tr>
              </thead>
              <tbody>
                {recent.notifications.slice(0, 10).map(n => (
                  <tr key={n.id}>
                    <td><small>{new Date(n.at || Date.now()).toLocaleString()}</small></td>
                    <td><small>{n.severity || 'info'}</small></td>
                    <td><small>{n.title}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: '14px 0 6px' }}><small><b>Audit</b></small></p>
          {recent.audit.length === 0 && <p><small>{loading ? 'Loading…' : 'No audit yet.'}</small></p>}
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr><th>Time</th><th>Action</th><th>Actor</th></tr>
              </thead>
              <tbody>
                {recent.audit.slice(0, 10).map(ev => (
                  <tr key={ev.id}>
                    <td><small>{new Date(ev.at || Date.now()).toLocaleString()}</small></td>
                    <td><small>{ev.action || '-'}</small></td>
                    <td><small>{ev.actorId || '-'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
