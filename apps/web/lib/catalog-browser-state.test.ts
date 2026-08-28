import { describe, expect, test } from "vitest";
import type { CatalogSearchResponse } from "./catalog-search-contract";
import {
  appendCatalogPage,
  changeCatalogCategory,
  createCatalogBrowserState,
  setRangeFacet,
  toggleEnumFacet,
} from "./catalog-browser-state";

const response=(ids:string[],offset:number):CatalogSearchResponse=>({
  items:ids.map((id)=>({
    product:{id,revisionId:`${id}-r1`,manufacturer:"Test",displayName:id,category:"CPU",specs:{}},
    applyState:"CAN_APPLY",maxSafeQuantity:null,
  })),
  total:5,limit:2,offset,facets:[],
});

describe("catalog browser state",()=>{
  test("category changes clear category facets and pagination but preserve query",()=>{
    let state=createCatalogBrowserState();
    state={...state,query:"ryzen",category:"CPU",offset:100,
      filters:[{id:"socket",control:"ENUM",values:["AM5"]}]};
    state=changeCatalogCategory(state,"GPU");
    expect(state).toMatchObject({query:"ryzen",category:"GPU",offset:0,filters:[],items:[]});
  });

  test("enum toggles are reversible",()=>{
    let state=createCatalogBrowserState({category:"CPU"});
    state=toggleEnumFacet(state,"manufacturer","AMD");
    expect(state.filters).toEqual([{id:"manufacturer",control:"ENUM",values:["AMD"]}]);
    state=toggleEnumFacet(state,"manufacturer","Intel");
    expect(state.filters[0]).toMatchObject({values:["AMD","Intel"]});
    state=toggleEnumFacet(state,"manufacturer","AMD");
    expect(state.filters[0]).toMatchObject({values:["Intel"]});
    state=toggleEnumFacet(state,"manufacturer","Intel");
    expect(state.filters).toEqual([]);
  });

  test("range selections preserve numeric values and reset pagination",()=>{
    let state=createCatalogBrowserState({category:"STORAGE"});
    state={...state,offset:50};
    state=setRangeFacet(state,"capacityBytes",512*1024**3,2*1024**4);
    expect(state.offset).toBe(0);
    expect(state.filters).toEqual([{
      id:"capacityBytes",control:"RANGE",min:512*1024**3,max:2*1024**4,
    }]);
  });

  test("appending later pages deduplicates ids while preserving server order",()=>{
    let state=createCatalogBrowserState({category:"CPU"});
    state=appendCatalogPage(state,response(["a","b"],0));
    state=appendCatalogPage(state,response(["b","c"],2));
    expect(state.items.map((item)=>item.product.id)).toEqual(["a","b","c"]);
    expect(state.offset).toBe(4);
    expect(state.total).toBe(5);
  });
});
