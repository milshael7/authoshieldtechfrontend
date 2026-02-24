import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_MESSAGES = 50;

/* ================= STORAGE ================= */

function safeGet(key){ try{return localStorage.getItem(key);}catch{return null;} }
function safeSet(key,val){ try{localStorage.setItem(key,val);}catch{} }
function safeRemove(key){ try{localStorage.removeItem(key);}catch{} }

function getRoomId(){
  if(typeof window==="undefined") return "root";
  return window.location.pathname.replace(/\/+$/,"")||"root";
}
function getUser(){
  try{return JSON.parse(localStorage.getItem("as_user")||"null");}
  catch{return null;}
}
function getStorageKey(){
  const user=getUser();
  const tenant=user?.companyId||user?.company||"unknown";
  return `authodev.panel.${tenant}.${getRoomId()}`;
}

/* ================= ICONS (MATCH YOUR IMAGE STYLE) ================= */

function IconCopy(){return(
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <rect x="9" y="9" width="13" height="13" rx="2"/>
  <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
</svg>)}

function IconSpeaker(){return(
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <path d="M15 9a4 4 0 0 1 0 6"/>
  <path d="M19 5a8 8 0 0 1 0 14"/>
</svg>)}

function IconThumbUp(){return(
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
  <path d="M5 9h14l-1 9H6L5 9z"/>
</svg>)}

function IconThumbDown(){return(
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="M10 15v4a3 3 0 0 0 6 0v-4"/>
  <path d="M19 15H5l1-9h12l1 9z"/>
</svg>)}

function IconRefresh(){return(
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <polyline points="23 4 23 10 17 10"/>
  <polyline points="1 20 1 14 7 14"/>
  <path d="M3.5 9a9 9 0 0 1 14-3l5 4"/>
  <path d="M20.5 15a9 9 0 0 1-14 3l-5-4"/>
</svg>)}

function IconShare(){return(
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="18" cy="5" r="3"/>
  <circle cx="6" cy="12" r="3"/>
  <circle cx="18" cy="19" r="3"/>
  <path d="M8.6 13.5l6.8 3.9"/>
  <path d="M15.4 6.6l-6.8 3.9"/>
</svg>)}

/* ================= PANEL ================= */

export default function AuthoDevPanel({
  title="Advisor",
  endpoint="/api/ai/chat",
  getContext,
}){

  const storageKey=useMemo(()=>getStorageKey(),[]);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);

  const bottomRef=useRef(null);

  useEffect(()=>{
    const raw=safeGet(storageKey);
    if(!raw) return;
    try{
      const parsed=JSON.parse(raw);
      setMessages(parsed?.messages||[]);
    }catch{}
  },[storageKey]);

  useEffect(()=>{
    safeSet(storageKey,JSON.stringify({messages}));
  },[messages,storageKey]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  async function sendMessage(regenText=null){
    const text=String(regenText||input||"").trim();
    if(!text||loading) return;

    if(!regenText){
      setMessages(m=>[...m,{role:"user",text,ts:new Date().toLocaleTimeString()}]);
      setInput("");
    }

    setLoading(true);

    try{
      const ctx=typeof getContext==="function"?getContext():{};
      const res=await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        credentials:"include",
        body:JSON.stringify({message:text,context:ctx}),
      });

      const data=await res.json().catch(()=>({}));
      const reply=data?.reply||"No response available.";

      setMessages(m=>[
        ...m,
        {role:"ai",text:reply,ts:new Date().toLocaleTimeString()}
      ]);
    }catch{
      setMessages(m=>[
        ...m,
        {role:"ai",text:"Assistant unavailable.",ts:new Date().toLocaleTimeString()}
      ]);
    }finally{
      setLoading(false);
    }
  }

  function copy(text){navigator.clipboard.writeText(text);}
  function speak(text){readAloud(text);}
  function share(text){
    if(navigator.share) navigator.share({text});
    else navigator.clipboard.writeText(text);
  }

  return(
    <div className="advisor-wrap">

      <div className="advisor-miniTitle">{title}</div>

      <div className="advisor-feed">
        {messages.map((m,i)=>(
          <div key={i} className={`advisor-row ${m.role}`}>
            <div className="advisor-bubble">{m.text}</div>
            <div className="advisor-ts">{m.ts}</div>

            {/* 🔥 ACTION BAR (AI ONLY) */}
            {m.role==="ai" && (
              <div style={{
                display:"flex",
                gap:18,
                marginTop:8,
                opacity:.65
              }}>
                <span onClick={()=>copy(m.text)} style={{cursor:"pointer"}}><IconCopy/></span>
                <span onClick={()=>speak(m.text)} style={{cursor:"pointer"}}><IconSpeaker/></span>
                <span style={{cursor:"pointer"}}><IconThumbUp/></span>
                <span style={{cursor:"pointer"}}><IconThumbDown/></span>
                <span onClick={()=>sendMessage(m.text)} style={{cursor:"pointer"}}><IconRefresh/></span>
                <span onClick={()=>share(m.text)} style={{cursor:"pointer"}}><IconShare/></span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div className="advisor-inputBar">
        <div className="advisor-pill">
          <textarea
            className="advisor-pill-input"
            placeholder="Ask anything"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            rows={1}
            onKeyDown={(e)=>{
              if(e.key==="Enter"&&!e.shiftKey){
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            className="advisor-pill-right"
            onClick={()=>sendMessage()}
            disabled={loading||!input.trim()}
          >Send</button>
        </div>
      </div>

      {loading && <div className="advisor-loading">Analyzing…</div>}
    </div>
  );
}
