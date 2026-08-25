# HowToPC Calculations, Homelab, and Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add transparent power, performance, workload, homelab capacity, electricity-cost, and deterministic optimization capabilities without presenting estimates as measurements.

**Architecture:** `packages/calculations` contains pure calculation models whose outputs always include model version, assumptions, confidence, and evidence/inputs. Homelab workload requirements are explicit user-configurable inputs. Optimizers search only canonical compatible candidates and revalidate every candidate through the compatibility engine.

**Tech Stack:** TypeScript, Zod, Vitest, fast-check, canonical catalog/compatibility packages.

**Spec:** baseline architecture plus adversarial review.

## Global constraints

- No fake universal bottleneck score.
- Measured, manufacturer-rated, derived, and estimated values are distinct observation types.
- Analysis results expose assumptions and ranges/confidence where appropriate.
- Optimization never bypasses compatibility validation.
- Purchase price, electricity price, performance, noise, power, size, and upgradeability are separate objectives/constraints rather than one magic score.
- MVP thermals/noise are qualitative or range-based unless evidence supports stronger precision.

---

## Task 1: Define versioned calculation result and assumption contracts

**Codex effort:** **High** — all later analysis outputs rely on this trust model.

**Files:**
- Create: `packages/calculations/package.json`
- Create: `packages/calculations/src/result.ts`
- Create: `packages/calculations/src/assumptions.ts`
- Create: `packages/calculations/src/evidence.ts`
- Create: `packages/calculations/src/index.ts`
- Test: `packages/calculations/src/result.test.ts`

**Interfaces:**
- Produces `CalculationResult<T>`, `CalculationConfidence`, `CalculationAssumptions`, `ObservationKind`.

- [ ] **Step 1: Write tests enforcing explicit assumptions and model version**

No result may be created without `modelVersion`, `inputs`, `assumptions`, and `confidence`.

- [ ] **Step 2: Define observation kinds**

At minimum:

```text
MEASURED
MANUFACTURER_RATED
DERIVED
ESTIMATED
```

Power-specific observations may refine these into idle/load/peak categories.

- [ ] **Step 3: Implement serialization suitable for build analysis snapshots**

- [ ] **Step 4: Commit**

```bash
git add packages/calculations
 git commit -m "feat: define transparent calculation contracts"
```

---

## Task 2: Implement system power and electricity-cost model

**Codex effort:** **Medium** — contained engineering math with explicit assumptions.

**Files:**
- Create: `packages/calculations/src/power/observation.ts`
- Create: `packages/calculations/src/power/model.ts`
- Create: `packages/calculations/src/power/psu-efficiency.ts`
- Create: `packages/calculations/src/power/electricity.ts`
- Test: `packages/calculations/src/power/*.test.ts`

**Interfaces:**
- Produces idle, typical, peak, transient allowance, wall-power estimate, and annual energy/cost results.

- [ ] **Step 1: Define typed power observations**

Include `IDLE_MEASURED`, `LOAD_MEASURED`, `PEAK_MEASURED`, `MANUFACTURER_TDP`, `MANUFACTURER_TBP`, `DERIVED_ESTIMATE`.

- [ ] **Step 2: Implement component-to-system aggregation**

Do not equate CPU TDP/TBP with exact wall draw. Lower-confidence source classes widen uncertainty or lower confidence.

- [ ] **Step 3: Model PSU efficiency**

Convert DC demand to estimated wall draw using an efficiency curve/range and current load fraction.

- [ ] **Step 4: Implement annual energy cost**

Inputs include electricity price, currency, duty-cycle assumptions, and hours/year.

- [ ] **Step 5: Property-test monotonicity**

Higher duty cycle or electricity price cannot reduce calculated annual cost.

- [ ] **Step 6: Commit**

```bash
git add packages/calculations/src/power
 git commit -m "feat: add power and electricity cost analysis"
```

---

## Task 3: Define benchmark/performance observation normalization

**Codex effort:** **High** — benchmark normalization is easy to make misleading; keep scope deliberately narrow.

**Files:**
- Create: `packages/calculations/src/performance/observation.ts`
- Create: `packages/calculations/src/performance/workload.ts`
- Create: `packages/calculations/src/performance/normalize.ts`
- Create: `packages/calculations/src/performance/analysis.ts`
- Test: `packages/calculations/src/performance/*.test.ts`

**Interfaces:**
- Produces workload-specific performance analysis; Plan 07 supplies benchmark observations.

- [ ] **Step 1: Define workload dimensions before scores**

Examples:

```text
gaming: resolution + quality preset + game/workload family
rendering: renderer/benchmark + device mode
video: codec/resolution/encode/decode
AI: model size/quantization + VRAM need
compile: workload/project benchmark
```

- [ ] **Step 2: Store benchmark observations without forcing unrelated tests onto one universal scale**

- [ ] **Step 3: Implement workload summaries**

Outputs can identify likely limiting resources and relative suitability only where data exists.

- [ ] **Step 4: Add no-data behavior**

Missing benchmark evidence yields `UNKNOWN`/insufficient evidence, not invented percentile scores.

- [ ] **Step 5: Commit**

```bash
git add packages/calculations/src/performance
 git commit -m "feat: add workload-specific performance analysis"
```

---

## Task 4: Define explicit homelab workload profiles

**Codex effort:** **Medium** — domain modeling with clear user-facing assumptions.

**Files:**
- Create: `packages/calculations/src/homelab/workload.ts`
- Create: `packages/calculations/src/homelab/proxmox.ts`
- Create: `packages/calculations/src/homelab/plex.ts`
- Create: `packages/calculations/src/homelab/truenas.ts`
- Create: `packages/calculations/src/homelab/container.ts`
- Create: `packages/calculations/src/homelab/vm.ts`
- Test: `packages/calculations/src/homelab/*.test.ts`

