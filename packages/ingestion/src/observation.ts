import type { ProductCategory, ProductIdentifier } from "@howtopc/domain";

export interface NormalizedProductObservation {
  providerId: string;
  sourceRecordId: string;
  sourceRecordUrl: string;
  manufacturer: string;
  displayName: string;
  category: ProductCategory;
  identifiers: readonly ProductIdentifier[];
  specs: Record<string, unknown>;
  manufacturerUrl?: string;
  series?: string;
  variant?: string;
  releaseYear?: number;
}
