# HowToPC Codex Execution Guide

This document is the handoff from ChatGPT architecture/planning to Codex implementation.

Codex should implement HowToPC **task by task**, reading the approved design and the relevant plan before editing. Do not prompt Codex to “build the whole app.” Each task below has a recommended **GPT-5.6 Sol effort** chosen to conserve limited usage while reserving deeper reasoning for contracts and algorithms where subtle mistakes would propagate.

## Effort policy

### Low
Use for deterministic scaffolding, UI wiring, docs, CI configuration, simple persistence, reporting, and mechanical/repetitive integration.

If the Codex UI you are using does not expose Low, use the cheapest available Sol effort for these tasks; do not upgrade to High merely because the task touches many files.

### Medium
Default for ordinary feature implementation, bounded integrations, calculations with clear formulas, and UI/data work whose architecture has already been decided.

### High
Reserve for work where correctness requires reasoning across multiple subsystems or where the chosen contract will be expensive to change:

- foundational domain/database contracts
- compatibility rule architecture
- hardware resource topology
- candidate build transactions
- mechanical geometry/placement/collision/installability
- benchmark normalization
- homelab cross-resource sizing
- optimization
- WebMCP tool design/safety/evals
- product identity/conflict resolution
- final adversarial integration verification

### Max / Extra-high-style effort
**Not scheduled for normal implementation.** If available in Codex, reserve it as an emergency tool for a concrete blocker after High has produced a reproducible failing case, or for one final deep review if substantial usage remains. Do not spend it on initial attempts.

## How to prompt Codex

Use a bounded prompt like:

```text
Work in CodWasTaken/HowToPC.
Read:
- docs/superpowers/specs/2026-08-26-howtopc-architecture-design.md
- docs/superpowers/specs/2026-08-26-howtopc-adversarial-review.md
- <relevant plan path>

Implement ONLY Task <N>: <task name>.
Follow the plan's file boundaries, interfaces, tests, and commit requirement.
Do not start the next task.
Before claiming completion, run every verification command required by the task and inspect the output.
If the plan conflicts with the current repository state, preserve the approved architectural invariants and report the smallest necessary plan adjustment.
```

Keep the task in the same Codex thread while fixing failures discovered by its own verification. Start a new bounded task only after the current task has a clean commit.

## Execution order and effort matrix

### Plan 01 — Foundation, domain, catalog
Plan: `docs/superpowers/plans/2026-08-26-01-foundation-domain-catalog.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 1 | 1 | Scaffold workspace and baseline tooling | **Low** |
| 2 | 2 | Core domain primitives and revision contracts | **High** |
| 3 | 3 | PostgreSQL/Drizzle canonical catalog schema | **High** |
| 4 | 4 | Catalog category schemas and validation | **Medium** |
| 5 | 5 | Canonical catalog repository/search | **Medium** |
| 6 | 6 | Curated fixtures and CI baseline | **Low** |

**Checkpoint A:** Stop and run the full Plan 01 exit criteria before moving on. If Task 2 or 3 required substantial redesign, review the resulting interfaces before consuming them elsewhere.

### Plan 02 — Compatibility and resource engine
Plan: `docs/superpowers/plans/2026-08-26-02-compatibility-resource-engine.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 7 | 1 | Rule-engine contracts and report | **High** |
| 8 | 2 | Core specification compatibility rules | **Medium** |
| 9 | 3 | Firmware and vendor-validation semantics | **Medium** |
| 10 | 4 | Electrical compatibility/accounting | **Medium** |
| 11 | 5 | Motherboard/resource topology graph + DSL | **High** |
| 12 | 6 | Candidate build transactions + compatibility deltas | **High** |
| 13 | 7 | Compatibility release gates/golden fixtures | **Medium** |

**Checkpoint B:** Compatibility must correctly return `COMPATIBLE`, `INCOMPATIBLE`, `WARNING`, and `UNKNOWN` before any 3D work is treated as authoritative.

