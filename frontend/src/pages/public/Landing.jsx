// frontend/src/pages/public/Landing.jsx
// AutoShield Tech — Public Landing (STABLE + VISIBLE + SAFEGUARDED)

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

export default function Landing() {
  const navigate = useNavigate();

  // ---- SAFETY: guarded scroll (prevents mobile/Safari crashes)
  const scrollToFreeTools = useCallback(() => {
    try {
      const el = document.getElementById("free-tools");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      /* fail silently */
    }
  }, []);

  return (
    <div className="landing-page">
      {/* ================= HEADER ================= */}
      <header className="public-header">
        <div className="brand">
          {/* Text-based logo to avoid missing asset issues */}
          <div
            style={{
              fontWeight: 900,
              letterSpacing: "0.12em",
              color: "#7AA7FF",
            }}
          >
            AUTOSHIELD
          </div>
        </div>

        <nav className="public-nav">
          <button onClick={() => navigate("/login")}>Sign In</button>
          <button className="primary" onClick={() => navigate("/pricing")}>
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
          Visibility, control, and accountability — without shortcuts,
          gimmicks, or uncontrolled automation.
        </p>

        <div className="hero-actions">
          <button className="primary" onClick={() => navigate("/pricing")}>
            Explore Plans
          </button>
          <button onClick={scrollToFreeTools}>
            Try Free Tools
          </button>
        </div>
      </section>

      {/* ================= FREE TOOLS ================= */}
      <section id="free-tools" className="free-tools">
        <h2>Free Cybersecurity Tools</h2>
        <p className="muted center">
          Limited access. No signup required. Upgrade anytime.
        </p>

        <div className="tool-grid">
          {[
            {
              title: "External Exposure Scan",
              desc: "Identify publicly visible risks affecting your organization.",
              items: [
                "1 asset scan",
                "Read-only results",
                "No historical tracking",
              ],
            },
            {
              title: "Security Posture Snapshot",
              desc: "High-level view of security controls and gaps.",
              items: [
                "Basic scoring",
                "No remediation guidance",
                "No automation",
              ],
            },
            {
              title: "Phishing Risk Check",
              desc: "Evaluate exposure to common phishing techniques.",
              items: [
                "Manual assessment",
                "No monitoring",
                "No alerting",
              ],
            },
            {
              title: "Asset Risk Preview",
              desc: "See how attackers prioritize assets.",
              items: [
                "Limited assets",
                "No correlations",
                "No incident linking",
              ],
            },
          ].map((tool) => (
            <div key={tool.title} className="tool-card">
              <h3>{tool.title}</h3>
              <p className="muted">{tool.desc}</p>
              <ul>
                {tool.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <button onClick={() => navigate("/pricing")}>
                Upgrade for Full Access
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PLATFORM PREVIEW ================= */}
      <section className="platform-preview">
        <h2>Inside the Platform</h2>
        <p className="muted center">
          Designed for security professionals — not hobby tools.
        </p>

        <div className="preview-grid">
          <Preview
            title="Security Posture"
            text="Continuous visibility into risk and control health."
          />
          <Preview
            title="Threats & Incidents"
            text="Priority-driven detection and response workflows."
          />
          <Preview
            title="Reports & Audits"
            text="Executive-ready reporting with immutable records."
          />
          <Preview
            title="AutoDev 6.5"
            text="Advanced cybersecurity execution and reporting — available to individuals only."
          />
        </div>

        <div className="center">
          <button className="primary" onClick={() => navigate("/pricing")}>
            View Plans
          </button>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <ol>
          <li>Use free tools to evaluate exposure</li>
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
          Plans and pricing are controlled by administrators and
          subject to notification.
        </p>
      </footer>
    </div>
  );
}

/* ================= SUB COMPONENT ================= */

function Preview({ title, text }) {
  return (
    <div>
      <h4>{title}</h4>
      <p className="muted">{text}</p>
    </div>
  );
}
