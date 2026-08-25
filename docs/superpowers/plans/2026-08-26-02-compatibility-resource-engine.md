# HowToPC Compatibility and Resource Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the deterministic compatibility engine that evaluates full candidate builds, explains every rule, and refuses to convert missing evidence into a false green result.

**Architecture:** Compatibility rules operate on the complete candidate build context, not only pairwise component checks. Cheap specification/electrical/resource checks execute first; geometry integrates later through Plan 03. All mutations are previewed against an immutable candidate revision before commit. Rules return evidence-aware results rather than booleans.

**Tech Stack:** TypeScript, Zod, Vitest, fast-check, domain/catalog packages from Plan 01.

**Spec:** `docs/superpowers/specs/2026-08-26-howtopc-architecture-design.md` and `docs/superpowers/specs/2026-08-26-howtopc-adversarial-review.md`

## Global constraints

- `UNKNOWN` is a successful engine outcome, not an exception.
- Pairwise compatibility shortcuts may optimize filtering, but authoritative analysis evaluates the whole build context.
- Every rule defines its evidence requirements, unknown behavior, remediation message, known-good fixture, and known-bad fixture before production use.
- Hard-incompatible candidate changes are previewable but are not committed by SAFE-mode agent mutations.
- QVL absence does not automatically mean memory incompatibility.
- Firmware prerequisites are warnings/conditions when resolvable; missing required support data can produce `UNKNOWN`.

---

## Task 1: Define rule-engine contracts and compatibility report

**Codex effort:** **High** — this is the central correctness API consumed by UI, geometry, optimizer, and WebMCP.

**Files:**
- Create: `packages/compatibility/package.json`
- Create: `packages/compatibility/src/rule.ts`
- Create: `packages/compatibility/src/context.ts`
- Create: `packages/compatibility/src/report.ts`
- Create: `packages/compatibility/src/engine.ts`
- Create: `packages/compatibility/src/index.ts`
- Test: `packages/compatibility/src/engine.test.ts`

**Interfaces:**
- Produces `CompatibilityRule`, `CompatibilityRuleResult`, `CompatibilityReport`, `BuildContext`, `evaluateBuild`.
- Later geometry rules plug into the same `CompatibilityRule` contract.

- [ ] **Step 1: Write report aggregation tests**

Required aggregation semantics:

```text
any INCOMPATIBLE => report INCOMPATIBLE
else any UNKNOWN => report UNKNOWN unless a higher-severity warning policy explicitly applies
else any WARNING => report WARNING
else all applicable rules COMPATIBLE => COMPATIBLE
```

Do not let non-applicable rules become UNKNOWN.

- [ ] **Step 2: Define rule contract**

Each rule exposes at minimum:

```ts
interface CompatibilityRule {
  id: string;
  category: CompatibilityCategory;
  evaluate(context: BuildContext): Promise<CompatibilityRuleResult> | CompatibilityRuleResult;
}
```

`CompatibilityRuleResult` includes status, message, involved build items/resources, measured values, evidence references, and remediation suggestions.

- [ ] **Step 3: Implement deterministic engine ordering**

Order rules by cheap specification checks, electrical/resource checks, then expensive geometry hooks. Rule ordering must not change final semantics.

- [ ] **Step 4: Test UNKNOWN propagation and non-applicable behavior**

- [ ] **Step 5: Commit**

```bash
git add packages/compatibility
 git commit -m "feat: add explainable compatibility rule engine"
```

---

## Task 2: Implement core specification compatibility rules

**Codex effort:** **Medium** — rule set is broad but mostly deterministic once contracts are stable.

**Files:**
- Create: `packages/compatibility/src/rules/cpu-motherboard.ts`
- Create: `packages/compatibility/src/rules/memory-motherboard.ts`
- Create: `packages/compatibility/src/rules/motherboard-case.ts`
- Create: `packages/compatibility/src/rules/gpu-case-analytic.ts`
- Create: `packages/compatibility/src/rules/psu-case.ts`
- Create: `packages/compatibility/src/rules/cooler-cpu.ts`
- Create: `packages/compatibility/src/rules/cooler-case-analytic.ts`
- Create: `packages/compatibility/src/rules/storage-interface.ts`
- Test: corresponding `*.test.ts`

