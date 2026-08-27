import { describe, expect, test } from "vitest";
import { motherboardSpecSchema } from "@howtopc/catalog";
import { calculateResourceUsage } from "./resources";

describe("build resource accounting", () => {
  test("counts DIMM and storage usage from quantity-aware lines", () => {
    const usage = calculateResourceUsage([
      { productId: "mb-b650-atx", quantity: 1 },
      { productId: "ram-ddr5-32", quantity: 2 },
      { productId: "ssd-nvme-2tb", quantity: 2 },
    ]);
    expect(usage.dimm).toMatchObject({ used: 4, available: 4 });
    expect(usage.memoryBytes.used).toBe(64 * 1024 ** 3);
    expect(usage.m2).toMatchObject({ used: 2, available: 3 });
    expect(usage.sata).toMatchObject({ used: 0, available: 4 });
  });

  test("motherboard specs can expose known GPU-capable slot capacity", () => {
    const parsed = motherboardSpecSchema.safeParse({
      schemaVersion: 1, socket: "AM5", formFactor: "ATX", memoryType: "DDR5",
      dimmSlots: 4, maxMemoryBytes: 192 * 1024 ** 3, pcieSlots: 3,
      gpuPcieSlots: 2, m2Slots: 3, sataPorts: 4,
    });
    expect(parsed.success).toBe(true);
  });
});
