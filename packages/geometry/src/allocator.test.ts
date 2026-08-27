import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { expandPhysicalInstances } from "./instances";
import { deriveMountTopology } from "./topology";
import { allocateMounts } from "./allocator";

const product = (id: string) => {
  const found = referenceCatalog.find((item) => item.id === id);
  if (!found) throw new Error(`Missing test product ${id}`);
  return found;
};

function denseProducts() {
  return [
    product("case-atx-340"), product("mb-b650-atx"), product("cpu-am5-7600"), product("psu-atx-750"),
    product("ram-ddr5-32"), product("ram-ddr5-32"),
    product("gpu-value-270"), product("gpu-value-270"), product("nic-10gbe"),
    product("ssd-nvme-2tb"), product("ssd-nvme-2tb"), product("ssd-nvme-2tb"),
    product("hdd-sata-8tb"), product("hdd-sata-8tb"), product("hdd-sata-8tb"), product("hdd-sata-8tb"),
  ];
}

describe("mount allocator", () => {
  test("assigns every supported dense instance to a distinct logical mount", () => {
    const products = denseProducts();
    const instances = expandPhysicalInstances(products.filter((item) => item.category !== "CASE"));
    const result = allocateMounts(instances, deriveMountTopology(products));
    expect(result.issues).toEqual([]);
    expect(result.assignments).toHaveLength(instances.length);
    expect(new Set(result.assignments.map((assignment) => assignment.mountId)).size).toBe(result.assignments.length);
    expect(new Set(result.assignments.map((assignment) => assignment.instanceId)).size).toBe(instances.length);
  });

  test("reports over-capacity DIMM and M.2 instances instead of sharing mounts", () => {
    const products = [
      product("case-atx-340"), product("mb-b650-atx"),
      product("ram-ddr5-32"), product("ram-ddr5-32"), product("ram-ddr5-32"),
      product("ssd-nvme-2tb"), product("ssd-nvme-2tb"), product("ssd-nvme-2tb"), product("ssd-nvme-2tb"),
    ];
    const instances = expandPhysicalInstances(products.filter((item) => item.category !== "CASE"));
    const result = allocateMounts(instances, deriveMountTopology(products));
    const noMount = result.issues.filter((issue) => issue.code === "NO_MOUNT");
    expect(noMount).toHaveLength(3);
    expect(new Set(result.assignments.map((assignment) => assignment.mountId)).size).toBe(result.assignments.length);
  });
});
