import type { ReferenceProduct } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "./observation";

export function toCatalogSeedProduct(observation: NormalizedProductObservation): ReferenceProduct {
  const id = `buildcores-${observation.sourceRecordId}`;
  return {
    id,
    revisionId: `${id}-r1`,
    manufacturer: observation.manufacturer,
    displayName: observation.displayName,
    category: observation.category,
    specs: observation.specs,
    source: {
      label: "BuildCores OpenDB",
      url: observation.sourceRecordUrl,
      evidence: "OPEN_DATA",
    },
  };
}
