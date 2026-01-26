import React from 'react';

/**
 * Security Posture Dashboard (visual / read-only for now)
 * This is UI-only. Later we wire real data from backend.
 */
export default function SecurityPostureDashboard({
  score = 82,
  coverage = {
    phishing: 88,
    malware: 76,
    accountTakeover: 91,
    fraud: 69,
  }
}) {

  const clamp = (n) => Math.max(0, Math.min(100, n));

  return (
    <div className="postureWrap">

      {/* LEFT: Overall posture */}
      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>Security Posture</b>
            <small>Overall protection health</small>
          </div>

          <div className="postureScore">
            <div className="scoreRing">
              {clamp(score)}
            </div>
            <div className="scoreMeta">
              <b perceived="true">{score >= 80 ? 'Strong' : score >= 60 ? 'Moderate' : 'At Risk'}</b>
              <span>Risk score</span>
            </div>
          </div>
        </div>

        {/* Meter */}
        <div className="meter">
          <div style={{ width: `${clamp(score)}%` }} />
        </div>

        {/* Coverage breakdown */}
        <div className="coverGrid">
          <CoverItem label="Phishing" value={coverage.phishing} />
          <CoverItem label="Malware" value={coverage.malware} />
          <CoverItem label="Account Takeover" value={coverage.accountTakeover} />
          <CoverItem label="Fraud & Abuse" value={coverage.fraud} />
        </div>
      </div>

      {/* RIGHT: Radar / visualization */}
      <div className="postureCard radarBox">
        <div className="radar" />
      </div>

    </div>
  );
}

/* ---------- helpers ---------- */

function CoverItem({ label, value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="coverItem">
      <div className="coverItemTop">
        <b>{label}</b>
        <small>{pct}%</small>
      </div>
      <div className="coverBar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
