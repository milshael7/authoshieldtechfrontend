// frontend/src/pages/Pricing.jsx
// Pricing & Plans — AutoShield Tech
// Phase 2: Plans, Limits, Upgrade Paths
//
// RULES:
// - No auto-upgrades
// - No AI wording
// - AutoDev 6.5 = system technology
// - Clear limits & notifications
// - Professional tone only

import React from "react";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="pricing-root">
      {/* ================= HEADER ================= */}
      <section className="pricing-hero">
        <h1>Plans & Pricing</h1>
        <p className="muted">
          Choose the plan that fits your role and scale.
          Upgrade only when you’re ready.
        </p>
      </section>

      {/* ================= PLANS ================= */}
      <section className="pricing-grid">
        {/* ========= INDIVIDUAL ========= */}
        <div className="pricing-card">
          <h2>Individual</h2>
          <p className="price">
            $250 / month
          </p>
          <p className="muted">
            For independent cybersecurity professionals.
          </p>

          <ul>
            <li>✔ Protect multiple companies (1 task per company)</li>
            <li>✔ Full SOC dashboard</li>
            <li>✔ Reports & incident tracking</li>
            <li>✔ Manual security operations</li>
            <li>✖ No team management</li>
          </ul>

          <div className="pricing-note">
            First month onboarding may be discounted.
          </div>

          <button
            className="btn primary"
            onClick={() => navigate("/login")}
          >
            Sign Up
          </button>
        </div>

        {/* ========= SMALL COMPANY ========= */}
        <div className="pricing-card highlight">
          <h2>Small Company</h2>
          <p className="price">
            $350 → $700 / month
          </p>
          <p className="muted">
            For growing businesses with limited teams.
          </p>

          <ul>
            <li>✔ Up to 10–15 users</li>
            <li>✔ Assets, threats, incidents</li>
            <li>✔ Reports & notifications</li>
            <li>✔ Discounted user pricing (80–85%)</li>
            <li>✖ No AutoDev 6.5 access</li>
          </ul>

          <div className="pricing-note">
            Notifications sent when user limit is reached.
            Upgrade optional.
          </div>

          <button
            className="btn primary"
            onClick={() => navigate("/login")}
          >
            Start as Small Company
          </button>
        </div>

        {/* ========= COMPANY ========= */}
        <div className="pricing-card">
          <h2>Company</h2>
          <p className="price">
            $1,000 → $1,500 / month
          </p>
          <p className="muted">
            For established organizations and enterprises.
          </p>

          <ul>
            <li>✔ Unlimited users</li>
            <li>✔ Full SOC visibility</li>
            <li>✔ Team & role management</li>
            <li>✔ Executive & audit reporting</li>
            <li>✖ No AutoDev 6.5 access</li>
          </ul>

          <div className="pricing-note">
            Price adjusts after 6 months with advance notice.
          </div>

          <button
            className="btn primary"
            onClick={() => navigate("/login")}
          >
            Contact / Sign Up
          </button>
        </div>
      </section>

      {/* ================= AUTODEV ================= */}
      <section className="pricing-section">
        <h2>AutoDev 6.5</h2>
        <p className="muted">
          Advanced security automation for individuals only.
        </p>

        <div className="autodev-box">
          <p>
            <b>Intro:</b> $100 (first month)
          </p>
          <p>
            <b>Standard:</b> $450 / month thereafter
          </p>

          <ul>
            <li>✔ Works on defined schedules</li>
            <li>✔ Continues active tasks if cancelled</li>
            <li>✔ Generates step-by-step reports</li>
            <li>✔ Escalates when human action is required</li>
            <li>✔ Full audit & history retention</li>
          </ul>

          <p className="warning">
            AutoDev 6.5 is <b>not available</b> to companies.
          </p>
        </div>
      </section>

      {/* ================= CONTRACTS ================= */}
      <section className="pricing-section">
        <h2>Annual Contracts</h2>
        <p className="muted">
          Available for all plans.
        </p>

        <ul>
          <li>✔ Yearly commitment</li>
          <li>✔ 5% contract premium applied</li>
          <li>✔ Stable pricing & invoicing</li>
          <li>✔ Ideal for long-term operations</li>
        </ul>
      </section>

      {/* ================= CTA ================= */}
      <section className="pricing-cta">
        <h2>Start Secure. Upgrade When Ready.</h2>
        <p>
          No automatic upgrades. No hidden changes.
        </p>

        <div className="cta-actions">
          <button
            className="btn primary"
            onClick={() => navigate("/login")}
          >
            Sign Up
          </button>

          <button
            className="btn ghost"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </section>
    </div>
  );
}
