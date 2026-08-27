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
  test("allows safe construction from an empty build", () => {
    for (const id of ["case-atx-340", "cpu-am5-7600", "mb-b650-atx", "ssd-nvme-2tb"]) {
      const result = addOne([], id);
      expect(result.committed, id).toBe(true);
      expect(result.decision.state, id).toBe("ALLOWED");
    }
  });

  test("distinguishes known conflicts from required unknown facts", () => {
    const cpuOnly = addOne([], "cpu-am5-7600").lines;
    const mismatch = addOne(cpuOnly, "mb-asus-p8h61-m-lx3-r2");
    expect(mismatch.committed).toBe(false);
    expect(mismatch.decision.state).toBe("BLOCKED_INCOMPATIBLE");

    const unknownBoard = [{ productId: "buildcores-a750515d-6abd-4126-9830-e2700b884aed", quantity: 1 }, { productId: "gpu-value-270", quantity: 1 }];
    const secondGpu = addOne(unknownBoard, "gpu-value-270");
    expect(secondGpu.committed).toBe(false);
    expect(secondGpu.decision.state).toBe("BLOCKED_UNKNOWN");
  });

  test("allows removing the final part from an incomplete build", () => {
    const partial = addOne([], "case-atx-340");
    const removed = removeOne(partial.lines, "case-atx-340");
    expect(removed.committed).toBe(true);
    expect(removed.lines).toEqual([]);
    expect(removed.report.status).toBe("UNKNOWN");
  });
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
