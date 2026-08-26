import { describe,expect,test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { buildParametricScene } from "./index";
describe("parametric digital twin",()=>{test("creates positive millimetre boxes",()=>{
 const ids=["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"];
 const scene=buildParametricScene(referenceCatalog.filter(p=>ids.includes(p.id)));
 expect(scene.caseBox.size.every(n=>n>0)).toBe(true); expect(scene.components.every(box=>box.size.every(n=>n>0))).toBe(true);
});});
