import { describe, expect, test } from "vitest";
import { cpuSpecSchema, memorySpecSchema, motherboardSpecSchema } from "@howtopc/catalog";
import * as ingestion from "./index";

const map = (category: string, raw: unknown) => (ingestion as any).mapBuildCoresProduct?.(category, raw);

describe("BuildCores OpenDB mapping", () => {
  test("normalizes CPU facts and source identifiers", () => {
    const result = map("CPU", {
      opendb_id:"cpu-1", socket:"LGA 1700",
      specifications:{tdp:65,integratedGraphics:{model:"Intel UHD 770"}},
      metadata:{name:"Intel Example CPU",manufacturer:"Intel",part_numbers:["BX-CPU-1"]},
      general_product_information:{manufacturer_url:"https://example.test/cpu"},
    });
    expect(result?.category).toBe("CPU");
    expect(result?.manufacturer).toBe("Intel");
    expect(result?.displayName).toBe("Intel Example CPU");
    expect(result?.specs.socket).toBe("LGA1700");
    expect(result?.specs.tdpWatts).toBe(65);
    expect(result?.specs.integratedGraphics).toBe(true);
    expect(result?.identifiers).toContainEqual({type:"SOURCE_ID",value:"cpu-1",sourceId:"buildcores-opendb"});
    expect(cpuSpecSchema.safeParse(result?.specs).success).toBe(true);
  });

  test("normalizes RAM capacity per module and ECC state", () => {
    const result = map("RAM", {
      opendb_id:"ram-1", modules:{quantity:2,capacity_gb:24}, speed:6400, ram_type:"DDR5", ecc:"Non-ECC",
      metadata:{name:"TEAMGROUP Example 48GB",manufacturer:"TEAMGROUP",part_numbers:["RAM-1"]},
    });
    expect(result?.category).toBe("MEMORY");
    expect(result?.specs.modules).toBe(2);
    expect(result?.specs.moduleCapacityBytes).toBe(24 * 1024 ** 3);
    expect(result?.specs.ecc).toBe(false);
    expect(memorySpecSchema.safeParse(result?.specs).success).toBe(true);
  });

  test("normalizes motherboard form factor and slot counts", () => {
    const result = map("Motherboard", {
      opendb_id:"mb-1", socket:"LGA 1700", form_factor:"Micro ATX",
      memory:{max:64,ram_type:"DDR4",slots:2},
      storage_devices:{sata_6_gb_s:4,sata_3_gb_s:0},
      pcie_slots:[{quantity:1},{quantity:2}], m2_slots:[{key:"M"},{key:"M"}],
      metadata:{name:"ASUS Example B760M",manufacturer:"ASUS",part_numbers:["MB-1"]},
    });
    expect(result?.category).toBe("MOTHERBOARD");
    expect(result?.specs).toMatchObject({socket:"LGA1700",formFactor:"MATX",memoryType:"DDR4",dimmSlots:2,pcieSlots:3,m2Slots:2,sataPorts:4});
    expect(result?.specs.maxMemoryBytes).toBe(64 * 1024 ** 3);
    expect(motherboardSpecSchema.safeParse(result?.specs).success).toBe(true);
  });

  test("rejects unsupported or ambiguous source values instead of guessing", () => {
    expect(map("RAM", {opendb_id:"bad",ram_type:"DDR6",modules:{quantity:1,capacity_gb:1},ecc:"Unknown",metadata:{name:"Future RAM",manufacturer:"X"}})).toBeNull();
    expect(map("Keyboard", {opendb_id:"bad"})).toBeNull();
  });
});
