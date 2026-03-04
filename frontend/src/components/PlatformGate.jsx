import React from "react";
import { Navigate } from "react-router-dom";

function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

const ROLE_HIERARCHY = {
  admin: 5,
  manager: 4,
  company: 3,
  small_company: 2,
  individual: 1,
};

function hasAccess(userRole, allowedRoles) {
  const userLevel = ROLE_HIERARCHY[normalize(userRole)] || 0;

  return allowedRoles.some((role) => {
    const requiredLevel = ROLE_HIERARCHY[normalize(role)] || 0;
    return userLevel >= requiredLevel;
  });
}

function isInactiveSubscription(status) {
  const s = normalize(status);
  return s === "locked" || s === "past due" || s === "past_due";
}

export default function PlatformGate({
  user,
  ready,
  allow,
  requireSubscription = false,
  children,
}) {

  if (!ready) {
    return <div style={{ padding: 40 }}>Initializing platform…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !hasAccess(user.role, allow)) {
    return <Navigate to="/404" replace />;
  }

  if (requireSubscription && isInactiveSubscription(user.subscriptionStatus)) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}
