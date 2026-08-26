import { describe, expect, test } from "vitest";
import { sourceObservation } from "./index";
describe("source provenance", () => {
  test("confidence does not imply rights", () => {
    const observation = sourceObservation({ sourceId:"manufacturer", sourceType:"MANUFACTURER", sourceReference:"spec", observedAt:"2026-08-26", factualConfidence:"AUTHORITATIVE" });
    expect(observation).not.toHaveProperty("rightsClass");
  });
});
