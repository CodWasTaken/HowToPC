import { describe, expect, test } from "vitest";
import { createBudgetHomelabBuild, createInitialBuild, removePart, replacePart } from "./builder";

describe("MVP builder state", () => {
  test("starts compatible and rejects an oversized GPU", () => {
    const initial = createInitialBuild();
    expect(initial.report.status).toBe("COMPATIBLE");
    const rejected = replacePart(initial.ids, "gpu-long-345");
    expect(rejected.committed).toBe(false);
    expect(rejected.snapshot.ids).toEqual(initial.ids);
  });

  test("calculates deterministic PLN reference price", () => {
    expect(createInitialBuild().totalPricePln).toBe(5780);
  });

  test("loads a compatible used homelab under 500 PLN", () => {
    const budget = createBudgetHomelabBuild();
    expect(budget.report.status).toBe("COMPATIBLE");
    expect(budget.totalPricePln).toBeCloseTo(451.99);
    expect(budget.ids).toContain("cpu-intel-i5-3470");
  });

  test("removes an optional installed network card", () => {
    const withNic = replacePart(createInitialBuild().ids, "nic-10gbe");
    expect(withNic.committed).toBe(true);
    const result = removePart(withNic.revisionIds, "nic-10gbe");
    expect(result.ids).not.toContain("nic-10gbe");
    expect(result.report.status).toBe("COMPATIBLE");
  });

  test("removing a required component leaves the build UNKNOWN", () => {
    const result = removePart(createInitialBuild().ids, "cpu-am5-7600");
    expect(result.ids).not.toContain("cpu-am5-7600");
    expect(result.report.status).toBe("UNKNOWN");
  });
});
