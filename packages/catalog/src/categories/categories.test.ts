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

  test("supports sourced historical memory generations",()=>{
    expect(memorySpecSchema.safeParse({schemaVersion:1,type:"DDR2",modules:2,moduleCapacityBytes:2*1024**3,ecc:false}).success).toBe(true);
    expect(motherboardSpecSchema.safeParse({schemaVersion:1,socket:"LGA775",formFactor:"ATX",memoryType:"DDR2",dimmSlots:4,maxMemoryBytes:8*1024**3,pcieSlots:2,m2Slots:0,sataPorts:4}).success).toBe(true);
  });

  test("retains planned sourced facet fields",()=>{
    expect(cpuSpecSchema.parse({schemaVersion:1,socket:"AM5",tdpWatts:65,family:"Ryzen 7000",cores:6,threads:12,unlocked:true})).toMatchObject({unlocked:true});
    expect(motherboardSpecSchema.parse({schemaVersion:1,socket:"AM5",formFactor:"ATX",memoryType:"DDR5",dimmSlots:4,maxMemoryBytes:128*1024**3,ethernetSpeedMbps:2500})).toMatchObject({ethernetSpeedMbps:2500});
    expect(memorySpecSchema.parse({schemaVersion:1,type:"DDR5",modules:2,moduleCapacityBytes:16*1024**3,ecc:false,formFactor:"DIMM",casLatency:30,timings:"30-36-36-76"})).toMatchObject({formFactor:"DIMM",timings:"30-36-36-76"});    expect(gpuSpecSchema.parse({schemaVersion:1,lengthMm:300,slotWidth:2.5,tdpWatts:250,chipsetManufacturer:"AMD",videoOutputs:{hdmi_2_1:1}})).toMatchObject({chipsetManufacturer:"AMD",videoOutputs:{hdmi_2_1:1}});
    expect(storageSpecSchema.parse({schemaVersion:1,interface:"SATA",formFactor:"3.5\"",capacityBytes:2_000_000_000_000,storageType:"SSHD",sequentialReadMbps:210,cacheBytes:256_000_000})).toMatchObject({storageType:"SSHD",sequentialReadMbps:210,cacheBytes:256_000_000});
    expect(psuSpecSchema.parse({schemaVersion:1,formFactor:"ATX",wattage:850,connectors:{},efficiencyRating:"GOLD",modularity:"FULL",lengthMm:160,fanless:false})).toMatchObject({lengthMm:160});
    expect(caseSpecSchema.parse({schemaVersion:1,supportedMotherboardFormFactors:["ATX"],maxGpuLengthMm:350,maxCpuCoolerHeightMm:170,internal25Bays:2,internal35Bays:2,dimensionsMm:{width:230,height:480,depth:450}})).toMatchObject({internal25Bays:2,dimensionsMm:{width:230,height:480,depth:450}});
    expect(coolerSpecSchema.parse({schemaVersion:1,type:"AIR",supportedSockets:["AM5"],fanSizeMm:120,fanQuantity:2,minRpm:500,maxRpm:1800,minNoiseDb:12,maxNoiseDb:28})).toMatchObject({minNoiseDb:12});
  });

  test("rejects non-canonical memory form factors",()=>{
    expect(memorySpecSchema.safeParse({schemaVersion:1,type:"DDR5",modules:1,moduleCapacityBytes:16*1024**3,ecc:false,formFactor:"RDIMM"}).success).toBe(false);
  });
});