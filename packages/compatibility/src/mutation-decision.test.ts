import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { evaluateBuild } from "./engine";
import { decideMutation } from "./mutation-decision";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
const build = (ids: readonly string[]) => ids.map((id) => {
  const product = byId.get(id);
  if (!product) throw new Error(`Missing test product ${id}`);
  return product;
});

describe("mutation decisions", () => {
  test("allows incomplete reports while distinguishing hard and unknown blockers", () => {
    expect(decideMutation(evaluateBuild([]))).toMatchObject({ allowed: true, state: "ALLOWED" });

    const socketMismatch = evaluateBuild(build(["cpu-am4-5600", "mb-b650-atx"]));
    expect(decideMutation(socketMismatch)).toMatchObject({ allowed: false, state: "BLOCKED_INCOMPATIBLE" });

    const unknownGpuTopology = evaluateBuild(build([
      "cpu-intel-i5-3470", "buildcores-a750515d-6abd-4126-9830-e2700b884aed",
      "ram-kingston-kvr16n11k2-16", "gpu-value-270", "gpu-value-270",
      "case-atx-340", "psu-atx-750", "cooler-intel-e97379-003",
    ]));
    expect(decideMutation(unknownGpuTopology)).toMatchObject({ allowed: false, state: "BLOCKED_UNKNOWN" });
  });
});
