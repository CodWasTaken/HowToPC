import { describe, expect, test } from "vitest";
import { bestOfferForProduct, type OfferObservation } from "./offers";

describe("offer observations", () => {
  test("selects the cheapest native offer inside the requested market", () => {
    const offers: OfferObservation[] = [
      { id:"us-a",productId:"p",market:"US",currency:"USD",amount:109,condition:"NEW",source:"US Shop A",observedAt:"2026-08-27",kind:"LISTING" },
      { id:"us-b",productId:"p",market:"US",currency:"USD",amount:99,condition:"NEW",source:"US Shop B",observedAt:"2026-08-27",kind:"LISTING" },
      { id:"pl",productId:"p",market:"PL",currency:"PLN",amount:399,condition:"NEW",source:"PL Shop",observedAt:"2026-08-27",kind:"LISTING" },
    ];
    expect(bestOfferForProduct(offers, "p", { market:"US" })?.amount).toBe(99);
    expect(bestOfferForProduct(offers, "p", { market:"US" })?.currency).toBe("USD");
    expect(bestOfferForProduct(offers, "p", { market:"PL" })?.amount).toBe(399);
    expect(bestOfferForProduct(offers, "missing", { market:"US" })).toBeUndefined();
  });

  test("preserves condition, source, and observation time", () => {
    const offers: OfferObservation[] = [
      { id:"used",productId:"p",market:"PL",currency:"PLN",amount:35,condition:"USED",source:"market-b",observedAt:"2026-08-26T21:00:00Z",kind:"LISTING" },
      { id:"new",productId:"p",market:"PL",currency:"PLN",amount:140,condition:"NEW",source:"shop",observedAt:"2026-08-26T22:00:00Z",kind:"LISTING" },
    ];
    const result = bestOfferForProduct(offers, "p", { market:"PL", condition:"USED" });
    expect(result).toMatchObject({ amount:35, source:"market-b", observedAt:"2026-08-26T21:00:00Z", condition:"USED" });
  });
});
