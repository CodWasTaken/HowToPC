import { describe, expect, test } from "vitest";
import { caseSpecSchema,coolerSpecSchema,cpuSpecSchema,fanSpecSchema,gpuSpecSchema,memorySpecSchema,motherboardSpecSchema,networkSpecSchema,psuSpecSchema,storageSpecSchema } from "../index";
describe("P0 hardware schemas",()=>{
  test("rejects invalid specs",()=>{
    expect(cpuSpecSchema.safeParse({schemaVersion:1,socket:"AM5",tdpWatts:-1}).success).toBe(false);
    expect(gpuSpecSchema.safeParse({schemaVersion:1,lengthMm:-1,slotWidth:2,tdpWatts:200}).success).toBe(false);
    expect(memorySpecSchema.safeParse({schemaVersion:1,type:"DDR5",modules:0,moduleCapacityBytes:1}).success).toBe(false);
    expect(psuSpecSchema.safeParse({schemaVersion:1,formFactor:"ATX",wattage:0}).success).toBe(false);
  });
  test("all MVP schemas require version 1",()=>{
    for(const schema of [caseSpecSchema,coolerSpecSchema,cpuSpecSchema,fanSpecSchema,gpuSpecSchema,memorySpecSchema,motherboardSpecSchema,networkSpecSchema,psuSpecSchema,storageSpecSchema]) expect(schema.safeParse({schemaVersion:2}).success).toBe(false);
  });
});
