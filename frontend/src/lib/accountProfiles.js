/* =========================================================
   AUTOSHIELD ACCOUNT PROFILES — BASELINE (LOCKED)
   File: frontend/src/lib/accountProfiles.js

   Purpose:
   - Defines account types and operational limits
   - Enforces Small Company constraints
   - Controls upgrade eligibility
   - Prevents role abuse and feature leakage

   ⚠️ NO UI
   ⚠️ NO API CALLS
   ⚠️ NO BUSINESS EXECUTION
   ========================================================= */

import { AccountType } from "./permits";

/* =============================
   ACCOUNT PROFILES
   ============================= */

export const AccountProfiles = {
  [AccountType.INDIVIDUAL]: {
    label: "Individual",
    description:
      "Single professional serving one company at a time.",

    limits: {
      maxCompaniesServed: 1,
      maxActiveTasks: 1,
      maxEmployees: 0,
    },

    features: {
      posture: true,
      assets: true,
      threats: true,
      incidents: true,
      vulnerabilities: true,
      compliance: false,
      policies: false,
      reports: true,
    },

    upgradeOptions: ["autodev"],
  },

  [AccountType.SMALL_COMPANY]: {
    label: "Small Company",
    description:
      "Growing organization with limited workforce and scope.",

    limits: {
      maxEmployees: 5,
      maxManagers: 1,
      maxProjects: 3,
    },

    features: {
      posture: true,
      assets: true,
      threats: true,
      incidents: true,
      vulnerabilities: true,
      compliance: false,
      policies: false,
      reports: true,
    },

    restrictions: {
      autodevAllowed: false,
    },

    upgradeOptions: ["company"],
  },

  [AccountType.COMPANY]: {
    label: "Company",
    description:
      "Full organization with internal security workforce.",

    limits: {
      maxEmployees: "unlimited",
      maxManagers: "unlimited",
      maxProjects: "unlimited",
    },

    features: {
      posture: true,
      assets: true,
      threats: true,
      incidents: true,
      vulnerabilities: true,
      compliance: true,
      policies: true,
      reports: true,
    },

    restrictions: {
      autodevAllowed: false,
    },

    upgradeOptions: [],
  },
};

/* =============================
   HELPERS
   ============================= */

export function getAccountProfile(type) {
  return AccountProfiles[type] || null;
}

export function canUpgradeTo(type, target) {
  const profile = AccountProfiles[type];
  if (!profile) return false;
  return profile.upgradeOptions.includes(target);
}

export function isSmallCompany(type) {
  return type === AccountType.SMALL_COMPANY;
}

export function isIndividual(type) {
  return type === AccountType.INDIVIDUAL;
}
