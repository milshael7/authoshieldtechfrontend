import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function scoreFromChecks(checks = []) {
  // Simple MVP scoring:
  // ok = 1, warn = 0.6, danger = 0.25
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    const st = String(c.status || 'info').toLowerCase();
    if (st === 'ok') return s + 1;
    if (st === 'warn') return s + 0.6;
    if (st === 'danger') return s + 0.25;
    return s + 0.5;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

function coverageModel({ summary, checks }) {
  // “Looks legit” bars (MVP placeholders tied to real signals we have)
  // You can swap these later for real telemetry.
  const score = scoreFromChecks(checks);

  // Base categories
  const autoprotect = checks.find(c => c.id === 'autoprotect');
  const autoprotectPct = autoprotect?.status === 'ok' ? 92 : 55;

  const passwordPct = checks.find(c => c.id === 'password')?.status === 'ok' ? 86 : 60;
  const mfaPct = checks.find(c => c.id === 'mfa')?.status === 'ok' ? 78 : 58;

  // Activity “confidence” based on real counts (audit/notifications)
  const auditN = Number(summary?.totals?.auditEvents || 0);
  const noteN = Number(summary?.totals?.notifications || 0);
  const activityPct = Math.max(35, Math.min(95, Math.round(35 + Math.log10(1 + auditN + noteN) * 35)));

  // Overall meter uses score as the main driver
  const meter = score;

  return {
    score,
    meter,
    items: [
      { label: 'Identity & Access', value: Math.round((mfaPct + passwordPct) / 2) },
      { label: 'AutoProtect Coverage', value: autoprotectPct },
      { label: 'Threat Visibility', value: Math.round((activityPct + 10) / 1.1) },
      { label: 'Audit Readiness', value: activityPct },
    ]
  };
}

export default function PosturePanel({ title = 'Security Posture', subtitle = 'Live posture snapshot (MVP)' }) {
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
        api.postureRecent(20),
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

  const model = useMemo(() => coverageModel({ summary, checks }), [summary, checks]);

  const scopeLabel = useMemo(() => {
    const t = summary?.scope?.type;
    if (!t) return '—';
    if (t === 'global') return 'Platform';
    if (t === 'company') return 'Company';
    return 'Account';
  }, [summary]);

  return (
    <div className="postureWrap">
      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>{title}</b>
            <small>{subtitle} • Scope: {scopeLabel}</small>
          </div>

          <div className="postureScore">
            <div className="scoreRing" title="Posture score (MVP)">
              {loading ? '—' : model.score}
            </div>
            <div className="scoreMeta">
              <b>{loading ? 'Loading…' : `Score: ${model.score}/100`}</b>
              <span>{summary?.time ? new Date(summary.time).toLocaleString() : ''}</span>
            </div>
          </div>
        </div>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}

        <div className="meter" style={{ marginTop: 14 }}>
          <div style={{ width: `${loading ? 0 : pct(model.meter)}%` }} />
        </div>

        <div className="coverGrid">
          {model.items.map((it) => (
            <div key={it.label}>
              <div className="coverItemTop">
                <b>{it.label}</b>
                <small>{loading ? '—' : `${pct(it.value)}%`}</small>
              </div>
              <div className="coverBar">
                <div style={{ width: `${loading ? 0 : pct(it.value)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <div className="row">
          <div className="col">
            <div className="card" style={{ padding: 12, background: 'rgba(0,0,0,.18)' }}>
              <b style={{ fontSize: 13 }}>Checks</b>
              <div style={{ height: 10 }} />

              {checks.length === 0 && (
                <small>{loading ? 'Loading…' : 'No checks yet.'}</small>
              )}

              {checks.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <span className={`dot ${c.status || 'info'}`} aria-hidden="true" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <b style={{ fontSize: 13 }}>{c.title}</b>
                      <small>{c.at ? new Date(c.at).toLocaleTimeString() : ''}</small>
                    </div>
                    <small style={{ display: 'block' }}>{c.message}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col radarBox">
            <div className="radar" title="Radar view (visual placeholder, MVP)" />
            <small style={{ display: 'block', marginTop: 8, opacity: 0.8 }}>
              Radar view is visual (MVP). Later it will map real signals (phishing, malware, fraud, policy, etc).
            </small>
          </div>
        </div>
      </div>

      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>Recent Activity</b>
            <small>Audit + notifications (last 20)</small>
          </div>
          <button onClick={load} disabled={loading} style={{ width: 'auto', minWidth: 130 }}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div style={{ height: 12 }} />

        <div className="card" style={{ padding: 12, background: 'rgba(0,0,0,.18)' }}>
          <b style={{ fontSize: 13 }}>Notifications</b>
          <div style={{ height: 10 }} />
          {(recent.notifications || []).length === 0 && (
            <small>{loading ? 'Loading…' : 'No notifications yet.'}</small>
          )}
          <ul className="list">
            {(recent.notifications || []).slice(0, 8).map(n => (
              <li key={n.id}>
                <span className={`dot ${n.severity || 'info'}`} aria-hidden="true" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <b>{n.title || 'Notification'}</b>
                    <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                  </div>
                  <div><small>{n.message || ''}</small></div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ height: 12 }} />

        <div className="card" style={{ padding: 12, background: 'rgba(0,0,0,.18)' }}>
          <b style={{ fontSize: 13 }}>Audit Log</b>
          <div style={{ height: 10 }} />
          {(recent.audit || []).length === 0 && (
            <small>{loading ? 'Loading…' : 'No audit events yet.'}</small>
          )}

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {(recent.audit || []).slice(0, 10).map(ev => (
                  <tr key={ev.id || ev.at + ev.action}>
                    <td><small>{ev.at ? new Date(ev.at).toLocaleString() : ''}</small></td>
                    <td><small>{ev.action || ''}</small></td>
                    <td><small>{ev.actorId || '—'}</small></td>
                    <td><small>{(ev.targetType || '—') + ':' + (ev.targetId || '—')}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <small style={{ display: 'block', marginTop: 10, opacity: 0.8 }}>
            This is read-only. Admin automatically sees everything Manager sees.
          </small>
        </div>
      </div>
    </div>
  );
}
