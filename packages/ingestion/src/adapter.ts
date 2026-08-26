import type { NormalizedProductObservation } from "./observation";
import type { SourcePolicy } from "./source";
import { BUILDCORES_SOURCE_POLICY } from "./source";
import { mapBuildCoresProduct } from "./buildcores";

export interface RawProductRecord {
  category: string;
  payload: unknown;
}

export interface SourceAdapter {
  id: string;
  policy: SourcePolicy;
  load(): Promise<readonly RawProductRecord[]>;
  normalize(record: RawProductRecord): NormalizedProductObservation | null;
}

export function createBuildCoresAdapter(records: readonly RawProductRecord[]): SourceAdapter {
  return {
    id: "buildcores-opendb",
    policy: BUILDCORES_SOURCE_POLICY,
    async load() { return records; },
    normalize(record) { return mapBuildCoresProduct(record.category, record.payload); },
  };
}
