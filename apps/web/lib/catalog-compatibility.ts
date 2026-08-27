import type { ReferenceProduct } from "@howtopc/catalog";
import { previewPart, type BuilderInput } from "./builder";

export type CatalogApplyState = "CAN_APPLY" | "CANNOT_APPLY";

export function catalogApplyState(input: BuilderInput, productId: string): CatalogApplyState {
  return previewPart(input, productId).committed ? "CAN_APPLY" : "CANNOT_APPLY";
}

export function sortCatalogForBuild(input: BuilderInput, products: readonly ReferenceProduct[]): ReferenceProduct[] {
  return products
    .map((product, index) => ({
      product,
      index,
      canApply: catalogApplyState(input, product.id) === "CAN_APPLY",
    }))
    .sort((a, b) => Number(b.canApply) - Number(a.canApply) || a.index - b.index)
    .map(({ product }) => product);
}
