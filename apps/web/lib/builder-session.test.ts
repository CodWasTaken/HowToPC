import { describe, expect, test } from "vitest";
import type { ReferenceProduct } from "@howtopc/catalog";
import {
  addProductToSession,
  createBuilderSession,
  decrementProductInSession,
  sessionSnapshot,
} from "./builder-session";

const externalStorage:ReferenceProduct={
  id:"session-external-storage",revisionId:"session-external-storage-r1",
  manufacturer:"External",displayName:"Session NVMe",category:"STORAGE",
  specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:1024**4},
};

describe("builder session",()=>{
  test("retains broad products independently of the current search page",()=>{
    const initial=createBuilderSession([{productId:"mb-b650-atx",quantity:1}]);
    const first=addProductToSession(initial,externalStorage);
    expect(first.mutation.committed).toBe(true);
    expect(first.session.knownProducts[externalStorage.id]).toBe(externalStorage);
    expect(sessionSnapshot(first.session).products.map((product)=>product.id)).toContain(externalStorage.id);

    const second=addProductToSession(first.session,externalStorage);
    expect(second.session.lines).toContainEqual({productId:externalStorage.id,quantity:2});
    const decremented=decrementProductInSession(second.session,externalStorage.id);
    expect(decremented.session.lines).toContainEqual({productId:externalStorage.id,quantity:1});
  });

  test("clearing lines does not invalidate retained canonical products",()=>{
    const added=addProductToSession(createBuilderSession(),externalStorage);
    const cleared={...added.session,lines:[]};
    expect(cleared.knownProducts[externalStorage.id]).toBe(externalStorage);
    expect(sessionSnapshot(cleared).products).toEqual([]);
  });
});
