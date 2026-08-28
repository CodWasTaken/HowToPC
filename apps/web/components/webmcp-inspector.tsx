"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { registerHowToPcTools, TOOL_NAMES } from "@howtopc/webmcp";
import type { BuilderSession } from "@/lib/builder-session";
import { createWebMcpBridge } from "@/lib/webmcp-bridge";

interface InspectorProps {
  session:BuilderSession;
  setSession:Dispatch<SetStateAction<BuilderSession>>;
}

type RegistrationStatus="checking"|"registered"|"unsupported"|"error";

export function WebMcpInspector({session,setSession}:InspectorProps) {
  const [status,setStatus]=useState<RegistrationStatus>("checking");
  const sessionRef=useRef(session);
  sessionRef.current=session;

  useEffect(()=>{
    let active=true;
    let controller:AbortController|null=null;
    const bridge=createWebMcpBridge({
      getSession:()=>sessionRef.current,
      setSession:(next)=>{
        sessionRef.current=next;
        setSession(next);
      },
    });
    registerHowToPcTools(bridge).then((created)=>{
      if(!active){created?.abort();return;}
      controller=created;
      setStatus(created?"registered":"unsupported");
    }).catch(()=>{
      if(active)setStatus("error");
    });

    return ()=>{
      active=false;
      controller?.abort();
    };
  },[setSession]);

  const detail=status==="registered"
    ?`${TOOL_NAMES.length} live tools · shared builder session`
    :status==="unsupported"
      ?"Browser WebMCP API unavailable"
      :status==="error"?"Tool registration failed":"Checking browser support";

  return <section className="agent-tools agent-tools-compact" aria-label="WebMCP status">
    <div className="agent-tools-summary">
      <span className={`agent-tools-dot ${status}`} aria-hidden="true" />
      <div><b>WebMCP</b><small>{detail}</small></div>
      <span className={`agent-tools-state ${status}`}>{status}</span>
    </div>
  </section>;
}
