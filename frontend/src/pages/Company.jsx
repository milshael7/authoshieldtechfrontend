// frontend/src/pages/Company.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import NotificationList from "../components/NotificationList.jsx";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function pct(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}

function fmtNum(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtCompact(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax >= 1e12) return (x / 1e12).toFixed(digits) + "t";
  if (ax >= 1e9) return (x / 1e9).toFixed(digits) + "b";
  if (ax >= 1e6) return (x / 1e6).toFixed(digits) + "m";
  if (ax >= 1e3) return (x / 1e3).toFixed(digits) + "k";
  return fmtNum(x, digits);
}

function riskLabel(score01) {
  const s = clamp(Number(score01) || 0, 0, 1);
  if (s >= 0.75) return { label: "High", badge: "danger" };
  if (s >= 0.45) return { label: "Medium", badge: "warn" };
  return { label: "Low", badge: "ok" };
}

// This is an MVP posture model (client-side) because your current backend
// doesn’t expose per-member posture yet. Later we’ll replace this with real API data.
function buildCompanyPosture(company, notes, user) {
  const members = (company?.members || []).filter(Boolean);
  const memberCount = members.length;

  // Notifications (use your existing notes feed)
  const totalAlerts = Array.isArray(notes) ? notes.length : 0;

  // Read/unread: support common shapes (depending on your backend payload)
  const unreadAlerts = Array.isArray(notes)
    ? notes.filter((n) => n && (n.read === false || n.isRead === false || n.readAt == null)).length
    : 0;

  // AutoProtect coverage:
  // Today we only know the COMPANY user’s autoprotectEnabled.
  // Until we have member profiles, show “Known coverage” + “Unknown members”.
  const knownProtected = user?.autoprotectEnabled ? 1 : 0;
  const unknownMembers = Math.max(0, memberCount - knownProtected);
  const coverageKnownPct = memberCount > 0 ? knownProtected / memberCount : 0;

  // Simple risk score (0..1):
  // - more unread alerts => higher risk
  // - low known coverage => higher risk
  const alertPressure = clamp(unreadAlerts / Math.max(1, memberCount), 0, 1);
  const coveragePenalty = 1 - clamp(coverageKnownPct, 0, 1);
  const riskScore = clamp(alertPressure * 0.55 + coveragePenalty * 0.45, 0, 1);

  const r = riskLabel(riskScore);

  const recommendations = [];
  if (memberCount === 0) recommendations.push("Add at least 1 member so we can start monitoring posture.");
  if (unknownMembers > 0) recommendations.push("Invite members to enable AutoProtect to increase coverage (recommended).");
  if (unreadAlerts > 0) recommendations.push("Review unread alerts and close/resolve the related cases.");
  recommendations.push("Turn on MFA for all accounts and require strong passwords.");
  recommendations.push("Set an internal policy: no password reuse + phishing training refresh monthly.");

  return {
    memberCount,
    totalAlerts,
    unreadAlerts,
    knownProtected,
    unknownMembers,
    coverageKnownPct,
    riskScore,
    riskLabel: r.label,
    riskBadge: r.badge,
    recommendations
  };
}

export default function Company({ user }) {
  const [company, setCompany] = useState(null);
  const [notes, setNotes] = useState([]);
  const [memberId, setMemberId] = useState("");

  const load = async () => {
    setCompany(await api.companyMe());
    setNotes(await api.companyNotifications());
  };

  useEffect(() => {
    load().catch((e) => alert(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    try {
      await api.companyAddMember(memberId);
      setMemberId("");
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.companyRemoveMember(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const markRead = async (id) => {
    try {
      await api.companyMarkRead(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const posture = useMemo(() => buildCompanyPosture(company, notes, user), [company, notes, user]);
  const sizeTier = company?.sizeTier || "—";

  return (
    <div className="row">
      {/* LEFT COLUMN */}
      <div className="col">
        <div className="card">
          <h2>Company Workspace</h2>

          {company ? (
            <>
              <div className="pill" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <b>{company.name}</b>{" "}
                  <span className="badge" style={{ marginLeft: 8 }}>
                    {sizeTier}
                  </span>
                </div>
                <span className={`badge ${posture.riskBadge}`}>Risk: {posture.riskLabel}</span>
              </div>

              <div style={{ height: 10 }} />
              <small>
                Companies manage members and view aggregate posture. Companies cannot force AutoProtect on members (MVP).
              </small>
            </>
          ) : (
            <small>Loading company…</small>
          )}
        </div>

        {/* ✅ Company Security Posture (the “room overview”) */}
        <div style={{ height: 16 }} />
        <div className="card">
          <h3>Security Posture</h3>
          <p>
            <small>
              This is your company’s “room status” — what AutoProtect would watch and defend at the org level.
              Right now it’s an MVP view based on your alerts + known coverage. Next step is true per-member posture.
            </small>
          </p>

          <div style={{ height: 10 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10
            }}
          >
            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(posture.memberCount, 0)}</div>
              <div className="kpiLbl">Members</div>
            </div>

            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(posture.totalAlerts, 0)}</div>
              <div className="kpiLbl">Total Alerts</div>
            </div>

            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(posture.unreadAlerts, 0)}</div>
              <div className="kpiLbl">Unread Alerts</div>
            </div>

            <div className="kpiBox">
              <div className="kpiVal">{pct(posture.coverageKnownPct, 0)}</div>
              <div className="kpiLbl">Known Coverage</div>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="card" style={{ background: "rgba(0,0,0,.18)" }}>
            <b>Coverage Details</b>
            <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
              <div>
                Protected (known): <b>{posture.knownProtected}</b>
              </div>
              <div>
                Unknown member status: <b>{posture.unknownMembers}</b> (until we fetch each member’s AutoProtect flag)
              </div>
            </div>

            <div style={{ height: 10 }} />

            <b>Recommendations</b>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {posture.recommendations.map((t, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <small>{t}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Members */}
        <div style={{ height: 16 }} />
        <div className="card">
          <h3>Members</h3>
          <small>Add/remove by userId (starter). Later becomes invite-by-email.</small>

          <div style={{ height: 10 }} />
          <div className="row">
            <div className="col">
              <input
                placeholder="Member userId"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>
            <div className="col">
              <button onClick={add} disabled={!memberId.trim()}>
                Add member
              </button>
            </div>
          </div>

          <div style={{ height: 12 }} />

          {company && (
            <table className="table">
              <thead>
                <tr>
                  <th>UserId</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(company.members || []).map((id) => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>
                      <button onClick={() => remove(id)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {(company.members || []).length === 0 && (
                  <tr>
                    <td colSpan="2" className="muted">
                      No members yet. Add a userId to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="col">
        <div className="card">
          <h3>Notifications</h3>
          <p>
            <small>
              These are company-level alerts and updates. Unread alerts increase your risk score.
            </small>
          </p>
          <NotificationList items={notes} onRead={markRead} />
        </div>
      </div>
    </div>
  );
}
