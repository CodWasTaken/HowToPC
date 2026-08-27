import { curatedRealCatalog } from "./curated-real-catalog";
import { fixtureCatalog } from "./fixture-catalog";

export const referenceCatalog = [
  ...fixtureCatalog,
  ...curatedRealCatalog,
] as const;

export { curatedRealCatalog, fixtureCatalog };
export type { ProductSource, ReferenceProduct } from "./product";