### Plan 03 — Mechanical geometry and 3D
Plan: `docs/superpowers/plans/2026-08-26-03-mechanical-geometry-3d.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 14 | 1 | Mechanical profiles/evidence/tolerances/anchors/mounts | **High** |
| 15 | 2 | Anchor-based placement and assembly transforms | **High** |
| 16 | 3 | Fast analytic clearance checks | **Medium** |
| 17 | 4 | Collision and keep-out validation | **High** |
| 18 | 5 | Installation paths and assembly dependencies | **High** |
| 19 | 6 | GLB/parametric asset runtime/pipeline | **Medium** |
| 20 | 7 | React Three Fiber digital-twin viewport | **Medium** |
| 21 | 8 | Mechanically verified MVP reference set | **Medium** |

**Quota note:** Tasks 14, 15, 17, and 18 are the densest cluster in the project. Do not combine them into one Codex request. Give each its own clean context and tests.

**Checkpoint C:** Require one end-to-end mechanically verified PC plus alternative cases/GPUs/cooling that prove the scene is data-driven, not hardcoded.

### Plan 04 — Calculations, homelab, optimization
Plan: `docs/superpowers/plans/2026-08-26-04-calculations-homelab-optimization.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 22 | 1 | Versioned calculation/assumption contracts | **High** |
| 23 | 2 | Power and electricity-cost model | **Medium** |
| 24 | 3 | Benchmark/performance normalization | **High** |
| 25 | 4 | Homelab workload profiles | **Medium** |
| 26 | 5 | Homelab sizing/storage/network planning | **High** |
| 27 | 6 | Conservative thermal/noise model | **Medium** |
| 28 | 7 | Deterministic constrained optimizer | **High** |

**Checkpoint D:** No calculation may display unsupported precision; optimizer results must re-run full compatibility and preserve declared hard constraints.

### Plan 05 — Builder UI
Plan: `docs/superpowers/plans/2026-08-26-05-builder-ui.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 29 | 1 | Builder shell/design tokens/routes | **Low** |
| 30 | 2 | Catalog browser and compatibility filters | **Medium** |
| 31 | 3 | Selected-parts/build-state panel | **Medium** |
| 32 | 4 | Integrate live 3D with committed/candidate state | **High** |
| 33 | 5 | Compatibility/engineering analysis panels | **Medium** |
| 34 | 6 | PC and homelab onboarding | **Medium** |
| 35 | 7 | Anonymous persistence/sharing | **Low** |
| 36 | 8 | Accessibility/responsive/performance UI gate | **Medium** |

**Quota note:** Do not use High for visual polish. Task 32 is High because it joins candidate transactions, geometry, and UI state; the rest should stay cheaper unless a concrete architecture bug appears.

### Plan 06 — WebMCP and agent integration
Plan: `docs/superpowers/plans/2026-08-26-06-webmcp-agent-integration.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 37 | 1 | Isolated WebMCP adapter boundary | **Medium** |
| 38 | 2 | P0 public tool set/schema/descriptions | **High** |
| 39 | 3 | SAFE preview/apply mutation policy | **High** |
| 40 | 4 | Normalize/sanitize third-party content | **Medium** |
| 41 | 5 | Build command log/undo/actor provenance | **Medium** |
| 42 | 6 | WebMCP evaluation suite | **High** |
| 43 | 7 | Judge-visible WebMCP inspector | **Low** |
| 44 | 8 | Browser fallback/manual parity E2E | **Medium** |

**Checkpoint E:** Run tool-selection and recovery evals before adding more public tools. If the agent struggles, improve descriptions/granularity instead of exposing lower-level UI/geometry tools.

