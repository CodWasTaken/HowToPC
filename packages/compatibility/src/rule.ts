import type { ReferenceProduct } from "@howtopc/catalog";
import type { CompatibilityStatus } from "@howtopc/domain";

export type CompatibilityReasonKind =
  | "MISSING_PREREQUISITE"
  | "KNOWN_CONFLICT"
  | "REQUIRED_FACT_UNKNOWN"
  | "INFORMATIONAL";

export interface CompatibilityRuleResult {
  readonly ruleId:string;
  readonly status:CompatibilityStatus;
  readonly message:string;
  readonly reasonKind:CompatibilityReasonKind;
  readonly blocksMutation:boolean;
  readonly involvedIds?:readonly string[];
  readonly remediation?:string;
}
export interface CompatibilityReport { readonly status:CompatibilityStatus; readonly results:readonly CompatibilityRuleResult[]; }
export type BuildProducts=readonly ReferenceProduct[];
