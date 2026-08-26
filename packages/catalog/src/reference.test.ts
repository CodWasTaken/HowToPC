import { describe,expect,test } from "vitest";
import { referenceCatalog } from "./index";
describe("reference catalog",()=>{test("contains diverse unique hardware",()=>{
 const categories=new Set(referenceCatalog.map(p=>p.category));
 for(const required of ["CPU","GPU","MOTHERBOARD","MEMORY","CASE","PSU","COOLER","STORAGE","NETWORK"])expect(categories.has(required)).toBe(true);
 const ids=referenceCatalog.map(p=>p.revisionId); expect(new Set(ids).size).toBe(ids.length);
});});
