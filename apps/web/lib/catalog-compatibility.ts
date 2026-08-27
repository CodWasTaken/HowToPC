import type { ReferenceProduct } from "@howtopc/catalog";
import { previewPart, type BuilderInput } from "./builder";

export type CatalogApplyState = "CAN_APPLY" | "BLOCKED_UNKNOWN" | "BLOCKED_INCOMPATIBLE";

const rank: Record<CatalogApplyState, number> = {
  CAN_APPLY: 0,
  BLOCKED_UNKNOWN: 1,
  BLOCKED_INCOMPATIBLE: 2,
};

export function catalogApplyState(input: BuilderInput, productId: string): CatalogApplyState {
  const state = previewPart(input, productId).decision.state;
  if (state === "ALLOWED") return "CAN_APPLY";
  return state;
}

export function sortCatalogForBuild(input: BuilderInput, products: readonly ReferenceProduct[]): ReferenceProduct[] {
  return products
    .map((product, index) => ({ product, index, state: catalogApplyState(input, product.id) }))
    .sort((a, b) => rank[a.state] - rank[b.state] || a.index - b.index)
    .map(({ product }) => product);
}
