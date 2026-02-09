<nav className="layout-nav">
  <NavLink to="/company" end onClick={() => setMenuOpen(false)}>
    Security Overview
  </NavLink>

  <NavLink to="/company/assets" onClick={() => setMenuOpen(false)}>
    Assets
  </NavLink>

  <NavLink to="/company/threats" onClick={() => setMenuOpen(false)}>
    Threats
  </NavLink>

  <NavLink to="/company/incidents" onClick={() => setMenuOpen(false)}>
    Incidents
  </NavLink>

  <NavLink to="/company/reports" onClick={() => setMenuOpen(false)}>
    Reports
  </NavLink>

  <NavLink
    to="/company/notifications"
    onClick={() => setMenuOpen(false)}
  >
    Notifications
  </NavLink>
</nav>
