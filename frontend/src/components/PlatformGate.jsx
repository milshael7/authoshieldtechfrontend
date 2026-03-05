// frontend/src/components/PlatformGate.jsx
// PlatformGate — Enterprise Auth Stabilizer v10
// NO REDIRECT LOOPS • REFRESH SAFE • DEEP ROUTE SAFE

import React, { useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const redirectedRef = useRef(false);

  /* ================= WAIT FOR BOOT ================= */
  if (!ready) {
    return <div style={{ padding: 40 }}>Initializing platform…</div>;
  }

  /* ================= SESSION STABILIZATION =================
     IMPORTANT:
     - Allow ONE render where user may be null
     - Prevent redirect loops during refresh
  */
  if (ready && !user) {
    if (redirectedRef.current) {
      return <div style={{ padding: 40 }}>Restoring session…</div>;
    }

    redirectedRef.current = true;

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  /* ================= ROLE ACCESS ================= */
  if (allow && user && !hasAccess(user.role, allow)) {
    return <Navigate to="/404" replace />;
  }

  /* ================= SUBSCRIPTION ================= */
  if (
    requireSubscription &&
    user &&
    isInactiveSubscription(user.subscriptionStatus)
  ) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}
