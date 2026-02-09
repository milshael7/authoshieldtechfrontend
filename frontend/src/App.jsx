// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSavedUser } from "./lib/api.js";

// Layouts
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import CompanyLayout from "./layouts/CompanyLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

// Pages
import Login from "./pages/Login.jsx";
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
   ROLE GUARDS — SOC HARDENED
   ========================================================= */

// Generic role guard
function RequireRole({ allow, children }) {
  const user = getSavedUser();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || "").toLowerCase();
  const allowed = allow.map((r) => r.toLowerCase());

  if (!allowed.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

// Admin-only hard guard (governance, compliance, policies)
function RequireAdmin({ children }) {
  const user = getSavedUser();
  if (!user) return <Navigate to="/login" replace />;

  if (String(user.role || "").toLowerCase() !== "admin") {
    return <Navigate to="/404" replace />;
  }

  return children;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getSavedUser();
    setUser(u);
    setReady(true);
  }, []);

  if (!ready) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  const role = String(user?.role || "").toLowerCase();

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/login" element={<Login />} />

        {/* ================= ADMIN — FULL SOC ================= */}
        <Route
          path="/admin/*"
          element={
            <RequireRole allow={["admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="global" />} />
          <Route path="assets" element={<Assets />} />
          <Route path="threats" element={<Threats />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="vulnerabilities" element={<Vulnerabilities />} />

          {/* GOVERNANCE — ADMIN ONLY */}
          <Route
            path="compliance"
            element={
              <RequireAdmin>
                <Compliance />
              </RequireAdmin>
            }
          />
          <Route
            path="policies"
            element={
              <RequireAdmin>
                <Policies />
              </RequireAdmin>
            }
          />

          <Route path="reports" element={<Reports />} />
          <Route path="trading" element={<Trading mode="admin" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= MANAGER — OPERATIONAL SOC ================= */}
        <Route
          path="/manager/*"
          element={
            <RequireRole allow={["admin", "manager"]}>
              <ManagerLayout />
            </RequireRole>
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

        {/* ================= COMPANY — VISIBILITY SOC ================= */}
        <Route
          path="/company/*"
          element={
            <RequireRole allow={["admin", "company"]}>
              <CompanyLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="company" />} />
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
            <RequireRole allow={["individual", "user"]}>
              <UserLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="user" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="/404" element={<NotFound />} />
        <Route
          path="*"
          element={
            <Navigate
              to={
                !user
                  ? "/login"
                  : role === "admin"
                  ? "/admin"
                  : role === "manager"
                  ? "/manager"
                  : role === "company"
                  ? "/company"
                  : "/user"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
