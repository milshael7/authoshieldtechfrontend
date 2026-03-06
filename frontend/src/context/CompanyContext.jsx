// frontend/src/context/CompanyContext.jsx
// ==========================================================
// COMPANY CONTEXT — ENTERPRISE HARDENED v18 (SEALED)
// QUIET-BY-DEFAULT • DETERMINISTIC • STORAGE-SAFE
// SINGLE SOURCE OF TRUTH • NO EVENT NOISE • PLATFORM-SAFE
// ==========================================================

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";

/* ================= CONTEXT ================= */

const CompanyContext = createContext(null);

/* ================= CONFIG ================= */

const STORAGE_KEY = "as_active_company";

/* ================= PROVIDER ================= */

export function CompanyProvider({ children }) {
  /* ================= STATE ================= */

  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [activeCompanyName, setActiveCompanyName] =
    useState("All Companies");

  /* ================= REFS ================= */

  const mountedRef = useRef(true);
  const lastSyncRef = useRef(0);

  /* ================= SAFE DESERIALIZE ================= */

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.id) return null;

      return {
        id: String(parsed.id),
        name: parsed.name || "Company",
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  /* ================= BOOT RESTORE ================= */

  useEffect(() => {
    mountedRef.current = true;

    const stored = readStorage();
    if (stored) {
      setActiveCompanyId(stored.id);
      setActiveCompanyName(stored.name);
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ================= CROSS-TAB SYNC =================
     Quiet, deterministic, no echo loops
  ==================================================== */

  useEffect(() => {
    function handleStorage(e) {
      if (e.key !== STORAGE_KEY) return;
      if (!mountedRef.current) return;

      const now = Date.now();
      if (now - lastSyncRef.current < 50) return; // 🔇 echo guard
      lastSyncRef.current = now;

      const parsed = (() => {
        try {
          return e.newValue ? JSON.parse(e.newValue) : null;
        } catch {
          return null;
        }
      })();

      if (!parsed || !parsed.id) {
        setActiveCompanyId(null);
        setActiveCompanyName("All Companies");
        return;
      }

      setActiveCompanyId(String(parsed.id));
      setActiveCompanyName(parsed.name || "Company");
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /* ================= SET COMPANY ================= */

  const setCompany = useCallback((company) => {
    if (!company || !company.id) {
      setActiveCompanyId(null);
      setActiveCompanyName("All Companies");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }

    const payload = {
      id: String(company.id),
      name: company.name || "Company",
    };

    setActiveCompanyId(payload.id);
    setActiveCompanyName(payload.name);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // silent — persistence is best-effort only
    }
  }, []);

  /* ================= CLEAR ================= */

  const clearCompany = useCallback(() => {
    setCompany(null);
  }, [setCompany]);

  /* ================= DERIVED MODE ================= */

  const mode = activeCompanyId ? "company" : "global";

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(
    () => ({
      activeCompanyId,
      activeCompanyName,
      mode,
      setCompany,
      clearCompany,
    }),
    [
      activeCompanyId,
      activeCompanyName,
      mode,
      setCompany,
      clearCompany,
    ]
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error(
      "useCompany must be used inside <CompanyProvider />"
    );
  }
  return ctx;
}
