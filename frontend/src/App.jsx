// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { getSavedUser } from "./lib/api.js";

// Layouts
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import CompanyLayout from "./layouts/CompanyLayout.jsx";
import SmallCompanyLayout from "./layouts/SmallCompanyLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

// Public Pages
import Landing from "./pages/public/Landing.jsx";
import Pricing from "./pages/public/Pricing.jsx";
import Signup from "./pages/public/Signup.jsx";

// Admin Pages
import AdminPricing from "./pages/admin/AdminPricing.jsx";

// Auth / App Pages
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
   ROLE GUARDS — SAFE & PUBLIC-AWARE
   ========================================================= */

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

function RequireAdmin({ children }) {
  const user = getSavedUser();
  if (!user) return <Navigate to="/login" replace />;

  if (String(user.role || "").toLowerCase() !== "admin") {
    return <Navigate to="/404" replace />;
  }

  return children;
}

/* =========================================================
   ROUTER CORE (PUBLIC-SAFE)
   ========================================================= */

function AppRoutes({ user }) {
  const location = useLocation();
  const role = String(user?.role || "").toLowerCase();

  const isPublicPath =
    location.pathname === "/" ||
    location.pathname.startsWith("/pricing") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/login");

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
        <Route
          path="pricing"
          element={
            <RequireAdmin>
              <AdminPricing />
            </RequireAdmin>
          }
        />
      </Route>

      {/* ================= MANAGER ================= */}
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

      {/* ================= COMPANY ================= */}
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

      {/* ================= SMALL COMPANY ================= */}
      <Route
        path="/small-company/*"
        element={
          <RequireRole allow={["small_company"]}>
            <SmallCompanyLayout />
          </RequireRole>
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
          <RequireRole allow={["individual", "user"]}>
            <UserLayout />
          </RequireRole>
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
          isPublicPath ? (
            <Navigate to="/" replace />
          ) : !user ? (
            <Navigate to="/login" replace />
          ) : role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : role === "manager" ? (
            <Navigate to="/manager" replace />
          ) : role === "company" ? (
            <Navigate to="/company" replace />
          ) : role === "small_company" ? (
            <Navigate to="/small-company" replace />
          ) : (
            <Navigate to="/user" replace />
          )
        }
      />
    </Routes>
  );
}

/* =========================================================
   APP ROOT
   ========================================================= */

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

  return (
    <BrowserRouter>
      <AppRoutes user={user} />
    </BrowserRouter>
  );
}
