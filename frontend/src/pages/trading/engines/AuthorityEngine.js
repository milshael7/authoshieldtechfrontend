// AuthorityEngine.js
// Institutional Role-Based Access Control (RBAC)

const roles = {
  owner: {
    canTrade: true,
    canWithdraw: true,
    canModifyRisk: true,
    canManageUsers: true,
  },
  admin: {
    canTrade: true,
    canWithdraw: false,
    canModifyRisk: true,
    canManageUsers: false,
  },
  trader: {
    canTrade: true,
    canWithdraw: false,
    canModifyRisk: false,
    canManageUsers: false,
  },
  viewer: {
    canTrade: false,
    canWithdraw: false,
    canModifyRisk: false,
    canManageUsers: false,
  },
};

export function getRolePermissions(role) {
  return roles[role] || roles.viewer;
}

export function isAuthorized(role, action) {
  const permissions = getRolePermissions(role);
  return permissions[action] || false;
}
