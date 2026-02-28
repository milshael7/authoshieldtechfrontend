// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import {
  getSavedUser,
  getToken,
  setToken,
  saveUser,
  clearToken,
  clearUser,
} from "./lib/api.js";

import { CompanyProvider } from "./context/CompanyContext";
import { ToolProvider } from "./pages/tools/ToolContext.jsx";
import { SecurityProvider } from "./context/SecurityContext.jsx";

/* LAYOUTS */
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import CompanyLayout from "./layouts/CompanyLayout.jsx";
import SmallCompanyLayout from "./layouts/SmallCompanyLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

/* PUBLIC */
import Landing from "./pages/public/Landing.jsx";
import Pricing from "./pages/public/Pricing.jsx";
import Signup from "./pages/public/Signup.jsx";
import Login from "./pages/Login.jsx";

/* SHARED */
import Intelligence from "./pages/Intelligence.jsx";
import SOC from "./pages/SOC.jsx";
import Assets from "./pages/Assets.jsx";
import Incidents from "./pages/Incidents.jsx";
import Vulnerabilities from "./pages/Vulnerabilities.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import NotFound from "./pages/NotFound.jsx";

/* ADMIN */
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import GlobalControl from "./pages/admin/GlobalControl.jsx";
import AdminCompanies from "./pages/admin/AdminCompanies.jsx";
import AuditExplorer from "./pages/admin/AuditExplorer.jsx";
import AdminToolGovernance from "./pages/admin/AdminToolGovernance.jsx";
import AdminCompanyRoom from "./pages/admin/AdminCompanyRoom.jsx";

/* SECURITY */
import SecurityOverview from "./components/security/SecurityOverview.jsx";
import RiskMonitor from "./pages/RiskMonitor.jsx";
import SessionMonitor from "./pages/SessionMonitor.jsx";
import DeviceIntegrityPanel from "./pages/DeviceIntegrityPanel.jsx";

/* INTERNAL */
import TradingRoom from "./pages/TradingRoom.jsx";

/* ================= HELPERS ================= */

function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

function isInactiveSubscription(status) {
  const s = normalize(status);
  return s === "locked" || s === "past due" || s === "past_due";
}

function RoleGuard({ user, ready, allow, children }) {
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = normalize(user.role);
  const allowed = allow.map(normalize);

  if (!allowed.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

function SubscriptionGuard({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (isInactiveSubscription(user.subscriptionStatus)) {
    return <Navigate to="/pricing" replace />;
  }
  return children;
}

/* ================= ROUTES ================= */

function AppRoutes({ user, ready }) {
  if (!ready) {
    return <div style={{ padding: 40 }}>Initializing platform…</div>;
  }

  return (
    <Routes>
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
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="soc" element={<SOC />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="company/:companyId" element={<AdminCompanyRoom />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="global" element={<GlobalControl />} />
        <Route path="audit" element={<AuditExplorer />} />
        <Route path="tool-governance" element={<AdminToolGovernance />} />
        <Route path="security" element={<SecurityOverview />} />
        <Route path="risk" element={<RiskMonitor />} />
        <Route path="sessions" element={<SessionMonitor />} />
        <Route path="device-integrity" element={<DeviceIntegrityPanel />} />
        <Route path="trading" element={<TradingRoom />} />
      </Route>

      {/* ================= COMPANY ================= */}
      <Route
        path="/company/*"
        element={
          <RoleGuard user={user} ready={ready} allow={["company"]}>
            <SubscriptionGuard user={user}>
              <CompanyLayout />
            </SubscriptionGuard>
          </RoleGuard>
        }
      >
        <Route index element={<SecurityOverview />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="soc" element={<SOC />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="risk" element={<RiskMonitor />} />
        <Route path="sessions" element={<SessionMonitor />} />
        <Route path="device-integrity" element={<DeviceIntegrityPanel />} />
        <Route path="trading" element={<TradingRoom />} />
      </Route>

      {/* ================= MANAGER ================= */}
      <Route
        path="/manager/*"
        element={
          <RoleGuard user={user} ready={ready} allow={["manager"]}>
            <ManagerLayout />
          </RoleGuard>
        }
      >
        <Route index element={<SecurityOverview />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
      </Route>

      {/* ================= SMALL COMPANY ================= */}
      <Route
        path="/small-company/*"
        element={
          <RoleGuard user={user} ready={ready} allow={["small_company"]}>
            <SubscriptionGuard user={user}>
              <SmallCompanyLayout />
            </SubscriptionGuard>
          </RoleGuard>
        }
      >
        <Route index element={<SecurityOverview />} />
      </Route>

      {/* ================= USER ================= */}
      <Route
        path="/user/*"
        element={
          <RoleGuard user={user} ready={ready} allow={["individual"]}>
            <SubscriptionGuard user={user}>
              <UserLayout />
            </SubscriptionGuard>
          </RoleGuard>
        }
      >
        <Route index element={<SecurityOverview />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* ================= MAIN APP ================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  useEffect(() => {
    async function bootAuth() {
      try {
        const token = getToken();
        const storedUser = getSavedUser();

        if (!token || !storedUser) {
          setUser(null);
          setReady(true);
          return;
        }

        const res = await fetch(`${base}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();

        if (data?.token && data?.user) {
          setToken(data.token);
          saveUser(data.user);
          setUser(data.user);
        } else {
          throw new Error("Bad refresh payload");
        }
      } catch {
        clearToken();
        clearUser();
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    bootAuth();
  }, [base]);

  return (
    <CompanyProvider>
      <ToolProvider user={ready ? user : null}>
        <SecurityProvider>
          <BrowserRouter>
            <AppRoutes user={user} ready={ready} />
          </BrowserRouter>
        </SecurityProvider>
      </ToolProvider>
    </CompanyProvider>
  );
}
