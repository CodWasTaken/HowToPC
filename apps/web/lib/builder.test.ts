import { describe, expect, test } from "vitest";
import {
  addPart,
  createBudgetHomelabBuild,
  createInitialBuild,
  removePart,
  replacePart,
} from "./builder";

describe("quantity-aware builder state", () => {
  test("migrates presets to quantity-one build lines", () => {
    const initial = createInitialBuild();
    expect(initial.report.status).toBe("COMPATIBLE");
    expect(initial.lines.every((line) => line.quantity === 1)).toBe(true);
    expect(initial.lines.find((line) => line.productId === "ssd-nvme-2tb")?.quantity).toBe(1);
  });

  test("increments an existing repeatable part", () => {
    const initial = createInitialBuild();
    const result = addPart(initial.lines, "ssd-nvme-2tb");
    expect(result.committed).toBe(true);
    expect(result.snapshot.lines.find((line) => line.productId === "ssd-nvme-2tb")?.quantity).toBe(2);
  });
  test("keeps distinct storage products installed together", () => {
    const initial = createInitialBuild();
    const result = addPart(initial.lines, "hdd-sata-8tb");
    expect(result.committed).toBe(true);
    expect(result.snapshot.lines.map((line) => line.productId)).toContain("ssd-nvme-2tb");
    expect(result.snapshot.lines.map((line) => line.productId)).toContain("hdd-sata-8tb");
  });

  test("decrements one unit and removes the line at quantity one", () => {
    const initial = createInitialBuild();
    const doubled = addPart(initial.lines, "ssd-nvme-2tb");
    const decremented = removePart(doubled.snapshot.lines, "ssd-nvme-2tb");
    expect(decremented.lines.find((line) => line.productId === "ssd-nvme-2tb")?.quantity).toBe(1);
    const removed = removePart(decremented.lines, "ssd-nvme-2tb");
    expect(removed.lines.some((line) => line.productId === "ssd-nvme-2tb")).toBe(false);
  });

  test("still rejects an incompatible singleton replacement", () => {
    const initial = createInitialBuild();
    const rejected = replacePart(initial.lines, "mb-asus-p8h61-m-lx3-r2");
    expect(rejected.committed).toBe(false);
    expect(rejected.snapshot.lines).toEqual(initial.lines);
  });
  test("totals native offers separately for PL and US markets", () => {
    const pl = createInitialBuild("PL");
    const us = createInitialBuild("US");
    expect(pl.pricedTotal).toEqual({ amount:5780, currency:"PLN", pricedItems:8, unpricedItems:0 });
    expect(us.pricedTotal).toEqual({ amount:1340, currency:"USD", pricedItems:8, unpricedItems:0 });
  });

  test("marks an incomplete market total instead of pricing missing offers as zero", () => {
    const usBudget = createBudgetHomelabBuild("US");
    expect(usBudget.pricedTotal.amount).toBeNull();
    expect(usBudget.pricedTotal.unpricedItems).toBeGreaterThan(0);
  });

  test("keeps the compatible used homelab preset", () => {
    const budget = createBudgetHomelabBuild();
    expect(budget.report.status).toBe("COMPATIBLE");
    expect(budget.pricedTotal).toMatchObject({ amount:451.99, currency:"PLN", unpricedItems:0 });
    expect(budget.lines.some((line) => line.productId === "cpu-intel-i5-3470")).toBe(true);
  });
});