**Interfaces:**
- Produces P0 spec-level compatibility coverage for the curated catalog.

- [ ] **Step 1: Write known-good/known-bad tests before each rule**

Examples:
- AM5 CPU + AM5 board passes socket check.
- AM4 CPU + AM5 board fails.
- DDR4 kit + DDR5-only board fails.
- Mini-ITX board in ATX case passes if supported.
- EATX board in Mini-ITX case fails.

- [ ] **Step 2: Implement evidence-aware rules**

If a required field is absent, return `UNKNOWN` with the missing field/evidence called out.

- [ ] **Step 3: Add property-based invariants**

Examples:

```text
socket mismatch can never yield COMPATIBLE
gpu length strictly above verified available corridor can never yield COMPATIBLE
negative/zero capacity data cannot enter a rule context
```

- [ ] **Step 4: Commit**

```bash
git add packages/compatibility/src/rules
 git commit -m "feat: add core specification compatibility rules"
```

---

## Task 3: Add firmware and vendor-validation semantics

**Codex effort:** **Medium** — nuanced semantics, but narrow scope.

**Files:**
- Create: `packages/compatibility/src/firmware.ts`
- Create: `packages/compatibility/src/rules/cpu-firmware.ts`
- Create: `packages/compatibility/src/rules/memory-validation.ts`
- Test: `packages/compatibility/src/firmware.test.ts`

**Interfaces:**
- Produces `FirmwareRequirement`, `VendorValidationStatus`.

- [ ] **Step 1: Encode motherboard CPU support requirements**

Support minimum BIOS version, board revision, and evidence reference.

- [ ] **Step 2: Distinguish memory spec compatibility from QVL validation**

Represent:

```text
SPEC_COMPATIBLE
VENDOR_VALIDATED
NOT_VENDOR_VALIDATED
```

Absence from QVL must not automatically become `INCOMPATIBLE`.

- [ ] **Step 3: Add fixtures for supported-after-BIOS-update and missing-support-table cases**

- [ ] **Step 4: Commit**

```bash
git add packages/compatibility
 git commit -m "feat: model firmware and vendor validation conditions"
```

---

## Task 4: Implement electrical compatibility and PSU connector accounting

**Codex effort:** **Medium** — precise but contained arithmetic/resource accounting.

**Files:**
- Create: `packages/compatibility/src/electrical/resources.ts`
- Create: `packages/compatibility/src/rules/psu-power-connectors.ts`
- Create: `packages/compatibility/src/rules/motherboard-power.ts`
- Create: `packages/compatibility/src/rules/header-capacity.ts`
- Test: `packages/compatibility/src/electrical/*.test.ts`

**Interfaces:**
- Produces `ElectricalDemand`, `ElectricalSupply`, connector allocation results.
- Plan 04 supplies power-load estimates; this task checks structural electrical compatibility independently of performance estimates.

- [ ] **Step 1: Write connector-allocation tests**

Cover PCIe 6-pin, PCIe 8-pin, 12VHPWR, 12V-2x6, motherboard 24-pin, CPU EPS, SATA power, fan/pump header count/current when data exists.

- [ ] **Step 2: Implement connector allocation as resources, not strings**

A PSU with enough wattage but the wrong connectors must fail the relevant rule.

- [ ] **Step 3: Return warnings for adapter-only situations rather than silently treating them as native connectors**

- [ ] **Step 4: Commit**

```bash
git add packages/compatibility/src/electrical packages/compatibility/src/rules
 git commit -m "feat: add electrical compatibility accounting"
```

---

## Task 5: Build the motherboard/resource topology graph and conditional rule DSL

**Codex effort:** **High** — dense reasoning and one of the main homelab differentiators.

**Files:**
- Create: `packages/compatibility/src/resources/graph.ts`
- Create: `packages/compatibility/src/resources/resource.ts`
- Create: `packages/compatibility/src/resources/constraints.ts`
- Create: `packages/compatibility/src/resources/dsl.ts`
- Create: `packages/compatibility/src/rules/resource-topology.ts`
- Test: `packages/compatibility/src/resources/*.test.ts`

