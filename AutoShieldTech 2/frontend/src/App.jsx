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

function Brand({ onHome }){
  return (
    <div className="brand" role="button" tabIndex={0}
      onClick={onHome}
      onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') onHome(); }}
      title="Go to Dashboard"
    >
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

  const goHome = () => setView('dashboard');

  if (!user) {
    return (
      <div className="container">
        <div className="nav">
          <Brand onHome={() => {}} />
          {/* removed the placeholder slogan */}
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
      <div className="nav">
        <Brand onHome={goHome} />
        <div className="actions" style={{maxWidth:800}}>
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
