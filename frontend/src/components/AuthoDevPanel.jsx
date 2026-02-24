import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

const MAX_MESSAGES = 50;

/* ================= STORAGE ================= */

function safeGet(key){ try{return localStorage.getItem(key);}catch{return null;} }
function safeSet(key,val){ try{localStorage.setItem(key,val);}catch{} }

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
  try{ navigator.clipboard?.writeText(String(text||"")); }catch{}
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

  useEffect(()=>{
    const raw=safeGet(storageKey);
    if(!raw) return;
    try{
      const parsed=JSON.parse(raw);
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

  async function sendMessage(){
    const messageText=String(input||"").trim();
    if(!messageText||loading) return;

    if(listening) stopListening();

    setMessages(m=>[
      ...m.slice(-MAX_MESSAGES+1),
      {role:"user",text:messageText,ts:new Date().toLocaleTimeString()}
    ]);
    setInput("");

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
      const reply=data?.reply||"Assistant unavailable.";

      setMessages(prev=>[
        ...prev.slice(-MAX_MESSAGES+1),
        {role:"ai",text:reply,speakText:reply,ts:new Date().toLocaleTimeString()}
      ]);

    }catch{
      setMessages(prev=>[
        ...prev.slice(-MAX_MESSAGES+1),
        {role:"ai",text:"Assistant unavailable.",speakText:"Assistant unavailable.",ts:new Date().toLocaleTimeString()}
      ]);
    }finally{
      setLoading(false);
    }
  }

  return(
    <div className="advisor-wrap">

      <div className="advisor-miniTitle">{title}</div>

      <div className="advisor-feed">
        {messages.map((m,i)=>(
          <div key={i} className={`advisor-row ${m.role}`}>
            <div className="advisor-bubble">{m.text}</div>

            {m.role==="ai" && (
              <div style={{
                display:"inline-flex",
                alignItems:"center",
                gap:6,
                marginTop:8,
                opacity:.85
              }}>
                <IconButton onClick={()=>readAloud(m.text)}><IconSpeaker/></IconButton>
                <IconButton onClick={()=>copyText(m.text)}><IconCopy/></IconButton>
                <IconButton><IconThumbUp/></IconButton>
                <IconButton><IconThumbDown/></IconButton>
                <IconButton><IconRefresh/></IconButton>
                <IconButton><IconShare/></IconButton>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* ===== PILL RESTORED ===== */}

      <div className="advisor-inputBar">
        <div style={{
          display:"flex",
          alignItems:"center",
          gap:8,
          padding:"6px 10px",
          borderRadius:999,
          background:"rgba(255,255,255,0.05)"
        }}>

          {/* MIC CIRCLE */}
          {!listening?(
            <CircleButton onClick={startListening}><IconMic/></CircleButton>
          ):(
            <CircleButton onClick={stopListening}><IconStop/></CircleButton>
          )}

          {/* BARS OR TEXTAREA */}
          {listening ? (
            <VoiceBars/>
          ) : (
            <textarea
              style={{
                flex:1,
                background:"transparent",
                border:"none",
                outline:"none",
                color:"#fff",
                resize:"none"
              }}
              placeholder="Ask anything"
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{
                if(e.key==="Enter"&&!e.shiftKey){
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          )}

          {/* SUBMIT CIRCLE */}
          <CircleButton onClick={sendMessage} white>
            <IconSend/>
          </CircleButton>

        </div>
      </div>

    </div>
  );
}

/* ===== BUTTONS ===== */

const IconButton = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    border:"none",
    background:"transparent",
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    padding:0,
    color:"rgba(255,255,255,.85)"
  }}>
    {children}
  </button>
);

const CircleButton = ({ children, onClick, white }) => (
  <button onClick={onClick} style={{
    width:36,
    height:36,
    minWidth:36,
    minHeight:36,
    borderRadius:"50%",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    border:"none",
    cursor:"pointer",
    background:white ? "#fff" : "rgba(255,255,255,0.08)",
    color:white ? "#000" : "rgba(255,255,255,.9)"
  }}>
    {children}
  </button>
);

/* ===== VOICE BARS ===== */

const VoiceBars = () => (
  <div style={{
    flex:1,
    display:"flex",
    alignItems:"center",
    gap:3,
    height:20
  }}>
    {[...Array(20)].map((_,i)=>(
      <div key={i} style={{
        width:2,
        height:8,
        background:"#fff",
        animation:"pulse 1s infinite ease-in-out",
        animationDelay:`${i*0.05}s`
      }}/>
    ))}
    <style>{`
      @keyframes pulse {
        0% { height: 4px; }
        50% { height: 18px; }
        100% { height: 4px; }
      }
    `}</style>
  </div>
);

/* ===== ICONS 16px ===== */

const baseIconProps = {
  width:16,
  height:16,
  fill:"none",
  stroke:"currentColor",
  strokeWidth:1.8,
  strokeLinecap:"round",
  strokeLinejoin:"round"
};

const IconMic=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>
<path d="M19 11a7 7 0 0 1-14 0"/>
<path d="M12 18v4"/>
</svg>
);

const IconStop=()=>(
<div style={{width:16,height:16,background:"#c33",borderRadius:3}}/>
);

const IconSpeaker=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<path d="M11 5L6 9H2v6h4l5 4V5z"/>
<path d="M15.5 8.5a5 5 0 0 1 0 7"/>
</svg>
);

const IconCopy=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<rect x="9" y="9" width="13" height="13" rx="2"/>
<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>
);

const IconThumbUp=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<path d="M14 9V5a3 3 0 0 0-3-3l-1 7"/>
<path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
<path d="M7 11h8a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7"/>
</svg>
);

const IconThumbDown=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<path d="M10 15v4a3 3 0 0 0 3 3l1-7"/>
<path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
<path d="M17 13H9a2 2 0 0 1-2-2l1-7a2 2 0 0 1 2-2h7"/>
</svg>
);

const IconRefresh=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<polyline points="23 4 23 10 17 10"/>
<path d="M20.49 15A9 9 0 1 1 23 10"/>
</svg>
);

const IconShare=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/>
<polyline points="16 6 12 2 8 6"/>
<line x1="12" y1="2" x2="12" y2="15"/>
</svg>
);

const IconSend=()=>(
<svg viewBox="0 0 24 24" {...baseIconProps}>
<path d="M22 2L11 13"/>
<path d="M22 2L15 22l-4-9-9-4 20-7z"/>
</svg>
);
