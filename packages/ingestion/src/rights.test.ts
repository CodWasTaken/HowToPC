import { describe, expect, test } from "vitest";
import * as ingestion from "./index";

describe("source rights policy", () => {
  test("allows BuildCores facts but not media redistribution by default", () => {
    const policy = (ingestion as any).BUILDCORES_SOURCE_POLICY;
    const canIngestAsset = (ingestion as any).canIngestAsset;
    expect(policy).toBeDefined();
    expect(canIngestAsset).toBeDefined();
    expect(policy.license).toBe("ODC-BY-1.0");
    expect(policy.attributionRequired).toBe(true);
    expect(canIngestAsset(policy, "FACTS")).toBe(true);
    expect(canIngestAsset(policy, "IMAGE")).toBe(false);
    expect(canIngestAsset(policy, "PDF")).toBe(false);
    expect(canIngestAsset(policy, "MODEL_3D")).toBe(false);
  });
});
