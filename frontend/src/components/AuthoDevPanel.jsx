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

function copyText(text){
  try{
    navigator.clipboard?.writeText(String(text||""));
  }catch{}
}

export default function AuthoDevPanel({
  title="Advisor",
  endpoint="/api/ai/chat",
  getContext,
}){

  const storageKey=useMemo(()=>getStorageKey(),[]);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);

  const recognitionRef=useRef(null);
  const bottomRef=useRef(null);
  const inactivityTimer=useRef(null);

  /* ================= LOAD ================= */

  useEffect(()=>{
    const raw=safeGet(storageKey);
    if(!raw) return;
    try{
      const parsed=JSON.parse(raw);
      const now=Date.now();
      if(parsed?.lastActive && now-parsed.lastActive>SESSION_TIMEOUT_MS){
        safeRemove(storageKey);
        return;
      }
      setMessages(Array.isArray(parsed?.messages)?parsed.messages:[]);
    }catch{}
  },[storageKey]);

  useEffect(()=>{
    safeSet(storageKey,JSON.stringify({
      messages,
      lastActive:Date.now(),
    }));
  },[messages,storageKey]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  useEffect(()=>{
    if(inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current=setTimeout(()=>{
      setMessages([]);
      safeRemove(storageKey);
    },SESSION_TIMEOUT_MS);
    return ()=>inactivityTimer.current&&clearTimeout(inactivityTimer.current);
  },[messages]);

  /* ================= VOICE (MIC) ================= */

  function startListening(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;

    try{recognitionRef.current?.stop();}catch{}

    const rec=new SR();
    rec.lang="en-US";
    rec.interimResults=true;

    rec.onstart=()=>setListening(true);
    rec.onend=()=>setListening(false);
    rec.onresult=(e)=>{
      const last=e.results?.[e.results.length-1];
      const text=last?.[0]?.transcript||"";
      if(text) setInput(text);
    };

    recognitionRef.current=rec;
    rec.start();
  }

  function stopListening(){
    try{recognitionRef.current?.stop();}catch{}
    setListening(false);
  }

  /* ================= SEND ================= */

  async function sendMessage(regenText=null){
    const messageText=String(regenText||input||"").trim();
    if(!messageText||loading) return;

    if(listening) stopListening();

    if(!regenText){
      setMessages(m=>[
        ...m.slice(-MAX_MESSAGES+1),
        {role:"user",text:messageText,ts:new Date().toLocaleTimeString()}
      ]);
      setInput("");
    }

    setLoading(true);

    try{
      const ctx=typeof getContext==="function"?getContext():{};
      const res=await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        credentials:"include",
        body:JSON.stringify({message:messageText,context:ctx}),
      });

      const data=await res.json().catch(()=>({}));
      const reply=data?.reply||"No response available.";

      setMessages(m=>[
        ...m.slice(-MAX_MESSAGES+1),
        {
          role:"ai",
          text:reply,
          speakText:data?.speakText||reply,
          reaction:null,
          ts:new Date().toLocaleTimeString(),
        },
      ]);
    }catch{
      setMessages(m=>[
        ...m.slice(-MAX_MESSAGES+1),
        {
          role:"ai",
          text:"Assistant unavailable.",
          speakText:"Assistant unavailable.",
          reaction:null,
          ts:new Date().toLocaleTimeString(),
        },
      ]);
    }finally{
      setLoading(false);
    }
  }

  function setReaction(index, value){
    setMessages(prev=>{
      const next=[...prev];
      if(!next[index]) return prev;
      next[index]={...next[index], reaction:value};
      return next;
    });
  }

  /* ================= UI ================= */

  return(
    <div className="advisor-wrap">

      <div className="advisor-miniTitle">
        {title}
      </div>

      <div className="advisor-feed">
        {messages.map((m,i)=>(
          <div key={i} className={`advisor-row ${m.role}`}>
            <div className="advisor-bubble">{m.text}</div>

            {/* ACTIONS (AI ONLY) */}
            {m.role==="ai" && (
              <div
                style={{
                  display:"flex",
                  alignItems:"center",
                  gap:12,
                  marginTop:6,
                  opacity:.58,
                  userSelect:"none",
                }}
              >
                {/* Speaker */}
                <button
                  type="button"
                  title="Read aloud"
                  onClick={()=>readAloud(m.speakText||m.text)}
                  style={iconBtnStyle}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
                    <path d="M18 6a8 8 0 0 1 0 12"/>
                  </svg>
                </button>

                {/* Copy */}
                <button
                  type="button"
                  title="Copy"
                  onClick={()=>copyText(m.text)}
                  style={iconBtnStyle}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>

                {/* Thumbs up */}
                <button
                  type="button"
                  title="Thumbs up"
                  onClick={()=>setReaction(i,"up")}
                  style={{
                    ...iconBtnStyle,
                    opacity: m.reaction==="up" ? 1 : 0.75
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-1 7"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    <path d="M7 11h8a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7"/>
                  </svg>
                </button>

                {/* Thumbs down */}
                <button
                  type="button"
                  title="Thumbs down"
                  onClick={()=>setReaction(i,"down")}
                  style={{
                    ...iconBtnStyle,
                    opacity: m.reaction==="down" ? 1 : 0.75
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l1-7"/>
                    <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
                    <path d="M17 13H9a2 2 0 0 1-2-2l1-7a2 2 0 0 1 2-2h7"/>
                  </svg>
                </button>
              </div>
            )}

            <div className="advisor-ts">{m.ts}</div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div className="advisor-inputBar">
        <div className={`advisor-pill ${listening ? "listening" : ""}`}>

          {/* MIC */}
          {!listening?(
            <button className="advisor-pill-left" onClick={startListening} title="Voice">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>
                <path d="M19 11a7 7 0 0 1-14 0"/>
                <path d="M12 18v4"/>
              </svg>
            </button>
          ):(
            <button className="advisor-pill-left stop" onClick={stopListening} title="Stop">
              <div className="stop-square"/>
            </button>
          )}

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

          {/* SEND */}
          <button
            className="advisor-pill-right"
            onClick={()=>sendMessage()}
            disabled={loading||!input.trim()}
            title="Send"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>

        </div>
      </div>

      {loading && <div className="advisor-loading">Analyzing…</div>}
    </div>
  );
}

const iconBtnStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  color: "rgba(255,255,255,.85)",
  display: "flex",
  alignItems: "center",
};
