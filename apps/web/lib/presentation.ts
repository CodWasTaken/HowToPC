import type { ReferenceProduct } from "@howtopc/catalog";
import type { CompatibilityReport, CompatibilityRuleResult } from "@howtopc/compatibility";

export type PresentedBuildStatus = "COMPATIBLE" | "WARNING" | "INCOMPATIBLE" | "INCOMPLETE" | "UNKNOWN";

export function presentBuildStatus(report: CompatibilityReport): PresentedBuildStatus {
  if (report.status !== "UNKNOWN") return report.status;
  const unknowns = report.results.filter((result) => result.status === "UNKNOWN");
  if (unknowns.some((result) => result.blocksMutation)) return "UNKNOWN";
  if (unknowns.some((result) => result.reasonKind === "MISSING_PREREQUISITE")) return "INCOMPLETE";
  return "UNKNOWN";
}

export function actionableResults(report: CompatibilityReport): CompatibilityRuleResult[] {
  const blockers = report.results.filter((result) =>
    result.status === "INCOMPATIBLE" || (result.status === "UNKNOWN" && result.blocksMutation),
  );
  const warnings = report.results.filter((result) => result.status === "WARNING");
  return [...blockers, ...warnings];
}

export function partRowTitle(product: Pick<ReferenceProduct, "manufacturer" | "displayName">): string {
  return `${product.manufacturer} · ${product.displayName}`;
}