**Interfaces:**
- Produces normalized `WorkloadProfile` and `ResourceDemand`.

- [ ] **Step 1: Define generic workload resource demand**

Cover compute, memory, storage capacity/performance, acceleration, networking, expansion, duty cycle, and availability/redundancy preferences.

- [ ] **Step 2: Implement MVP templates**

Templates: Proxmox, Docker, Plex/Jellyfin, TrueNAS/NAS, Home Assistant, generic Linux VM, generic Windows VM, game server, backup server, local AI inference.

- [ ] **Step 3: Require consequential assumptions**

Example Plex template asks/records streams, resolution/codec, transcoding requirement, hardware acceleration. VM template records count, RAM/vCPU/storage assumptions and oversubscription policy.

- [ ] **Step 4: Combine multiple workloads without double-counting fixed overhead blindly**

- [ ] **Step 5: Commit**

```bash
git add packages/calculations/src/homelab
 git commit -m "feat: add explicit homelab workload profiles"
```

---

## Task 5: Implement homelab hardware suitability and storage/network planning

**Codex effort:** **High** — cross-links workloads, topology, storage, networking, and compatibility.

**Files:**
- Create: `packages/calculations/src/homelab/sizing.ts`
- Create: `packages/calculations/src/homelab/storage.ts`
- Create: `packages/calculations/src/homelab/network.ts`
- Create: `packages/calculations/src/homelab/transcoding.ts`
- Test: corresponding tests

**Interfaces:**
- Consumes compatibility resource graph and electrical/mechanical constraints.
- Produces resource sufficiency report and candidate requirements.

- [ ] **Step 1: Implement compute/memory sufficiency checks**

Keep “recommended” headroom configurable and visible.

- [ ] **Step 2: Implement storage topology requirements**

Check drive count/capacity, SATA/SAS/NVMe interfaces, bays, HBA need, PCIe resource, power/connectors, and redundancy assumptions.

- [ ] **Step 3: Implement networking requirements**

MVP supports 1/2.5/10GbE interface requirements, NIC necessity, physical/electrical slot requirements, and throughput suitability.

- [ ] **Step 4: Implement transcoding capability requirement**

Use explicit codec/stream assumptions; do not infer universal Plex capability from CPU name alone.

- [ ] **Step 5: Commit**

```bash
git add packages/calculations/src/homelab
 git commit -m "feat: analyze homelab hardware suitability"
```

---

## Task 6: Add conservative thermal/noise suitability model

**Codex effort:** **Medium** — deliberately limited model; High is unnecessary unless expanding beyond the approved scope.

**Files:**
- Create: `packages/calculations/src/thermal/airflow.ts`
- Create: `packages/calculations/src/thermal/suitability.ts`
- Create: `packages/calculations/src/thermal/noise.ts`
- Test: `packages/calculations/src/thermal/*.test.ts`

**Interfaces:**
- Produces qualitative/range outputs such as airflow balance, cooling margin, and noise expectation.

- [ ] **Step 1: Define assumptions**

Ambient temperature, approximate component thermal load, fan count/size/RPM class, radiator configuration, and case restriction level.

- [ ] **Step 2: Implement conservative airflow/cooling margin**

Do not claim exact component temperatures without validated model evidence.

- [ ] **Step 3: Implement noise expectation using available manufacturer acoustic data where present**

Multiple noise sources are not arithmetically summed as dBA values.

- [ ] **Step 4: Commit**

```bash
git add packages/calculations/src/thermal
 git commit -m "feat: add conservative thermal and noise analysis"
```

---

## Task 7: Implement deterministic constrained optimization

**Codex effort:** **High** — this is combinatorial and must preserve all constraints while producing explainable changes.

**Files:**
- Create: `packages/calculations/src/optimizer/objective.ts`
- Create: `packages/calculations/src/optimizer/constraints.ts`
- Create: `packages/calculations/src/optimizer/candidates.ts`
- Create: `packages/calculations/src/optimizer/search.ts`
- Create: `packages/calculations/src/optimizer/explain.ts`
- Test: `packages/calculations/src/optimizer/*.test.ts`

**Interfaces:**
- Produces `optimizeBuild(request)` -> ranked candidate revisions plus explanations.

- [ ] **Step 1: Define objectives and hard constraints separately**

Objectives: cost, estimated power, workload performance, noise, size, upgradeability. Hard constraints: budget ceiling if strict, compatibility, minimum performance, storage/network/workload requirements, user exclusions/preferences.

- [ ] **Step 2: Implement bounded candidate generation**

Use catalog prefilters and category-level replacement sets; do not brute-force the Cartesian product of the entire catalog.

- [ ] **Step 3: Revalidate every candidate**

Every proposed optimized build runs full compatibility analysis and relevant calculations before ranking.

- [ ] **Step 4: Explain deltas**

Example: `replaced PSU because selected GPU requires native 12V-2x6; +€20, +100W capacity, no workload-performance change`.

- [ ] **Step 5: Test preservation constraints**

For “€100 cheaper with <=5% modeled gaming loss,” no returned candidate may violate either condition.

- [ ] **Step 6: Commit**

```bash
git add packages/calculations/src/optimizer
 git commit -m "feat: add constrained build optimizer"
```

## Exit criteria

Plan 04 is complete when HowToPC can transparently estimate power/energy, express workload-specific performance only where evidence exists, size explicit PC/homelab workloads, reason about storage/network/expansion constraints, provide conservative thermal/noise guidance, and optimize builds without ever bypassing deterministic compatibility or hiding assumptions.
