import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  getToken,
  getSavedUser,
  clearToken,
  clearUser,
} from "../../lib/api.js";

/*
  Enterprise Tools Governance Context
  v3 — Token Safe • 401 Storm Guard • Drift Safe • Auto Sync Hardened
*/

const ToolContext = createContext(null);

export function ToolProvider({ children }) {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [autodev, setAutodev] = useState(null);

  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  // Prevent multiple forced redirects
  const redirectingRef = useRef(false);

  /* =========================================================
     SAFE FETCH WRAPPER (HARDENED)
  ========================================================= */

  async function safeFetch(url, options = {}) {
    const token = getToken();

    const headers = {
      ...(options.headers || {}),
    };

    // Only attach Authorization if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;

        clearToken();
        clearUser();

        window.location.href = "/login";
      }

      return null;
    }

    return res;
  }

  /* =========================================================
     LOAD USER
  ========================================================= */

  function loadUser() {
    const stored = getSavedUser();
    if (stored) setUser(stored);
  }

  /* =========================================================
     LOAD TOOL CATALOG
  ========================================================= */

  async function loadTools() {
    const res = await safeFetch(`${base}/api/tools/catalog`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setTools(data.tools || []);
  }

  /* =========================================================
     LOAD MY REQUESTS
  ========================================================= */

  async function loadMyRequests() {
    const res = await safeFetch(`${base}/api/tools/requests/mine`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setMyRequests(data.requests || []);
  }

  /* =========================================================
     LOAD INBOX
  ========================================================= */

  async function loadInbox() {
    const res = await safeFetch(`${base}/api/tools/requests/inbox`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setInbox(data.inbox || []);
  }

  /* =========================================================
     LOAD AUTODEV STATUS
  ========================================================= */

  async function loadAutodev() {
    const res = await safeFetch(`${base}/api/autoprotect/status`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setAutodev(data.autodev);
  }

  /* =========================================================
     REQUEST TOOL
  ========================================================= */

  async function requestTool(toolId, note = "") {
    const res = await safeFetch(`${base}/api/tools/request/${toolId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });

    if (!res) return;

    const data = await res.json();
    if (data.ok) {
      await loadMyRequests();
      await loadTools();
      return data;
    }
  }

  /* =========================================================
     INITIALIZE
  ========================================================= */

  async function initialize() {
    setLoading(true);

    loadUser();
    await loadTools();
    await loadMyRequests();
    await loadInbox();
    await loadAutodev();

    setLoading(false);
  }

  useEffect(() => {
    initialize();

    // Auto-refresh every 30s (grant expiration sync)
    const interval = setInterval(() => {
      loadTools();
      loadMyRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  function getTool(toolId) {
    return tools.find((t) => t.id === toolId);
  }

  function hasToolAccess(toolId) {
    const tool = getTool(toolId);
    return tool?.accessible === true;
  }

  function toolRequiresApproval(toolId) {
    const tool = getTool(toolId);
    return tool?.requiresApproval === true;
  }

  function hasActiveGrant(toolId) {
    const tool = getTool(toolId);
    return tool?.hasActiveGrant === true;
  }

  function subscriptionLocked() {
    const s = String(user?.subscriptionStatus || "").toLowerCase();
    return s === "locked" || s === "past_due";
  }

  function normalizeRole() {
    return String(user?.role || "").toLowerCase();
  }

  function isAdmin() {
    return normalizeRole() === "admin";
  }

  function isManager() {
    return normalizeRole() === "manager";
  }

  function isCompany() {
    return normalizeRole() === "company" ||
           normalizeRole() === "small_company";
  }

  function isIndividual() {
    return normalizeRole() === "individual";
  }

  /* ========================================================= */

  return (
    <ToolContext.Provider
      value={{
        loading,
        user,
        tools,
        myRequests,
        inbox,
        autodev,

        refresh: initialize,
        requestTool,

        hasToolAccess,
        toolRequiresApproval,
        hasActiveGrant,
        subscriptionLocked,

        isAdmin,
        isManager,
        isCompany,
        isIndividual,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
}

export function useTools() {
  return useContext(ToolContext);
}
