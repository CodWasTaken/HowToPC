import { referenceCatalog, referencePricePln, type ReferenceProduct } from "@howtopc/catalog";
import { applySafeReplacement } from "./transaction";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
function price(ids: readonly string[]): number | null {
  let total = 0;
  for (const id of ids) {
    const observed = referencePricePln(id);
    if (observed === undefined) return null;
    total += observed;
  }
  return total;
}
const specs = (product: ReferenceProduct) => product.specs as Record<string, any>;

function preservesMinimumCapability(current: ReferenceProduct, candidate: ReferenceProduct): boolean {
  if (current.category === "STORAGE") {
    return Number(specs(candidate).capacityBytes ?? 0) >= Number(specs(current).capacityBytes ?? 0);
  }
  if (current.category === "MEMORY") {
    const total = (product: ReferenceProduct) => Number(specs(product).modules ?? 0) * Number(specs(product).moduleCapacityBytes ?? 0);
    return total(candidate) >= total(current);
  }
  return true;
}

export function optimizeForPrice(ids: readonly string[]) {
  const current = price(ids);
  if (current === null) return null;
  let best: any = null;
  for (const candidate of referenceCatalog) {
    if (ids.includes(candidate.id) || referencePricePln(candidate.id) === undefined) continue;
    const replacedId = ids.find((id) => byId.get(id)?.category === candidate.category);
    if (!replacedId) continue;
    const replaced = byId.get(replacedId);
    if (!replaced || !preservesMinimumCapability(replaced, candidate)) continue;
    const result = applySafeReplacement(ids, candidate.id);
    if (!result.committed) continue;
    const next = price(result.revisionIds);
    if (next === null) continue;
    const saving = current - next;
    if (saving > 0 && (!best || saving > best.savingsPln)) {
      best = { componentId:candidate.id, replacesId:replacedId, savingsPln:saving, currentPricePln:current, candidatePricePln:next };
    }
  }
  return best;
}
