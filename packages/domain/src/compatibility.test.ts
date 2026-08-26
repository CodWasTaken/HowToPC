import { describe, expect, test } from "vitest";
import { COMPATIBILITY_STATUSES } from "./index";
describe("compatibility status", () => {
  test("exposes exactly four states", () => expect(COMPATIBILITY_STATUSES).toEqual(["COMPATIBLE","INCOMPATIBLE","WARNING","UNKNOWN"]));
});
