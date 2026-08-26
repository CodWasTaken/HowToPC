import { describe,expect,test } from "vitest";
import { searchProducts } from "./index";
const sample=[{id:"cpu-am5",manufacturer:"AMD",displayName:"Ryzen AM5",category:"CPU",specs:{socket:"AM5"}},{id:"cpu-am4",manufacturer:"AMD",displayName:"Ryzen AM4",category:"CPU",specs:{socket:"AM4"}},{id:"board-am5",manufacturer:"ASUS",displayName:"B650 ATX",category:"MOTHERBOARD",specs:{socket:"AM5",memoryType:"DDR5",formFactor:"ATX"}}];
describe("catalog search",()=>{test("searches text and compatibility prefilters",()=>{
 expect(searchProducts(sample,{query:"Ryzen",socket:"AM5"}).map(p=>p.id)).toEqual(["cpu-am5"]);
 expect(searchProducts(sample,{category:"MOTHERBOARD",memoryType:"DDR5"}).map(p=>p.id)).toEqual(["board-am5"]);
});});
