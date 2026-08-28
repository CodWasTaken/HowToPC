import { describe, expect, test } from "vitest";
import { catalogRepository } from "../../../../../lib/server/catalog-repository";
import { GET } from "./route";

const context=(id:string)=>({params:Promise.resolve({id})});

describe("public catalog product route",()=>{
  test("resolves a generated public product",async()=>{
    const generated=(await catalogRepository.loadCategory("CPU"))
      .find((product)=>product.id.startsWith("buildcores-"));
    expect(generated).toBeTruthy();
    const response=await GET(new Request(`http://localhost/api/catalog/product/${generated!.id}`),context(generated!.id));
    expect(response.status).toBe(200);
    expect((await response.json()).id).toBe(generated!.id);
  });

  test("does not expose fixture-only products",async()=>{
    const response=await GET(new Request("http://localhost/api/catalog/product/cpu-am5-7600"),context("cpu-am5-7600"));
    expect(response.status).toBe(404);
  });
});
