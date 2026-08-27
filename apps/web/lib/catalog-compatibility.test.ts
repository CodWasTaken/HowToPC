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

    const firstRed = sorted.findIndex((product) => catalogApplyState(initial.ids, product.id) === "CANNOT_APPLY");
    const lastGreen = sorted.findLastIndex((product) => catalogApplyState(initial.ids, product.id) === "CAN_APPLY");
    expect(firstRed).toBeGreaterThan(lastGreen);
  });
});
