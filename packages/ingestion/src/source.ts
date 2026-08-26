export type IngestionAssetClass = "FACTS" | "IMAGE" | "PDF" | "MODEL_3D";

export interface SourcePolicy {
  id: string;
  name: string;
  license: string;
  attributionRequired: boolean;
  attribution: string;
  allowedAssets: readonly IngestionAssetClass[];
}

export const BUILDCORES_SOURCE_POLICY: SourcePolicy = {
  id: "buildcores-opendb",
  name: "BuildCores OpenDB",
  license: "ODC-BY-1.0",
  attributionRequired: true,
  attribution: "BuildCores OpenDB — ODC-By 1.0",
  allowedAssets: ["FACTS"],
};

export function canIngestAsset(policy: SourcePolicy, assetClass: IngestionAssetClass): boolean {
  return policy.allowedAssets.includes(assetClass);
}
