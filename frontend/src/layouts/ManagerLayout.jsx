<nav className="layout-nav">
  <NavLink to="/manager" end onClick={() => setMenuOpen(false)}>
    Security Overview
  </NavLink>

  <NavLink to="/manager/assets" onClick={() => setMenuOpen(false)}>
    Assets
  </NavLink>

  <NavLink to="/manager/threats" onClick={() => setMenuOpen(false)}>
    Threats
  </NavLink>

  <NavLink to="/manager/incidents" onClick={() => setMenuOpen(false)}>
    Incidents
  </NavLink>

  <NavLink to="/manager/vulnerabilities" onClick={() => setMenuOpen(false)}>
    Vulnerabilities
  </NavLink>

  <NavLink to="/manager/reports" onClick={() => setMenuOpen(false)}>
    Reports
  </NavLink>

  <NavLink
    to="/manager/notifications"
    onClick={() => setMenuOpen(false)}
  >
    Notifications
  </NavLink>
</nav>
