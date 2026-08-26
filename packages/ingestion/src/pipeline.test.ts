import { describe, expect, test } from "vitest";
import * as ingestion from "./index";

describe("ingestion pipeline", () => {
  test("accepts supported normalized facts and reports rejected records", async () => {
    const createBuildCoresAdapter = (ingestion as any).createBuildCoresAdapter;
    const runIngestionBatch = (ingestion as any).runIngestionBatch;
    expect(createBuildCoresAdapter).toBeDefined();
    expect(runIngestionBatch).toBeDefined();
    const adapter = createBuildCoresAdapter([
      {category:"CPU",payload:{opendb_id:"cpu-2",socket:"AM5",specifications:{tdp:65,integratedGraphics:{model:"None"}},metadata:{name:"AMD Example",manufacturer:"AMD",part_numbers:[]}}},
      {category:"Keyboard",payload:{opendb_id:"keyboard-1"}},
    ]);
    const result = await runIngestionBatch(adapter);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].sourceRecordId).toBe("cpu-2");
    expect(result.rejected).toEqual([{category:"Keyboard",sourceRecordId:"keyboard-1",reason:"UNSUPPORTED_OR_INVALID"}]);
  });
});
