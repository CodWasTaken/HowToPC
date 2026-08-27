import type { ProductIdentifier } from "@howtopc/domain";
import type { CatalogProduct } from "./search";

export interface ProductSource {
  label: string;
  url?: string;
  evidence: "MANUFACTURER" | "OPEN_DATA" | "RETAILER" | "REFERENCE" | "MANUAL";
}

export interface ReferenceProduct extends CatalogProduct {
  revisionId: string;
  watts?: number;
  source?: ProductSource;
  identifiers?: readonly ProductIdentifier[];
  series?: string;
  variant?: string;
  releaseYear?: number;
}
