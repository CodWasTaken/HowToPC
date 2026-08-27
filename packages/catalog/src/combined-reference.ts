import { buildCoresSnapshot } from "./generated/buildcores-snapshot";
import { curatedRealCatalog } from "./curated-real-catalog";
import { fixtureCatalog } from "./fixture-catalog";
import type { ReferenceProduct } from "./product";

export const publicSeedCatalog = [
  ...curatedRealCatalog,
  ...buildCoresSnapshot,
] satisfies readonly ReferenceProduct[];

export const referenceCatalog = [
  ...fixtureCatalog,
  ...publicSeedCatalog,
] satisfies readonly ReferenceProduct[];

export { curatedRealCatalog, fixtureCatalog };
export type { ProductSource, ReferenceProduct } from "./product";
