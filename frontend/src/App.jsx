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
import Notifications from "./pages/Notifications.jsx";
import NotFound from "./pages/NotFound.jsx";

// ---------------- Role Guard ----------------
function RequireRole({ allow, children }) {
  const user = getSavedUser();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || "").toLowerCase();
  const allowed = allow.map(r => r.toLowerCase());

  if (!allowed.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  return children;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // allow browser to fully restore storage
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
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin/*"
          element={
            <RequireRole allow={["admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="global" />} />
          <Route path="trading" element={<Trading mode="admin" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* MANAGER */}
        <Route
          path="/manager/*"
          element={
            <RequireRole allow={["admin", "manager"]}>
              <ManagerLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="manager" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* COMPANY */}
        <Route
          path="/company/*"
          element={
            <RequireRole allow={["admin", "company"]}>
              <CompanyLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="company" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* USER */}
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

        {/* FALLBACK */}
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
