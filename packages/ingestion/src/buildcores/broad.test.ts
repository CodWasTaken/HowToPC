import { describe, expect, test } from "vitest";
import { mapBuildCoresProductDetailed } from "../buildcores";

const metadata = (name:string, manufacturer:string, extra:Record<string,unknown>={}) => ({
  name, manufacturer, part_numbers:[`${manufacturer}-MPN`], series:"Series X", variant:"V1", releaseYear:2024, ...extra,
});

describe("broad BuildCores normalization",()=>{
  test("maps GPU identity, dimensions, power, memory, interface, and outputs",()=>{
    const result=mapBuildCoresProductDetailed("GPU",{
      opendb_id:"gpu-1",metadata:metadata("Card","ASUS"),chipset_manufacturer:"AMD",chipset:"Radeon RX",memory:16,memory_type:"GDDR6",interface:"PCIe 4.0 x16",
      length:300,tdp:250,total_slot_width:2.5,power_connectors:{pcie_8_pin:2,pcie_12VHPWR:0},video_outputs:{hdmi_2_1:1,displayport_2_1:3},
    });
    expect(result).toMatchObject({ok:true,observation:{category:"GPU",series:"Series X",variant:"V1",releaseYear:2024,identifiers:[{type:"SOURCE_ID",value:"gpu-1"},{type:"MPN",value:"ASUS-MPN"}],specs:{chipsetManufacturer:"AMD",chipset:"Radeon RX",vramBytes:16*1024**3,memoryType:"GDDR6",interface:"PCIe 4.0 x16",lengthMm:300,slotWidth:2.5,tdpWatts:250,powerConnectors:{PCIE_8:2},videoOutputs:{hdmi_2_1:1,displayport_2_1:3}}}});
  });

  test("maps storage type, interface, capacity, generation, and cache without invented benchmark data",()=>{
    const result=mapBuildCoresProductDetailed("Storage",{opendb_id:"s-1",metadata:metadata("Drive","Inland"),capacity:512,storage_type:"SSD",form_factor:"M.2-2280",interface:"M.2 PCIe 3.0 x4",nvme:true,cache:256});
    expect(result).toMatchObject({ok:true,observation:{specs:{storageType:"SSD",interface:"NVME",capacityBytes:512*1000**3,pcieGeneration:3,cacheBytes:256*1000**2}}});
    if(result.ok){expect(result.observation.specs).not.toHaveProperty("sequentialReadMbps");expect(result.observation.specs).not.toHaveProperty("sequentialWriteMbps");expect(result.observation.specs).not.toHaveProperty("enduranceTbw");}
  });

  test("does not misclassify nonstandard storage mounts as M.2 or SATA bays",()=>{
    expect(mapBuildCoresProductDetailed("Storage",{opendb_id:"s-pcie",metadata:metadata("AIC SSD","Intel"),capacity:800,storage_type:"SSD",form_factor:"PCIe",interface:"PCIe x4",nvme:true})).toMatchObject({ok:false,reason:"AMBIGUOUS_VALUE"});
    expect(mapBuildCoresProductDetailed("Storage",{opendb_id:"s-m2-sata",metadata:metadata("M.2 SATA SSD","Crucial"),capacity:500,storage_type:"SSD",form_factor:"M.2-2280",interface:"M.2 SATA",nvme:false})).toMatchObject({ok:false,reason:"AMBIGUOUS_VALUE"});
  });
  test("maps PSU certification, modularity, connectors, and sourced length",()=>{
    expect(mapBuildCoresProductDetailed("PSU",{opendb_id:"p-1",metadata:metadata("PSU","Antec"),wattage:550,form_factor:"ATX",efficiency_rating:"80+ Bronze",modular:"Non-Modular",length:140,fanless:false,connectors:{atx_24_pin:1,eps_8_pin:1,pcie_6_plus_2_pin:2}})).toMatchObject({ok:true,observation:{specs:{wattage:550,efficiencyRating:"BRONZE",modularity:"FIXED",lengthMm:140,fanless:false,connectors:{ATX_24:1,EPS_8:1,PCIE_8:2}}}});
  });

  test("maps case clearances, bays, expansion slots, and structured dimensions",()=>{
    expect(mapBuildCoresProductDetailed("PCCase",{opendb_id:"c-1",metadata:metadata("Case","Fractal"),dimensions_mm:{width:217,height:453,depth:413},supported_motherboard_form_factors:["ATX","Micro ATX","Mini-ITX"],max_video_card_length:315,max_cpu_cooler_height:170,internal_3_5_bays:2,internal_2_5_bays:3,expansion_slots:7,supported_power_supply_form_factors:["ATX"]})).toMatchObject({ok:true,observation:{specs:{maxGpuLengthMm:315,maxCpuCoolerHeightMm:170,internal25Bays:3,internal35Bays:2,expansionSlots:7,dimensionsMm:{width:217,height:453,depth:413}}}});
  });

  test("maps cooler type and sourced fan/noise fields",()=>{
    expect(mapBuildCoresProductDetailed("CPUCooler",{opendb_id:"co-1",metadata:metadata("Liquid 240","Gelid"),cpu_sockets:["AM5","LGA 1700"],water_cooled:true,radiator_size:240,height:56,fan_size:120,fan_quantity:2,min_fan_rpm:750,max_fan_rpm:1800,min_noise_level:18.5,max_noise_level:29.6,fanless:false})).toMatchObject({ok:true,observation:{specs:{type:"AIO",supportedSockets:["AM5","LGA1700"],radiatorSizeMm:240,heightMm:56,fanSizeMm:120,fanQuantity:2,minRpm:750,maxRpm:1800,minNoiseDb:18.5,maxNoiseDb:29.6,fanless:false}}});
  });

  test("rejects a cooler whose air-vs-liquid type is unknown instead of guessing AIR",()=>{
    expect(mapBuildCoresProductDetailed("CPUCooler",{opendb_id:"co-unknown",metadata:metadata("Mystery Cooler","X"),cpu_sockets:["AM5"],water_cooled:null})).toMatchObject({ok:false,reason:"MISSING_REQUIRED_FIELD"});
  });

  test("maps fan fields without mistaking an RGB 4-pin lead for PWM",()=>{
    expect(mapBuildCoresProductDetailed("CaseFan",{opendb_id:"f-1",metadata:metadata("Fan","Scythe"),size:120,pwm:false,connector:"3-pin + 4-pin 12V RGB",quantity:1,min_airflow:20,max_airflow:51.17,min_noise_level:8,max_noise_level:24.9,static_pressure:1.2,flow_direction:"Standard"})).toMatchObject({ok:true,observation:{specs:{sizeMm:120,connector:"DC_3",quantity:1,minAirflowCfm:20,maxAirflowCfm:51.17,minNoiseDb:8,maxNoiseDb:24.9,staticPressureMmH2o:1.2,pwm:false,flowDirection:"Standard"}}});
  });
  test("maps explicit motherboard wireless state, Ethernet speed, and storage M.2 slots",()=>{
    expect(mapBuildCoresProductDetailed("Motherboard",{opendb_id:"mb-1",metadata:metadata("Board","ASUS"),socket:"LGA 1700",form_factor:"Micro ATX",memory:{max:64,ram_type:"DDR4",slots:2},storage_devices:{sata_6_gb_s:4,sata_3_gb_s:0},pcie_slots:[{quantity:1}],m2_slots:[{key:"M"},{key:"E"}],wireless_networking:"None",onboard_ethernet:[{speed:"1 Gb/s"},{speed:"2.5 Gb/s"}]})).toMatchObject({ok:true,observation:{specs:{wireless:false,ethernetSpeedMbps:2500,m2Slots:1}}});
  });

  test("reports deterministic rejection reasons",()=>{
    expect(mapBuildCoresProductDetailed("NetworkCard",{opendb_id:"n-1",metadata:metadata("NIC","StarTech")})).toMatchObject({ok:false,reason:"MISSING_REQUIRED_FIELD"});
    expect(mapBuildCoresProductDetailed("RAM",{opendb_id:"ram-bad",metadata:metadata("RAM","X"),ram_type:"DDR4",modules:{quantity:1,capacity_gb:8},ecc:"Unknown"})).toMatchObject({ok:false,reason:"AMBIGUOUS_VALUE"});
    expect(mapBuildCoresProductDetailed("PSU",{opendb_id:"psu-tfx",metadata:metadata("TFX PSU","X"),wattage:300,form_factor:"TFX"})).toMatchObject({ok:false,reason:"AMBIGUOUS_VALUE"});
    expect(mapBuildCoresProductDetailed("Motherboard",{opendb_id:"mb-unknown-m2",metadata:metadata("Board","X"),socket:"AM5",form_factor:"ATX",memory:{max:64,ram_type:"DDR5",slots:2},storage_devices:{sata_6_gb_s:4,sata_3_gb_s:0},pcie_slots:[],m2_slots:[{key:null}]})).toMatchObject({ok:false,reason:"MISSING_REQUIRED_FIELD"});
    expect(mapBuildCoresProductDetailed("Chair",{opendb_id:"x",metadata:metadata("Chair","X")})).toMatchObject({ok:false,reason:"UNSUPPORTED_CATEGORY"});
    expect(mapBuildCoresProductDetailed("HBA",{opendb_id:"hba-1",metadata:metadata("Adapter","LSI")})).toMatchObject({ok:false,reason:"UNSUPPORTED_CATEGORY"});
    expect(mapBuildCoresProductDetailed("GPU",null)).toMatchObject({ok:false,reason:"INVALID_RECORD"});
    expect(mapBuildCoresProductDetailed("GPU",{opendb_id:"gpu-no-name",metadata:{manufacturer:"X"},length:200,total_slot_width:2,tdp:100})).toMatchObject({ok:false,reason:"MISSING_IDENTITY"});
  });
});