import { describe, expect, test } from "vitest";
import type { ReferenceProduct } from "@howtopc/catalog";
import {
  addOne,
  calculateResourceUsage,
  createCatalogResolver,
  expandBuildLines,
  overlayCatalogResolver,
  previewAdd,
  referenceCatalogResolver,
  type BuildLine,
} from "./index";

const TiB=1024**4;
const externalStorage:ReferenceProduct={
  id:"external-storage-1",revisionId:"external-storage-1-r1",
  manufacturer:"External",displayName:"External 1TB NVMe",category:"STORAGE",
  specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:TiB},
};
const boardOnly:BuildLine[]=[{productId:"mb-b650-atx",quantity:1}];

describe("catalog resolver",()=>{
  test("creates and overlays resolvers without losing base products",()=>{
    const standalone=createCatalogResolver([externalStorage]);
    expect(standalone.get(externalStorage.id)).toBe(externalStorage);
    expect(standalone.get("cpu-am5-7600")).toBeUndefined();
    const overlay=overlayCatalogResolver(referenceCatalogResolver,[externalStorage]);
    expect(overlay.get(externalStorage.id)).toBe(externalStorage);
    expect(overlay.get("cpu-am5-7600")?.id).toBe("cpu-am5-7600");
  });

  test("evaluates an explicit external candidate and resolves it after commit",()=>{
    const preview=previewAdd(boardOnly,externalStorage,referenceCatalogResolver);
    expect(preview.committed).toBe(true);
    expect(preview.candidateLines).toContainEqual({productId:externalStorage.id,quantity:1});

    const first=addOne(boardOnly,externalStorage,referenceCatalogResolver);
    expect(first.committed).toBe(true);
    const sessionResolver=overlayCatalogResolver(referenceCatalogResolver,[externalStorage]);
    const second=addOne(first.lines,externalStorage.id,sessionResolver);
    expect(second.committed).toBe(true);
    expect(second.lines).toContainEqual({productId:externalStorage.id,quantity:2});

    const usage=calculateResourceUsage(second.lines,sessionResolver);
    expect(usage.m2).toMatchObject({used:2,available:3});
  });

  test("fails explicitly when an installed product id cannot be resolved",()=>{
    expect(()=>expandBuildLines([
      {productId:"missing-product",quantity:1},
    ],referenceCatalogResolver)).toThrow(/Unknown catalog product: missing-product/);
  });
});
