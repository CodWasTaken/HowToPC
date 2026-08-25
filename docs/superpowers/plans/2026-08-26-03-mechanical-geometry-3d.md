# HowToPC Mechanical Geometry and 3D Digital Twin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the real-scale mechanical model, mounting system, analytic clearance checks, collision/keep-out validation, installation-state reasoning, and browser 3D renderer used by both compatibility and the human/agent experience.

**Architecture:** Mechanical truth lives in `packages/geometry` as framework-independent data/functions. `apps/web` renders that truth through React Three Fiber but does not invent placement coordinates. All dimensions are millimetres. Parts attach through anchors/mounts; collision and installation validation use simplified geometry. Visual assets may be exact, parametric, or bounding placeholders without changing mechanical compatibility semantics.

**Tech Stack:** TypeScript, Three.js, React Three Fiber, Drei, three-mesh-bvh, glTF/GLB, Blender, glTF Transform, Meshopt/KTX2 where useful, Vitest, fast-check.

**Spec:** baseline architecture plus adversarial review.

## Global constraints

- 1 logical geometry unit = 1 mm.
- `+X` width, `+Y` vertical, `+Z` depth across all normalized assets.
- The renderer and compatibility engine consume the same `MechanicalProfile`.
- Visual fidelity and mechanical confidence are independent.
- Collision-free final state does not automatically mean installable.
- Dimension uncertainty/tolerances can downgrade a borderline result to `WARNING` or `UNKNOWN` rather than false `COMPATIBLE`.
- Never use proprietary BuildCores 3D assets without explicit permission.

---

## Task 1: Define mechanical profiles, evidence levels, tolerances, anchors, and mounts

**Codex effort:** **High** — this data model determines whether later 3D work is reusable or becomes per-case hardcoding.

**Files:**
- Create: `packages/geometry/package.json`
- Create: `packages/geometry/src/profile.ts`
- Create: `packages/geometry/src/dimensions.ts`
- Create: `packages/geometry/src/transform.ts`
- Create: `packages/geometry/src/anchor.ts`
- Create: `packages/geometry/src/mount.ts`
- Create: `packages/geometry/src/evidence.ts`
- Create: `packages/geometry/src/index.ts`
- Test: `packages/geometry/src/*.test.ts`

**Interfaces:**
- Produces `MechanicalProfile`, `MechanicalVerificationLevel`, `DimensionInterval`, `Anchor`, `Mount`, `MountGroup`, `KeepOutZone`, `ConnectorAnchor`, `InstallationConstraint`.

- [ ] **Step 1: Write failing mechanical invariant tests**

Test coordinate normalization, non-negative dimensions, valid transforms, valid orientation constraints, and interval/tolerance behavior.

- [ ] **Step 2: Implement dimension intervals**

Represent measured/declared values with optional uncertainty. Clearance arithmetic works on intervals rather than assuming all values are exact.

- [ ] **Step 3: Implement anchors and mount compatibility**

A mount declares allowed mount kinds/sizes/orientations/cardinality. A part declares attachment anchors. Transform resolution must be deterministic from attachment relationship.

- [ ] **Step 4: Implement mount groups**

Represent shared-hole/exclusive layouts such as `3x120 OR 2x140`, not five independent slots.

- [ ] **Step 5: Commit**

```bash
git add packages/geometry
 git commit -m "feat: define mechanical profile and mounting contracts"
```

---

## Task 2: Implement anchor-based placement and assembly transforms

**Codex effort:** **High** — 3D correctness depends on robust transform composition.

**Files:**
- Create: `packages/geometry/src/placement.ts`
- Create: `packages/geometry/src/assembly.ts`
- Create: `packages/geometry/src/scene-graph.ts`
- Test: `packages/geometry/src/placement.test.ts`
- Test: `packages/geometry/src/assembly.test.ts`

**Interfaces:**
- Produces `resolvePlacement`, `MechanicalAssembly`, `ResolvedMechanicalScene`.

- [ ] **Step 1: Test deterministic placement**

A GPU edge connector attached to motherboard PCIe slot plus bracket alignment must resolve to one placement; the case/motherboard transform propagates to GPU world transform.

- [ ] **Step 2: Implement parent-child mechanical scene graph**

Examples:

```text
case -> motherboard -> GPU
case -> front radiator -> fan layer
case -> PSU
motherboard -> CPU cooler
```

