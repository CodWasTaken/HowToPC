"use client";
import { useMemo,useState } from "react";
import { referenceCatalog } from "@howtopc/catalog";
import { createInitialBuild,replacePart,snapshot } from "@/lib/builder";
import { DigitalTwin } from "./digital-twin";
const categories=["CPU","MOTHERBOARD","MEMORY","GPU","CASE","PSU","COOLER","STORAGE","NETWORK"];
export function BuilderWorkspace(){
 const initial=createInitialBuild(); const [ids,setIds]=useState<string[]>(initial.ids); const [query,setQuery]=useState(""); const [category,setCategory]=useState("ALL"); const [preview,setPreview]=useState<ReturnType<typeof replacePart>|null>(null);
 const current=useMemo(()=>snapshot(ids),[ids]);
 const visible=referenceCatalog.filter(product=>(category==="ALL"||product.category===category)&&(!query||`${product.manufacturer} ${product.displayName}`.toLowerCase().includes(query.toLowerCase())));
 const installed=new Set(ids);
 function choose(id:string){const result=replacePart(ids,id);setPreview(result);if(result.committed)setIds(result.revisionIds);}
 return <main className="app-shell">
  <header className="topbar"><div><strong>HowToPC</strong><span>engineering configurator</span></div><div className="top-status"><span className={`status-dot ${current.report.status.toLowerCase()}`}/>{current.report.status}<span>€{current.totalPriceEur}</span></div></header>
  <section className="workspace">
   <aside className="panel catalog-panel"><div className="panel-head"><h2>Parts</h2><input aria-label="Search parts" placeholder="Search parts" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="category-tabs"><button className={category==="ALL"?"active":""} onClick={()=>setCategory("ALL")}>All</button>{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="part-list">{visible.map(product=><button key={product.id} className={`part-row ${installed.has(product.id)?"installed":""}`} onClick={()=>choose(product.id)}><span><b>{product.displayName}</b><small>{product.manufacturer} · {product.category}</small></span><span>€{product.priceEur}</span></button>)}</div></aside>
   <section className="panel twin-panel"><div className="panel-title-row"><div><h2>Digital twin</h2><p>Real-scale parametric geometry; visual fidelity is not verification.</p></div><button className="plain-button" onClick={()=>{setIds([...initial.ids]);setPreview(null);}}>Reset</button></div><DigitalTwin products={current.products}/>{preview&&!preview.committed?<div className="rejected"><b>Change not committed</b><span>{preview.candidate.report.results.find(r=>r.status==="INCOMPATIBLE")?.message}</span></div>:null}</section>
   <aside className="panel build-panel"><div className="panel-head"><h2>Build</h2><span>{current.products.length} items</span></div><div className="installed-list">{current.products.map(product=><div className="installed-row" key={product.id}><span className="category-code">{product.category}</span><span>{product.displayName}</span><b>€{product.priceEur}</b></div>)}</div><div className="analysis"><h3>Compatibility</h3><div className={`overall ${current.report.status.toLowerCase()}`}>{current.report.status}</div>{current.report.results.map(result=><div className="rule" key={result.ruleId}><span className={`rule-mark ${result.status.toLowerCase()}`}>{result.status==="COMPATIBLE"?"OK":result.status}</span><p>{result.message}</p></div>)}</div></aside>
  </section>
 </main>;
}
