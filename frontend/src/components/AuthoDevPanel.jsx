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

/* ================= MAIN COMPONENT ================= */

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
  const [speakingIndex,setSpeakingIndex]=useState(null);

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

  /* ================= SPEECH ================= */

  function handleSpeak(text,index){
    setSpeakingIndex(index);
    readAloud(text,()=>{
      setSpeakingIndex(null);
    });
  }

  /* ================= VOICE INPUT ================= */

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

  async function sendMessage(customText=null, replaceIndex=null){
    const messageText=String(customText ?? input ?? "").trim();
    if(!messageText||loading) return;
    if(listening) stopListening();

    if(replaceIndex===null){
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
      const reply=data?.reply||"Assistant unavailable.";

      setMessages(prev=>{
        const newMsg = {role:"ai",text:reply,ts:new Date().toLocaleTimeString()};
        if(replaceIndex!==null){
          const copy=[...prev];
          copy[replaceIndex]=newMsg;
          return copy;
        }
        return [...prev.slice(-MAX_MESSAGES+1),newMsg];
      });

    }catch{
      setMessages(prev=>[
        ...prev.slice(-MAX_MESSAGES+1),
        {role:"ai",text:"Assistant unavailable.",ts:new Date().toLocaleTimeString()}
      ]);
    }finally{
      setLoading(false);
    }
  }

  function regenerate(index){
    const previousUser=[...messages]
      .slice(0,index)
      .reverse()
      .find(m=>m.role==="user");

    if(previousUser?.text){
      sendMessage(previousUser.text,index);
    }
  }

  function share(text){
    if(navigator.share){
      navigator.share({text}).catch(()=>{});
    }else{
      copyText(text);
    }
  }

  function react(index,type){
    setMessages(prev=>{
      const copy=[...prev];
      copy[index]={...copy[index],reaction:type};
      return copy;
    });
  }

  /* ================= UI ================= */

  return(
    <div style={{
      display:"flex",
      flexDirection:"column",
      height:"100%",
      maxWidth:880,
      margin:"0 auto",
      width:"100%"
    }}>

      <div style={{fontSize:13,opacity:.7,marginBottom:12}}>
        {title}
      </div>

      <div style={{
        flex:1,
        overflowY:"auto",
        display:"flex",
        flexDirection:"column",
        gap:18,
        paddingRight:4
      }}>
        {messages.map((m,i)=>(
          <div key={i} style={{
            display:"flex",
            flexDirection:"column",
            alignItems:m.role==="user"?"flex-end":"flex-start"
          }}>

            <div style={{
              maxWidth:"75%",
              padding:"12px 16px",
              borderRadius:16,
              lineHeight:1.4,
              background:m.role==="user"
                ?"linear-gradient(135deg,#5EC6FF,#7aa2ff)"
                :"rgba(255,255,255,.06)",
              color:"#fff",
              position:"relative"
            }}>
              {m.text}

              {speakingIndex===i && (
                <div style={{
                  position:"absolute",
                  bottom:6,
                  right:8,
                  display:"flex",
                  gap:2
                }}>
                  {[...Array(6)].map((_,n)=>(
                    <div key={n} style={{
                      width:2,
                      height:6,
                      background:"#fff",
                      animation:"pulse 0.8s infinite ease-in-out",
                      animationDelay:`${n*0.1}s`
                    }}/>
                  ))}
                </div>
              )}
            </div>

            {m.role==="ai" && (
              <div style={{
                display:"flex",
                flexWrap:"wrap",
                gap:10,
                marginTop:10,
                opacity:.85
              }}>
                <IconButton onClick={()=>handleSpeak(m.text,i)}><IconSpeaker/></IconButton>
                <IconButton onClick={()=>copyText(m.text)}><IconCopy/></IconButton>
                <IconButton onClick={()=>react(i,"up")}><IconThumbUp/></IconButton>
                <IconButton onClick={()=>react(i,"down")}><IconThumbDown/></IconButton>
                <IconButton onClick={()=>regenerate(i)}><IconRefresh/></IconButton>
                <IconButton onClick={()=>share(m.text)}><IconShare/></IconButton>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div style={{
        marginTop:14,
        padding:"8px 12px",
        borderRadius:999,
        background:"rgba(255,255,255,0.05)",
        display:"flex",
        alignItems:"center",
        gap:10
      }}>

        {!listening?
          <CircleButton onClick={startListening}><IconMic/></CircleButton>
          :
          <CircleButton onClick={stopListening}><IconStop/></CircleButton>
        }

        <textarea
          style={{
            flex:1,
            background:"transparent",
            border:"none",
            outline:"none",
            color:"#fff",
            resize:"none",
            fontSize:14
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

        <CircleButton onClick={()=>sendMessage()} white>
          <IconSend/>
        </CircleButton>

      </div>

      <style>{`
        @keyframes pulse {
          0% { height: 4px; }
          50% { height: 14px; }
          100% { height: 4px; }
        }
      `}</style>

    </div>
  );
}

/* ================= BUTTONS ================= */

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
    width:40,
    height:40,
    minWidth:40,
    minHeight:40,
    borderRadius:"50%",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    border:"none",
    cursor:"pointer",
    background:white ? "#fff" : "rgba(255,255,255,0.08)"
  }}>
    {children}
  </button>
);

/* ================= ICONS ================= */

const baseIconProps = {
  width:22,
  height:22,
  fill:"none",
  stroke:"#fff",
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
<div style={{width:18,height:18,background:"#c33",borderRadius:4}}/>
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
<svg viewBox="0 0 24 24"
  width="20"
  height="20"
  fill="none"
  stroke="#000"
  strokeWidth="1.8"
  strokeLinecap="round"
  strokeLinejoin="round"
>
<path d="M22 2L11 13"/>
<path d="M22 2L15 22l-4-9-9-4 20-7z"/>
</svg>
);
