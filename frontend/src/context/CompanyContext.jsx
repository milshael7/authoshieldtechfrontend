import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect
} from "react";

const CompanyContext = createContext(null);

const STORAGE_KEY = "as_active_company";

export function CompanyProvider({ children }) {

  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [activeCompanyName, setActiveCompanyName] = useState("All Companies");

  /* ================= RESTORE FROM STORAGE ================= */

  useEffect(() => {

    try {

      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed?.id) {
        setActiveCompanyId(parsed.id);
        setActiveCompanyName(parsed.name || "Company");
      }

    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

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

    setActiveCompanyId(id);
    setActiveCompanyName(name);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id,
        name
      })
    );

  };

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(() => ({

    activeCompanyId,
    activeCompanyName,

    mode,

    setCompany,

    clearCompany: () => {
      setCompany(null);
    }

  }), [activeCompanyId, activeCompanyName, mode]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );

}

/* ================= HOOK ================= */

export function useCompany() {

  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error(
      "useCompany must be used inside CompanyProvider"
    );
  }

  return context;

}
