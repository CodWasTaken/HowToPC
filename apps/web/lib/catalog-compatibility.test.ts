import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { createInitialBuild, type BuilderInput } from "./builder";
import { catalogApplyState, sortCatalogForBuild } from "./catalog-compatibility";

const product = (id: string) => {
  const found = referenceCatalog.find((item) => item.id === id);
  if (!found) throw new Error(`Missing test product ${id}`);
  return found;
};

describe("catalog apply-now compatibility", () => {
  test("allows useful parts to start an empty build", () => {
    expect(catalogApplyState([], "case-atx-340")).toBe("CAN_APPLY");
    expect(catalogApplyState([], "cpu-am5-7600")).toBe("CAN_APPLY");
  });

  test("distinguishes required unknown facts from known incompatibility", () => {
    const partial: BuilderInput = [
      { productId: "cpu-intel-i5-3470", quantity: 1 },
      { productId: "buildcores-a750515d-6abd-4126-9830-e2700b884aed", quantity: 1 },
      { productId: "gpu-value-270", quantity: 1 },
    ];
    expect(catalogApplyState(partial, "gpu-value-270")).toBe("BLOCKED_UNKNOWN");
    expect(catalogApplyState(partial, "mb-b650-atx")).toBe("BLOCKED_INCOMPATIBLE");
  });

  test("sorts allowed, then unknown, then incompatible while staying stable", () => {
    const partial: BuilderInput = [
      { productId: "cpu-intel-i5-3470", quantity: 1 },
      { productId: "buildcores-a750515d-6abd-4126-9830-e2700b884aed", quantity: 1 },
      { productId: "gpu-value-270", quantity: 1 },
    ];
    const input = [product("mb-b650-atx"), product("gpu-value-270"), product("case-atx-340")];
    expect(sortCatalogForBuild(partial, input).map((item) => item.id)).toEqual([
      "case-atx-340", "gpu-value-270", "mb-b650-atx",
    ]);
  });

  test("keeps the current coherent motherboard allowed and rejects a mismatched one", () => {
    const initial = createInitialBuild();
    expect(catalogApplyState(initial.lines, "mb-b650-atx")).toBe("CAN_APPLY");
    expect(catalogApplyState(initial.lines, "mb-asus-p8h61-m-lx3-r2")).toBe("BLOCKED_INCOMPATIBLE");
  });
});
