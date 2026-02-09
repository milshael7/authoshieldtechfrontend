// frontend/src/pages/public/Landing.jsx
// AutoShield Tech — Public Landing (Commercial + Free Tools)
//
// PURPOSE:
// - First-touch commercial page
// - Trust builder (no pricing pressure)
// - Free, limited cybersecurity tools
// - Soft upgrade paths to Pricing
//
// RULES:
// - NO pricing tables
// - NO signup forms
// - NO AI wording
// - AutoDev 6.5 named correctly
// - Professional, enterprise tone only

import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* ================= HEADER ================= */}
      <header className="public-header">
        <div className="brand">
          {/* Use your provided logo asset here */}
          <img
            src="/logo.png"
            alt="AutoShield Tech"
            className="brand-logo"
          />
          <span className="brand-name">AutoShield Tech</span>
        </div>

        <nav className="public-nav">
          <button onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button
            className="primary"
            onClick={() => navigate("/pricing")}
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* ================= HERO ================= */}
      <section className="hero">
        <h1>
          Professional Cybersecurity Operations
          <br />
          Built for Real Companies
        </h1>

        <p className="muted">
          Visibility, accountability, and protection — designed for
          professionals, not shortcuts.
        </p>

        <div className="hero-actions">
          <button
            className="primary"
            onClick={() => navigate("/pricing")}
          >
            Explore Plans
          </button>
          <button
            onClick={() =>
              document
                .getElementById("free-tools")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Try Free Tools
          </button>
        </div>
      </section>

      {/* ================= FREE TOOLS ================= */}
      <section id="free-tools" className="free-tools">
        <h2>Free Cybersecurity Tools</h2>
        <p className="muted center">
          Limited access. No signup required. Upgrade only if it fits
          your operation.
        </p>

        <div className="tool-grid">
          <div className="tool-card">
            <h3>External Exposure Scan</h3>
            <p className="muted">
              Identify publicly visible risks affecting your organization.
            </p>
            <ul>
              <li>Single asset scan</li>
              <li>Read-only findings</li>
              <li>No historical storage</li>
            </ul>
            <button onClick={() => navigate("/pricing")}>
              Upgrade for Full Coverage
            </button>
          </div>

          <div className="tool-card">
            <h3>Security Posture Snapshot</h3>
            <p className="muted">
              High-level overview of control coverage and gaps.
            </p>
            <ul>
              <li>Basic scoring only</li>
              <li>No remediation workflows</li>
              <li>No execution</li>
            </ul>
            <button onClick={() => navigate("/pricing")}>
              Unlock Full Posture
            </button>
          </div>

          <div className="tool-card">
            <h3>Phishing Risk Check</h3>
            <p className="muted">
              Evaluate exposure to common phishing vectors.
            </p>
            <ul>
              <li>Manual assessment</li>
              <li>No alerting</li>
              <li>No monitoring</li>
            </ul>
            <button onClick={() => navigate("/pricing")}>
              Enable Protection
            </button>
          </div>

          <div className="tool-card">
            <h3>Asset Risk Preview</h3>
            <p className="muted">
              Understand how attackers prioritize assets.
            </p>
            <ul>
              <li>Limited assets</li>
              <li>No correlations</li>
              <li>No incident linkage</li>
            </ul>
            <button onClick={() => navigate("/pricing")}>
              View Full Inventory
            </button>
          </div>
        </div>
      </section>

      {/* ================= PLATFORM PREVIEW ================= */}
      <section className="platform-preview">
        <h2>Inside the Platform</h2>
        <p className="muted center">
          Built to support real cybersecurity work.
        </p>

        <div className="preview-grid">
          <div>
            <h4>Security Posture</h4>
            <p className="muted">
              Continuous visibility into risk and control health.
            </p>
          </div>
          <div>
            <h4>Threats & Incidents</h4>
            <p className="muted">
              Priority-driven detection and response.
            </p>
          </div>
          <div>
            <h4>Reports & Audits</h4>
            <p className="muted">
              Executive-ready reporting with immutable records.
            </p>
          </div>
          <div>
            <h4>AutoDev 6.5</h4>
            <p className="muted">
              Advanced cybersecurity execution and reporting —
              available to individuals only.
            </p>
          </div>
        </div>

        <div className="center">
          <button
            className="primary"
            onClick={() => navigate("/pricing")}
          >
            See Plans & Pricing
          </button>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <ol>
          <li>Evaluate risk using free tools</li>
          <li>Select your role: Individual, Small Company, or Company</li>
          <li>Connect your environment securely</li>
          <li>Operate with full visibility and accountability</li>
        </ol>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="public-footer">
        <p>
          AutoShield Tech is a professional cybersecurity platform.
          Business email required. No automatic upgrades.
        </p>
        <p>
          Pricing and plans are controlled by administrators and
          may change with notification.
        </p>
      </footer>
    </div>
  );
}
