export type OfferCondition = "NEW" | "USED" | "REFURBISHED";
export type OfferKind = "LISTING" | "CURATED_ESTIMATE";

export interface OfferObservation {
  id: string;
  productId: string;
  source: string;
  condition: OfferCondition;
  amountPln: number;
  observedAt: string;
  kind: OfferKind;
  url?: string;
}

export function bestOfferForProduct(
  offers: readonly OfferObservation[],
  productId: string,
  condition?: OfferCondition,
): OfferObservation | undefined {
  return offers
    .filter((offer) => offer.productId === productId && (!condition || offer.condition === condition))
    .filter((offer) => Number.isFinite(offer.amountPln) && offer.amountPln >= 0)
    .sort((a, b) => a.amountPln - b.amountPln)[0];
}
