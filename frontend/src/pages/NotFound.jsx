// frontend/src/pages/NotFound.jsx
// AutoShield Tech — Route Safety Page
//
// PURPOSE:
// - Prevent blank / blue-screen confusion
// - Catch routing + role-guard fallthroughs
// - Provide clear recovery path
//
// RULES:
// - No auth logic
// - No redirects
// - Visual-only safety net

import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.35))",
          border: "1px solid rgba(255,255,255,.14)",
          borderRadius: 18,
          padding: "36px 28px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: "rgba(122,167,255,.9)",
          }}
        >
          404
        </div>

        <h2 style={{ marginTop: 12 }}>
          Page Not Found
        </h2>

        <p
          className="muted"
          style={{ marginTop: 10, lineHeight: 1.5 }}
        >
          The page you’re trying to reach doesn’t exist, or you don’t have
          permission to access it.
        </p>

        <p
          className="muted"
          style={{ marginTop: 8, fontSize: 13 }}
        >
          This is not a system error. Navigation has been safely halted.
        </p>

        <div
          style={{
            marginTop: 26,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="primary"
            onClick={() => navigate("/")}
            style={{ minWidth: 140 }}
          >
            Go to Home
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{ minWidth: 140 }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
