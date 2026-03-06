// frontend/src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import {
  getSavedUser,
  getToken,
  setToken,
  saveUser,
} from "./lib/api.js";

import { CompanyProvider } from "./context/CompanyContext";
import { ToolProvider } from "./pages/tools/ToolContext.jsx";
import { SecurityProvider } from "./context/SecurityContext.jsx";

import { EventBusProvider } from "./core/EventBus.jsx";
import { AIDecisionProvider } from "./core/AIDecisionBus.jsx";

import BrainAdapter from "./core/BrainAdapter.jsx";
import AutoDevEngine from "./core/AutoDevEngine.jsx";

import PlatformGate from "./components/PlatformGate.jsx";

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
import CorporateEntities from "./pages/admin/CorporateEntities.jsx";
import UserGovernance from "./pages/admin/UserGovernance.jsx";

/* MANAGER */
import ManagerCommand from "./pages/manager/ManagerCommand.jsx";

/* SECURITY */
import SecurityOverview from "./components/security/SecurityOverview.jsx";
import RiskMonitor from "./pages/RiskMonitor.jsx";
import SessionMonitor from "./pages/SessionMonitor.jsx";
import DeviceIntegrityPanel from "./pages/DeviceIntegrityPanel.jsx";

/* TRADING */
import TradingLayout from "./pages/trading/TradingLayout.jsx";

/* ================= ROUTES ================= */

function AppRoutes({ user, ready }) {
  return (
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
          <PlatformGate user={user} ready={ready} allow={["admin"]}>
            <AdminLayout />
          </PlatformGate>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="soc" element={<SOC />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="company/:companyId" element={<AdminCompanyRoom />} />
        <Route path="corporate" element={<CorporateEntities />} />
        <Route path="user-governance" element={<UserGovernance />} />
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
        <Route path="trading/*" element={<TradingLayout />} />
      </Route>

      {/* MANAGER */}
      <Route
        path="/manager/*"
        element={
          <PlatformGate user={user} ready={ready} allow={["manager", "admin"]}>
            <ManagerLayout />
          </PlatformGate>
        }
      >
        <Route index element={<SOC />} />
        <Route path="command" element={<ManagerCommand />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* COMPANY */}
      <Route
        path="/company/*"
        element={
          <PlatformGate
            user={user}
            ready={ready}
            allow={["company", "manager", "admin"]}
            requireSubscription
          >
            <CompanyLayout />
          </PlatformGate>
        }
      >
        <Route index element={<SecurityOverview />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* SMALL COMPANY */}
      <Route
        path="/small-company/*"
        element={
          <PlatformGate user={user} ready={ready} allow={["small_company"]}>
            <SmallCompanyLayout />
          </PlatformGate>
        }
      >
        <Route index element={<SecurityOverview />} />
        <Route path="assets" element={<Assets />} />
        <Route path="incidents" element={<Incidents />} />
      </Route>

      {/* USER */}
      <Route
        path="/user/*"
        element={
          <PlatformGate user={user} ready={ready} allow={["individual"]}>
            <UserLayout />
          </PlatformGate>
        }
      >
        <Route index element={<SecurityOverview />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* ================= MAIN APP ================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const bootedRef = useRef(false);
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    async function bootAuth() {
      try {
        const token = getToken();
        const storedUser = getSavedUser();

        if (!token || !storedUser) {
          setUser(null);
          return;
        }

        const res = await fetch(`${base}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setUser(storedUser);
          return;
        }

        const data = await res.json();
        if (data?.token && data?.user) {
          setToken(data.token);
          saveUser(data.user);
          setUser(data.user);
        } else {
          setUser(storedUser);
        }
      } catch {
        setUser(getSavedUser());
      } finally {
        setReady(true);
      }
    }

    bootAuth();
  }, [base]);

  // 🔇 QUIET MODE: do not start engines until auth is ready
  if (!ready) {
    return <div style={{ padding: 40 }}>Initializing platform…</div>;
  }

  return (
    <EventBusProvider>
      <AIDecisionProvider>
        <BrainAdapter />
        <AutoDevEngine />

        <CompanyProvider>
          <ToolProvider user={user}>
            <SecurityProvider>
              <BrowserRouter>
                <AppRoutes user={user} ready={ready} />
              </BrowserRouter>
            </SecurityProvider>
          </ToolProvider>
        </CompanyProvider>
      </AIDecisionProvider>
    </EventBusProvider>
  );
}
