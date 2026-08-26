export type CatalogSpecsCoverage = "COMPLETE" | "PARTIAL";
export type MechanicalCoverage = "VERIFIED" | "PARAMETRIC" | "BOUNDING" | "NONE";
export type PriceCoverage = "FRESH" | "STALE" | "NONE";
export type BenchmarkCoverage = "STRONG" | "LIMITED" | "NONE";
export type FirmwareTopologyCoverage = "VERIFIED" | "PARTIAL" | "NONE";

export interface CoverageProfile {
  readonly catalogSpecs: CatalogSpecsCoverage;
  readonly mechanical: MechanicalCoverage;
  readonly price: PriceCoverage;
  readonly benchmark: BenchmarkCoverage;
  readonly firmwareTopology: FirmwareTopologyCoverage;
}
