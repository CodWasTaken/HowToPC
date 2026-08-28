"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { isRepeatableCategory, maxSafeQuantity } from "@howtopc/compatibility";
import { registerHowToPcTools, TOOL_NAMES } from "@howtopc/webmcp";
import { fetchCatalogPage, fetchCatalogProduct } from "@/lib/catalog-client";
import {
  sessionResolver,
  sessionSnapshot,
  type BuilderSession,
} from "@/lib/builder-session";
import { runAgentChange, type AgentChangeInput } from "@/lib/agent-change";
import type { CatalogApplyState } from "@/lib/catalog-search-contract";

interface InspectorProps {
  session:BuilderSession;
  setSession:Dispatch<SetStateAction<BuilderSession>>;
}

const applyState=(state:string):CatalogApplyState=>
  state==="ALLOWED"?"CAN_APPLY":state as CatalogApplyState;

export function WebMcpInspector({session,setSession}:InspectorProps) {
  const [status,setStatus]=useState("checking");
  const history=useRef<BuilderSession[]>([]);
  const goals=useRef<Record<string,unknown>>({});
  const workloads=useRef<string[]>(["1440p gaming"]);
  useEffect(()=>{
    let active=true;
    let controller:AbortController|null=null;
    const current=sessionSnapshot(session);

    const summary=(product:any,state?:CatalogApplyState,maxQuantity?:number|null)=>{
      let applyNow=state;
      let max=maxQuantity;
      if(!applyNow){
        const preview=runAgentChange(session,{componentId:product.id,action:"add"},product);
        applyNow=preview.decision?applyState(String((preview.decision as {state:string}).state)):"BLOCKED_UNKNOWN";
      }
      if(max===undefined&&isRepeatableCategory(product.category)){
        max=maxSafeQuantity(session.lines,product,sessionResolver(session));
      }
      return {
        id:product.id,name:product.displayName,manufacturer:product.manufacturer,
        category:product.category,specs:product.specs,source:product.source,
        identifiers:product.identifiers,series:product.series,variant:product.variant,
        releaseYear:product.releaseYear,applyNow,maxSafeQuantity:max??null,
      };
    };

    const resolveCandidate=async(input:AgentChangeInput)=>{
      if(input.action==="decrement")return undefined;
      return session.knownProducts[input.componentId]??await fetchCatalogProduct(input.componentId);
    };
    registerHowToPcTools({
      getBuild:()=>({...current,goals:goals.current,workloads:workloads.current}),
      searchComponents:async(input:any)=>{
        const response=await fetchCatalogPage({
          query:typeof input.query==="string"?input.query:undefined,
          category:input.category||undefined,
          filters:Array.isArray(input.filters)?input.filters:[],
          compatibleOnly:input.compatibleOnly===true,
          sort:input.sort??"RELEVANCE",
          limit:input.limit??12,offset:input.offset??0,
          buildLines:session.lines.map((line)=>({...line})),
        });
        return {
          ...response,
          items:response.items.map((item)=>summary(item.product,item.applyState,item.maxSafeQuantity)),
        };
      },
      inspectComponent:async({componentId}:any)=>summary(await fetchCatalogProduct(componentId)),
      previewChange:async(input:AgentChangeInput)=>{
        const candidate=await resolveCandidate(input);
        return runAgentChange(session,input,candidate);
      },
      applyChange:async(input:AgentChangeInput)=>{
        const candidate=await resolveCandidate(input);
        const result=runAgentChange(session,input,candidate);
        if(result.committed){
          history.current.push({
            lines:session.lines.map((line)=>({...line})),
            knownProducts:{...session.knownProducts},
          });
          setSession(result.session);
        }
        return result;
      },
      setGoals:(input:any)=>{goals.current=input;return input;},
      setWorkloads:(input:any)=>{workloads.current=input.workloads;return input;},
      analyzeBuild:()=>({report:current.report,resourceUsage:current.resourceUsage}),
      optimizeBuild:()=>({message:"Pricing optimization is paused while sourced compatibility/catalog coverage is being verified."}),
      undoLastChange:()=>{
        const previous=history.current.pop();
        if(!previous)return {undone:false};
        setSession(previous);
        return {undone:true,build:sessionSnapshot(previous)};
      },
    }).then((created)=>{
      if(!active){created?.abort();return;}
      controller=created;setStatus(created?"registered":"unsupported");
    }).catch(()=>active&&setStatus("error"));
    return ()=>{active=false;controller?.abort();};
  },[session,setSession]);

  return <section className="agent-tools" aria-label="Agent tools">
    <div className="agent-tools-summary">
      <span className={`agent-tools-dot ${status}`} aria-hidden="true" />
      <div><b>Agent tools</b><small>{TOOL_NAMES.length} tools · public catalog + same build session</small></div>
      <span className={`agent-tools-state ${status}`}>{status}</span>
    </div>
    <details className="agent-tools-details">
      <summary>Advanced diagnostics</summary>
      <code>{TOOL_NAMES.join(" · ")}</code>
    </details>
  </section>;
}
