// frontend/src/App.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { getSavedUser } from "./lib/api.js";

/* ================= LAYOUTS ================= */

import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import CompanyLayout from "./layouts/CompanyLayout.jsx";
import SmallCompanyLayout from "./layouts/SmallCompanyLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

/* ================= PUBLIC ================= */

import Landing from "./pages/public/Landing.jsx";
import Pricing from "./pages/public/Pricing.jsx";
import Signup from "./pages/public/Signup.jsx";
import Login from "./pages/Login.jsx";

/* ================= ADMIN ================= */

import AdminPricing from "./pages/admin/AdminPricing.jsx";

/* ================= APP PAGES ================= */

import Trading from "./pages/Trading.jsx";
import Posture from "./pages/Posture.jsx";
import Assets from "./pages/Assets.jsx";
import Threats from "./pages/Threats.jsx";
import Incidents from "./pages/Incidents.jsx";
import Vulnerabilities from "./pages/Vulnerabilities.jsx";
import Compliance from "./pages/Compliance.jsx";
import Policies from "./pages/Policies.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import NotFound from "./pages/NotFound.jsx";

/* =========================================================
   ROLE UTILITIES
   ========================================================= */

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function RoleGuard({ user, allow, children }) {
  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user.role);
  const allowed = allow.map(normalizeRole);

  if (!allowed.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

/* =========================================================
   ROUTER CORE
   ========================================================= */

function AppRoutes({ user }) {
  const location = useLocation();
  const role = normalizeRole(user?.role);

  const isPublicPath = useMemo(() => {
    return (
      location.pathname === "/" ||
      location.pathname.startsWith("/pricing") ||
      location.pathname.startsWith("/signup") ||
      location.pathname.startsWith("/login")
    );
  }, [location.pathname]);

  function defaultRedirect() {
    if (!user) return "/login";

    switch (role) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      case "company":
        return "/company";
      case "small_company":
        return "/small-company";
      default:
        return "/user";
    }
  }

  return (
    <Routes>

      {/* ================= PUBLIC ================= */}

      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* ================= ADMIN ================= */}

      <Route
        path="/admin/*"
        element={
          <RoleGuard user={user} allow={["admin"]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Posture scope="global" />} />
        <Route path="assets" element={<Assets />} />
        <Route path="threats" element={<Threats />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="policies" element={<Policies />} />
        <Route path="reports" element={<Reports />} />
        <Route path="trading" element={<Trading mode="admin" />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="pricing" element={<AdminPricing />} />
      </Route>

      {/* ================= MANAGER ================= */}

      <Route
        path="/manager/*"
        element={
          <RoleGuard user={user} allow={["admin", "manager"]}>
            <ManagerLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Posture scope="manager" />} />
        <Route path="assets" element={<Assets />} />
        <Route path="threats" element={<Threats />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ================= COMPANY ================= */}

      <Route
        path="/company/*"
        element={
          <RoleGuard user={user} allow={["admin", "company"]}>
            <CompanyLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Posture scope="company" />} />
        <Route path="assets" element={<Assets />} />
        <Route path="threats" element={<Threats />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ================= SMALL COMPANY ================= */}

      <Route
        path="/small-company/*"
        element={
          <RoleGuard user={user} allow={["small_company"]}>
            <SmallCompanyLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Posture scope="small_company" />} />
        <Route path="assets" element={<Assets />} />
        <Route path="threats" element={<Threats />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ================= USER ================= */}

      <Route
        path="/user/*"
        element={
          <RoleGuard user={user} allow={["individual", "user"]}>
            <UserLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Posture scope="individual" />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ================= FALLBACK ================= */}

      <Route path="/404" element={<NotFound />} />

      <Route
        path="*"
        element={
          isPublicPath
            ? <Navigate to="/" replace />
            : <Navigate to={defaultRedirect()} replace />
        }
      />

    </Routes>
  );
}

/* =========================================================
   APP ROOT
   ========================================================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getSavedUser();
    setUser(u);
    setReady(true);
  }, []);

  if (!ready) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} />
    </BrowserRouter>
  );
}
