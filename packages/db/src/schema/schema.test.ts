import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import { assetRights, buildItems, productIdentifiers, productRevisions, products, sourceObservations } from "./index";
describe("canonical database schema", () => {
  test("keeps identity, revisions, observations, and rights separate", () => {
    expect(products).toBeDefined(); expect(productRevisions).toBeDefined(); expect(sourceObservations).toBeDefined(); expect(assetRights).toBeDefined();
  });
  test("product identifiers enforce canonical uniqueness", () => expect(getTableConfig(productIdentifiers).indexes.some(index => index.config.unique)).toBe(true));
  test("build items reference build and product revisions", () => expect(getTableConfig(buildItems).foreignKeys).toHaveLength(2));
});
