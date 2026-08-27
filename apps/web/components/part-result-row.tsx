import type { ReferenceProduct } from "@howtopc/catalog";
import type { CatalogApplyState } from "@/lib/catalog-compatibility";
import { partRowTitle } from "@/lib/presentation";

interface PartResultRowProps {
  product: ReferenceProduct;
  applyState: CatalogApplyState;
  installed: boolean;
  repeatable: boolean;
  quantity: number;
  maxQuantity: number;
  onAdd: () => void;
  onDecrement: () => void;
}

const stateLabel: Record<CatalogApplyState, string> = {
  CAN_APPLY: "Can add to current build",
  BLOCKED_UNKNOWN: "Compatibility cannot be verified yet",
  BLOCKED_INCOMPATIBLE: "Known incompatible with current build",
};

export function PartResultRow(props: PartResultRowProps) {
  const { product, applyState, installed, repeatable, quantity, maxQuantity, onAdd, onDecrement } = props;
  const canAdd = applyState === "CAN_APPLY";
  const title = partRowTitle(product);
  return (
    <div className={`part-result-row ${installed ? "installed" : ""}`} title={title}>
      <span className={`part-compat-dot ${applyState.toLowerCase().replaceAll("_", "-")}`} aria-label={stateLabel[applyState]} />
      <button className="part-result-identity" onClick={onAdd} disabled={!canAdd && !installed} aria-label={title}>
        <span className="part-result-name">{product.displayName}</span>
        <span className="part-result-meta">
          {product.manufacturer} · {product.category}{product.source?.evidence === "OPEN_DATA" ? " · OpenDB" : ""}
        </span>
      </button>
      <div className="part-result-actions">
        {repeatable ? (
          <div className="quantity-control">
            <button onClick={onDecrement} disabled={quantity === 0} aria-label={`Remove one ${product.displayName}`}>−</button>
            <span>{quantity}/{maxQuantity}</span>
            <button onClick={onAdd} disabled={!canAdd} aria-label={`Add one ${product.displayName}`}>+</button>
          </div>
        ) : (
          <button className="part-add-button" onClick={onAdd} disabled={!canAdd || installed} aria-label={`Use ${product.displayName}`}>
            {installed ? "✓" : "+"}
          </button>
        )}
      </div>
    </div>
  );
}
