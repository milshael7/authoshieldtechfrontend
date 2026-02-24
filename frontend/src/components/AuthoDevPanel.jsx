import React, { useEffect, useMemo, useRef, useState } from "react";
import { readAloud } from "./ReadAloud";

const MAX_MESSAGES = 50;

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
    safeSet(storageKey,JSON.stringify({messages}));
  },[messages,storageKey]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  function startListening(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
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
    const text=input.trim();
    if(!text||loading) return;
    if(listening) stopListening();

    setMessages(m=>[...m.slice(-MAX_MESSAGES+1),{role:"user",text}]);
    setInput("");
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
      const reply=data?.reply||"Assistant unavailable.";
      setMessages(prev=>[...prev.slice(-MAX_MESSAGES+1),{role:"ai",text:reply}]);
    }catch{
      setMessages(prev=>[...prev.slice(-MAX_MESSAGES+1),{role:"ai",text:"Assistant unavailable."}]);
    }finally{
      setLoading(false);
    }
  }

  async function sendFeedback(type,message){
    try{
      await fetch("/api/ai/feedback",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type,message})
      });
    }catch{}
  }

  function resendMessage(text){
    setInput(text);
    sendMessage();
  }

  function shareMessage(text){
    if(navigator.share){
      navigator.share({title:"AutoShield AI",text});
    }else{
      navigator.clipboard?.writeText(text);
    }
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{fontSize:13,opacity:.6,marginBottom:12}}>{title}</div>

      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:18}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{
              maxWidth:"75%",
              padding:"12px 16px",
              borderRadius:16,
              background:m.role==="user"
                ?"linear-gradient(135deg,#5EC6FF,#7aa2ff)"
                :"rgba(255,255,255,.06)"
            }}>
              {m.text}
            </div>

            {m.role==="ai" && (
              <div style={{display:"flex",gap:12,marginTop:8}}>
                <IconButton onClick={()=>readAloud(m.text)}>🔊</IconButton>
                <IconButton onClick={()=>navigator.clipboard?.writeText(m.text)}>📋</IconButton>
                <IconButton onClick={()=>sendFeedback("positive",m.text)}>👍</IconButton>
                <IconButton onClick={()=>sendFeedback("negative",m.text)}>👎</IconButton>
                <IconButton onClick={()=>resendMessage(m.text)}>🔄</IconButton>
                <IconButton onClick={()=>shareMessage(m.text)}>📤</IconButton>
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
        <button onClick={listening?stopListening:startListening}>🎤</button>
        <div style={{width:1,height:24,background:"rgba(255,255,255,.2)"}}/>
        <textarea
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff"}}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={(e)=>{
            if(e.key==="Enter"&&!e.shiftKey){
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}

const IconButton = ({ children, onClick }) => (
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>
    {children}
  </button>
);
