import React, { useEffect, useMemo, useRef, useState } from "react";

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
  const [transcriptBuffer,setTranscriptBuffer]=useState("");
  const [volume,setVolume]=useState(0);

  const recognitionRef=useRef(null);
  const feedRef=useRef(null);
  const textareaRef=useRef(null);
  const audioRef=useRef(null);

  /* ================= LOAD HISTORY ================= */

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
    if(feedRef.current){
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  },[messages]);

  useEffect(()=>{
    const el=textareaRef.current;
    if(!el) return;
    el.style.height="auto";
    el.style.height=Math.min(el.scrollHeight,140)+"px";
  },[input]);

  /* ================= REAL MIC ANALYZER ================= */

  async function setupAudioAnalyzer(stream){
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);
    analyser.fftSize = 256;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function tick(){
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for(let i=0;i<dataArray.length;i++){
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setVolume(avg);
      if(listening){
        requestAnimationFrame(tick);
      }
    }

    tick();

    audioRef.current = { audioContext, analyser };
  }

  /* ================= VOICE INPUT ================= */

  async function startListening(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return;

    try{ recognitionRef.current?.stop(); }catch{}

    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    setupAudioAnalyzer(stream);

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;

    rec.onstart = () => {
      setListening(true);
      setTranscriptBuffer("");
    };

    rec.onend = () => {
      setListening(false);
      setVolume(0);
    };

    rec.onresult = (e) => {
      let transcript="";
      for(let i=0;i<e.results.length;i++){
        transcript+=e.results[i][0].transcript;
      }
      setTranscriptBuffer(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening(){
    try{ recognitionRef.current?.stop(); }catch{}
    setListening(false);
    setVolume(0);

    if(transcriptBuffer){
      setInput(transcriptBuffer.trim());
    }
  }

  /* ================= SEND ================= */

  async function sendMessage(){
    const messageText=String(input||transcriptBuffer||"").trim();
    if(!messageText||loading) return;

    if(listening) stopListening();

    setMessages(m=>[
      ...m.slice(-MAX_MESSAGES+1),
      {role:"user",text:messageText}
    ]);

    setInput("");
    setTranscriptBuffer("");
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
        {role:"ai",text:reply}
      ]);

    }catch{
      setMessages(prev=>[
        ...prev.slice(-MAX_MESSAGES+1),
        {role:"ai",text:"Assistant unavailable."}
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

      <div className="advisor-feed" ref={feedRef}>
        {messages.map((m,i)=>(
          <div key={i} style={{
            alignSelf:m.role==="user"?"flex-end":"flex-start",
            maxWidth:"75%",
            padding:"12px 16px",
            borderRadius:16,
            lineHeight:1.4,
            background:m.role==="user"
              ?"linear-gradient(135deg,#5EC6FF,#7aa2ff)"
              :"rgba(255,255,255,.06)"
          }}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="advisor-inputBar">
        <div className="advisor-pill">

          <button
            className="advisor-pill-left"
            onClick={listening ? stopListening : startListening}
          >
            🎤
          </button>

          {!listening ? (
            <textarea
              ref={textareaRef}
              className="advisor-pill-input"
              placeholder="Ask anything"
              value={input}
              rows={1}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{
                if(e.key==="Enter"&&!e.shiftKey){
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          ) : (
            <LiveVisualizer volume={volume}/>
          )}

          <button
            className="advisor-pill-right"
            onClick={sendMessage}
          >
            ➤
          </button>

        </div>
      </div>

    </div>
  );
}

/* ================= VISUALIZER ================= */

const LiveVisualizer = ({ volume }) => {
  const active = volume > 15; // threshold

  return (
    <div style={{
      flex:1,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      gap:3
    }}>
      {[...Array(20)].map((_,i)=>{
        const height = active
          ? 6 + Math.random() * (volume/4)
          : 6;

        return (
          <div key={i} style={{
            width:3,
            height,
            background:"#fff",
            borderRadius:2,
            transition:"height 0.1s ease"
          }}/>
        );
      })}
    </div>
  );
};
