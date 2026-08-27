"use client";

import { useMemo, useState } from "react";
import { bestReferenceOffer, referenceCatalog } from "@howtopc/catalog";
import { createBudgetHomelabBuild, createInitialBuild, removePart, replacePart, snapshot } from "@/lib/builder";
import { DigitalTwin } from "./digital-twin";
import { ThemeToggle } from "./theme-toggle";
import { WebMcpInspector } from "./webmcp-inspector";

const categories = ["CPU", "MOTHERBOARD", "MEMORY", "GPU", "CASE", "PSU", "COOLER", "STORAGE", "NETWORK"];
const formatPln = (amount: number) => `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(amount)} zł`;
const offerDisplay = (productId: string) => {
  const offer = bestReferenceOffer(productId);
  if (!offer) return { amount: "—", detail: "NO PRICE · specs only", title: "No price observation yet." };
  return {
    amount: formatPln(offer.amountPln),
    detail: `${offer.condition} · ${offer.kind === "LISTING" ? "observed" : "estimate"}`,
    title: `${offer.source} · ${offer.condition} · observed ${new Date(offer.observedAt).toLocaleDateString("pl-PL")}`,
  };
};

export function BuilderWorkspace() {
  const initial = createInitialBuild();
  const [ids, setIds] = useState<string[]>(initial.ids);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [preview, setPreview] = useState<ReturnType<typeof replacePart> | null>(null);
  const current = useMemo(() => snapshot(ids), [ids]);
  const visible = referenceCatalog.filter((product) =>
    (category === "ALL" || product.category === category) &&
    (!query || `${product.manufacturer} ${product.displayName}`.toLowerCase().includes(query.toLowerCase()))
  );
  const installed = new Set(ids);

  function choose(id: string) {
    const result = replacePart(ids, id);
    setPreview(result);
    if (result.committed) setIds(result.revisionIds);
  }

  function remove(id: string) {
    const result = removePart(ids, id);
    setIds(result.ids);
    setPreview(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><strong>HowToPC</strong><span>engineering configurator</span></div>
        <div className="top-status">
          <span className={`status-dot ${current.report.status.toLowerCase()}`} />
          {current.report.status}
          <span>{formatPln(current.totalPricePln)}</span>
          <ThemeToggle />
        </div>
      </header>
      <section className="workspace">
        <aside className="panel catalog-panel">
          <div className="panel-head">
            <h2>Parts</h2>
            <input aria-label="Search parts" placeholder="Search parts" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="category-tabs">
            <button className={category === "ALL" ? "active" : ""} onClick={() => setCategory("ALL")}>All</button>
            {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="catalog-attribution">Specs may include BuildCores OpenDB · ODC-By 1.0. Prices are separate observations.</div>
          <div className="part-list">
            {visible.map((product) => {
              const offer = offerDisplay(product.id);
              return (
                <button key={product.id} className={`part-row ${installed.has(product.id) ? "installed" : ""}`} onClick={() => choose(product.id)}>
                  <span><b>{product.displayName}</b><small>{product.manufacturer} · {product.category}{product.source?.evidence === "OPEN_DATA" ? " · OpenDB" : ""}</small></span>
                  <span className="price-cell" title={offer.title}><b>{offer.amount}</b><small>{offer.detail}</small></span>
                </button>
              );
            })}
          </div>
        </aside>
        <section className="panel twin-panel">
          <div className="panel-title-row">
            <div><h2>Digital twin</h2><p>Real-scale parametric geometry; visual fidelity is not verification.</p></div>
            <div className="twin-actions"><button className="plain-button" onClick={() => { setIds([...createBudgetHomelabBuild().ids]); setPreview(null); }}>Budget homelab ≤500 zł</button><button className="plain-button" onClick={() => { setIds([...initial.ids]); setPreview(null); }}>Reset</button></div>
          </div>
          <DigitalTwin products={current.products} />
          {preview && !preview.committed ? (
            <div className="rejected" role="alert">
              <b>Change not committed</b>
              <span>{preview.candidate.report.results.find((result) => result.status === "INCOMPATIBLE")?.message}</span>
            </div>
          ) : null}
        </section>
        <aside className="panel build-panel">
          <div className="panel-head"><h2>Build</h2><span>{current.products.length} items</span></div>
          <div className="installed-list">
            {current.products.map((product) => {
              const offer = offerDisplay(product.id);
              return (
                <div className="installed-row" key={product.id}>
                  <span className="category-code">{product.category}</span>
                  <span>{product.displayName}</span>
                  <div className="installed-actions">
                    <span className="installed-price" title={offer.title}><b>{offer.amount}</b><small>{offer.detail.split(" · ")[0]}</small></span>
                    <button className="remove-button" onClick={() => remove(product.id)} aria-label={`Remove ${product.displayName}`}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="analysis">
            <h3>Compatibility</h3>
            <div className={`overall ${current.report.status.toLowerCase()}`}>{current.report.status}</div>
            {current.report.results.map((result) => (
              <div className="rule" key={result.ruleId}>
                <span className={`rule-mark ${result.status.toLowerCase()}`}>{result.status === "COMPATIBLE" ? "OK" : result.status}</span>
                <p>{result.message}</p>
              </div>
            ))}
          </div>
          <WebMcpInspector ids={ids} setIds={setIds} />
        </aside>
      </section>
    </main>
  );
}
