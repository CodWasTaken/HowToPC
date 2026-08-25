# HowToPC WebMCP and Agent Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose the builder's deterministic domain capabilities to AI agents through WebMCP without duplicating business logic, leaking untrusted retailer content, or allowing unsafe partial mutations.

**Architecture:** `packages/webmcp` is the only package allowed to reference `document.modelContext` or WebMCP browser APIs. Public tools are task-oriented and map to domain/query/transaction functions. Read tools operate on canonical cached data; mutation tools preview candidate revisions, validate them, then commit according to policy. The human UI remains fully usable when WebMCP is unavailable.

**Tech Stack:** TypeScript, current WebMCP `document.modelContext` API, Zod/JSON Schema, Vitest, Playwright, Chrome WebMCP testing/evals.

**Spec:** baseline architecture plus adversarial review.

## Global constraints

- Never expose UI-click tools such as `click_gpu_dropdown`.
- WebMCP never directly mutates Zustand state or database rows.
- External retailer/web text is untrusted; tool outputs default to normalized structured facts.
- SAFE mutation policy rejects hard incompatibilities and does not silently upgrade UNKNOWN to compatible.
- Tool descriptions must be concise, specific, and evaluated for tool-selection accuracy.
- WebMCP availability/failure must not break manual builder use.

---

## Task 1: Create the isolated WebMCP adapter boundary

**Codex effort:** **Medium** — API integration is contained; architecture is already decided.

**Files:**
- Create: `packages/webmcp/package.json`
- Create: `packages/webmcp/src/runtime.ts`
- Create: `packages/webmcp/src/register.ts`
- Create: `packages/webmcp/src/schema.ts`
- Create: `packages/webmcp/src/index.ts`
- Test: `packages/webmcp/src/*.test.ts`

**Interfaces:**
- Produces a runtime adapter capable of registering/unregistering tools.
- No other package imports WebMCP globals.

- [ ] **Step 1: Define runtime interface independent of browser global**

Create an injectable interface so unit tests can use a fake runtime.

- [ ] **Step 2: Implement browser adapter around `document.modelContext`**

Feature-detect availability and return a clear disabled state when unsupported.

- [ ] **Step 3: Support clean tool registration/unregistration lifecycle**

Avoid duplicate registrations during React development/re-renders.

- [ ] **Step 4: Commit**

```bash
git add packages/webmcp
 git commit -m "feat: isolate WebMCP runtime adapter"
```

---

## Task 2: Design and register the P0 public tool set

**Codex effort:** **High** — tool granularity/schema/descriptions directly affect agent reliability and hackathon judging.

**Files:**
- Create: `packages/webmcp/src/tools/catalog.ts`
- Create: `packages/webmcp/src/tools/build.ts`
- Create: `packages/webmcp/src/tools/analysis.ts`
- Create: `packages/webmcp/src/tools/optimization.ts`
- Create: `packages/webmcp/src/tools/index.ts`
- Test: corresponding tests

**Interfaces:**
- Public tools should begin with this compact set:

```text
get_build
search_components
inspect_component
preview_build_change
apply_build_change
set_build_goals
set_workloads
analyze_build
optimize_build
undo_last_change
```

- [ ] **Step 1: Define strict input/output schemas**

Use stable product/build IDs, typed category/filter fields, and explicit mutation command objects.

- [ ] **Step 2: Write tool-description selection tests/eval prompts**

Ensure the agent chooses `preview_build_change` rather than inventing a mutation or calling unrelated tools.

- [ ] **Step 3: Map tools to domain/catalog/calculation functions**

No business logic inside WebMCP handlers beyond validation, policy, serialization, and error mapping.

- [ ] **Step 4: Keep geometry internals private**

Do not expose dozens of low-level mount/anchor functions unless an actual user journey proves they are needed.

- [ ] **Step 5: Commit**

```bash
git add packages/webmcp/src/tools
 git commit -m "feat: expose task-oriented WebMCP builder tools"
```

---

## Task 3: Implement SAFE preview/apply mutation policy

**Codex effort:** **High** — agent safety and build consistency depend on this boundary.

**Files:**
- Create: `packages/webmcp/src/policy.ts`
- Create: `packages/webmcp/src/errors.ts`
- Modify: build tool handlers
- Test: `packages/webmcp/src/policy.test.ts`

**Interfaces:**
- Consumes Plan 02 candidate transaction API.
- Produces structured agent-facing errors/remediation.

- [ ] **Step 1: Test mutation policy**

Required cases:
- compatible candidate applies;
- hard incompatible candidate can preview but SAFE apply rejects;
- unknown critical fit condition does not return success as compatible;
- stale build revision returns concurrency error;
- multi-change optimizer result commits atomically.

- [ ] **Step 2: Implement structured error result**

Example fields:

```text
code: PHYSICAL_COLLISION
component_id
conflict_component_id
required_clearance_mm
available_clearance_mm
remediation[]
```

- [ ] **Step 3: Require expected build revision on mutations**

- [ ] **Step 4: Commit**

```bash
git add packages/webmcp
 git commit -m "feat: enforce safe transactional WebMCP mutations"
```

---

## Task 4: Sanitize and minimize agent-visible third-party content

**Codex effort:** **Medium** — security boundary with clear rules.

