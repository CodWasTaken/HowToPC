import type { ProductRevisionId } from "./product";
import type { Money } from "./units";
type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type BuildId = Brand<string, "BuildId">;
export type BuildRevisionId = Brand<string, "BuildRevisionId">;
function brandedId<Name extends string>(value: string, name: Name): Brand<string, Name> {
  const trimmed = value.trim();
  if (!trimmed) throw new TypeError(`${name} must be non-empty.`);
  return trimmed as Brand<string, Name>;
}
export const buildId = (value: string): BuildId => brandedId(value, "BuildId");
export const buildRevisionId = (value: string): BuildRevisionId => brandedId(value, "BuildRevisionId");
export interface BuildItem { readonly productRevisionId: ProductRevisionId; readonly quantity: number; }
export function buildItem(productRevisionId: ProductRevisionId, quantity = 1): BuildItem {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new RangeError("Build item quantity must be a positive integer.");
  return { productRevisionId, quantity };
}
export type BuildMode = "PC" | "HOMELAB";
export interface BuildGoals { readonly maxBudget?: Money; readonly notes?: readonly string[]; }
export interface Build { readonly id: BuildId; readonly mode: BuildMode; readonly name?: string; readonly currentRevisionId?: BuildRevisionId; readonly createdAt: string; }
export interface BuildRevision {
  readonly id: BuildRevisionId;
  readonly buildId: BuildId;
  readonly parentRevisionId?: BuildRevisionId;
  readonly items: readonly BuildItem[];
  readonly goals: BuildGoals;
  readonly workloads: readonly string[];
  readonly createdAt: string;
}
