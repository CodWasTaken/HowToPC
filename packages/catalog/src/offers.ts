export type OfferCondition = "NEW" | "USED" | "REFURBISHED";
export type OfferKind = "LISTING" | "CURATED_ESTIMATE";

export interface OfferObservation {
  id: string;
  productId: string;
  source: string;
  condition: OfferCondition;
  market: string;
  currency: string;
  amount: number;
  observedAt: string;
  kind: OfferKind;
  url?: string;
}

export interface OfferSelection {
  market: string;
  condition?: OfferCondition;
}

const selection = (value?: OfferSelection | OfferCondition): OfferSelection =>
  typeof value === "string" ? { market:"PL", condition:value } : (value ?? { market:"PL" });
export function bestOfferForProduct(
  offers: readonly OfferObservation[],
  productId: string,
  requested?: OfferSelection | OfferCondition,
): OfferObservation | undefined {
  const { market, condition } = selection(requested);
  return offers
    .filter((offer) => offer.productId === productId && offer.market === market)
    .filter((offer) => !condition || offer.condition === condition)
    .filter((offer) => Number.isFinite(offer.amount) && offer.amount >= 0)
    .sort((a, b) => a.amount - b.amount)[0];
}
