import { describe, expect, test } from "vitest";
import {
  clampCatalogPageSize,
  createCatalogRepository,
} from "./catalog-repository";

const GENERATED_CPU_ID="buildcores-1108a9a6-5414-44d0-a9ca-add54f8a80fa";
const SOURCE_ID="1108a9a6-5414-44d0-a9ca-add54f8a80fa";
const MPN="AD786KYBI44JC";

describe("catalog repository",()=>{
  test("loads generated real category shards without fixture products",async()=>{
    const repository=createCatalogRepository();
    const cpus=await repository.loadCategory("CPU");
    expect(cpus.length).toBeGreaterThan(100);
    expect(cpus.some((product)=>product.id==="cpu-am5-7600")).toBe(false);
    expect(cpus.every((product)=>product.source?.evidence!=="REFERENCE")).toBe(true);
  });

  test("resolves an id through the compact id index",async()=>{
    const repository=createCatalogRepository();
    const product=await repository.getById(GENERATED_CPU_ID);
    expect(product).toMatchObject({
      id:GENERATED_CPU_ID,
      category:"CPU",
      manufacturer:"AMD",
    });
  });

  test("searches stable identifiers including MPN and source id",async()=>{
    const repository=createCatalogRepository();
    const byMpn=await repository.searchIdentity(MPN,"CPU");
    const bySource=await repository.searchIdentity(SOURCE_ID,"CPU");
    expect(byMpn.map((product)=>product.id)).toContain(GENERATED_CPU_ID);
    expect(bySource.map((product)=>product.id)).toContain(GENERATED_CPU_ID);
  });

  test("clamps page size to the public 1..100 range",()=>{
    expect(clampCatalogPageSize(-5)).toBe(1);
    expect(clampCatalogPageSize(0)).toBe(1);
    expect(clampCatalogPageSize(25)).toBe(25);
    expect(clampCatalogPageSize(500)).toBe(100);
  });
});
