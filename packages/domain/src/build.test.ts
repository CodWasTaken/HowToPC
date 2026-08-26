import { describe, expect, test } from "vitest";
import { buildItem, productRevisionId } from "./index";
describe("build items", () => {
  test("references a product revision and positive quantity", () => {
    expect(buildItem(productRevisionId("cpu-r1"))).toEqual({ productRevisionId:"cpu-r1", quantity:1 });
    expect(() => buildItem(productRevisionId("cpu-r1"), 0)).toThrow(/positive integer/i);
  });
});
