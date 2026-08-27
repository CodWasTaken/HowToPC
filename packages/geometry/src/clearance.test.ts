import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import * as geometry from "./index";

const baseIds = [
  "cpu-am5-7600", "mb-b650-atx", "ram-ddr5-32", "gpu-mid-300",
  "case-atx-340", "psu-atx-750", "cooler-air-158", "ssd-nvme-2tb",
];

function products(ids = baseIds) {
  return referenceCatalog.filter((product) => ids.includes(product.id));
}

describe("mechanical clearance measurements", () => {
  test("reports remaining GPU and cooler headroom in millimetres", () => {
    const measure = (geometry as any).measureClearances;
    expect(measure).toBeDefined();
    const result = measure?.(products());
    expect(result?.find((item: any) => item.id === "gpu-length")?.remainingMm).toBe(40);
    expect(result?.find((item: any) => item.id === "cooler-height")?.remainingMm).toBe(12);
  });

  test("marks a component over the case limit as failed clearance", () => {
    const measure = (geometry as any).measureClearances;
    const ids = baseIds.map((id) => id === "gpu-mid-300" ? "gpu-long-345" : id);
    const result = measure?.(products(ids));
    const gpu = result?.find((item: any) => item.id === "gpu-length");
    expect(gpu?.remainingMm).toBe(-5);
    expect(gpu?.status).toBe("FAIL");
  });
});

test("uses the longest installed GPU for case clearance", () => {
  const pick = (id: string) => {
    const found = referenceCatalog.find((product) => product.id === id);
    if (!found) throw new Error(`Missing ${id}`);
    return found;
  };
  const build = products().filter((product) => product.category !== "GPU").concat([
    pick("gpu-mid-300"), pick("gpu-long-345"),
  ]);
  const gpu = (geometry as any).measureClearances(build)
    .find((item: any) => item.id === "gpu-length");
  expect(gpu?.remainingMm).toBe(-5);
  expect(gpu?.status).toBe("FAIL");
});
