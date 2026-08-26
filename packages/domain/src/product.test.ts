import { describe, expect, test } from "vitest";
import { productId, productRevisionId } from "./index";
describe("canonical product identity", () => {
  test("rejects empty ids", () => {
    expect(() => productId(" ")).toThrow(/non-empty/i);
    expect(() => productRevisionId("")).toThrow(/non-empty/i);
  });
});
