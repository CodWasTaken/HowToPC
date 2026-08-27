# Empty and Partial Build Mutation Decisions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users and agents build safely from an empty or incomplete machine without treating unrelated missing prerequisites as a reason to reject every mutation.

**Architecture:** Compatibility reports keep the canonical four statuses, while each rule gains explicit mutation-blocking metadata. A shared mutation-decision helper distinguishes known conflicts, required-fact unknowns, and non-blocking missing prerequisites; quantity mutations, catalog dots, and WebMCP all consume that same decision.

**Tech Stack:** TypeScript, Vitest, existing `@howtopc/compatibility`, React/Next.js integration tests.

**Spec:** `docs/superpowers/specs/2026-08-27-configurator-redesign-full-catalog-geometry-design.md`

## Global Constraints

- Canonical compatibility states remain exactly `COMPATIBLE`, `INCOMPATIBLE`, `WARNING`, `UNKNOWN`.
- `INCOMPLETE` is presentation-only and never becomes a fifth engine status.
- Missing unrelated prerequisites must not block safe additions.
- A fact required to validate the requested mutation may still block as UNKNOWN.
- Known conflicts always block.
- Pricing behavior is out of scope.

---
### Task 1: Add rule-level mutation metadata

**Files:**
- Modify: `packages/compatibility/src/rule.ts`
- Modify: `packages/compatibility/src/rules.ts`
- Modify: `packages/compatibility/src/rules.test.ts`

**Interfaces:**
- Produces `CompatibilityReasonKind = "MISSING_PREREQUISITE" | "KNOWN_CONFLICT" | "REQUIRED_FACT_UNKNOWN" | "INFORMATIONAL"`.
- `CompatibilityRuleResult` gains `reasonKind` and `blocksMutation`.

- [ ] **Step 1: Write failing rule metadata tests**

```ts
const empty = evaluateBuild([]);
const missing = empty.results.find((result) => result.ruleId === "required-build-components")!;
expect(missing).toMatchObject({ status:"UNKNOWN", reasonKind:"MISSING_PREREQUISITE", blocksMutation:false });
```

Also assert a socket mismatch is `KNOWN_CONFLICT/true` and unknown multi-GPU slot topology is `REQUIRED_FACT_UNKNOWN/true`.

- [ ] **Step 2: Run `pnpm --filter @howtopc/compatibility test` and verify RED**

Expected: metadata fields are absent.
- [ ] **Step 3: Add the metadata types and annotate every rule result**

Use `MISSING_PREREQUISITE/false` only for the required-components summary. Use `KNOWN_CONFLICT/true` for failed deterministic comparisons/capacity/connector rules. Use `REQUIRED_FACT_UNKNOWN/true` for the multi-GPU topology unknown. Compatible/warning results use `INFORMATIONAL/false`.

```ts
export type CompatibilityReasonKind =
  | "MISSING_PREREQUISITE" | "KNOWN_CONFLICT"
  | "REQUIRED_FACT_UNKNOWN" | "INFORMATIONAL";

export interface CompatibilityRuleResult {
  readonly ruleId: string;
  readonly status: CompatibilityStatus;
  readonly message: string;
  readonly reasonKind: CompatibilityReasonKind;
  readonly blocksMutation: boolean;
  readonly involvedIds?: readonly string[];
  readonly remediation?: string;
}
```

- [ ] **Step 4: Run compatibility typecheck/tests and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add packages/compatibility/src/rule.ts packages/compatibility/src/rules.ts packages/compatibility/src/rules.test.ts
git commit -m "feat: classify compatibility mutation blockers"
```
### Task 2: Centralize mutation admissibility

**Files:**
- Create: `packages/compatibility/src/mutation-decision.ts`
- Create: `packages/compatibility/src/mutation-decision.test.ts`
- Modify: `packages/compatibility/src/index.ts`

**Interfaces:**
- Produces `MutationDecisionState = "ALLOWED" | "BLOCKED_UNKNOWN" | "BLOCKED_INCOMPATIBLE"`.
- Produces `decideMutation(report: CompatibilityReport): { allowed:boolean; state:MutationDecisionState; blocker?:CompatibilityRuleResult }`.

- [ ] **Step 1: Write the failing decision tests**

```ts
expect(decideMutation(evaluateBuild([]))).toMatchObject({ allowed:true, state:"ALLOWED" });
expect(decideMutation(socketMismatchReport)).toMatchObject({ allowed:false, state:"BLOCKED_INCOMPATIBLE" });
expect(decideMutation(unknownGpuTopologyReport)).toMatchObject({ allowed:false, state:"BLOCKED_UNKNOWN" });
```

Construct the latter two reports from real fixture products rather than hand-written fake statuses.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter @howtopc/compatibility test -- mutation-decision`
Expected: missing module/export.

- [ ] **Step 3: Implement deterministic blocker precedence**
```ts
export function decideMutation(report: CompatibilityReport): MutationDecision {
  const incompatible = report.results.find((result) =>
    result.blocksMutation && result.reasonKind === "KNOWN_CONFLICT",
  );
  if (incompatible) return { allowed:false, state:"BLOCKED_INCOMPATIBLE", blocker:incompatible };
  const unknown = report.results.find((result) =>
    result.blocksMutation && result.reasonKind === "REQUIRED_FACT_UNKNOWN",
  );
  if (unknown) return { allowed:false, state:"BLOCKED_UNKNOWN", blocker:unknown };
  return { allowed:true, state:"ALLOWED" };
}
```

Known conflicts take precedence if a report contains both blocker classes. Whole-build `report.status` is deliberately not consulted.

