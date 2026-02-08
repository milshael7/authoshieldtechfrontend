// frontend/src/pages/AttackSurface.jsx
// Attack Surface & Exposure — FINAL BASELINE
// External visibility, attacker-first view

import React from "react";

export default function AttackSurface() {
  return (
    <div className="postureWrap">
      {/* ================= LEFT: EXPOSURE ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Attack Surface</h2>
            <small>What attackers can see and reach</small>
          </div>
        </div>

        <ul className="list" style={{ marginTop: 20 }}>
          <li>
            <span className="dot bad" />
            <div>
              <b>Internet-Facing Server</b>
              <small>Production system exposed to the web</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Cloud Storage Exposure</b>
              <small>Public permissions detected</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Email Domain Reputation</b>
              <small>Potential spoofing risk</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Dark Web Monitoring</b>
              <small>No leaked credentials found</small>
            </div>
          </li>
        </ul>
      </section>

      {/* ================= RIGHT: GUIDANCE ================= */}
      <aside className="postureCard">
        <h3>Exposure Guidance</h3>
        <p className="muted">
          Reduce externally reachable assets first.
        </p>

        <ul className="list">
          <li>
            <span className="dot bad" />
            <div>
              <b>High Priority</b>
              <small>Secure internet-facing systems</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Medium Priority</b>
              <small>Harden cloud permissions</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Monitoring Active</b>
              <small>Continuous external scanning enabled</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Ask the assistant:
          <br />• “What can attackers reach?”
          <br />• “Which exposure is most dangerous?”
        </p>
      </aside>
    </div>
  );
}
