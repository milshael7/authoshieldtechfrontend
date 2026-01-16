import React, { useState } from 'react';
import { api } from '../lib/api.js';

export default function Login({ onLogin }) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState('login');
  const [resetEmail,setResetEmail]=useState('');
  const [resetPass,setResetPass]=useState('');

  const submit=async(e)=>{e.preventDefault();try{await onLogin(email,password);}catch(err){alert(err.message);}};
  const reset=async(e)=>{e.preventDefault();try{await api.resetPassword(resetEmail,resetPass);alert('Password updated. Now sign in.');setMode('login');}catch(err){alert(err.message);}};

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2>{mode==='login'?'Sign in':'Reset password'}</h2>
          {mode==='login' ? (
            <form onSubmit={submit}>
              <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
              <div style={{height:10}} />
              <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
              <div style={{height:12}} />
              <button type="submit">Sign in</button>
              <div style={{height:10}} />
              <small><a href="#" onClick={(e)=>{e.preventDefault();setMode('reset')}}>Reset password</a> (only if forced)</small>
            </form>
          ) : (
            <form onSubmit={reset}>
              <input placeholder="Email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} />
              <div style={{height:10}} />
              <input type="password" placeholder="New password" value={resetPass} onChange={e=>setResetPass(e.target.value)} />
              <div style={{height:12}} />
              <button type="submit">Set new password</button>
              <div style={{height:10}} />
              <small><a href="#" onClick={(e)=>{e.preventDefault();setMode('login')}}>Back</a></small>
            </form>
          )}
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Trial ($19.99 / 30 days)</h3>
          <small>Text-only experience with Read Aloud. AutoProtect add-on is separate. No “AI” branding shown publicly.</small>
        </div>
      </div>
    </div>
  );
}
