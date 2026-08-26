import { referenceCatalog, referencePricePln, type ReferenceProduct } from "@howtopc/catalog";
import { applySafeReplacement, evaluateBuild, type CompatibilityReport } from "@howtopc/compatibility";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
export const initialBuildIds = ["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"] as const;
export const budgetHomelabIds = ["cpu-intel-i5-3470","mb-asus-p8h61-m-lx3-r2","ram-kingston-kvr16n11k2-16","case-silentiumpc-brutus-m10","psu-chieftec-gps-400aa","cooler-intel-e97379-003","hdd-wd5000aakx"] as const;

export interface BuilderSnapshot { ids:string[]; products:ReferenceProduct[]; report:CompatibilityReport; totalPricePln:number; }
export function productsFor(ids: readonly string[]): ReferenceProduct[] { return ids.map((id) => byId.get(id)).filter((product): product is ReferenceProduct => Boolean(product)); }
export function snapshot(ids: readonly string[]): BuilderSnapshot {
  const products = productsFor(ids);
  return { ids:[...ids], products, report:evaluateBuild(products), totalPricePln:products.reduce((sum, product) => sum + (referencePricePln(product.id) ?? 0), 0) };
}
export function createInitialBuild(): BuilderSnapshot { return snapshot(initialBuildIds); }
export function createBudgetHomelabBuild(): BuilderSnapshot { return snapshot(budgetHomelabIds); }
export function replacePart(ids: readonly string[], replacementId: string) {
  const result = applySafeReplacement(ids, replacementId);
  return { ...result, snapshot:snapshot(result.revisionIds), candidate:snapshot(result.candidateIds) };
}
export function removePart(ids: readonly string[], productId: string): BuilderSnapshot {
  return snapshot(ids.filter((id) => id !== productId));
}
