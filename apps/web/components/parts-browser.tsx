import type { ReferenceProduct } from "@howtopc/catalog";
import type { CatalogApplyState } from "@/lib/catalog-compatibility";
import { PartResultRow } from "./part-result-row";

interface PartsBrowserProps {
  className?: string;
  products: readonly ReferenceProduct[];
  categories: readonly string[];
  category: string;
  query: string;
  installedIds: ReadonlySet<string>;
  applyStateFor: (productId: string) => CatalogApplyState;
  repeatableFor: (productId: string) => boolean;
  quantityFor: (productId: string) => number;
  maxQuantityFor: (productId: string) => number;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAdd: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

export function PartsBrowser(props: PartsBrowserProps) {
  const { products, categories, category, query } = props;
  return (
    <aside className={`panel catalog-panel ${props.className ?? ""}`}>
      <div className="parts-browser-head">
        <div><h2>Parts</h2><span>{products.length} shown</span></div>
        <input aria-label="Search parts" placeholder="Search hardware" value={query} onChange={(event) => props.onQueryChange(event.target.value)} />
      </div>
      <div className="category-tabs" aria-label="Hardware categories">
        <button className={category === "ALL" ? "active" : ""} onClick={() => props.onCategoryChange("ALL")}>All</button>
        {categories.map((item) => (
          <button key={item} className={category === item ? "active" : ""} onClick={() => props.onCategoryChange(item)}>{item}</button>
        ))}
      </div>
      <div className="catalog-attribution">Specs may include BuildCores OpenDB · ODC-By 1.0.</div>
      <div className="part-results">
        {products.map((product) => (
          <PartResultRow
            key={product.id}
            product={product}
            applyState={props.applyStateFor(product.id)}
            installed={props.installedIds.has(product.id)}
            repeatable={props.repeatableFor(product.id)}
            quantity={props.quantityFor(product.id)}
            maxQuantity={props.maxQuantityFor(product.id)}
            onAdd={() => props.onAdd(product.id)}
            onDecrement={() => props.onDecrement(product.id)}
          />
        ))}
      </div>
    </aside>
  );
}
