import { describe, expect, test } from "vitest";
import * as catalog from "./index";

describe("offer observations", () => {
  test("selects the cheapest matching PLN offer without losing provenance", () => {
    const bestOfferForProduct = (catalog as any).bestOfferForProduct;
    expect(bestOfferForProduct).toBeDefined();
    const offers = [
      { id:"a", productId:"cpu-old", source:"market-a", condition:"USED", amountPln:45, observedAt:"2026-08-26T20:00:00Z", kind:"LISTING" },
      { id:"b", productId:"cpu-old", source:"market-b", condition:"USED", amountPln:35, observedAt:"2026-08-26T21:00:00Z", kind:"LISTING" },
      { id:"c", productId:"cpu-old", source:"shop", condition:"NEW", amountPln:140, observedAt:"2026-08-26T22:00:00Z", kind:"LISTING" },
    ];
    const result = bestOfferForProduct?.(offers, "cpu-old", "USED");
    expect(result?.amountPln).toBe(35);
    expect(result?.source).toBe("market-b");
    expect(result?.observedAt).toBe("2026-08-26T21:00:00Z");
  });
});
