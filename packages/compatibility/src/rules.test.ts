import { describe,expect,test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { evaluateBuild } from "./index";
const select=(ids:string[])=>referenceCatalog.filter(p=>ids.includes(p.id));
describe("MVP compatibility rules",()=>{
 test("accepts a coherent AM5 build",()=>expect(evaluateBuild(select(["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"])).status).toBe("COMPATIBLE"));
 test("explains key hard failures",()=>{const report=evaluateBuild(select(["cpu-am4-5600","mb-b650-itx","ram-ddr4-32","gpu-long-345","case-itx-320","psu-atx-750","cooler-air-158"]));expect(report.status).toBe("INCOMPATIBLE");expect(report.results.filter(r=>r.status==="INCOMPATIBLE").length).toBeGreaterThanOrEqual(4);});
});
