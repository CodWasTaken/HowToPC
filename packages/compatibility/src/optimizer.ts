import { bestReferenceOffer, referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";
import { applySafeReplacement } from "./transaction";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
function price(ids: readonly string[], market: string): { amount:number; currency:string } | null {
  let total = 0;
  let currency = market === "US" ? "USD" : "PLN";
  for (const id of ids) {
    const offer = bestReferenceOffer(id, { market });
    if (!offer) return null;
    total += offer.amount;
    currency = offer.currency;
  }
  return { amount:total, currency };
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

export function optimizeForPrice(ids: readonly string[], market = "PL") {
  const current = price(ids, market);
  if (current === null) return null;
  let best: any = null;
  for (const candidate of referenceCatalog) {
    if (ids.includes(candidate.id) || !bestReferenceOffer(candidate.id, { market })) continue;
    const replacedId = ids.find((id) => byId.get(id)?.category === candidate.category);
    if (!replacedId) continue;
    const replaced = byId.get(replacedId);
    if (!replaced || !preservesMinimumCapability(replaced, candidate)) continue;
    const result = applySafeReplacement(ids, candidate.id);
    if (!result.committed) continue;
    const next = price(result.revisionIds, market);
    if (next === null) continue;
    const saving = current.amount - next.amount;
    if (saving > 0 && (!best || saving > best.savingsAmount)) {
      best = { componentId:candidate.id, replacesId:replacedId, savingsAmount:saving, currentAmount:current.amount, candidateAmount:next.amount, currency:current.currency, market };
    }
  }
  return best;
}
