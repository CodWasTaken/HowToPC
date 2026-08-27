import { describe, expect, test } from "vitest";
import {
  addOne,
  maxSafeQuantity,
  removeOne,
  replaceSingleton,
  type BuildLine,
} from "./index";

const base: BuildLine[] = [
  { productId: "cpu-am5-7600", quantity: 1 },
  { productId: "mb-b650-atx", quantity: 1 },
  { productId: "ram-ddr5-32", quantity: 1 },
  { productId: "gpu-mid-300", quantity: 1 },
  { productId: "case-atx-340", quantity: 1 },
  { productId: "psu-atx-750", quantity: 1 },
  { productId: "cooler-air-158", quantity: 1 },
  { productId: "ssd-nvme-2tb", quantity: 1 },
];

describe("quantity-safe build mutations", () => {
  test("increments and decrements repeatable hardware", () => {
    const added = addOne(base, "ssd-nvme-2tb");
    expect(added.committed).toBe(true);
    expect(added.lines.find((line) => line.productId === "ssd-nvme-2tb")?.quantity).toBe(2);
    expect(removeOne(added.lines, "ssd-nvme-2tb").lines).toEqual(base);
  });

  test("rejects an incompatible singleton replacement", () => {
    const result = replaceSingleton(base, "mb-asus-p8h61-m-lx3-r2");
    expect(result.committed).toBe(false);
    expect(result.lines).toEqual(base);
  });

  test("finds the maximum safe quantity for a repeatable part", () => {
    expect(maxSafeQuantity(base, "ram-ddr5-32")).toBe(2);
  });
});
