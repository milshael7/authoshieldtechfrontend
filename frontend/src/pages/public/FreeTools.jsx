// frontend/src/pages/public/FreeTools.jsx
// AutoShield Tech — Front Page (Free Cybersecurity Tools)
// PURPOSE:
// - Trust-first commercial landing
// - Limited free cybersecurity tools
// - Upgrade pathways to pricing/signup
// - Blueprint-aligned visuals
// - No payment logic here

import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function FreeTools() {
  const navigate = useNavigate();

  return (
    <div className="public-page">
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">
          <h1>AutoShield Tech</h1>
          <p className="hero-tagline">
            Professional cybersecurity tools built to defend real businesses.
          </p>

          <div className="hero-actions">
            <button
              className="primary"
              onClick={() => navigate("/signup")}
            >
              Get Started Securely
            </button>

            <button
              className="secondary"
              onClick={() => navigate("/pricing")}
            >
              View Plans
            </button>
          </div>
        </div>

        <div className="hero-visual">
          {/* Blueprint placeholder */}
          <div className="mock-panel">
            <span>Security Posture • Threats • Assets</span>
          </div>
        </div>
      </section>

      {/* ================= FREE TOOLS ================= */}
      <section className="tools">
        <h2>Free Cybersecurity Tools</h2>
        <p className="muted">
          Start protecting your organization with limited access tools.
        </p>

        <div className="tool-grid">
          <ToolCard
            title="External Exposure Scan"
            desc="Identify internet-facing assets and potential entry points."
            action={() => navigate("/signup")}
          />

          <ToolCard
            title="Security Posture Snapshot"
            desc="Get a high-level view of your current security readiness."
            action={() => navigate("/signup")}
          />

          <ToolCard
            title="Threat Awareness Feed"
            desc="See common attack patterns affecting your industry."
            action={() => navigate("/signup")}
          />

          <ToolCard
            title="Risk Indicators"
            desc="Basic risk signals without remediation automation."
            action={() => navigate("/signup")}
          />
        </div>
      </section>

      {/* ================= UPGRADE CTA ================= */}
      <section className="upgrade">
        <h2>Need Full Protection?</h2>
        <p className="muted">
          Upgrade to unlock continuous monitoring, response workflows,
          and advanced security operations.
        </p>

        <button
          className="primary"
          onClick={() => navigate("/pricing")}
        >
          Upgrade & View Plans
        </button>
      </section>

      {/* ================= TRUST ================= */}
      <section className="trust">
        <div className="trust-grid">
          <TrustItem
            title="Built for Professionals"
            text="Designed for real cybersecurity work, not demos."
          />
          <TrustItem
            title="No Automatic Upgrades"
            text="You control when and how your account evolves."
          />
          <TrustItem
            title="Audit-Ready Records"
            text="All security actions are logged and preserved."
          />
        </div>
      </section>

      {/* ================= FOOTER CTA ================= */}
      <section className="footer-cta">
        <p>
          Already know what you need?
        </p>
        <button
          className="secondary"
          onClick={() => navigate("/signup")}
        >
          Create Account
        </button>
      </section>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function ToolCard({ title, desc, action }) {
  return (
    <div className="tool-card">
      <h3>{title}</h3>
      <p className="muted">{desc}</p>
      <button className="link" onClick={action}>
        Unlock Full Access →
      </button>
    </div>
  );
}

function TrustItem({ title, text }) {
  return (
    <div className="trust-item">
      <b>{title}</b>
      <p className="muted">{text}</p>
    </div>
  );
}
