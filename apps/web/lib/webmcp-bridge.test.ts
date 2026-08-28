import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { createBuilderSession, type BuilderSession } from "./builder-session";
import { createWebMcpBridge } from "./webmcp-bridge";

const product = (id:string) => {
  const found = referenceCatalog.find((item) => item.id === id);
  if (!found) throw new Error(`Missing test product ${id}`);
  return found;
};

function liveAccess(initial:BuilderSession) {
  let current = initial;
  return {
    access:{getSession:()=>current,setSession:(next:BuilderSession)=>{current=next;}},
    get:()=>current,
    set:(next:BuilderSession)=>{current=next;},
  };
}

describe("production WebMCP bridge", () => {
  test("one bridge instance always reads the latest human builder session", () => {
    const live=liveAccess(createBuilderSession());
    const bridge=createWebMcpBridge(live.access);
    expect((bridge.getState() as any).lines).toEqual([]);

    live.set(createBuilderSession([{productId:"case-atx-340",quantity:1}]));
    expect((bridge.getState() as any).lines).toEqual([{productId:"case-atx-340",quantity:1}]);
  });
  test("state and mutation outputs omit legacy pricing", async () => {
    const gpu=product("gpu-mid-300");
    const live=liveAccess(createBuilderSession(
      [{productId:"case-atx-340",quantity:1}],
      {[gpu.id]:gpu},
    ));
    const bridge=createWebMcpBridge(live.access);
    expect(JSON.stringify(bridge.getState())).not.toContain("totalPricePln");

    const result=await bridge.addProduct({productId:gpu.id});
    expect((result as any).committed).toBe(true);
    expect(live.get().lines).toContainEqual({productId:gpu.id,quantity:1});
    expect(JSON.stringify(result)).not.toContain("totalPricePln");
  });

  test("geometry diagnostics stay explicit when a case is absent", () => {
    const live=liveAccess(createBuilderSession([{productId:"cpu-am5-7600",quantity:1}]));
    const bridge=createWebMcpBridge(live.access);
    expect(bridge.geometryDiagnostics()).toMatchObject({
      available:false,
      reason:"CASE_REQUIRED",
      clearances:[],placementIssues:[],collisions:[],
    });
  });
});
