import { describe, expect, test } from "vitest";
import type { ReferenceProduct } from "../product";
import { facetDefinitionsForCategory } from "./definitions";
import { applyFacetFilters, calculateFacetResults } from "./engine";

const GiB=1024**3;
const TiB=1024**4;
const product=(
  id:string,manufacturer:string,category:string,specs:Record<string,unknown>,releaseYear?:number,
):ReferenceProduct=>({id,revisionId:`${id}-r1`,manufacturer,displayName:id,category,specs,releaseYear});

const cpus:ReferenceProduct[]=[
  product("cpu-7600","AMD","CPU",{schemaVersion:1,socket:"AM5",family:"Ryzen 7000",cores:6,threads:12,integratedGraphics:true,tdpWatts:65,unlocked:false},2023),
  product("cpu-7950x","AMD","CPU",{schemaVersion:1,socket:"AM5",family:"Ryzen 7000",cores:16,threads:32,integratedGraphics:false,tdpWatts:170,unlocked:true},2022),
  product("cpu-13400","Intel","CPU",{schemaVersion:1,socket:"LGA1700",cores:10,threads:16,tdpWatts:65},2023),
];

const storage:ReferenceProduct[]=[
  product("ssd-2tb","Samsung","STORAGE",{schemaVersion:1,storageType:"SSD",interface:"NVME",formFactor:"M.2 2280",capacityBytes:2*TiB,pcieGeneration:4}),
  product("hdd-8tb","Seagate","STORAGE",{schemaVersion:1,storageType:"HDD",interface:"SATA",formFactor:"3.5in",capacityBytes:8*TiB,rpm:7200,cacheBytes:256*GiB}),
];

const psus:ReferenceProduct[]=[
  product("psu-corsair-atx","Corsair","PSU",{schemaVersion:1,formFactor:"ATX",wattage:750,connectors:{PCIE_8:3},fanless:false}),
  product("psu-seasonic-atx","Seasonic","PSU",{schemaVersion:1,formFactor:"ATX",wattage:1000,connectors:{PCIE_8:4},fanless:false}),
  product("psu-corsair-sfx","Corsair","PSU",{schemaVersion:1,formFactor:"SFX",wattage:850,connectors:{PCIE_8:3},fanless:true}),
];

