import { afterEach, describe, expect, test, vi } from "vitest";
import type { CatalogSearchRequest } from "./catalog-search-contract";
import { CatalogHttpError, fetchCatalogPage } from "./catalog-client";

const request:CatalogSearchRequest={
  query:"ryzen",category:"CPU",
  filters:[
    {id:"manufacturer",control:"ENUM",values:["AMD"]},
    {id:"tdpWatts",control:"RANGE",min:65,max:170,includeUnknown:false},
  ],
  compatibleOnly:true,sort:"NEWEST",limit:50,offset:100,
  buildLines:[{productId:"cpu-am5-7600",quantity:1}],
};

afterEach(()=>vi.unstubAllGlobals());

describe("catalog client",()=>{
  test("serializes the complete public search request",async()=>{
    const response={items:[],total:0,limit:50,offset:100,facets:[]};
    const fetchMock=vi.fn(async()=>new Response(JSON.stringify(response),{
      status:200,headers:{"content-type":"application/json"},
    }));
    vi.stubGlobal("fetch",fetchMock);
    await expect(fetchCatalogPage(request)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url,init]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toBe("/api/catalog/search");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(request);
  });

  test.each([400,500])("turns HTTP %s into a useful typed error",async(status)=>{
    vi.stubGlobal("fetch",vi.fn(async()=>new Response(
      JSON.stringify({error:`catalog failed ${status}`}),
      {status,headers:{"content-type":"application/json"}},
    )));
    try{
      await fetchCatalogPage(request);
      throw new Error("expected fetchCatalogPage to reject");
    }catch(error){
      expect(error).toBeInstanceOf(CatalogHttpError);
      expect(error).toMatchObject({status});
      expect((error as Error).message).toContain(`catalog failed ${status}`);
    }
  });
});
