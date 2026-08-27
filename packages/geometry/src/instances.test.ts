import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { expandPhysicalInstances, sizeForProduct } from "./instances";

const product = (id: string) => {
  const found = referenceCatalog.find((item) => item.id === id);
  if (!found) throw new Error(`Missing test product ${id}`);
  return found;
};

describe("physical geometry instances", () => {
  test("uses global X width, Y vertical, Z depth dimensions", () => {
    expect(sizeForProduct(product("gpu-mid-300"))).toEqual([50.8, 120, 300]);
    expect(sizeForProduct(product("ram-ddr5-32"))).toEqual([8, 45, 135]);
    expect(sizeForProduct(product("ssd-nvme-2tb"))).toEqual([4, 22, 80]);
  });

  test("expands kits and duplicate products into unique physical instances", () => {
    const ram = product("ram-ddr5-32");
    const gpu = product("gpu-value-270");
    const storage = product("ssd-nvme-2tb");
    const instances = expandPhysicalInstances([ram, ram, gpu, gpu, storage, storage]);
    expect(instances.filter((item) => item.category === "MEMORY")).toHaveLength(4);
    expect(instances.filter((item) => item.category === "GPU")).toHaveLength(2);
    expect(instances.filter((item) => item.category === "STORAGE")).toHaveLength(2);
    expect(new Set(instances.map((item) => item.id)).size).toBe(instances.length);
  });
});
