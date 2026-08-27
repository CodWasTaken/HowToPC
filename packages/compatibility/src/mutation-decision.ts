import type { CompatibilityReport, CompatibilityRuleResult } from "./rule";

export type MutationDecisionState = "ALLOWED" | "BLOCKED_UNKNOWN" | "BLOCKED_INCOMPATIBLE";

export interface MutationDecision {
  allowed: boolean;
  state: MutationDecisionState;
  blocker?: CompatibilityRuleResult;
}

export function decideMutation(report: CompatibilityReport): MutationDecision {
  const incompatible = report.results.find((result) =>
    result.blocksMutation && result.reasonKind === "KNOWN_CONFLICT",
  );
  if (incompatible) return { allowed: false, state: "BLOCKED_INCOMPATIBLE", blocker: incompatible };

  const unknown = report.results.find((result) =>
    result.blocksMutation && result.reasonKind === "REQUIRED_FACT_UNKNOWN",
  );
  if (unknown) return { allowed: false, state: "BLOCKED_UNKNOWN", blocker: unknown };

  return { allowed: true, state: "ALLOWED" };
}