**Files:**
- Create: `packages/webmcp/src/serialization/product.ts`
- Create: `packages/webmcp/src/serialization/offer.ts`
- Create: `packages/webmcp/src/serialization/evidence.ts`
- Test: `packages/webmcp/src/serialization/*.test.ts`

**Interfaces:**
- Produces normalized agent DTOs rather than raw provider responses/descriptions.

- [ ] **Step 1: Define allowlisted output fields**

Return product identity, normalized specs, canonical price/availability observations, compatibility, coverage, evidence references; exclude raw marketing prose by default.

- [ ] **Step 2: Add hostile-content fixtures**

A retailer title/description containing instruction-like text must remain inert data and must not appear in trusted tool descriptions/system-like output.

- [ ] **Step 3: Mark any deliberately surfaced untrusted text explicitly**

Prefer not surfacing it during P0.

- [ ] **Step 4: Commit**

```bash
git add packages/webmcp/src/serialization
 git commit -m "security: normalize WebMCP external content"
```

---

## Task 5: Add build command log, undo, and actor provenance

**Codex effort:** **Medium** — important observability; interfaces are defined.

**Files:**
- Create/modify: `packages/domain/src/command-log.ts`
- Create/modify DB schema/migration for command records
- Create: `packages/webmcp/src/actor.ts`
- Test: command-log tests

**Interfaces:**
- Produces command/event records with actor `human | agent`, arguments, old/new build revision, compatibility delta, timestamp.

- [ ] **Step 1: Persist every successful mutation command**

- [ ] **Step 2: Implement `undo_last_change` as a domain revision operation**

Do not mutate/decrement revision history; create a new revision representing the restored state.

- [ ] **Step 3: Expose concise reason/delta for UI activity feed**

- [ ] **Step 4: Commit**

```bash
git add packages/domain packages/db packages/webmcp
 git commit -m "feat: add auditable human and agent build command log"
```

---

## Task 6: Create WebMCP evaluation suite

**Codex effort:** **High** — this validates the hackathon's core differentiator and needs reasoning about agent behavior, not just unit code.

**Files:**
- Create: `packages/webmcp/evals/tool-selection.*`
- Create: `packages/webmcp/evals/build-flows.*`
- Create: `docs/webmcp/eval-scenarios.md`
- Add scripts required by current WebMCP/Chrome eval tooling

**Interfaces:**
- Produces repeatable evaluation scenarios for tool discoverability, correctness, recovery, and overreach.

- [ ] **Step 1: Add simple tool-selection evals**

Examples:
- “show AM5 boards under X” -> search only;
- “will this GPU fit?” -> preview/analyze, no mutation;
- “replace GPU with this one” -> preview then apply according to policy.

- [ ] **Step 2: Add multi-step PC build eval**

Budget + 1440p + quiet + upgradeability; agent must create a valid build through structured actions.

- [ ] **Step 3: Add homelab eval**

Proxmox + Plex + storage + low idle power; verify workload assumptions are represented rather than invented invisibly.

- [ ] **Step 4: Add recovery eval**

Agent selects/considers oversized GPU + front radiator conflict and must use remediation data to recover.

- [ ] **Step 5: Add negative evals**

Agent must not commit hard incompatibility, must not claim UNKNOWN is verified, and must not require unsupported low-level geometry tools.

- [ ] **Step 6: Commit**

```bash
git add packages/webmcp/evals docs/webmcp
 git commit -m "test: add WebMCP agent behavior evaluations"
```

---

## Task 7: Build judge-visible WebMCP activity/debug panel

**Codex effort:** **Low** — presentation/observability over existing data.

**Files:**
- Create: `apps/web/src/features/developer/WebMcpInspector.tsx`
- Create: `apps/web/src/features/developer/ToolInvocationRow.tsx`
- Create: `apps/web/src/features/developer/EngineeringEvidence.tsx`

**Interfaces:**
- Consumes tool registry, command log, latest compatibility analysis, engine versions.

- [ ] **Step 1: Add optional inspector toggle**

Show registered tools, latest tool call/result, build revision, compatibility delta, geometry clearance values, data provenance/confidence, engine/model versions.

- [ ] **Step 2: Ensure panel contains no secrets/provider credentials**

- [ ] **Step 3: Keep it optional and unobtrusive for normal users**

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/developer
 git commit -m "feat: add WebMCP engineering inspector"
```

---

## Task 8: Browser fallback and end-to-end agent/manual parity verification

**Codex effort:** **Medium** — integration verification.

**Files:**
- Create: `apps/web/e2e/webmcp.spec.ts`
- Create: `apps/web/e2e/manual-parity.spec.ts`
- Modify WebMCP bootstrap integration

**Interfaces:**
- Verifies same domain outcome from manual vs tool mutation.

- [ ] **Step 1: Verify builder works with WebMCP absent**

Feature-detection failure shows a small agent-unavailable state, not application failure.

- [ ] **Step 2: Verify equivalent human/agent command produces equivalent build revision state**

- [ ] **Step 3: Verify tool registration lifecycle**

No duplicate/stale tools after navigation/hot reload in development.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e packages/webmcp
 git commit -m "test: verify WebMCP fallback and manual parity"
```

## Exit criteria

Plan 06 is complete when an agent can discover a small coherent tool set, search/inspect/analyze/preview/apply/optimize a build through the same deterministic engine as the UI, safely recover from incompatibilities, never require raw UI clicking, and demonstrate its tool use visibly to judges.
