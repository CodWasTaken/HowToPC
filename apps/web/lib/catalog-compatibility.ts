import type { ReferenceProduct } from "@howtopc/catalog";
import { replacePart } from "./builder";

export type CatalogApplyState = "CAN_APPLY" | "CANNOT_APPLY";

export function catalogApplyState(ids: readonly string[], productId: string): CatalogApplyState {
  return replacePart(ids, productId).committed ? "CAN_APPLY" : "CANNOT_APPLY";
}

export function sortCatalogForBuild(ids: readonly string[], products: readonly ReferenceProduct[]): ReferenceProduct[] {
  return products
    .map((product, index) => ({
      product,
      index,
      canApply: catalogApplyState(ids, product.id) === "CAN_APPLY",
    }))
    .sort((a, b) => Number(b.canApply) - Number(a.canApply) || a.index - b.index)
    .map(({ product }) => product);
}
