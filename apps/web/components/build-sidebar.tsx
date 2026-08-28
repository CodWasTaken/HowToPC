import type { ReactNode } from "react";
import { createCatalogResolver, isRepeatableCategory, maxSafeQuantity } from "@howtopc/compatibility";
import type { BuilderSnapshot } from "@/lib/builder";
import { CompatibilitySummary } from "./compatibility-summary";
import { ResourceSummary } from "./resource-summary";

interface BuildSidebarProps {
  className?: string;
  build: BuilderSnapshot;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onClear: () => void;
  children?: ReactNode;
}

export function BuildSidebar({ build, onIncrement, onDecrement, onClear, children, className }: BuildSidebarProps) {
  const resolver=createCatalogResolver(build.products);
  return (
    <aside className={`panel build-panel ${className ?? ""}`}>
      <div className="build-panel-head">
        <div><h2>Build</h2><span>{build.products.length} installed items</span></div>
        <button className="text-button" onClick={onClear} disabled={build.lines.length === 0}>Clear build</button>
      </div>
      <div className="build-scroll">
        <section className="installed-section">
          {build.lines.length === 0 ? <p className="build-empty">Build is empty. Choose any component to begin.</p> : null}
          {build.lines.map((line) => {
            const product = build.products.find((item) => item.id === line.productId);
            if (!product) return null;
            const repeatable = isRepeatableCategory(product.category);
            const max = repeatable ? maxSafeQuantity(build.lines, product.id, resolver) : 1;
            return (
              <div className="installed-row redesigned" key={product.id} title={product.displayName}>
                <span className="installed-copy">
                  <small>{product.category}</small>
                  <b>{product.displayName}</b>
                </span>
                {repeatable ? (
                  <div className="quantity-control">
                    <button onClick={() => onDecrement(product.id)} aria-label={`Remove one ${product.displayName}`}>−</button>
                    <span>{line.quantity}</span>
                    <button onClick={() => onIncrement(product.id)} disabled={line.quantity >= max} aria-label={`Add one ${product.displayName}`}>+</button>
                  </div>
                ) : (
                  <button className="icon-remove-button" onClick={() => onDecrement(product.id)} aria-label={`Remove ${product.displayName}`}>×</button>
                )}
              </div>
            );
          })}
        </section>
        <ResourceSummary usage={build.resourceUsage} />
        <CompatibilitySummary report={build.report} />
        {children}
      </div>
    </aside>
  );
}
