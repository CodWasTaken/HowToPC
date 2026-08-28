import { describe, expect, test } from "vitest";
import { generateCatalogArtifacts, type BuildCoresCatalogInputRecord } from "./catalog-artifacts";

const metadata=(name:string,manufacturer:string)=>({name,manufacturer,part_numbers:[`${manufacturer}-${name}`],releaseYear:2024});
const gpu=(id:string,name:string,manufacturer:string,chipsetManufacturer:string,memoryType?:string):BuildCoresCatalogInputRecord=>({
  sourceCategory:"GPU",
  raw:{
    opendb_id:id,metadata:metadata(name,manufacturer),chipset_manufacturer:chipsetManufacturer,
    chipset:`${chipsetManufacturer} chip`,memory:16,...(memoryType?{memory_type:memoryType}:{}),
    interface:"PCIe 4.0 x16",length:id==="gpu-z"?320:280,tdp:250,total_slot_width:2.5,
    power_connectors:{pcie_8_pin:2},video_outputs:{displayport_2_1:3},
  },
});

const fixtureRecords:BuildCoresCatalogInputRecord[]=[
  gpu("gpu-z","Zeta Card","Zotac","NVIDIA"),
  {sourceCategory:"NetworkCard",raw:{opendb_id:"nic-1",metadata:metadata("Identity NIC","StarTech")}},
  gpu("gpu-a","Alpha Card","ASUS","AMD","GDDR6"),
  {sourceCategory:"CPU",raw:{opendb_id:"cpu-1",socket:"AM5",series:"Ryzen 7000",specifications:{tdp:65},metadata:metadata("Ryzen Example","AMD")}},
];

describe("catalog artifact generation",()=>{
  test("sorts products and builds deterministic category/id indexes",()=>{
    const artifacts=generateCatalogArtifacts(fixtureRecords,{sourceCommit:"fixture-commit"});
    expect(artifacts.shards.GPU.map((product)=>product.id)).toEqual(["buildcores-gpu-a","buildcores-gpu-z"]);
    expect(artifacts.shards.CPU.map((product)=>product.id)).toEqual(["buildcores-cpu-1"]);
    expect(artifacts.idIndex).toMatchObject({"buildcores-cpu-1":"CPU","buildcores-gpu-a":"GPU","buildcores-gpu-z":"GPU"});
  });
  test("reports source totals, rejection reasons, and facet coverage",()=>{
    const artifacts=generateCatalogArtifacts(fixtureRecords,{sourceCommit:"fixture-commit"});
    expect(artifacts.importReport).toMatchObject({
      sourceCommit:"fixture-commit",
      totals:{total:4,accepted:3,rejected:1},
      rejectionReasons:{MISSING_REQUIRED_FIELD:1},
      sourceCategories:{
        GPU:{total:2,accepted:2,rejected:0,rejectionReasons:{}},
        CPU:{total:1,accepted:1,rejected:0,rejectionReasons:{}},
        NetworkCard:{total:1,accepted:0,rejected:1,rejectionReasons:{MISSING_REQUIRED_FIELD:1}},
      },
      acceptedByCanonicalCategory:{CPU:1,GPU:2,NETWORK:0},
      facetCoverage:{GPU:{"specs.memoryType":{known:1,missing:1}}},
    });
    expect(artifacts.facetSummary.GPU["specs.chipsetManufacturer"]).toEqual({
      kind:"ENUM",known:2,values:["AMD","NVIDIA"],
    });
    expect(artifacts.facetSummary.GPU["specs.lengthMm"]).toEqual({
      kind:"NUMBER",known:2,min:280,max:320,
    });
  });

  test("is independent of input ordering",()=>{
    const forward=generateCatalogArtifacts(fixtureRecords,{sourceCommit:"fixture-commit"});
    const reverse=generateCatalogArtifacts([...fixtureRecords].reverse(),{sourceCommit:"fixture-commit"});
    expect(JSON.stringify(reverse)).toBe(JSON.stringify(forward));
  });
  test("fails on duplicate materialized product ids",()=>{
    const duplicate=[
      gpu("gpu-dup","First","ASUS","AMD","GDDR6"),
      gpu("gpu-dup","Second","MSI","NVIDIA","GDDR6X"),
    ];
    expect(()=>generateCatalogArtifacts(duplicate,{sourceCommit:"fixture-commit"})).toThrow(/Duplicate catalog product id: buildcores-gpu-dup/);
  });
});