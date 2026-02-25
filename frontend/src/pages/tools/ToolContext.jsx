import React, { createContext, useContext, useEffect, useState } from "react";

/*
  Enterprise Entitlement Context
  Global Access Control Brain
*/

const ToolContext = createContext(null);

export function ToolProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [autodev, setAutodev] = useState(null);

  /* =========================================================
     LOAD USER (REFRESH TOKEN SAFE)
  ========================================================= */

  async function loadUser() {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (data.token && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error("User load failed", e);
    }
  }

  /* =========================================================
     LOAD TOOL CATALOG
  ========================================================= */

  async function loadTools() {
    try {
      const res = await fetch("/api/tools/catalog", {
        credentials: "include",
      });

      const data = await res.json();

      if (data.ok) {
        setTools(data.tools || []);
      }
    } catch (e) {
      console.error("Tool load failed", e);
    }
  }

  /* =========================================================
     LOAD AUTODEV STATUS
  ========================================================= */

  async function loadAutodev() {
    try {
      const res = await fetch("/api/autoprotect/status", {
        credentials: "include",
      });

      const data = await res.json();

      if (data.ok) {
        setAutodev(data.autodev);
      }
    } catch (e) {
      console.error("Autodev load failed", e);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  async function initialize() {
    setLoading(true);
    await loadUser();
    await loadTools();
    await loadAutodev();
    setLoading(false);
  }

  useEffect(() => {
    initialize();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  function hasToolAccess(toolId) {
    const tool = tools.find((t) => t.id === toolId);
    return tool?.accessible === true;
  }

  function isAdmin() {
    return user?.accountType === "ADMIN";
  }

  function isManager() {
    return user?.accountType === "MANAGER";
  }

  function isCompany() {
    return user?.accountType === "COMPANY";
  }

  function isIndividual() {
    return user?.accountType === "INDIVIDUAL";
  }

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <ToolContext.Provider
      value={{
        loading,
        user,
        tools,
        autodev,

        refresh: initialize,

        hasToolAccess,
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