- [ ] **Step 3: Implement assembly stack thickness and orientation**

Radiator+fans consume combined corridor depth. Reversing permitted fan orientation must not change physical thickness.

- [ ] **Step 4: Reject ambiguous/over-constrained anchor solutions**

Return a structured mechanical error, not a best-guess transform.

- [ ] **Step 5: Commit**

```bash
git add packages/geometry/src
 git commit -m "feat: add anchor-driven mechanical placement"
```

---

## Task 3: Implement fast analytic clearance checks

**Codex effort:** **Medium** — important arithmetic but bounded and testable.

**Files:**
- Create: `packages/geometry/src/clearance.ts`
- Create: `packages/geometry/src/rules/gpu-clearance.ts`
- Create: `packages/geometry/src/rules/cooler-clearance.ts`
- Create: `packages/geometry/src/rules/psu-clearance.ts`
- Create: `packages/geometry/src/rules/radiator-mount.ts`
- Test: `packages/geometry/src/rules/*.test.ts`

**Interfaces:**
- Produces geometry-backed `CompatibilityRule`s compatible with Plan 02.

- [ ] **Step 1: Encode available-clearance calculations as current-build values**

Do not compare only against case marketing maximums. Installed front radiator/fans/cages change available GPU corridor.

- [ ] **Step 2: Add tolerance-aware results**

If required and available intervals overlap ambiguously, report `WARNING`/`UNKNOWN` with the uncertainty rather than green.

- [ ] **Step 3: Add property tests**

Increasing an obstruction thickness cannot increase available clearance. Removing an obstruction cannot reduce the corridor.

- [ ] **Step 4: Commit**

```bash
git add packages/geometry/src
 git commit -m "feat: add analytic mechanical clearance rules"
```

---

## Task 4: Implement collision and keep-out validation

**Codex effort:** **High** — computational geometry is subtle; use High for implementation and tests.

**Files:**
- Create: `packages/geometry/src/collision/shape.ts`
- Create: `packages/geometry/src/collision/bvh.ts`
- Create: `packages/geometry/src/collision/intersection.ts`
- Create: `packages/geometry/src/collision/keepout.ts`
- Create: `packages/geometry/src/rules/collision.ts`
- Test: `packages/geometry/src/collision/*.test.ts`

**Interfaces:**
- Produces `CollisionShape`, `CollisionResult`, `KeepOutViolation`, collision compatibility rule.

- [ ] **Step 1: Start with simple primitive/convex fixtures**

Prove OBB/convex/simple-triangle cases before loading GLBs.

- [ ] **Step 2: Integrate `three-mesh-bvh` behind an adapter**

The rest of the domain must not import BVH library types directly.

- [ ] **Step 3: Distinguish solid collisions from keep-out violations**

Examples: GPU physically intersects radiator = hard incompatibility; power-cable bend keep-out touches side panel = warning/incompatible depending on evidence/policy.

- [ ] **Step 4: Return useful measurements**

Include parties, approximate penetration/clearance, and remediation target where possible.

- [ ] **Step 5: Commit**

```bash
git add packages/geometry/src/collision packages/geometry/src/rules
 git commit -m "feat: add mechanical collision and keep-out checks"
```

---

## Task 5: Model installation paths and assembly dependencies

**Codex effort:** **High** — this solves the non-obvious “fits after teleportation but cannot be installed” weakness.

**Files:**
- Create: `packages/geometry/src/installation/path.ts`
- Create: `packages/geometry/src/installation/dependency.ts`
- Create: `packages/geometry/src/installation/sequence.ts`
- Create: `packages/geometry/src/rules/installability.ts`
- Test: `packages/geometry/src/installation/*.test.ts`

**Interfaces:**
- Produces `InstallationPath`, `AssemblyDependency`, `InstallationResult`.

- [ ] **Step 1: Define P0 installation constraints conservatively**

Support insertion direction/corridor, removable obstruction dependency, and required predecessor/successor assembly steps. Do not attempt general robotic motion planning.

- [ ] **Step 2: Add reference fixtures**

At least one part whose final volume fits but insertion corridor fails, and one that becomes installable after a removable cage/panel is removed.

- [ ] **Step 3: Integrate result into compatibility report**

Final fit and installation validity are separate rule IDs and explanations.

- [ ] **Step 4: Commit**

