export type SourceConfidence = "AUTHORITATIVE" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type SourceType = "MANUFACTURER" | "OPEN_DATABASE" | "CATALOG" | "RETAILER" | "BENCHMARK" | "COMMUNITY" | "OTHER";
export interface SourceObservation {
  readonly sourceId: string;
  readonly sourceType: SourceType;
  readonly sourceReference: string;
  readonly observedAt: string;
  readonly factualConfidence: SourceConfidence;
}
export function sourceObservation(input: SourceObservation): SourceObservation {
  const { sourceId, sourceType, sourceReference, observedAt, factualConfidence } = input;
  return { sourceId, sourceType, sourceReference, observedAt, factualConfidence };
}
export type RightsClass = "REDISTRIBUTABLE" | "LINK_ONLY" | "FACT_ONLY" | "INTERNAL_ONLY" | "BLOCKED" | "UNKNOWN";
export interface AssetRights { readonly rightsClass: RightsClass; readonly attribution?: string; readonly licenseId?: string; }
