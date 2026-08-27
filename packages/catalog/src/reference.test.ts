import { describe, expect, test } from "vitest";
import { bestReferenceOffer, referenceCatalog, referenceOffers } from "./index";

describe("reference catalog", () => {
  test("contains diverse unique hardware including legacy real parts", () => {
    const categories = new Set(referenceCatalog.map((p) => p.category));
    for (const required of ["CPU","GPU","MOTHERBOARD","MEMORY","CASE","PSU","COOLER","STORAGE","NETWORK"])
      expect(categories.has(required)).toBe(true);
    const ids = referenceCatalog.map((p) => p.revisionId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["cpu-intel-i5-3470","mb-asus-p8h61-m-lx3-r2","ram-kingston-kvr16n11k2-16","case-silentiumpc-brutus-m10","psu-chieftec-gps-400aa","cooler-intel-e97379-003","hdd-wd5000aakx"])
      expect(referenceCatalog.some((p) => p.id === id)).toBe(true);
  });

  test("keeps price observations separate from hardware products", () => {
    expect(referenceOffers.length).toBeGreaterThan(0);
    const cpuOffer = bestReferenceOffer("cpu-intel-i5-3470", "USED");
    expect(cpuOffer?.amountPln).toBe(13);
    expect(cpuOffer?.source).toContain("Allegro");
    for (const product of referenceCatalog) expect((product as any).priceEur).toBeUndefined();
    expect(bestReferenceOffer("buildcores-d879b83e-b826-46ad-b008-a51b9674da07")).toBeUndefined();
  });
});