```bash
git add packages/geometry/src/installation packages/geometry/src/rules
 git commit -m "feat: validate component installation constraints"
```

---

## Task 6: Build GLB/parametric asset runtime and verification pipeline

**Codex effort:** **Medium** — mostly pipeline/integration once mechanical contracts exist.

**Files:**
- Create: `packages/geometry/src/assets/manifest.ts`
- Create: `packages/geometry/src/assets/loader.ts`
- Create: `packages/geometry/src/assets/parametric.ts`
- Create: `scripts/assets/validate-mechanical-asset.ts`
- Create: `scripts/assets/optimize-glb.ts`
- Create: `docs/geometry/asset-authoring.md`

**Interfaces:**
- Produces asset manifest with independent render/collision asset references and provenance.

- [ ] **Step 1: Define asset manifest**

Include product revision, scale/origin convention, render URI, collision URI, asset provenance, rights class, mechanical verification level, checksum/version.

- [ ] **Step 2: Implement parametric fallback models**

Generate dimensionally accurate GPU/PSU/RAM/drive/fan placeholders from verified dimensions without pretending visual exactness.

- [ ] **Step 3: Add validation script**

Check bounding dimensions against declared dimensions within explicit tolerance, anchor validity, scale, and obvious self-collision mistakes.

- [ ] **Step 4: Document Blender export convention**

- [ ] **Step 5: Commit**

```bash
git add packages/geometry scripts/assets docs/geometry
 git commit -m "feat: add mechanical asset pipeline and parametric fallbacks"
```

---

## Task 7: Implement the React Three Fiber digital-twin viewport

**Codex effort:** **Medium** — significant UI work but domain/geometry decisions must already be solved.

**Files:**
- Create: `apps/web/src/features/builder-3d/BuildViewport.tsx`
- Create: `apps/web/src/features/builder-3d/BuildScene.tsx`
- Create: `apps/web/src/features/builder-3d/ComponentMesh.tsx`
- Create: `apps/web/src/features/builder-3d/SceneControls.tsx`
- Create: `apps/web/src/features/builder-3d/useAsset.ts`
- Test: `apps/web/src/features/builder-3d/*.test.tsx`

**Interfaces:**
- Consumes `ResolvedMechanicalScene` only; does not calculate compatibility or store alternate geometry truth.

- [ ] **Step 1: Render one static verified case + motherboard + GPU scene**

- [ ] **Step 2: Add orbit/zoom, transparent/remove-side-panel, isolate, explode-view, and selection**

Keep interaction state separate from mechanical state.

- [ ] **Step 3: Add invalid preview visualization**

Ghost candidate component and highlight collision/keep-out areas without committing it.

- [ ] **Step 4: Add mechanical confidence indicator**

A photorealistic asset cannot imply verified connector geometry if only bounding data is verified.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/builder-3d
 git commit -m "feat: render real-scale build digital twin"
```

---

## Task 8: Create the mechanically verified MVP reference set

**Codex effort:** **Medium** for integration; **High** only for debugging mismatches. Do not burn High on repetitive data entry.

**Files:**
- Create: `packages/geometry/fixtures/reference-mechanical/*.json`
- Create: `docs/geometry/reference-builds.md`
- Add: original/licensed GLBs to the approved asset storage workflow, not copied proprietary meshes.

**Interfaces:**
- Produces one “perfect computer” vertical slice plus alternatives proving data-driven generality.

- [ ] **Step 1: Encode one complete reference PC**

Case, motherboard, CPU location, RAM, GPU, PSU, cooler/AIO, fans, SSD/HDD as appropriate.

- [ ] **Step 2: Add at least three chassis/form-factor variations and several GPU/cooler alternatives**

- [ ] **Step 3: Verify every demo mechanical claim against cited evidence**

Unknown or inferred geometry must be labeled as such.

- [ ] **Step 4: Run golden collision/clearance tests and visually inspect viewport**

- [ ] **Step 5: Commit metadata/docs**

```bash
git add packages/geometry/fixtures docs/geometry
 git commit -m "test: add mechanically verified reference builds"
```

## Exit criteria

Plan 03 is complete when HowToPC can place a reference PC at real scale from mounts/anchors, adapt placement across multiple cases/components without per-build coordinate hacks, calculate dynamic analytic clearances, detect relevant collisions/keep-outs, distinguish final fit from installability, render the same resolved scene in the browser, and clearly expose mechanical confidence.
