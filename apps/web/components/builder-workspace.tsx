"use client";

import { useMemo, useState } from "react";
import type { ProductCategory, ReferenceProduct } from "@howtopc/catalog";
import {
  addProductToSession,
  createBuilderSession,
  decrementProductInSession,
  sessionSnapshot,
  type BuilderSession,
} from "@/lib/builder-session";
import { useCatalogBrowser } from "@/hooks/use-catalog-browser";
import { DigitalTwin } from "./digital-twin";
import { ThemeToggle } from "./theme-toggle";
import { PartsBrowser } from "./parts-browser";
import { BuildSidebar } from "./build-sidebar";
import { WebMcpInspector } from "./webmcp-inspector";
import { WorkspaceNavigation, type MobileWorkspaceView } from "./workspace-navigation";
import { presentBuildStatus } from "@/lib/presentation";

const categories:readonly ProductCategory[]=[
  "CPU","MOTHERBOARD","MEMORY","GPU","CASE","PSU","COOLER","STORAGE","NETWORK","FAN",
];

function rejectedMessage(result:ReturnType<typeof addProductToSession>):string|null {
  if(result.mutation.committed)return null;
  return result.mutation.report.results.find((item)=>item.status!=="COMPATIBLE")?.message
    ?? "This change cannot be committed safely.";
}
export function BuilderWorkspace() {
  const [session,setSession]=useState<BuilderSession>(()=>createBuilderSession());
  const [previewMessage,setPreviewMessage]=useState<string|null>(null);
  const [leftDrawerOpen,setLeftDrawerOpen]=useState(false);
  const [rightDrawerOpen,setRightDrawerOpen]=useState(false);
  const [mobileView,setMobileView]=useState<MobileWorkspaceView>("TWIN");
  const browser=useCatalogBrowser(session.lines);
  const current=useMemo(()=>sessionSnapshot(session),[session]);
  const installed=useMemo(()=>new Set(session.lines.map((line)=>line.productId)),[session.lines]);
  const presentedStatus=presentBuildStatus(current.report);

  function addProduct(product:ReferenceProduct) {
    const result=addProductToSession(session,product);
    setPreviewMessage(rejectedMessage(result));
    if(result.mutation.committed)setSession(result.session);
  }

  function increment(productId:string) {
    const product=session.knownProducts[productId]
      ?? current.products.find((item)=>item.id===productId);
    if(product)addProduct(product);
  }

  function decrement(productId:string) {
    const result=decrementProductInSession(session,productId);
    setSession(result.session);setPreviewMessage(null);
  }

  const quantityFor=(productId:string)=>session.lines.find((line)=>line.productId===productId)?.quantity??0;
  return <main className="app-shell">
    <header className="topbar">
      <div><strong>HowToPC</strong><span>engineering configurator</span></div>
      <div className="top-status">
        <span className={`status-dot ${presentedStatus.toLowerCase()}`} />
        {presentedStatus}
        <ThemeToggle />
      </div>
    </header>
    <WorkspaceNavigation
      leftDrawerOpen={leftDrawerOpen} rightDrawerOpen={rightDrawerOpen}
      mobileView={mobileView}
      onToggleParts={()=>{setLeftDrawerOpen((open)=>!open);setRightDrawerOpen(false);}}
      onShowTwin={()=>{setLeftDrawerOpen(false);setRightDrawerOpen(false);}}
      onToggleBuild={()=>{setRightDrawerOpen((open)=>!open);setLeftDrawerOpen(false);}}
      onMobileView={setMobileView}
    />
    <section className="workspace" data-mobile-view={mobileView}>
      <PartsBrowser
        className={`${leftDrawerOpen?"drawer-open":""} ${mobileView==="PARTS"?"mobile-active":""}`}
        items={browser.state.items} total={browser.state.total}
        categories={categories} category={browser.state.category}
        query={browser.queryInput} loading={browser.loading} error={browser.error}
        filters={browser.state.filters} facets={browser.state.facets}
        compatibleOnly={browser.state.compatibleOnly} sort={browser.state.sort}
        installedIds={installed} quantityFor={quantityFor}
        onQueryChange={browser.setQueryInput}
        onCategoryChange={browser.setCategory}
        onAdd={addProduct} onDecrement={decrement} onLoadMore={browser.loadMore}
        onToggleEnum={browser.toggleEnum} onBoolean={browser.setBoolean}
        onRange={browser.setRange} onToggleUnknown={browser.toggleUnknown}
        onRemoveFilter={browser.removeFacet} onClearFilters={browser.clearFilters}
        onCompatibleOnly={browser.setCompatibleOnly} onSort={browser.setSort}
      />
      <section className={`panel twin-panel ${mobileView==="TWIN"?"mobile-active":""}`}>
        <div className="panel-title-row">
          <div><h2>Digital twin</h2><p>Real-scale parametric geometry; visual fidelity is not verification.</p></div>
        </div>
        <DigitalTwin products={current.products} />
        {previewMessage?<div className="rejected" role="alert">
          <b>Change not committed</b><span>{previewMessage}</span>
        </div>:null}
      </section>
      <BuildSidebar
        className={`${rightDrawerOpen?"drawer-open":""} ${mobileView==="BUILD"?"mobile-active":""}`}
        build={current} onIncrement={increment} onDecrement={decrement}
        onClear={()=>{setSession(createBuilderSession([],session.knownProducts));setPreviewMessage(null);}}
      >
        <WebMcpInspector session={session} setSession={setSession} />
      </BuildSidebar>
      <button className={`workspace-backdrop ${leftDrawerOpen||rightDrawerOpen?"visible":""}`}
        onClick={()=>{setLeftDrawerOpen(false);setRightDrawerOpen(false);}}
        aria-label="Close side panel" />
    </section>
  </main>;
}