**Interfaces:**
- Produces `ResourceGraph`, `ResourceNode`, `ResourceEdge`, `ConditionalConstraint`, and evaluator.
- Must represent physical slot width separately from electrical PCIe lane width/generation/source.

- [ ] **Step 1: Write topology fixtures**

At minimum model:

```text
M.2_3 occupied -> SATA_5 and SATA_6 unavailable
PCIe slot 2 physical x16 -> electrical x4 from chipset
M.2_2 occupied -> PCIe slot 2 bandwidth reduced/unavailable according to fixture
```

- [ ] **Step 2: Define declarative conditional constraint format**

Avoid motherboard-model-specific `if` statements in TypeScript code.

- [ ] **Step 3: Implement resource allocation and conflict explanations**

Results identify which installed devices caused the conflict and suggest remediations such as moving the NVMe device or choosing another board.

- [ ] **Step 4: Add property tests for resource conservation**

Allocated resources cannot exceed available cardinality/bandwidth in hard-resource dimensions.

- [ ] **Step 5: Commit**

```bash
git add packages/compatibility/src/resources
 git commit -m "feat: add conditional hardware resource graph"
```

---

## Task 6: Implement candidate build transactions and compatibility deltas

**Codex effort:** **High** — this is the safety boundary for both humans and agents.

**Files:**
- Create: `packages/domain/src/commands.ts`
- Create: `packages/domain/src/transaction.ts`
- Create: `packages/compatibility/src/candidate.ts`
- Create: `packages/compatibility/src/delta.ts`
- Test: `packages/compatibility/src/candidate.test.ts`

**Interfaces:**
- Produces `previewBuildChange`, `applyBuildChange`, `BuildTransaction`, `CompatibilityDelta`.
- Plan 06 WebMCP must call these functions rather than directly mutating Zustand/database state.

- [ ] **Step 1: Write failing transaction tests**

Required behaviors:
- candidate change never mutates source revision;
- invalid candidate can be previewed;
- SAFE apply rejects new hard incompatibility;
- UNKNOWN can be policy-controlled but never silently upgraded to compatible;
- successful apply creates exactly one new build revision.

- [ ] **Step 2: Implement command model**

Commands include add, remove, replace, set goals, set workloads, and placement/configuration changes.

- [ ] **Step 3: Implement compatibility delta**

Report rules introduced, resolved, or changed by the candidate.

- [ ] **Step 4: Add optimistic concurrency using expected build revision**

Reject stale writes rather than overwriting a newer human/agent build.

- [ ] **Step 5: Commit**

```bash
git add packages/domain packages/compatibility
 git commit -m "feat: add safe candidate build transactions"
```

---

## Task 7: Add compatibility release gates and golden fixtures

**Codex effort:** **Medium** — important verification, but criteria are already explicit.

**Files:**
- Create: `packages/compatibility/test/golden-builds/*.json`
- Create: `packages/compatibility/test/property/*.test.ts`
- Create: `docs/compatibility/rule-quality-gate.md`

**Interfaces:**
- Produces reusable known-good and known-bad builds for geometry/WebMCP/end-to-end plans.

- [ ] **Step 1: Add golden compatible/incompatible/unknown builds**

Include examples for PC and homelab resource usage.

- [ ] **Step 2: Implement reusable rule quality test helper**

A production rule test suite must demonstrate known-good, known-bad, missing-evidence behavior, and explanation/remediation fields.

- [ ] **Step 3: Run full compatibility suite repeatedly with randomized property tests**

```bash
pnpm --filter @howtopc/compatibility test
pnpm typecheck
```

Expected: zero failures.

- [ ] **Step 4: Commit**

```bash
git add packages/compatibility docs/compatibility
 git commit -m "test: enforce compatibility rule quality gates"
```

## Exit criteria

Plan 02 is complete only when the engine can explain and safely preview the P0 specification, firmware, electrical, and resource-topology compatibility of a complete candidate build; missing evidence returns `UNKNOWN`; stale/invalid writes cannot silently commit; and property/golden tests protect the core invariants.
