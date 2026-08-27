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
  test("supports DDR3-era memory and motherboards",()=>{
    expect(memorySpecSchema.safeParse({schemaVersion:1,type:"DDR3",modules:2,moduleCapacityBytes:8*1024**3,speedMt:1600,ecc:false}).success).toBe(true);
    expect(motherboardSpecSchema.safeParse({schemaVersion:1,socket:"LGA1155",formFactor:"MATX",memoryType:"DDR3",dimmSlots:2,maxMemoryBytes:16*1024**3,pcieSlots:3,m2Slots:0,sataPorts:4}).success).toBe(true);
  });
  test("retains sourced category fields used by faceted search",()=>{
    const cpu=cpuSpecSchema.parse({schemaVersion:1,socket:"AM5",tdpWatts:65,family:"Ryzen 7000",cores:6,threads:12,releaseYear:2023});
    expect(cpu).toMatchObject({family:"Ryzen 7000",cores:6,threads:12,releaseYear:2023});
    const storage=storageSpecSchema.parse({schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:2*1024**4,driveType:"SSD",readMbps:7450,writeMbps:6900,pcieGeneration:4});
    expect(storage).toMatchObject({driveType:"SSD",readMbps:7450,writeMbps:6900,pcieGeneration:4});
    const psu=psuSpecSchema.parse({schemaVersion:1,formFactor:"ATX",wattage:850,connectors:{},efficiencyRating:"GOLD",modularity:"FULL",atxVersion:"3.1"});
    expect(psu).toMatchObject({efficiencyRating:"GOLD",modularity:"FULL",atxVersion:"3.1"});
  });

});
