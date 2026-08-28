import { describe, expect, test } from "vitest";
import type { ProductCategory, ReferenceProduct } from "@howtopc/catalog";
import type { CatalogSearchRequest } from "../catalog-search-contract";
import type { CatalogRepository } from "./catalog-repository";
import { catalogBuildSignature, createCatalogSearchService } from "./catalog-search";

const gpu=(id:string,name:string,lengthMm:number):ReferenceProduct=>({
  id,revisionId:`${id}-r1`,manufacturer:"Test",displayName:name,category:"GPU",
  specs:{schemaVersion:1,lengthMm,slotWidth:2,tdpWatts:200,powerConnectors:{}},
});
const cpu=(id:string,name:string,manufacturer:string,socket:string):ReferenceProduct=>({
  id,revisionId:`${id}-r1`,manufacturer,displayName:name,category:"CPU",
  specs:{schemaVersion:1,socket,tdpWatts:65,integratedGraphics:true},
});
const storage:ReferenceProduct={
  id:"storage-good",revisionId:"storage-good-r1",manufacturer:"Test",displayName:"Good SSD",category:"STORAGE",
  specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2 2280",capacityBytes:1024**4},
};

function fakeRepository(
  publicProducts:ReferenceProduct[],
  installed:ReferenceProduct[]=[]
):CatalogRepository {
  const lookup=new Map([...publicProducts,...installed].map((product)=>[product.id,product]));
  return {
    loadCategory:async(category:ProductCategory)=>publicProducts.filter((product)=>product.category===category),
    loadAll:async()=>publicProducts,
    getById:async(id:string)=>lookup.get(id),
    searchIdentity:async(query:string,category?:ProductCategory)=>publicProducts.filter((product)=>
      (!category||product.category===category)&&product.displayName.toLowerCase().includes(query.toLowerCase())),
  };
}

const request=(overrides:Partial<CatalogSearchRequest>):CatalogSearchRequest=>({
  filters:[],compatibleOnly:false,sort:"RELEVANCE",limit:2,offset:0,buildLines:[],...overrides,
});

describe("catalog search service",()=>{
  test("sorts compatibility across the full result set before pagination",async()=>{
    const products=[
      gpu("bad-a","A Bad GPU",390),
      gpu("bad-b","B Bad GPU",410),
      gpu("good-late","Z Good GPU",300),
      gpu("bad-c","C Bad GPU",420),
    ];
    const service=createCatalogSearchService(fakeRepository(products));
    const result=await service.search(request({
      category:"GPU",
      buildLines:[{productId:"case-atx-340",quantity:1}],
    }));
    expect(result.total).toBe(4);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      product:{id:"good-late"},applyState:"CAN_APPLY",
    });
    expect(result.items[1].applyState).toBe("BLOCKED_INCOMPATIBLE");
  });

  test("applies query and facets before pagination",async()=>{
    const products=[
      cpu("cpu-1","Old One","Intel","LGA1155"),
      cpu("cpu-2","Old Two","AMD","AM4"),
      cpu("cpu-3","Old Three","AMD","AM4"),
      cpu("cpu-target","Target Processor","AMD","AM5"),
    ];
    const service=createCatalogSearchService(fakeRepository(products));
    const result=await service.search(request({
      category:"CPU",query:"target",
      filters:[{id:"socket",control:"ENUM",values:["AM5"]}],
    }));
    expect(result.total).toBe(1);
    expect(result.items.map((item)=>item.product.id)).toEqual(["cpu-target"]);
    const manufacturer=result.facets.find((facet)=>facet.id==="manufacturer");
    expect(manufacturer).toMatchObject({
      control:"ENUM",options:[{value:"AMD",count:1}],
    });
  });

  test("compatibleOnly removes unknown and incompatible rows before paging",async()=>{
    const unknownBoard:ReferenceProduct={
      id:"unknown-board",revisionId:"unknown-board-r1",manufacturer:"Test",displayName:"Unknown Board",category:"MOTHERBOARD",
      specs:{schemaVersion:1,socket:"AM5",formFactor:"ATX",memoryType:"DDR5",dimmSlots:4,maxMemoryBytes:128*1024**3,pcieSlots:3,m2Slots:2,sataPorts:4},
    };
    const products=[
      gpu("gpu-unknown","Unknown Slot GPU",300),
      gpu("gpu-bad","Too Long GPU",390),
      storage,
    ];
    const service=createCatalogSearchService(fakeRepository(products,[unknownBoard]));
    const result=await service.search(request({
      compatibleOnly:true,limit:10,
      buildLines:[
        {productId:"unknown-board",quantity:1},
        {productId:"gpu-value-270",quantity:1},
        {productId:"case-atx-340",quantity:1},
      ],
    }));
    expect(result.items.map((item)=>item.product.id)).toEqual(["storage-good"]);
    expect(result.total).toBe(1);
  });

  test("uses an order-independent build signature for annotation caching",()=>{
    const first=catalogBuildSignature([
      {productId:"b",quantity:2},{productId:"a",quantity:1},
    ]);
    const reordered=catalogBuildSignature([
      {productId:"a",quantity:1},{productId:"b",quantity:2},
    ]);
    const changed=catalogBuildSignature([
      {productId:"a",quantity:1},{productId:"b",quantity:3},
    ]);
    expect(reordered).toBe(first);
    expect(changed).not.toBe(first);
  });
});
