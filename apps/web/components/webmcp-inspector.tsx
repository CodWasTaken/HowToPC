"use client";
import {useEffect,useRef,useState,type Dispatch,type SetStateAction} from "react";
import {referenceCatalog,searchProducts} from "@howtopc/catalog";
import {optimizeForPrice} from "@howtopc/compatibility";
import {registerHowToPcTools,TOOL_NAMES} from "@howtopc/webmcp";
import {replacePart,snapshot} from "@/lib/builder";
export function WebMcpInspector({ids,setIds}:{ids:string[];setIds:Dispatch<SetStateAction<string[]>>}){
 const [status,setStatus]=useState("checking");const history=useRef<string[][]>([]);const goals=useRef<Record<string,unknown>>({});const workloads=useRef<string[]>(["1440p gaming"]);
 useEffect(()=>{let active=true;let controller:AbortController|null=null;const summary=(p:any)=>({id:p.id,name:p.displayName,manufacturer:p.manufacturer,category:p.category,referencePriceEur:p.priceEur,specs:p.specs});
  registerHowToPcTools({
   getBuild:()=>({...snapshot(ids),goals:goals.current,workloads:workloads.current}),
   searchComponents:(input:any)=>searchProducts(referenceCatalog,input).slice(0,12).map(summary),
   inspectComponent:({componentId}:any)=>{const p=referenceCatalog.find(x=>x.id===componentId);return p?summary(p):{error:"UNKNOWN_COMPONENT",componentId};},
   previewChange:({componentId}:any)=>{const r=replacePart(ids,componentId);return {wouldCommit:r.committed,candidate:r.candidate,report:r.candidate.report};},
   applyChange:({componentId}:any)=>{const r=replacePart(ids,componentId);if(r.committed){history.current.push([...ids]);setIds(r.revisionIds);}return {committed:r.committed,build:r.snapshot,report:r.candidate.report};},
   setGoals:(input:any)=>{goals.current=input;return input;},setWorkloads:(input:any)=>{workloads.current=input.workloads;return input;},
   analyzeBuild:()=>snapshot(ids).report,optimizeBuild:()=>optimizeForPrice(ids)??{message:"No cheaper compatible substitution found."},
   undoLastChange:()=>{const prev=history.current.pop();if(!prev)return {undone:false};setIds(prev);return {undone:true,build:snapshot(prev)};}
  }).then(c=>{if(!active){c?.abort();return;}controller=c;setStatus(c?"registered":"unsupported");}).catch(()=>active&&setStatus("error"));
  return()=>{active=false;controller?.abort();};
 },[ids,setIds]);
 return <section className="mcp-inspector"><div className="mcp-head"><h3>WebMCP</h3><span className={`mcp-state ${status}`}>{status}</span></div><p>{TOOL_NAMES.length} task tools · same build engine as UI</p><code>{TOOL_NAMES.join(" · ")}</code></section>;
}