### Plan 07 — Ingestion, pricing, data quality
Plan: `docs/superpowers/plans/2026-08-26-07-ingestion-pricing-data-quality.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 45 | 1 | Ingestion/rights/source-gate contracts | **High** |
| 46 | 2 | BuildCores OpenDB seed adapter | **Medium** |
| 47 | 3 | Canonical product identity resolution | **High** |
| 48 | 4 | Conflict detection/canonical override queue | **High** |
| 49 | 5 | Optional Icecat enrichment adapter | **Medium** |
| 50 | 6 | First retailer offer provider | **Medium** |
| 51 | 7 | Production/market availability classification | **Medium** |
| 52 | 8 | Coverage/data-quality reports | **Low** |

**Quota note:** Tasks 49 and 50 are optional for hackathon P0 if credentials/provider terms slow progress. Do not spend scarce High-effort usage forcing nonessential third-party integrations to work.

### Plan 08 — Integration, verification, deployment, demo
Plan: `docs/superpowers/plans/2026-08-26-08-integration-verification-deployment-demo.md`

| Global task | Plan task | Work | Sol effort |
|---:|---:|---|---|
| 53 | 1 | Full-system golden build scenarios | **High** |
| 54 | 2 | Unified CI quality gates | **Medium** |
| 55 | 3 | Browser/3D performance budgets | **Medium** |
| 56 | 4 | Production infrastructure/environment boundaries | **Medium** |
| 57 | 5 | Hackathon demo flow and seed state | **Medium** |
| 58 | 6 | Code/data/asset licensing package | **Low** |
| 59 | 7 | Public-repo/submission-readiness cleanup | **Low** for cleanup; switch to **High** only for the explicit final technical review portion |
| 60 | 8 | Final full-system adversarial verification | **High** |

## Recommended quota strategy

### 1. Spend High only on the 21 High-designated jobs

The High jobs are where cross-system mistakes are most likely to be expensive. Do not turn every medium-sized task into High “just to be safe.”

### 2. If quota becomes tight, preserve this critical path

Implement in this order before P1 breadth:

```text
1-13   Foundation + compatibility
14-21  Mechanical digital twin
29-33  Core builder UI
37-44  WebMCP agent path
53-60  Integration/demo/release
```

Then add Plan 04 analysis/homelab depth and Plan 07 broad ingestion according to remaining time/usage. A minimal homelab workload path is still required for the approved MVP; advanced analysis can be staged.

### 3. Optional/defer-first tasks if resources are low

Defer before compromising core correctness:

- Task 27 advanced thermal/noise detail
- Task 35 authentication (anonymous persistence is enough)
- Task 49 Icecat integration
- Task 50 live retailer integration
- broad mechanical catalog expansion beyond the reference/demo set
- visual asset polish that does not improve mechanical correctness

### 4. Use Medium as the default retry level

If a Low task fails because of an ordinary build/test issue, first retry/fix in the same thread at Low/Medium. Do not reflexively restart the task at High.

### 5. Escalate to High only with a concrete reason

Good escalation examples:

- incompatible domain types are forcing duplicate models;
- resource graph produces contradictory allocations;
- collision transform is wrong despite isolated transform tests;
- optimizer violates hard constraints;
- agent tool selection fails WebMCP evals;
- identity resolver merges distinct physical SKUs.

Bad escalation examples:

- Tailwind spacing looks wrong;
- package import path is broken;
- a simple migration command needs correction;
- README wording needs adjustment.

### 6. Reserve a High pass for Task 60

Do not exhaust all deep-reasoning capacity before final integration. A fresh adversarial review of the assembled system is more valuable than using High for routine components earlier.

## Plan dependency graph

```text
Plan 01 Foundation
   ↓
Plan 02 Compatibility
   ├───────────────┐
   ↓               ↓
Plan 03 Geometry   Plan 04 Calculations/Homelab
   └───────┬───────┘
           ↓
Plan 05 Builder UI
           ↓
Plan 06 WebMCP

Plan 07 Ingestion/Data ─── enriches Plans 01/04 but must not block runtime
           ↓
Plan 08 Integration/Release
```

Plan 07 can begin after the Plan 01 schema stabilizes, but broad ingestion should not distract from Plans 02–06 during the hackathon critical path.

## Definition of done for every Codex task

Codex is not finished because code was written. Every task must:

1. implement only the named task scope;
2. preserve approved package/interface boundaries;
3. add/update the specified tests;
4. run the task's verification commands and inspect the output;
5. run relevant typecheck/build commands when interfaces changed;
6. commit a coherent change with the plan's intended commit message or an equivalent descriptive message;
7. stop before beginning the next task.

If a task uncovers a genuine flaw in the approved architecture, Codex should document the failing assumption and propose the smallest correction rather than silently redesigning HowToPC.
