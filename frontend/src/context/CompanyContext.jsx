import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect
} from "react";

const CompanyContext = createContext(null);

const STORAGE_KEY = "as_active_company";

/* =========================================================
   PROVIDER
========================================================= */

export function CompanyProvider({ children }) {

  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [activeCompanyName, setActiveCompanyName] = useState("All Companies");

  /* ================= RESTORE FROM STORAGE ================= */

  useEffect(() => {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed && parsed.id) {

        setActiveCompanyId(String(parsed.id));
        setActiveCompanyName(parsed.name || "Company");

      }

    } catch {

      console.warn("Company storage corrupted — resetting");
      localStorage.removeItem(STORAGE_KEY);

    }

  }, []);

  /* ================= CROSS TAB SYNC ================= */

  useEffect(() => {

    function handleStorage(e) {

      if (e.key !== STORAGE_KEY) return;

      try {

        const parsed = JSON.parse(e.newValue);

        if (!parsed) {

          setActiveCompanyId(null);
          setActiveCompanyName("All Companies");
          return;

        }

        setActiveCompanyId(parsed.id || null);
        setActiveCompanyName(parsed.name || "Company");

      } catch {}

    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };

  }, []);

  /* ================= MODE ================= */

  const mode = activeCompanyId ? "company" : "global";

  /* ================= SET COMPANY ================= */

  const setCompany = (company) => {

    if (!company) {

      setActiveCompanyId(null);
      setActiveCompanyName("All Companies");

      localStorage.removeItem(STORAGE_KEY);

      return;

    }

    const id = String(company.id);
    const name = company.name || "Company";

    const payload = { id, name };

    setActiveCompanyId(id);
    setActiveCompanyName(name);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      console.warn("Unable to persist company selection");
    }

  };

  /* ================= CLEAR ================= */

  const clearCompany = () => {
    setCompany(null);
  };

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(() => ({

    activeCompanyId,
    activeCompanyName,

    mode,

    setCompany,
    clearCompany

  }), [
    activeCompanyId,
    activeCompanyName,
    mode
  ]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );

}

/* =========================================================
   HOOK
========================================================= */

export function useCompany() {

  const context = useContext(CompanyContext);

  if (!context) {

    throw new Error(
      "useCompany must be used inside CompanyProvider"
    );

  }

  return context;

}
