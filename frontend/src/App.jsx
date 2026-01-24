import React, { useEffect, useMemo, useState } from 'react';
import {
  api,
  setToken,
  clearToken,
  getSavedUser,
  saveUser,
  clearUser,
  getToken,
} from './lib/api.js';

import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import Manager from './pages/Manager.jsx';
import Company from './pages/Company.jsx';
import Individual from './pages/Individual.jsx';
import Trading from './pages/Trading.jsx';

// ✅ Use your GitHub-hosted logo (same one used for watermark)
const AUTOSHIELD_LOGO_URL =
  'https://github.com/user-attachments/assets/0895f9e4-83c4-4088-8658-7a6aeb728af2';

function Brand(){
  return (
    <div className="brand">
      <div className="logo" aria-hidden="true"></div>
      <div className="brandTitle"><b>AutoShield</b><span>TECH</span></div>
    </div>
  );
}

export default function App(){
  const [user, setUser] = useState(() => getSavedUser());
  const [view, setView] = useState('dashboard'); // dashboard | trading
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    // If token exists but user isn't saved, we can't restore fully without a /me endpoint.
    // Keep it simple: user is stored locally on login.
    const t = getToken();
    if (t && !user) {
      setBootError('Session token found but no user profile saved. Please sign in again.');
      clearToken();
    }
  }, []);

  const onLogin = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    saveUser(res.user);
    setUser(res.user);
    setView('dashboard');
  };

  const signOut = () => {
    clearToken();
    clearUser();
    setUser(null);
    setView('dashboard');
  };

  if (!user) {
    return (
      <div className="container">
        {/* ✅ fixed corner logo (shows on login too) */}
        <div className="autoshield-corner-logo" aria-label="AutoShield Tech">
          <img src={AUTOSHIELD_LOGO_URL} alt="AutoShield Tech Logo" />
        </div>

        <div className="nav">
          <Brand />
          <small>Security + trading, one command center</small>
        </div>

        {bootError && (
          <div className="card" style={{borderColor:'rgba(255,180,0,.5)'}}>
            <b>Note:</b> {bootError}
          </div>
        )}

        <Login onLogin={onLogin} />
      </div>
    );
  }

  const autoprotectEnabled = !!user.autoprotectEnabled;

  const dashboardPage = useMemo(() => {
    if (user.mustResetPassword) {
      return (
        <div className="card">
          <h2>Security reset required</h2>
          <p>Your account requires a password reset before you can continue.</p>
          <p><small>Ask an Admin to reset your password, or use the reset flow if enabled for your account.</small></p>
          <div style={{height:10}} />
          <button onClick={signOut}>Back to login</button>
        </div>
      );
    }
    if (user.role === 'Admin') return <Admin user={user} />;
    if (user.role === 'Manager') return <Manager user={user} />;
    if (user.role === 'Company') return <Company user={user} />;
    return <Individual user={user} />;
  }, [user]);

  const page = view === 'trading'
    ? <Trading user={user} />
    : dashboardPage;

  return (
    <div className="container">
      {/* ✅ fixed corner logo (shows everywhere) */}
      <div className="autoshield-corner-logo" aria-label="AutoShield Tech">
        <img src={AUTOSHIELD_LOGO_URL} alt="AutoShield Tech Logo" />
      </div>

      <div className="nav">
        <Brand />
        <div className="actions" style={{maxWidth:700}}>
          <button className={view==='dashboard'?'active':''} onClick={()=>setView('dashboard')}>Cybersecurity</button>
          <button className={view==='trading'?'active':''} onClick={()=>setView('trading')}>Trading</button>

          <span className="badge">{user.role}</span>
          <span className={`badge ${user.subscriptionStatus==='Active'?'ok':(user.subscriptionStatus==='PastDue'?'warn':'danger')}`}>
            {user.subscriptionStatus}
          </span>
          {autoprotectEnabled && <span className="badge ok">AutoProtect</span>}

          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

      {page}
    </div>
  );
}
