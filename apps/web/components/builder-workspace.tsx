"use client";

import { useMemo, useState } from "react";
import { referenceCatalog } from "@howtopc/catalog";
import {
  addPart,
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
import { ThemeToggle } from "./theme-toggle";
import { WebMcpInspector } from "./webmcp-inspector";
import { PartsBrowser } from "./parts-browser";
import { BuildSidebar } from "./build-sidebar";
import { presentBuildStatus } from "@/lib/presentation";

const categories = ["CPU", "MOTHERBOARD", "MEMORY", "GPU", "CASE", "PSU", "COOLER", "STORAGE", "NETWORK", "FAN", "HBA"];
export function BuilderWorkspace() {
  const initial = createInitialBuild();
  const [lines, setLines] = useState(initial.lines);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [preview, setPreview] = useState<ReturnType<typeof addPart> | null>(null);
  const current = useMemo(() => snapshot(lines), [lines]);
  const filtered = referenceCatalog.filter((product) =>
    (category === "ALL" || product.category === category) &&
    (!query || `${product.manufacturer} ${product.displayName}`.toLowerCase().includes(query.toLowerCase()))
  );
  const visible = sortCatalogForBuild(lines, filtered);
  const installed = new Set(lines.map((line) => line.productId));
  const presentedStatus = presentBuildStatus(current.report);

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
          <span className={`status-dot ${presentedStatus.toLowerCase()}`} />
          {presentedStatus}
          <ThemeToggle />
        </div>
      </header>
      <section className="workspace">
        <PartsBrowser
          products={visible}
          categories={categories}
          category={category}
          query={query}
          installedIds={installed}
          applyStateFor={(id) => catalogApplyState(lines, id)}
          repeatableFor={isRepeatableProduct}
          quantityFor={(id) => partQuantity(lines, id)}
          maxQuantityFor={(id) => isRepeatableProduct(id) ? maxPartQuantity(lines, id) : 1}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onAdd={(id) => isRepeatableProduct(id) ? increment(id) : selectPart(id)}
          onDecrement={decrement}
        />
        <section className="panel twin-panel">
          <div className="panel-title-row">
            <div><h2>Digital twin</h2><p>Real-scale parametric geometry; visual fidelity is not verification.</p></div>
          </div>
          <DigitalTwin products={current.products} />
          {preview && !preview.committed ? (
            <div className="rejected" role="alert">
              <b>Change not committed</b>
              <span>{preview.candidate.report.results.find((result) => result.status === "INCOMPATIBLE" || result.status === "UNKNOWN")?.message}</span>
            </div>
          ) : null}
        </section>
        <BuildSidebar
          build={current}
          onIncrement={increment}
          onDecrement={decrement}
          onClear={() => { setLines([]); setPreview(null); }}
        >
          <WebMcpInspector lines={lines} setLines={setLines} />
        </BuildSidebar>
      </section>
    </main>
  );
}
