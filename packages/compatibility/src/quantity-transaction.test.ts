import { describe, expect, test } from "vitest";
import type { ReferenceProduct } from "@howtopc/catalog";
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

  test("blocks a second NVMe drive when motherboard M.2 capacity is unknown", () => {
    const storage:ReferenceProduct={
      id:"storage-capacity-unknown",revisionId:"storage-capacity-unknown-r1",manufacturer:"Test",
      displayName:"Unknown-capacity NVMe",category:"STORAGE",
      specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:1024**4},
    };
    const first=addOne([],storage);
    expect(first.committed).toBe(true);
    const second=addOne(first.lines,storage);
    expect(second.committed).toBe(false);
    expect(second.decision.state).toBe("BLOCKED_UNKNOWN");
    expect(maxSafeQuantity([],storage)).toBe(1);
  });

  test("does not invent repeatable capacity when no mount resource is known", () => {
    const fan:ReferenceProduct={
      id:"fan-capacity-unknown",revisionId:"fan-capacity-unknown-r1",manufacturer:"Test",
      displayName:"120mm test fan",category:"FAN",specs:{schemaVersion:1,sizeMm:120},
    };
    expect(maxSafeQuantity([],fan)).toBe(1);
    const first=addOne([],fan);
    expect(first.committed).toBe(true);
    const second=addOne(first.lines,fan);
    expect(second.committed).toBe(false);
    expect(second.decision.state).toBe("BLOCKED_UNKNOWN");
  });

  test("finds the maximum safe quantity for a repeatable part", () => {
    expect(maxSafeQuantity(base, "ram-ddr5-32")).toBe(2);
  });
});
