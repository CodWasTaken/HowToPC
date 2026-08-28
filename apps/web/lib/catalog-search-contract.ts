import type { FacetResult, FacetSelection, ProductCategory, ReferenceProduct } from "@howtopc/catalog";
import type { BuildLine } from "@howtopc/compatibility";

export type CatalogApplyState =
  | "CAN_APPLY"
  | "BLOCKED_UNKNOWN"
  | "BLOCKED_INCOMPATIBLE";

export type CatalogSort = "RELEVANCE" | "NEWEST" | "NAME";

export interface CatalogSearchRequest {
  query?: string;
  category?: ProductCategory;
  filters: FacetSelection[];
  compatibleOnly: boolean;
  sort: CatalogSort;
  limit: number;
  offset: number;
  buildLines: BuildLine[];
}

export interface CatalogSearchItem {
  product: ReferenceProduct;
  applyState: CatalogApplyState;
  maxSafeQuantity: number | null;
}

export interface CatalogSearchResponse {
  items: CatalogSearchItem[];
  total: number;
  limit: number;
  offset: number;
  facets: FacetResult[];
}