- [ ] **Step 4: Run compatibility typecheck/tests and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add packages/compatibility/src/mutation-decision.ts packages/compatibility/src/mutation-decision.test.ts packages/compatibility/src/index.ts
git commit -m "feat: decide mutations independently of completeness"
```

### Task 3: Make add/replace/remove primitives honor the decision

**Files:**
- Modify: `packages/compatibility/src/quantity-transaction.ts`
- Modify: `packages/compatibility/src/quantity-transaction.test.ts`

**Interfaces:**
- `QuantityMutationResult` gains `decision: MutationDecision`.
- `previewAdd`, `addOne`, and `replaceSingleton` commit according to `decideMutation(report)`.
- `removeOne` commits any existing-line decrement/removal because removal cannot introduce a new installed component conflict.
- [ ] **Step 1: Write failing empty/partial mutation tests**

```ts
expect(addOne([], "case-atx-340").committed).toBe(true);
expect(addOne([], "cpu-am5-7600").committed).toBe(true);
expect(addOne([], "mb-b650-atx").committed).toBe(true);
expect(addOne([], "ssd-nvme-2tb").committed).toBe(true);
```

Also test: add AM5 CPU then LGA1155 board rejects as `BLOCKED_INCOMPATIBLE`; add a second GPU to a board fixture with `gpuPcieSlots` omitted rejects as `BLOCKED_UNKNOWN`; removing the final case/motherboard/CPU from a partial build commits and leaves an incomplete report.

- [ ] **Step 2: Run quantity transaction tests and verify RED**

Expected: empty additions are rejected by the current whole-report UNKNOWN gate.

- [ ] **Step 3: Replace `canCommit(report)` with `decideMutation(report)`**

`previewCandidate()` stores the decision. `addOne`/`replaceSingleton` use `decision.allowed`. For `removeOne`, evaluate the resulting report for display but return `committed:true` whenever the requested line existed and the candidate differs.

- [ ] **Step 4: Verify focused tests, full compatibility tests, and typecheck**

- [ ] **Step 5: Commit**

```bash
git add packages/compatibility/src/quantity-transaction.ts packages/compatibility/src/quantity-transaction.test.ts
git commit -m "fix: allow safe editing of incomplete builds"
```
### Task 4: Expose green/gray/red apply-now state to the browser

**Files:**
- Modify: `apps/web/lib/catalog-compatibility.ts`
- Modify: `apps/web/lib/catalog-compatibility.test.ts`
- Modify: `apps/web/lib/builder.test.ts`

**Interfaces:**
- `CatalogApplyState = "CAN_APPLY" | "BLOCKED_UNKNOWN" | "BLOCKED_INCOMPATIBLE"`.
- Sort order is `CAN_APPLY`, then `BLOCKED_UNKNOWN`, then `BLOCKED_INCOMPATIBLE`, stable inside each group.

- [ ] **Step 1: Write failing tri-state/empty-build tests**

```ts
expect(catalogApplyState([], "case-atx-340")).toBe("CAN_APPLY");
expect(catalogApplyState([], "cpu-am5-7600")).toBe("CAN_APPLY");
```

Use a test-only resolver/candidate fixture with unknown second-GPU topology for `BLOCKED_UNKNOWN`, and an AM5/LGA1155 conflict for `BLOCKED_INCOMPATIBLE`. Assert stable three-bucket sorting.

- [ ] **Step 2: Run web tests and verify RED**

- [ ] **Step 3: Map `previewPart(...).decision.state` directly to the catalog state**

Do not infer state from whole-build `report.status`. Keep `sortCatalogForBuild` stable using rank `{ CAN_APPLY:0, BLOCKED_UNKNOWN:1, BLOCKED_INCOMPATIBLE:2 }`.

- [ ] **Step 4: Verify web tests/typecheck and commit**

```bash
git add apps/web/lib/catalog-compatibility.ts apps/web/lib/catalog-compatibility.test.ts apps/web/lib/builder.test.ts
git commit -m "feat: distinguish unknown and incompatible catalog actions"
```
### Task 5: Give WebMCP the same empty-build behavior

**Files:**
- Create: `apps/web/lib/agent-change.ts`
- Create: `apps/web/lib/agent-change.test.ts`
- Modify: `apps/web/components/webmcp-inspector.tsx`

**Interfaces:**
- Move `AgentAction`, `AgentChangeInput`, and `runAgentChange(lines,input)` out of the React component into a pure tested module.
- `runAgentChange` delegates to `addPart`, `decrementPart`, and `replaceSingletonPart`, so its decision semantics are identical to UI mutations.

- [ ] **Step 1: Write failing pure agent-change tests**

```ts
expect(runAgentChange([], { componentId:"case-atx-340", action:"replace" }).committed).toBe(true);
expect(runAgentChange([], { componentId:"cpu-am5-7600", action:"replace" }).committed).toBe(true);
```

Also assert an incompatible singleton replacement returns `CHANGE_REJECTED` with `BLOCKED_INCOMPATIBLE`, and atomic multi-add rolls back if a later increment becomes blocked.

- [ ] **Step 2: Verify RED because the helper is still component-local**

- [ ] **Step 3: Extract the pure helper and make the inspector import it**

The React component retains history/state registration only. Do not duplicate compatibility decisions inside WebMCP.

- [ ] **Step 4: Run web + WebMCP tests/typechecks and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/agent-change.ts apps/web/lib/agent-change.test.ts apps/web/components/webmcp-inspector.tsx
git commit -m "fix: let agents construct builds from empty state"
```

### Task 6: Verify the correctness milestone

- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `git diff --check`.
- [ ] Production-smoke an empty build: clear all lines, add a case, CPU, board, and storage in different orders; verify allowed actions commit and known conflicts still reject.
- [ ] Push the verified checkpoint before beginning catalog/layout/geometry work.
