/**
 * AuthoShield Tech — Official Logo Component (DEPLOY SAFE)
 */

import React from "react";

export default function Logo({
  size = "md",
  variant = "full",
}) {
  const sizes = {
    sm: { icon: 28, font: 15 },
    md: { icon: 38, font: 18 },
    lg: { icon: 52, font: 22 },
  };

  const cfg = sizes[size] || sizes.md;

  return (
    <div
      className="authoshield-logo"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {/* Logo Image (public folder) */}
      <img
        src="/logo.png"
        alt="AuthoShield Tech"
        style={{
          width: cfg.icon,
          height: cfg.icon,
          objectFit: "contain",
        }}
      />

      {variant === "full" && (
        <span
          style={{
            fontSize: cfg.font,
            fontWeight: 800,
            letterSpacing: "0.06em",
            background: "linear-gradient(90deg,#4f8cff,#9cc9ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AuthoShield Tech
        </span>
      )}
    </div>
  );
}