describe("facet engine",()=>{
  test("applies enum, boolean, range, unknown, and combined filters",()=>{
    const cpuDefs=facetDefinitionsForCategory("CPU");
    expect(applyFacetFilters(cpus,[
      {id:"manufacturer",control:"ENUM",values:["AMD"]},
      {id:"socket",control:"ENUM",values:["AM5"]},
    ],cpuDefs).map((item)=>item.id)).toEqual(["cpu-7600","cpu-7950x"]);

    expect(applyFacetFilters(cpus,[
      {id:"integratedGraphics",control:"BOOLEAN",value:true,includeUnknown:true},
    ],cpuDefs).map((item)=>item.id)).toEqual(["cpu-7600","cpu-13400"]);

    const storageDefs=facetDefinitionsForCategory("STORAGE");
    expect(applyFacetFilters(storage,[
      {id:"capacityBytes",control:"RANGE",min:TiB,max:4*TiB},
    ],storageDefs).map((item)=>item.id)).toEqual(["ssd-2tb"]);
    const psuDefs=facetDefinitionsForCategory("PSU");
    expect(applyFacetFilters(psus,[
      {id:"wattage",control:"RANGE",min:700,max:900},
    ],psuDefs).map((item)=>item.id)).toEqual(["psu-corsair-atx","psu-corsair-sfx"]);

    expect(applyFacetFilters(cpus,[
      {id:"family",control:"ENUM",values:["Ryzen 7000"]},
    ],cpuDefs).map((item)=>item.id)).toEqual(["cpu-7600","cpu-7950x"]);
    expect(applyFacetFilters(cpus,[
      {id:"family",control:"ENUM",values:["Ryzen 7000"],includeUnknown:true},
    ],cpuDefs).map((item)=>item.id)).toEqual(["cpu-7600","cpu-7950x","cpu-13400"]);
  });

  test("calculates standard faceted counts with each facet's own filter removed",()=>{
    const definitions=facetDefinitionsForCategory("PSU");
    const results=calculateFacetResults(psus,[
      {id:"manufacturer",control:"ENUM",values:["Corsair"]},
      {id:"formFactor",control:"ENUM",values:["ATX"]},
    ],definitions);
    const manufacturer=results.find((result)=>result.id==="manufacturer");
    const formFactor=results.find((result)=>result.id==="formFactor");
    expect(manufacturer).toMatchObject({
      control:"ENUM",options:[{value:"Corsair",count:1},{value:"Seasonic",count:1}],
    });
    expect(formFactor).toMatchObject({
      control:"ENUM",options:[{value:"ATX",count:1},{value:"SFX",count:1}],
    });
  });

  test("derives numeric bounds and omits facets with zero known values",()=>{
    const results=calculateFacetResults(storage,[],facetDefinitionsForCategory("STORAGE"));
    expect(results.find((result)=>result.id==="capacityBytes")).toMatchObject({
      control:"RANGE",min:2*TiB,max:8*TiB,knownCount:2,unknownCount:0,
    });
    expect(results.some((result)=>result.id==="enduranceTbw")).toBe(false);
  });

  test("exposes the required sourced facet definitions per category",()=>{
    const ids=(category:Parameters<typeof facetDefinitionsForCategory>[0])=>
      facetDefinitionsForCategory(category).map((definition)=>definition.id);
    expect(ids("CPU")).toEqual(expect.arrayContaining(["manufacturer","socket","family","cores","threads","integratedGraphics","tdpWatts","releaseYear"]));
    expect(ids("MOTHERBOARD")).toEqual(expect.arrayContaining(["manufacturer","socket","chipset","formFactor","memoryType","dimmSlots","maxMemoryBytes","pcieSlots","m2Slots","sataPorts","wireless","ethernetSpeedMbps","eccSupport"]));
    expect(ids("MEMORY")).toEqual(expect.arrayContaining(["manufacturer","type","kitCapacityBytes","modules","moduleCapacityBytes","speedMt","ecc","formFactor","casLatency"]));
    expect(ids("STORAGE")).toEqual(expect.arrayContaining(["manufacturer","storageType","interface","formFactor","capacityBytes","pcieGeneration","sequentialReadMbps","sequentialWriteMbps","enduranceTbw","rpm","cacheBytes"]));
    expect(ids("GPU")).toEqual(expect.arrayContaining(["chipsetManufacturer","manufacturer","chipset","vramBytes","memoryType","lengthMm","slotWidth","tdpWatts","powerConnectors","videoOutputs","interface"]));
    expect(ids("PSU")).toEqual(expect.arrayContaining(["manufacturer","wattage","formFactor","efficiencyRating","modularity","connectors","atxVersion","fanless"]));
    expect(ids("CASE")).toEqual(expect.arrayContaining(["supportedMotherboardFormFactors","maxGpuLengthMm","maxCpuCoolerHeightMm","psuFormFactors","internal25Bays","internal35Bays","sidePanel"]));
    expect(ids("COOLER")).toEqual(expect.arrayContaining(["type","supportedSockets","heightMm","radiatorSizeMm","fanSizeMm","fanQuantity"]));
    expect(ids("FAN")).toEqual(expect.arrayContaining(["sizeMm","connector","maxAirflowCfm","maxNoiseDb","staticPressureMmH2o","pwm"]));
    expect(ids("NETWORK")).toEqual(expect.arrayContaining(["interface","speedMbps","ports","wireless","standard"]));
    expect(ids("HBA")).toEqual(expect.arrayContaining(["manufacturer","interface","connector","generation","ports","speedMbps"]));
  });
});
