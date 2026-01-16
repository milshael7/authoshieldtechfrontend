import React from 'react';
export default function ReadAloud({text}){const speak=()=>{if(!('speechSynthesis'in window))return alert('Read aloud not supported.');const u=new SpeechSynthesisUtterance(text);u.rate=1.0;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);};return <button onClick={speak} title='Read aloud'>🔊 Read aloud</button>;}
