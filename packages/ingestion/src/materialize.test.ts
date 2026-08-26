import { describe, expect, test } from "vitest";
import * as ingestion from "./index";

describe("catalog materialization", () => {
  test("creates deterministic open-data catalog records without embedding price", () => {
    const toCatalogSeedProduct = (ingestion as any).toCatalogSeedProduct;
    expect(toCatalogSeedProduct).toBeDefined();
    const product = toCatalogSeedProduct({
      providerId:"buildcores-opendb",sourceRecordId:"abc-123",sourceRecordUrl:"https://example.test/source",
      manufacturer:"Intel",displayName:"Intel Example",category:"CPU",identifiers:[],
      specs:{schemaVersion:1,socket:"LGA1155",tdpWatts:77,integratedGraphics:true},
    });
    expect(product).toMatchObject({
      id:"buildcores-abc-123",revisionId:"buildcores-abc-123-r1",manufacturer:"Intel",displayName:"Intel Example",category:"CPU",
      source:{label:"BuildCores OpenDB",url:"https://example.test/source",evidence:"OPEN_DATA"},
    });
    expect((product as any).priceEur).toBeUndefined();
    expect((product as any).pricePln).toBeUndefined();
  });
});
