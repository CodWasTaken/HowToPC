import type { NormalizedProductObservation } from "./observation";
import type { RawProductRecord, SourceAdapter } from "./adapter";
import { canIngestAsset } from "./source";

export interface RejectedProductRecord {
  category: string;
  sourceRecordId?: string;
  reason: "UNSUPPORTED_OR_INVALID";
}

export interface IngestionBatchResult {
  accepted: readonly NormalizedProductObservation[];
  rejected: readonly RejectedProductRecord[];
}

function sourceRecordId(record: RawProductRecord): string | undefined {
  const payload = record.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const value = (payload as Record<string, unknown>).opendb_id;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function runIngestionBatch(adapter: SourceAdapter): Promise<IngestionBatchResult> {
  if (!canIngestAsset(adapter.policy, "FACTS")) throw new Error(`Source ${adapter.id} does not permit factual ingestion.`);
  const accepted: NormalizedProductObservation[] = [];
  const rejected: RejectedProductRecord[] = [];
  for (const record of await adapter.load()) {
    const normalized = adapter.normalize(record);
    if (normalized) accepted.push(normalized);
    else rejected.push({ category:record.category, sourceRecordId:sourceRecordId(record), reason:"UNSUPPORTED_OR_INVALID" });
  }
  return { accepted, rejected };
}
