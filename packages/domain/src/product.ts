import type { CoverageProfile } from "./coverage";

type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type ProductId = Brand<string, "ProductId">;
export type ProductRevisionId = Brand<string, "ProductRevisionId">;
export type ManufacturerId = Brand<string, "ManufacturerId">;

function brandedId<Name extends string>(value: string, name: Name): Brand<string, Name> {
  const trimmed = value.trim();
  if (!trimmed) throw new TypeError(`${name} must be non-empty.`);
  return trimmed as Brand<string, Name>;
}
export const productId = (value: string): ProductId => brandedId(value, "ProductId");
export const productRevisionId = (value: string): ProductRevisionId => brandedId(value, "ProductRevisionId");
export const manufacturerId = (value: string): ManufacturerId => brandedId(value, "ManufacturerId");

export type ProductCategory = "CPU" | "GPU" | "MOTHERBOARD" | "MEMORY" | "CASE" | "PSU" | "COOLER" | "FAN" | "STORAGE" | "NETWORK" | "HBA";
export type ProductIdentifierType = "MPN" | "GTIN" | "EAN" | "UPC" | "SOURCE_ID";
export interface ProductIdentifier { readonly type: ProductIdentifierType; readonly value: string; readonly sourceId?: string; }
export type ProductionStatus = "CURRENT" | "DISCONTINUED" | "UNKNOWN";
export type MarketAvailabilityStatus = "CURRENT" | "AVAILABLE" | "SCARCE" | "USED" | "ARCHIVED" | "UNKNOWN";
export interface ProductRevision {
  readonly id: ProductRevisionId;
  readonly productId: ProductId;
  readonly category: ProductCategory;
  readonly manufacturerId: ManufacturerId;
  readonly displayName: string;
  readonly identifiers: readonly ProductIdentifier[];
  readonly productionStatus: ProductionStatus;
  readonly marketAvailabilityStatus: MarketAvailabilityStatus;
  readonly coverage: CoverageProfile;
  readonly createdAt: string;
}
