import { describe, expect, test } from "vitest";
import { fanSpecSchema } from "@howtopc/catalog";
import { mapBuildCoresProduct } from "./buildcores";

const meta = (name:string, manufacturer:string) => ({ name, manufacturer, part_numbers:[] });

describe("broad BuildCores normalization", () => {
  test("maps explicit GPU dimensions, power, and connectors", () => {
    const result = mapBuildCoresProduct("GPU", {
      opendb_id:"gpu-1", metadata:meta("RX 570", "ASUS"), length:240, tdp:150, total_slot_width:2,
      power_connectors:{ pcie_6_pin:0, pcie_8_pin:1, pcie_12VHPWR:0, pcie_12V_2x6:0 },
    });
    expect(result).toMatchObject({ category:"GPU", specs:{ lengthMm:240, slotWidth:2, tdpWatts:150, powerConnectors:{ PCIE_8:1 } } });
  });

  test("maps NVMe, SATA, and SAS storage without guessing unsupported interfaces", () => {
    const nvme = mapBuildCoresProduct("Storage", { opendb_id:"s1", metadata:meta("NVMe", "Inland"), capacity:512, form_factor:"M.2-2280", interface:"M.2 PCIe 3.0 x4", nvme:true });
    const sata = mapBuildCoresProduct("Storage", { opendb_id:"s2", metadata:meta("SATA", "WD"), capacity:1000, form_factor:'2.5"', interface:"SATA 6.0 Gb/s", nvme:false });
    const pata = mapBuildCoresProduct("Storage", { opendb_id:"s3", metadata:meta("PATA", "Old"), capacity:80, form_factor:'3.5"', interface:"PATA 100", nvme:false });
    expect(nvme?.specs).toMatchObject({ interface:"NVME", formFactor:"M.2-2280" });
    expect(sata?.specs).toMatchObject({ interface:"SATA" });
    expect(pata).toBeNull();
  });

  test("maps supported PSU form factors and native connector counts", () => {
    const result = mapBuildCoresProduct("PSU", { opendb_id:"p1", metadata:meta("Earthwatts 550", "Antec"), wattage:550, form_factor:"ATX", connectors:{ eps_8_pin:1, pcie_6_plus_2_pin:2, pcie_12vhpwr:0 } });
    expect(result?.specs).toMatchObject({ formFactor:"ATX", wattage:550, connectors:{ EPS_8:1, PCIE_8:2 } });
  });

  test("maps cases while preserving unknown PSU form-factor support", () => {
    const result = mapBuildCoresProduct("PCCase", {
      opendb_id:"c1", metadata:meta("Meshify C", "Fractal Design"),
      supported_motherboard_form_factors:["ATX","Micro ATX","Mini-ITX"],
      supported_power_supply_form_factors:[], max_video_card_length:315, max_cpu_cooler_height:170,
    });
    expect(result).toMatchObject({ category:"CASE", specs:{ supportedMotherboardFormFactors:["ATX","MATX","MINI_ITX"], maxGpuLengthMm:315, maxCpuCoolerHeightMm:170 } });
    expect(result?.specs).not.toHaveProperty("psuFormFactors");
  });

  test("maps air and liquid coolers from explicit socket/type data", () => {
    const aio = mapBuildCoresProduct("CPUCooler", { opendb_id:"a1", metadata:meta("Liquid 240", "Gelid"), cpu_sockets:["AM5","LGA 1700"], water_cooled:true, radiator_size:240, height:56 });
    const air = mapBuildCoresProduct("CPUCooler", { opendb_id:"a2", metadata:meta("Tower", "Noctua"), cpu_sockets:["AM5"], water_cooled:false, height:158 });
    expect(aio?.specs).toMatchObject({ type:"AIO", supportedSockets:["AM5","LGA1700"], radiatorSizeMm:240 });
    expect(air?.specs).toMatchObject({ type:"AIR", heightMm:158 });
  });

  test("accepts fan size without fabricating thickness", () => {
    const parsed = fanSpecSchema.parse({ schemaVersion:1, sizeMm:140, connector:"PWM_4" });
    expect(parsed).not.toHaveProperty("thicknessMm");
    const fan = mapBuildCoresProduct("CaseFan", { opendb_id:"f1", metadata:meta("Pure A14", "Thermaltake"), size:140, pwm:true, connector:"4-pin PWM" });
    expect(fan?.specs).toEqual({ schemaVersion:1, sizeMm:140, connector:"PWM_4" });
  });

  test("rejects BuildCores network records that lack explicit interface/speed/port facts", () => {
    const result = mapBuildCoresProduct("NetworkCard", {
      opendb_id:"n1", metadata:meta("Gigabit Ethernet PCIe x1", "StarTech"), general_product_information:{},
    });
    expect(result).toBeNull();
  });
});
