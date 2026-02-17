// frontend/src/App.jsx
// FULL ROLE-STRUCTURED ROUTING — GLOBAL CONTROL ADDED

import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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

/* ================= SHARED PAGES ================= */

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

/* ================= ADMIN GLOBAL ================= */

import GlobalControl from "./pages/admin/GlobalControl.jsx";

/* ========================================================= */

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function RoleGuard({ user, ready, allow, children }) {
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user.role);
  const allowed = allow.map(normalizeRole);

  if (!allowed.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getSavedUser();
    setUser(stored || null);
    setReady(true);
  }, []);

  function defaultRedirect() {
    if (!user) return "/login";

    switch (normalizeRole(user.role)) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      case "company":
        return "/company";
      case "small_company":
        return "/small-company";
      case "individual":
        return "/user";
      default:
        return "/login";
    }
  }

  if (!ready) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin/*"
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

          {/* NEW */}
          <Route path="global" element={<GlobalControl />} />
        </Route>

        {/* MANAGER */}
        <Route
          path="/manager/*"
          element={
            <RoleGuard user={user} ready={ready} allow={["manager", "admin"]}>
              <ManagerLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Posture />} />
          <Route path="assets" element={<Assets />} />
          <Route path="threats" element={<Threats />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="vulnerabilities" element={<Vulnerabilities />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="trading" element={<TradingRoom />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* COMPANY */}
        <Route
          path="/company/*"
          element={
            <RoleGuard user={user} ready={ready} allow={["company", "admin", "manager"]}>
              <CompanyLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Posture />} />
          <Route path="assets" element={<Assets />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* SMALL COMPANY */}
        <Route
          path="/small-company/*"
          element={
            <RoleGuard user={user} ready={ready} allow={["small_company", "admin", "manager"]}>
              <SmallCompanyLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Posture />} />
          <Route path="assets" element={<Assets />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* USER */}
        <Route
          path="/user/*"
          element={
            <RoleGuard user={user} ready={ready} allow={["individual", "admin", "manager"]}>
              <UserLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Posture />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to={defaultRedirect()} replace />} />

      </Routes>
    </BrowserRouter>
  );
}
