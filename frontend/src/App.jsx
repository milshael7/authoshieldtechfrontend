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

/* ================= APP PAGES ================= */

import Posture from "./pages/Posture.jsx";
import Assets from "./pages/Assets.jsx";
import Threats from "./pages/Threats.jsx";
import Incidents from "./pages/Incidents.jsx";
import Vulnerabilities from "./pages/Vulnerabilities.jsx";
import Compliance from "./pages/Compliance.jsx";
import Policies from "./pages/Policies.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import TradingRoom from "./pages/TradingRoom.jsx";
import VulnerabilityCenter from "./pages/VulnerabilityCenter.jsx";
import NotFound from "./pages/NotFound.jsx";

/* ========================================================= */

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function RoleGuard({ user, ready, allow, children }) {
  if (!ready) return null; // ⛔ block render until hydration finishes
  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user.role);
  const allowed = allow.map(normalizeRole);

  if (!allowed.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

function AppRoutes({ user, ready }) {
  const location = useLocation();

  const isPublicPath = useMemo(() => {
    return (
      location.pathname === "/" ||
      location.pathname.startsWith("/pricing") ||
      location.pathname.startsWith("/signup") ||
      location.pathname.startsWith("/login")
    );
  }, [location.pathname]);

  const role = normalizeRole(user?.role);

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
      {/* PUBLIC */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <RoleGuard user={user} ready={ready} allow={["admin"]}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Posture />} />
        <Route path="assets" element={<Assets />} />
        <Route path="threats" element={<Threats />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="vulnerability-center" element={<VulnerabilityCenter />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="policies" element={<Policies />} />
        <Route path="reports" element={<Reports />} />
        <Route path="trading" element={<TradingRoom />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/manager" element={<ManagerLayout />} />
      <Route path="/company" element={<CompanyLayout />} />
      <Route path="/small-company" element={<SmallCompanyLayout />} />
      <Route path="/user" element={<UserLayout />} />

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

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // 🔥 Hydrate ONCE on initial mount
  useEffect(() => {
    const u = getSavedUser();
    setUser(u || null);
    setReady(true);
  }, []);

  if (!ready) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} ready={ready} />
    </BrowserRouter>
  );
}
