import { describe,expect,test } from "vitest";
import { applySafeReplacement } from "./index";
const good=["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"];
describe("safe build changes",()=>{
 test("previews invalid replacement without committing it",()=>{const result=applySafeReplacement(good,"gpu-long-345");expect(result.committed).toBe(false);expect(result.revisionIds).toEqual(good);expect(result.candidateIds).toContain("gpu-long-345");});
 test("commits a compatible case replacement",()=>{const result=applySafeReplacement(good,"case-atx-380");expect(result.committed).toBe(true);expect(result.revisionIds).toContain("case-atx-380");});
});
