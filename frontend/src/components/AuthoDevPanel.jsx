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

  /* ================= VOICE ================= */

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

  /* ================= ACTIONS ================= */

  async function copyText(text){
    try{await navigator.clipboard.writeText(text);}catch{}
  }

  async function shareText(text){
    if(!navigator.share) return copyText(text);
    try{await navigator.share({text});}catch{}
  }

  function setReaction(index,type){
    setMessages(m=>m.map((msg,i)=>
      i===index?{...msg,reaction:type}:msg
    ));
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

            {m.role==="ai"&&(
              <div className="advisor-actions">

                {/* Speaker */}
                <button className="icon-btn" onClick={()=>readAloud(m.speakText)} title="Read">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <path d="M19 5a7 7 0 0 1 0 14"/>
                  </svg>
                </button>

                {/* Thumbs Up */}
                <button
                  className={`icon-btn ${m.reaction==="up"?"active":""}`}
                  onClick={()=>setReaction(i,"up")}
                  title="Helpful"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 9V5a3 3 0 0 0-6 0v4H4v11h16V9h-6z"/>
                  </svg>
                </button>

                {/* Thumbs Down */}
                <button
                  className={`icon-btn ${m.reaction==="down"?"active":""}`}
                  onClick={()=>setReaction(i,"down")}
                  title="Not helpful"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M10 15v4a3 3 0 0 0 6 0v-4h4V4H4v11h6z"/>
                  </svg>
                </button>

                {/* Regenerate */}
                <button className="icon-btn" onClick={()=>sendMessage(m.text)} title="Regenerate">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                  </svg>
                </button>

                {/* Share */}
                <button className="icon-btn" onClick={()=>shareText(m.text)} title="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
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
              {/* clean mic outline */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>
                <path d="M19 11a7 7 0 0 1-14 0"/>
                <path d="M12 18v4"/>
                <path d="M8 22h8"/>
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
            {/* paper plane */}
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
