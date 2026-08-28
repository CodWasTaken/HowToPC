import { describe, expect, test } from "vitest";
import type { BuildLine } from "@howtopc/compatibility";
import { runAgentChange } from "./agent-change";
import { createBuilderSession, sessionSnapshot } from "./builder-session";

describe("agent build changes", () => {
  test("constructs a build from empty state", () => {
    expect(runAgentChange([], { componentId: "case-atx-340", action: "replace" }).committed).toBe(true);
    expect(runAgentChange([], { componentId: "cpu-am5-7600", action: "replace" }).committed).toBe(true);
  });

  test("reports a known incompatible singleton replacement", () => {
    const cpuOnly: BuildLine[] = [{ productId: "cpu-am5-7600", quantity: 1 }];
    const result = runAgentChange(cpuOnly, { componentId: "mb-asus-p8h61-m-lx3-r2", action: "replace" });
    expect(result).toMatchObject({ committed: false, error: "CHANGE_REJECTED" });
    expect(result.decision?.state).toBe("BLOCKED_INCOMPATIBLE");
  });

  test("rolls back an atomic multi-add when a later increment is blocked", () => {
    const partial: BuildLine[] = [
      { productId: "buildcores-a750515d-6abd-4126-9830-e2700b884aed", quantity: 1 },
    ];
    const result = runAgentChange(partial, { componentId: "gpu-value-270", action: "add", quantity: 2 });
    expect(result.committed).toBe(false);
    expect(result.decision?.state).toBe("BLOCKED_UNKNOWN");
    expect(result.build.lines).toEqual(partial);
  });
});


test("agent changes retain a broad canonical product in the builder session",()=>{
  const broad={
    id:"agent-external-storage",revisionId:"agent-external-storage-r1",
    manufacturer:"External",displayName:"External NVMe",category:"STORAGE" as const,
    specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:1024**4},
    source:{label:"BuildCores OpenDB",evidence:"OPEN_DATA" as const},
  };
  const empty=createBuilderSession();
  const added=runAgentChange(empty,{componentId:broad.id,action:"add"},broad);
  expect(added.committed).toBe(true);
  expect(added.session.knownProducts[broad.id]).toEqual(broad);
  expect(sessionSnapshot(added.session).products[0]?.id).toBe(broad.id);
  const incremented=runAgentChange(added.session,{componentId:broad.id,action:"add"});
  expect(incremented.session.lines).toContainEqual({productId:broad.id,quantity:2});
  const decremented=runAgentChange(incremented.session,{componentId:broad.id,action:"decrement"});
  expect(decremented.session.lines).toContainEqual({productId:broad.id,quantity:1});
});
