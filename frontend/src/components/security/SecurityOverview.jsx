import React, { useRef } from "react";
import SecurityRadar from "../components/security/SecurityRadar";
import SecurityToolMarketplace from "../components/security/SecurityToolMarketplace";

export default function SecurityOverview() {
  const radarRef = useRef(null);

  function refreshRadar() {
    if (radarRef.current?.reload) {
      radarRef.current.reload();
    }
  }

  return (
    <div className="postureWrap">
      <SecurityRadar ref={radarRef} />
      <SecurityToolMarketplace onChange={refreshRadar} />
    </div>
  );
}
