import { describe, expect, test } from "vitest";
import type { ReferenceProduct } from "@howtopc/catalog";
import { catalogRepository } from "./server/catalog-repository";
import { buildParametricScene } from "@howtopc/geometry";
import { sessionSnapshot } from "./builder-session";
import {
  BUILDER_TEMPLATES,
  loadBuilderTemplate,
} from "./builder-templates";

describe("builder templates",()=>{
  test("ships mainstream and high-end editable starter builds",()=>{
    expect(BUILDER_TEMPLATES.map((template)=>template.id)).toEqual([
      "rtx-4060-gaming",
      "high-end-gaming",
    ]);
    expect(BUILDER_TEMPLATES[0]?.highlights).toContain("RTX 4060");
    expect(BUILDER_TEMPLATES[1]?.highlights).toContain("RTX 5090");
    expect(BUILDER_TEMPLATES[1]?.highlights).toContain("Ryzen 9 9950X3D");
    expect(BUILDER_TEMPLATES[1]?.productIds).toContain("buildcores-cf33502b-5930-4faa-b387-835d0c65efc1");
  });

  test("passes only the product id to the template product loader",async()=>{
    const product:ReferenceProduct={
      id:"template-test-storage",revisionId:"template-test-storage-r1",manufacturer:"Test",
      displayName:"Template test storage",category:"STORAGE",
      specs:{schemaVersion:1,interface:"NVME",formFactor:"M.2-2280",capacityBytes:1000000000},
    };
    const template={...BUILDER_TEMPLATES[0]!,productIds:[product.id]};
    const extraArguments:number[]=[];
    await loadBuilderTemplate(template,async(_id,...extra)=>{
      extraArguments.push(extra.length);
      return product;
    });
    expect(extraArguments).toEqual([0]);
  });

  test.each(BUILDER_TEMPLATES)("$title resolves to a compatible real-catalog build",async(template)=>{
    const session=await loadBuilderTemplate(template,async(id)=>{
      const product=await catalogRepository.getById(id);
      if(!product)throw new Error(`Missing template product: ${id}`);
      return product;
    });
    const snapshot=sessionSnapshot(session);
    expect(snapshot.lines).toHaveLength(template.productIds.length);
    expect(snapshot.products).toHaveLength(template.productIds.length);
    expect(snapshot.report.status).toBe("COMPATIBLE");
    expect(buildParametricScene(snapshot.products).collisions).toEqual([]);
  },20000);
});
