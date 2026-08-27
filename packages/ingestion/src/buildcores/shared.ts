import type { ProductCategory, ProductIdentifier } from "@howtopc/domain";
import type { NormalizedProductObservation } from "../observation";

export const GIB = 1024 ** 3;
export const GB = 1000 ** 3;
export const rec = (value: unknown): Record<string, any> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
export const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
export const finite = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

export function normalizeSocket(value: unknown): string | null {
  const socket = text(value);
  if (!socket) return null;
  return socket.replace(/^LGA\s+(\d+)$/i, "LGA$1");
}

export function identifiers(raw: Record<string, any>): ProductIdentifier[] {
  const id = text(raw.opendb_id);
  const result: ProductIdentifier[] = id ? [{ type:"SOURCE_ID", value:id, sourceId:"buildcores-opendb" }] : [];
  const metadata = rec(raw.metadata);
  const parts = Array.isArray(metadata?.part_numbers) ? metadata.part_numbers : [];
  for (const part of parts) { const value = text(part); if (value) result.push({ type:"MPN", value, sourceId:"buildcores-opendb" }); }
  return result;
}

export function base(
  category: ProductCategory,
  sourceCategory: string,
  raw: Record<string, any>,
  specs: Record<string, unknown>,
): NormalizedProductObservation | null {
  const id = text(raw.opendb_id);
  const metadata = rec(raw.metadata);
  const name = text(metadata?.name);
  const manufacturer = text(metadata?.manufacturer);
  if (!id || !name || !manufacturer) return null;
  return {
    providerId:"buildcores-opendb",
    sourceRecordId:id,
    sourceRecordUrl:`https://github.com/buildcores/buildcores-open-db/blob/main/open-db/${sourceCategory}/${id}.json`,
    manufacturer,
    displayName:name,
    category,
    identifiers:identifiers(raw),
    specs,
    manufacturerUrl:text(rec(raw.general_product_information)?.manufacturer_url) ?? undefined,
  };
}

export function motherboardFormFactor(value: unknown): "MINI_ITX" | "MATX" | "ATX" | "EATX" | null {
  const normalized = text(value)?.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (normalized === "mini itx") return "MINI_ITX";
  if (normalized === "micro atx") return "MATX";
  if (normalized === "atx") return "ATX";
  if (normalized === "eatx" || normalized === "extended atx") return "EATX";
  return null;
}
