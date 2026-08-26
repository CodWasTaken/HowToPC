import { describe,expect,test } from "vitest";
import { createInitialBuild,replacePart } from "./builder";
describe("MVP builder state",()=>{
 test("starts compatible and rejects an oversized GPU",()=>{const initial=createInitialBuild();expect(initial.report.status).toBe("COMPATIBLE");const rejected=replacePart(initial.ids,"gpu-long-345");expect(rejected.committed).toBe(false);expect(rejected.snapshot.ids).toEqual(initial.ids);});
 test("calculates deterministic reference price",()=>expect(createInitialBuild().totalPriceEur).toBe(1340));
});
