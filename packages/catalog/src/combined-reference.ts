import { buildCoresSnapshot } from "./generated/buildcores-snapshot";
import {
  referenceCatalog as curatedReferenceCatalog,
  type ProductSource,
  type ReferenceProduct,
} from "./reference";

export const referenceCatalog = [
  ...curatedReferenceCatalog,
  ...buildCoresSnapshot,
] satisfies readonly ReferenceProduct[];

export type { ProductSource, ReferenceProduct };
