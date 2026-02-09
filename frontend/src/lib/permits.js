/* =========================================================
   AUTOSHIELD PERMIT MATRIX — BASELINE (LOCKED)
   File: frontend/src/lib/permits.js

   Purpose:
   - Centralized permission & capability rules
   - Prevents feature leakage between roles
   - Enforces AutoDev 6.5 usage boundaries
   - Shared reference for frontend & backend

   ⚠️ NO UI
   ⚠️ NO API CALLS
   ⚠️ NO BUSINESS EXECUTION
   ========================================================= */

/* =============================
   ACCOUNT TYPES
   ============================= */

export const AccountType = {
  INDIVIDUAL: "individual",
  SMALL_COMPANY: "small_company",
  COMPANY: "company",
  MANAGER: "manager",
  ADMIN: "admin",
};

/* =============================
   CAPABILITIES
   ============================= */

export const Capability = {
  // Core
  VIEW_POSTURE: "view_posture",
  VIEW_REPORTS: "view_reports",
  RECEIVE_NOTIFICATIONS: "receive_notifications",

  // Workforce
  HIRE_INDIVIDUALS: "hire_individuals",
  ASSIGN_ROLES: "assign_roles",

  // AutoDev
  USE_AUTODEV: "use_autodev",
  RECEIVE_AUTODEV_REPORTS: "receive_autodev_reports",

  // Governance
  COMPLIANCE: "compliance",
  POLICIES: "policies",
  AUDIT: "audit",

  // Platform
  UPGRADE_ACCOUNT: "upgrade_account",
};

/* =============================
   PERMIT MATRIX
   ============================= */

export const PermitMatrix = {
  [AccountType.INDIVIDUAL]: new Set([
    Capability.VIEW_POSTURE,
    Capability.VIEW_REPORTS,
    Capability.RECEIVE_NOTIFICATIONS,

    // AutoDev is ONLY allowed here
    Capability.USE_AUTODEV,
    Capability.RECEIVE_AUTODEV_REPORTS,
  ]),

  [AccountType.SMALL_COMPANY]: new Set([
    Capability.VIEW_POSTURE,
    Capability.VIEW_REPORTS,
    Capability.RECEIVE_NOTIFICATIONS,

    Capability.HIRE_INDIVIDUALS,
    Capability.ASSIGN_ROLES,

    // Upgrade path only
    Capability.UPGRADE_ACCOUNT,
  ]),

  [AccountType.COMPANY]: new Set([
    Capability.VIEW_POSTURE,
    Capability.VIEW_REPORTS,
    Capability.RECEIVE_NOTIFICATIONS,

    Capability.HIRE_INDIVIDUALS,
    Capability.ASSIGN_ROLES,

    Capability.COMPLIANCE,
    Capability.POLICIES,
    Capability.AUDIT,
  ]),

  [AccountType.MANAGER]: new Set([
    Capability.VIEW_POSTURE,
    Capability.VIEW_REPORTS,
    Capability.RECEIVE_NOTIFICATIONS,
    Capability.AUDIT,
  ]),

  [AccountType.ADMIN]: new Set([
    // Admin can see everything but does NOT bypass AutoDev rules
    ...Object.values(Capability),
  ]),
};

/* =============================
   HELPERS
   ============================= */

export function hasCapability(accountType, capability) {
  const set = PermitMatrix[accountType];
  if (!set) return false;
  return set.has(capability);
}

export function canUseAutoDev(accountType) {
  return hasCapability(accountType, Capability.USE_AUTODEV);
}

export function canUpgrade(accountType) {
  return hasCapability(accountType, Capability.UPGRADE_ACCOUNT);
}
