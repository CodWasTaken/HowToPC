import { describe, expect, test } from "vitest";
import { POST } from "./route";

const validBody={
  category:"NETWORK",
  filters:[],
  compatibleOnly:false,
  sort:"RELEVANCE",
  limit:25,
  offset:0,
  buildLines:[],
};

const call=async(body:unknown)=>POST(new Request("http://test/api/catalog/search",{
  method:"POST",
  headers:{"content-type":"application/json"},
  body:JSON.stringify(body),
}));

describe("catalog search route validation",()=>{
  test.each([
    {...validBody,category:"NOT_A_CATEGORY"},
    {...validBody,offset:-1},
    {...validBody,limit:0},
    {...validBody,filters:[{id:"socket",control:"ENUM",values:"AM5"}]},
    {...validBody,priceMin:100},
  ])("rejects malformed or frozen input %#",async(body)=>{
    const response=await call(body);
    expect(response.status).toBe(400);
  });

  test("accepts positive numeric limits and lets server search clamp to 100",async()=>{
    const response=await call({...validBody,limit:500});
    expect(response.status).toBe(200);
    const body=await response.json() as {limit:number;items:unknown[]};
    expect(body.limit).toBe(100);
    expect(body.items.length).toBeLessThanOrEqual(100);
  });
});
