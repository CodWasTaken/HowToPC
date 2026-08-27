# Mount Topology and Collision Geometry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace overlapping category offsets with deterministic physical instances, logical mounts, corrected XYZ dimensions, and explicit collision/unplaced diagnostics.

**Architecture:** Geometry first expands quantity-aware products into physical instances, derives a simplified `MountTopology` from known board/case capacities, allocates each instance to one logical mount, then builds scene boxes and runs AABB collision checks. Exact manufacturer coordinates are never invented; unresolved placement becomes data instead of overlapping meshes.

**Tech Stack:** TypeScript, Vitest, `@react-three/fiber`/Three.js only at the rendering boundary.

**Spec:** `docs/superpowers/specs/2026-08-27-configurator-redesign-full-catalog-geometry-design.md`

## Global Constraints

- 1 logical geometry unit = 1 mm.
- +X width/away from motherboard tray, +Y vertical, +Z case depth.
- Passing parametric geometry is not exact CAD verification.
- Missing exact topology must not be replaced with invented manufacturer coordinates.
- Every physical instance gets a unique mount or an explicit unplaced diagnostic.
- Pricing is out of scope.

---
### Task 1: Normalize physical instance dimensions in global XYZ

**Files:**
- Create: `packages/geometry/src/instances.ts`
- Create: `packages/geometry/src/instances.test.ts`
- Modify: `packages/geometry/src/index.ts`
- Modify: `packages/geometry/src/scene.ts`

**Interfaces:**
- `PhysicalInstance { id, productId, label, category, size:Vec3, product }`.
- `expandPhysicalInstances(products): PhysicalInstance[]` expands memory kits to DIMMs and duplicate products to unique instance IDs.
- `sizeForProduct(product, instanceKind?)` returns global `[X,Y,Z]` dimensions.

- [ ] **Step 1: Write failing axis/expansion tests**

```ts
const gpu = product("gpu-mid-300");
expect(sizeForProduct(gpu)).toEqual([50.8, 120, 300]);
const ram = product("ram-ddr5-32");
expect(expandPhysicalInstances([ram, ram]).filter(x => x.category === "MEMORY")).toHaveLength(4);
```

Also assert unique IDs for duplicate GPU/storage instances.

- [ ] **Step 2: Run geometry tests and verify RED**

Expected: current GPU dimensions are `[120,50.8,300]` and instance helper does not exist.

- [ ] **Step 3: Implement physical expansion and corrected global dimensions**

Use GPU `[slotWidth * 20.32, heightMm, lengthMm]`; DIMM `[8,45,135]`; M.2 `[4,22,80]`; board `[8,height,depth]`. Keep conservative parametric defaults only where the existing category schema already permits a visual fallback; those defaults are visual, not compatibility facts.
- [ ] **Step 4: Run geometry typecheck/tests and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add packages/geometry/src/instances.ts packages/geometry/src/instances.test.ts packages/geometry/src/scene.ts packages/geometry/src/index.ts
git commit -m "fix: use global XYZ component dimensions"
```

### Task 2: Derive discrete mount topology

**Files:**
- Create: `packages/geometry/src/topology.ts`
- Create: `packages/geometry/src/topology.test.ts`
- Modify: `packages/geometry/src/index.ts`

**Interfaces:**
- `MountKind = "CPU" | "DIMM" | "PCIE" | "M2" | "SATA_25" | "SATA_35" | "PSU" | "BOARD"`.
- `MountSlot { id, kind, position:Vec3, capacityUnits:number }`.
- `MountTopology { caseSize:Vec3; slots:readonly MountSlot[]; notes:readonly string[] }`.
- `deriveMountTopology(products): MountTopology` uses only known capacities/form factors plus standardized parametric spacing.

- [ ] **Step 1: Write failing topology tests**

For the B650 ATX fixture, assert 4 DIMM mounts, 3 M.2 mounts, 3 general PCIe logical rows, one board mount, one CPU mount, and one PSU zone. For the ITX fixture assert 2 DIMM/2 M.2/1 PCIe. Do not assert exact manufacturer slot coordinates.

- [ ] **Step 2: Verify RED**

Run the focused topology test; expected missing module.

- [ ] **Step 3: Implement standardized topology formulas**

Board-relative DIMM/M.2/PCIe anchors must remain inside the board bounding region and use deterministic spacing. Case-relative SATA/PSU zones must remain inside the case volume. When a case does not expose drive-bay counts in the current schema, create a conservative visual bay zone sized to installed drives and add a topology note that bay coordinates/capacity are parametric, not verified.
- [ ] **Step 4: Run topology tests/typecheck and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add packages/geometry/src/topology.ts packages/geometry/src/topology.test.ts packages/geometry/src/index.ts
git commit -m "feat: derive parametric component mount topology"
```

### Task 3: Allocate unique mounts before scene creation

**Files:**
- Create: `packages/geometry/src/allocator.ts`
- Create: `packages/geometry/src/allocator.test.ts`
- Modify: `packages/geometry/src/index.ts`

