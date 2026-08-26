import { describe,expect,test } from "vitest";
import { createInitialBuild,replacePart } from "./builder";
describe("MVP builder state",()=>{
 test("starts compatible and rejects an oversized GPU",()=>{const initial=createInitialBuild();expect(initial.report.status).toBe("COMPATIBLE");const rejected=replacePart(initial.ids,"gpu-long-345");expect(rejected.committed).toBe(false);expect(rejected.snapshot.ids).toEqual(initial.ids);});
 test("calculates deterministic reference price",()=>expect(createInitialBuild().totalPriceEur).toBe(1340));
});

import * as builder from "./builder";

test("removes an optional installed network card", () => {
  const remove = (builder as any).removePart;
  expect(remove).toBeDefined();
  const withNic = replacePart(createInitialBuild().ids, "nic-10gbe");
  expect(withNic.committed).toBe(true);
  const result = remove?.(withNic.revisionIds, "nic-10gbe");
  expect(result?.ids).not.toContain("nic-10gbe");
  expect(result?.report.status).toBe("COMPATIBLE");
});

test("removing a required component leaves the build UNKNOWN", () => {
  const remove = (builder as any).removePart;
  const result = remove?.(createInitialBuild().ids, "cpu-am5-7600");
  expect(result?.ids).not.toContain("cpu-am5-7600");
  expect(result?.report.status).toBe("UNKNOWN");
});
