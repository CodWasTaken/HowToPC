"use client";

import { useMemo, useState } from "react";
import { bestReferenceOffer, referenceCatalog } from "@howtopc/catalog";
import {
  addPart,
  createBudgetHomelabBuild,
  createInitialBuild,
  isRepeatableProduct,
  maxPartQuantity,
  partQuantity,
  removePart,
  replacePart,
  snapshot,
} from "@/lib/builder";
import { catalogApplyState, sortCatalogForBuild } from "@/lib/catalog-compatibility";
import { DigitalTwin } from "./digital-twin";
import { MarketSelector } from "./market-selector";
import type { SupportedMarket } from "@/lib/market";
import { ThemeToggle } from "./theme-toggle";
import { WebMcpInspector } from "./webmcp-inspector";

const categories = ["CPU", "MOTHERBOARD", "MEMORY", "GPU", "CASE", "PSU", "COOLER", "STORAGE", "NETWORK", "FAN", "HBA"];
const formatMoney = (amount: number, currency: string, market: SupportedMarket) => new Intl.NumberFormat(market === "PL" ? "pl-PL" : "en-US", { style:"currency", currency, maximumFractionDigits:2 }).format(amount);
const offerDisplay = (productId: string, market: SupportedMarket) => {
  const offer = bestReferenceOffer(productId, { market });
  if (!offer) return { amount: "—", detail: "NO PRICE · specs only", title: "No price observation yet." };
  return {
    amount: formatMoney(offer.amount, offer.currency, market),
    detail: `${offer.condition} · ${offer.kind === "LISTING" ? "observed" : "estimate"}`,
    title: `${offer.source} · ${offer.condition} · observed ${new Date(offer.observedAt).toLocaleDateString(market === "PL" ? "pl-PL" : "en-US")}`,
  };
};

const resourceText = (label: string, used: number, available: number | null) =>
  available === null ? null : `${label} ${used}/${available}`;

export function BuilderWorkspace() {
  const initial = createInitialBuild();
  const [lines, setLines] = useState(initial.lines);
  const [market, setMarket] = useState<SupportedMarket>("US");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [preview, setPreview] = useState<ReturnType<typeof addPart> | null>(null);
  const current = useMemo(() => snapshot(lines, market), [lines, market]);
  const filtered = referenceCatalog.filter((product) =>
    (category === "ALL" || product.category === category) &&
    (!query || `${product.manufacturer} ${product.displayName}`.toLowerCase().includes(query.toLowerCase()))
  );
  const visible = sortCatalogForBuild(lines, filtered);
  const installed = new Set(lines.map((line) => line.productId));
  const resources = [
    resourceText("DIMM", current.resourceUsage.dimm.used, current.resourceUsage.dimm.available),
    resourceText("M.2", current.resourceUsage.m2.used, current.resourceUsage.m2.available),
    resourceText("SATA", current.resourceUsage.sata.used, current.resourceUsage.sata.available),
    resourceText("GPU PCIe", current.resourceUsage.gpuPcie.used, current.resourceUsage.gpuPcie.available),
    resourceText("PCIe", current.resourceUsage.generalPcie.used, current.resourceUsage.generalPcie.available),
  ].filter((value): value is string => Boolean(value));

  function selectPart(id: string) {
    const result = replacePart(lines, id);
    setPreview(result);
    if (result.committed) setLines(result.snapshot.lines);
  }

  function increment(id: string) {
    const result = addPart(lines, id);
    setPreview(result);
    if (result.committed) setLines(result.snapshot.lines);
  }

  function decrement(id: string) {
    setLines(removePart(lines, id).lines);
    setPreview(null);
  }
  return (
    <main className="app-shell">
      <header className="topbar">
        <div><strong>HowToPC</strong><span>engineering configurator</span></div>
        <div className="top-status">
          <span className={`status-dot ${current.report.status.toLowerCase()}`} />
          {current.report.status}
          <span>{current.pricedTotal.amount === null ? "NO PRICE" : formatMoney(current.pricedTotal.amount, current.pricedTotal.currency, market)}</span>
          <MarketSelector market={market} onChange={setMarket} />
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
              const offer = offerDisplay(product.id, market);
              const repeatable = isRepeatableProduct(product.id);
              const quantity = partQuantity(lines, product.id);
              const max = repeatable ? maxPartQuantity(lines, product.id) : 1;
              const applyState = catalogApplyState(lines, product.id);
              const canApply = applyState === "CAN_APPLY";
              const applyLabel = canApply ? "Can add to current build" : "Cannot add to current build";
              return (
                <div key={product.id} className={`part-row ${installed.has(product.id) ? "installed" : ""}`}>
                  <button className="part-select" onClick={() => repeatable ? increment(product.id) : selectPart(product.id)}>
                    <span className="part-main">
                      <span className={`part-compat-dot ${canApply ? "can-apply" : "cannot-apply"}`} aria-label={applyLabel} title={applyLabel} />
                      <span className="part-copy"><b>{product.displayName}</b><small>{product.manufacturer} · {product.category}{product.source?.evidence === "OPEN_DATA" ? " · OpenDB" : ""}</small></span>
                    </span>
                    <span className="price-cell" title={offer.title}><b>{offer.amount}</b><small>{offer.detail}</small></span>
                  </button>
                  {repeatable ? (
                    <div className="quantity-control">
                      <button onClick={() => decrement(product.id)} disabled={quantity === 0} aria-label={`Remove one ${product.displayName}`}>−</button>
                      <span>{quantity}/{max}</span>
                      <button onClick={() => increment(product.id)} disabled={!canApply} aria-label={`Add one ${product.displayName}`}>+</button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>
        <section className="panel twin-panel">
          <div className="panel-title-row">
            <div><h2>Digital twin</h2><p>Real-scale parametric geometry; visual fidelity is not verification.</p></div>
            <div className="twin-actions">
              <button className="plain-button" onClick={() => { setLines(createBudgetHomelabBuild().lines); setPreview(null); }}>Budget homelab preset</button>
              <button className="plain-button" onClick={() => { setLines(initial.lines); setPreview(null); }}>Reset</button>
            </div>
          </div>
          <DigitalTwin products={current.products} />
          {preview && !preview.committed ? (
            <div className="rejected" role="alert">
              <b>Change not committed</b>
              <span>{preview.candidate.report.results.find((result) => result.status === "INCOMPATIBLE" || result.status === "UNKNOWN")?.message}</span>
            </div>
          ) : null}
        </section>
        <aside className="panel build-panel">
          <div className="panel-head"><h2>Build</h2><span>{current.products.length} items</span></div>
          {resources.length ? <div className="resource-summary">{resources.map((item) => <span key={item}>{item}</span>)}</div> : null}
          <div className="installed-list">
            {current.lines.map((line) => {
              const product = referenceCatalog.find((item) => item.id === line.productId);
              if (!product) return null;
              const offer = offerDisplay(product.id, market);
              return (
                <div className="installed-row" key={product.id}>
                  <span className="category-code">{product.category}</span>
                  <span>{product.displayName}{line.quantity > 1 ? ` ×${line.quantity}` : ""}</span>
                  <div className="installed-actions">
                    <span className="installed-price" title={offer.title}><b>{offer.amount}</b><small>{offer.detail.split(" · ")[0]}</small></span>
                    <button className="remove-button" onClick={() => decrement(product.id)} aria-label={`Remove one ${product.displayName}`}>Remove</button>
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
          <WebMcpInspector lines={lines} setLines={setLines} market={market} />
        </aside>
      </section>
    </main>
  );
}
