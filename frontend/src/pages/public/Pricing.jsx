// frontend/src/pages/public/Pricing.jsx
// AutoShield Tech — Plans & Pricing (UPGRADED)
//
// PURPOSE:
// - Clear, professional pricing
// - Notification-driven upgrade model
// - Admin-controlled pricing (future-ready)
// - Contract-aware (monthly / yearly)
// - NO forced upgrades
// - NO automation wording

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");

  // NOTE:
  // Prices shown here are DISPLAY values only.
  // Actual billing will be controlled by administrators.
  const yearlyNote =
    billing === "yearly"
      ? "Yearly contracts include a 5% contract fee. Pricing confirmed before billing."
      : "Month-to-month. No automatic upgrades.";

  return (
    <div className="pricing-page">
      {/* ================= HEADER ================= */}
      <section className="pricing-header">
        <h1>Plans & Pricing</h1>
        <p className="muted center">
          Transparent pricing. Upgrade only when notified or when you choose.
        </p>

        <div className="billing-toggle">
          <button
            className={billing === "monthly" ? "active" : ""}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={billing === "yearly" ? "active" : ""}
            onClick={() => setBilling("yearly")}
          >
            Yearly Contract
          </button>
        </div>

        <small className="muted center">{yearlyNote}</small>
      </section>

      {/* ================= PLANS ================= */}
      <section className="pricing-grid">
        {/* ===== INDIVIDUAL ===== */}
        <div className="price-card">
          <h2>Individual</h2>
          <p className="price">
            {billing === "monthly"
              ? "$250 / month"
              : "$250 × 12 + 5%"}
          </p>
          <p className="muted">
            For professional cybersecurity practitioners.
          </p>

          <ul>
            <li>Single professional account</li>
            <li>One role per client company</li>
            <li>Core SOC visibility</li>
            <li>Manual cybersecurity operations</li>
            <li>AutoDev 6.5 available as upgrade</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Get Started
          </button>
        </div>

        {/* ===== SMALL COMPANY ===== */}
        <div className="price-card">
          <h2>Small Company</h2>
          <p className="price">
            {billing === "monthly"
              ? "$350 → $700 (growth-based)"
              : "Contract-based + 5%"}
          </p>
          <p className="muted">
            Designed for growing teams with capped user limits.
          </p>

          <ul>
            <li>Up to 10–15 users</li>
            <li>Limited SOC visibility</li>
            <li>No AutoDev 6.5 access</li>
            <li>Monthly upgrade notifications</li>
            <li>Cannot exceed user cap without upgrade</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Start as Small Company
          </button>
        </div>

        {/* ===== COMPANY ===== */}
        <div className="price-card highlight">
          <h2>Company</h2>
          <p className="price">
            {billing === "monthly"
              ? "$1,000 → $1,500 (after 6 months)"
              : "Contract-based + 5%"}
          </p>
          <p className="muted">
            Enterprise-grade cybersecurity operations.
          </p>

          <ul>
            <li>Unlimited users</li>
            <li>Full SOC visibility</li>
            <li>Admin & manager roles</li>
            <li>Incident, threat & asset governance</li>
            <li>No automatic upgrades</li>
          </ul>

          <button onClick={() => navigate("/signup")}>
            Contact & Start
          </button>
        </div>
      </section>

      {/* ================= AUTODEV ================= */}
      <section className="pricing-autodev">
        <h2>AutoDev 6.5</h2>
        <p className="muted center">
          Advanced cybersecurity execution and reporting.
          Available to individuals only.
        </p>

        <div className="price-card wide">
          <p className="price">
            First Month: $100<br />
            Ongoing: $450 / month
          </p>

          <ul>
            <li>Continuous cybersecurity execution</li>
            <li>Scheduled work hours</li>
            <li>Human intervention alerts</li>
            <li>Immutable audit & reporting history</li>
            <li>Owner-branded reports</li>
          </ul>

          <p className="muted">
            AutoDev 6.5 operates continuously and escalates
            when human action is required.
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="public-footer">
        <p>
          Prices shown are subject to administrative control and notification.
          No automatic upgrades. No forced billing changes.
        </p>
      </footer>
    </div>
  );
}