**Interfaces:**
- `MountAssignment { instanceId:string; mountId:string; position:Vec3 }`.
- `PlacementIssue { instanceId:string; code:"NO_MOUNT" | "TOPOLOGY_UNKNOWN" | "MOUNT_OCCUPIED"; message:string }`.
- `allocateMounts(instances, topology): { assignments:MountAssignment[]; issues:PlacementIssue[] }`.

- [ ] **Step 1: Write failing allocation regressions**

Build physical instances for: four DIMMs, two GPUs, three M.2 drives, four SATA drives, and a NIC. Assert every assigned `mountId` is unique for mutually exclusive mounts and every assigned instance has one assignment. Add an intentionally overfilled DIMM/M.2 fixture and assert the extra instance becomes a `NO_MOUNT` issue instead of sharing a position.

- [ ] **Step 2: Verify RED**

Run geometry tests; expected missing allocator.

- [ ] **Step 3: Implement deterministic category allocation**

Allocate BOARD/CPU/PSU first, then DIMM/M2, then GPUs, other PCIe cards, then SATA. GPU mounts are derived from known `gpuPcieSlots` when available; when exact spacing is unknown, distribute those known-capacity anchors across the standardized expansion zone and record a topology note. Network/HBA use remaining general PCIe anchors. Use card thickness when computing the final X position and spacing so repeated card boxes do not share volume.
- [ ] **Step 4: Run allocator tests/typecheck and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add packages/geometry/src/allocator.ts packages/geometry/src/allocator.test.ts packages/geometry/src/index.ts
git commit -m "feat: allocate unique logical hardware mounts"
```

### Task 4: Add AABB collision diagnostics

**Files:**
- Create: `packages/geometry/src/collision.ts`
- Create: `packages/geometry/src/collision.test.ts`
- Modify: `packages/geometry/src/index.ts`

**Interfaces:**
- `Collision { aId:string; bId:string; overlapMm:Vec3; message:string }`.
- `boxesOverlap(a,b): boolean` uses strict overlap so touching faces are not collisions.
- `detectCollisions(boxes, allowedPairs): Collision[]`.
- `allowedPairs` is an explicit set of normalized instance-ID pairs; there is no category-wide collision disable switch.

- [ ] **Step 1: Write failing AABB tests**

Assert separated/touching boxes do not collide, intersecting boxes do, and an explicitly allowed CPU/cooler relationship is suppressed while the same geometric overlap without that pair is reported. Add a synthetic cooler/DIMM intersection regression.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement strict three-axis AABB intersection**

Compute overlap on each axis as `(aHalf + bHalf) - abs(aCenter - bCenter)` and require all three values to be `> 0`. Normalize pair keys lexicographically so allowed relationships are deterministic.

- [ ] **Step 4: Run collision tests/typecheck and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add packages/geometry/src/collision.ts packages/geometry/src/collision.test.ts packages/geometry/src/index.ts
git commit -m "feat: detect parametric component collisions"
```
### Task 5: Rebuild the scene from assignments and surface diagnostics

**Files:**
- Modify: `packages/geometry/src/scene.ts`
- Modify: `packages/geometry/src/scene.test.ts`
- Modify: `packages/geometry/src/clearance.ts`
- Modify: `packages/geometry/src/clearance.test.ts`

**Interfaces:**
- `ParametricScene` becomes `{ caseBox, components, placementIssues, collisions, topologyNotes }`.
- Scene creation composes physical expansion, topology derivation, allocation, box creation, then collision detection.
- Unassigned instances are never rendered at the origin as a fallback.

- [ ] **Step 1: Replace offset-specific tests with scene invariants**

Assert a dense fixture scene has unique assignments and no unexpected collisions. Assert an over-capacity fixture returns placement issues and omits the unplaced mesh. Keep the corrected GPU dimension assertion at `[50.8,120,300]`.

- [ ] **Step 2: Add clearance aggregation tests**

For multiple GPUs, `measureClearances` evaluates the longest installed GPU rather than only the first. Missing measurements stay unknown/omitted rather than receiving invented numbers.
- [ ] **Step 3: Run geometry tests and verify RED against current scene assembly**

- [ ] **Step 4: Compose the new pipeline in `buildParametricScene`**

Remove the old category `instanceIndex` offset logic. Preserve the transparent-case contract and stable instance labels/IDs used by the renderer.

- [ ] **Step 5: Run all geometry tests/typecheck and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add packages/geometry/src/scene.ts packages/geometry/src/scene.test.ts packages/geometry/src/clearance.ts packages/geometry/src/clearance.test.ts
git commit -m "fix: build twin from mount assignments"
```

### Task 6: Verify the geometry milestone

- [ ] Run `pnpm --filter @howtopc/geometry typecheck` and `pnpm --filter @howtopc/geometry test`.
- [ ] Run the complete workspace Vitest suite to catch cross-package regressions.
- [ ] Run the production web build.
- [ ] Runtime-smoke default, Mini-ITX, four-DIMM, dual-GPU, multi-M.2, and multi-SATA scenes.
- [ ] Inspect placement/collision diagnostics for each smoke scene; no supported dense fixture may silently overlap.
- [ ] Run `git diff --check` and push the verified checkpoint.
