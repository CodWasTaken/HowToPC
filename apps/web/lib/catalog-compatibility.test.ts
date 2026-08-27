import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { createInitialBuild } from "./builder";
import { catalogApplyState, sortCatalogForBuild } from "./catalog-compatibility";

describe("catalog apply-now compatibility", () => {
  test("marks safe choices green and sorts them before rejected choices", () => {
    const initial = createInitialBuild();
    const sorted = sortCatalogForBuild(initial.ids, referenceCatalog);
    expect(catalogApplyState(initial.ids, "mb-b650-atx")).toBe("CAN_APPLY");
    expect(catalogApplyState(initial.ids, "mb-asus-p8h61-m-lx3-r2")).toBe("CANNOT_APPLY");
    const states = sorted.map((product) => catalogApplyState(initial.ids, product.id));
    const firstRed = states.indexOf("CANNOT_APPLY");
    const lastGreen = states.lastIndexOf("CAN_APPLY");
    expect(firstRed).toBeGreaterThan(lastGreen);
  });

  test("keeps stable source ordering inside green and red groups", () => {
    const initial = createInitialBuild();
    const subset = referenceCatalog.filter((product) => ["mb-b650-atx", "mb-asus-p8h61-m-lx3-r2"].includes(product.id));
    expect(sortCatalogForBuild(initial.ids, subset).map((product) => product.id)).toEqual([
      "mb-b650-atx",
      "mb-asus-p8h61-m-lx3-r2",
    ]);
  });
});
