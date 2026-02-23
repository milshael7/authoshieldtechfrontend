// frontend/src/App.jsx
// FULL ROLE-STRUCTURED ROUTING — ADMIN OVERVIEW FIXED
// Executive Command Center Activated

import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  getSavedUser,
  getToken,
  setToken,
  saveUser,
  clearToken,
  clearUser,
} from "./lib/api.js";

import { CompanyProvider } from "./context/CompanyContext";

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

/* ================= SHARED ================= */

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

/* ================= ADMIN ================= */

import AdminOverview from "./pages/admin/AdminOverview.jsx";
import GlobalControl from "./pages/admin/GlobalControl.jsx";

/* ================= COMPANY ================= */

import CompanyDashboardV2 from "./pages/company/CompanyDashboardV2.jsx";

/* ================= USER EXTENSIONS ================= */

import Scans from "./pages/Scans.jsx";
import RunScan from "./pages/RunScan.jsx";
import Billing from "./pages/Billing.jsx";

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
    async function bootAuth() {
      const token = getToken();
      const storedUser = getSavedUser();

      if (!token || !storedUser) {
        setUser(null);
        setReady(true);
        return;
      }

      setUser(storedUser);
      setReady(true);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!res.ok) {
          if (res.status === 401) {
            clearToken();
            clearUser();
            setUser(null);
          }
          return;
        }

        const data = await res.json();

        if (data?.token && data?.user) {
          setToken(data.token);
          saveUser(data.user);
          setUser(data.user);
        }
      } catch {
        console.warn("Silent refresh failed. Keeping session.");
      }
    }

    bootAuth();
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

  if (!ready) {
    return <div style={{ padding: 40 }}>Validating session…</div>;
  }

  return (
    <CompanyProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* ================= ADMIN ================= */}

          <Route
            path="/admin/*"
            element={
              <RoleGuard user={user} ready={ready} allow={["admin"]}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route index element={<AdminOverview />} />
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
            <Route path="global" element={<GlobalControl />} />
          </Route>

          {/* ================= MANAGER ================= */}

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
            <Route index element={<CompanyDashboardV2 />} />
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
            <Route path="scans" element={<Scans />} />
            <Route path="run-scan" element={<RunScan />} />
            <Route path="billing" element={<Billing />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to={defaultRedirect()} replace />} />

        </Routes>
      </BrowserRouter>
    </CompanyProvider>
  );
}
