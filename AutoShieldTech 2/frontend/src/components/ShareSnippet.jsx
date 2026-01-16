import React from 'react';
export default function ShareSnippet({text}){const share=async()=>{try{if(navigator.share){await navigator.share({text});}else{await navigator.clipboard.writeText(text);alert('Copied. Paste into email/message.');}}catch{}};return <button onClick={share} title='Share'>🔗 Share</button>;}
