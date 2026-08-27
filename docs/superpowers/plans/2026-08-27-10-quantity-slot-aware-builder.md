# Quantity and Slot-Aware Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let repeatable hardware coexist with explicit quantities while enforcing real DIMM, M.2, SATA, PCIe/GPU, power, and connector limits.

**Architecture:** Replace the web builder's flat ID array with `BuildLine { productId, quantity }` while preserving singleton replacement semantics. Compatibility accepts expanded product instances plus deterministic resource accounting; quantity mutation primitives live in `@howtopc/compatibility` so UI and WebMCP share them.

**Tech Stack:** TypeScript, Zod, Vitest, React 19, Next.js 16, Three.js/R3F, existing catalog/compatibility/WebMCP packages.

**Spec:** `docs/superpowers/specs/2026-08-27-multi-device-builder-regional-catalog-design.md`

## Global Constraints

- Singleton categories: CPU, MOTHERBOARD, CASE, PSU, COOLER.
- Repeatable categories: MEMORY, GPU, STORAGE, FAN, NETWORK, HBA.
- RAM quantity consumes `quantity × modules` DIMM slots and total memory capacity.
- M.2/NVMe and SATA devices consume their respective motherboard ports.
- Multi-GPU mutations require known GPU-capable slot capacity; missing topology yields `UNKNOWN`.
- PSU demand and GPU connector requirements aggregate every GPU quantity.
- Mixed compatible RAM is allowed with `WARNING`; different DDR generations remain incompatible.
- Rejected mutations must not commit.

---

### Task 1: Quantity-aware build lines and resource accounting

**Files:**
- Create: `packages/compatibility/src/build-lines.ts`
- Create: `packages/compatibility/src/resources.ts`
- Test: `packages/compatibility/src/resources.test.ts`
- Modify: `packages/compatibility/src/index.ts`
- Modify: `packages/catalog/src/categories/motherboard.ts`

**Interfaces:**
- Produces: `BuildLine { productId: string; quantity: number }`, `expandBuildLines(lines)`, and `calculateResourceUsage(lines)`.
- `ResourceUsage` exposes `dimm`, `memoryBytes`, `m2`, `sata`, `gpuPcie`, and `generalPcie` used/available values, using `null` when capacity is unknown.
- [ ] **Step 1: Write failing resource tests**

```ts
const lines = [
  { productId: "mb-b650-atx", quantity: 1 },
  { productId: "ram-ddr5-32", quantity: 2 },
  { productId: "ssd-nvme-2tb", quantity: 2 },
] as const;
const usage = calculateResourceUsage(lines);
expect(usage.dimm).toMatchObject({ used: 4, available: 4 });
expect(usage.m2).toMatchObject({ used: 2, available: 3 });
```

Also assert `motherboardSpecSchema` accepts optional `gpuPcieSlots`.

- [ ] **Step 2: Verify RED**

Run: `npx -y pnpm@11.24.0 --filter @howtopc/compatibility test`
Expected: FAIL because resource APIs are missing.

- [ ] **Step 3: Implement build-line/resource helpers**

```ts
export interface BuildLine { productId: string; quantity: number }
export function expandBuildLines(lines: readonly BuildLine[]): ReferenceProduct[] {
  return lines
    .flatMap(line => Array.from({ length: line.quantity }, () => byId.get(line.productId)))
    .filter((product): product is ReferenceProduct => Boolean(product));
}
```

Calculate DIMM usage from memory-kit module count; classify storage by interface; count GPU and expansion cards; read capacities from the installed motherboard. Add `gpuPcieSlots?: number` to motherboard specs without inventing defaults.

- [ ] **Step 4: Verify GREEN and commit**

Run:
`npx -y pnpm@11.24.0 --filter @howtopc/catalog typecheck && npx -y pnpm@11.24.0 --filter @howtopc/compatibility test`

Commit:
```bash
git add packages/catalog/src/categories/motherboard.ts packages/compatibility/src
git commit -m "feat: account for motherboard build resources"
```

### Task 2: Aggregate compatibility for repeated hardware

**Files:**
- Modify: `packages/compatibility/src/rules.ts`
- Test: `packages/compatibility/src/rules.test.ts`

**Interfaces:**
- Consumes: expanded repeated product instances and `calculateResourceUsage`.
- Produces: deterministic compatibility results for multi-memory, multi-storage, and multi-GPU builds.

- [ ] **Step 1: Write failing tests**

Add cases asserting: two `ram-ddr5-32` kits fill a 4-DIMM board; a third is incompatible; mixed DDR5 kits can return `WARNING`; four M.2 drives on a three-slot board fail; two GPUs sum PSU demand/connectors; two GPUs with unknown GPU-capable topology return `UNKNOWN`.

- [ ] **Step 2: Verify RED**

Run: `npx -y pnpm@11.24.0 --filter @howtopc/compatibility test`
Expected: FAIL on aggregate behavior.

- [ ] **Step 3: Implement aggregate rules**

Use `products.filter(...)` arrays instead of `first(...)` for MEMORY/GPU/STORAGE/NETWORK/HBA. Add rule IDs `memory-slot-capacity`, `memory-total-capacity`, `mixed-memory`, `gpu-slot-capacity`, and aggregate PSU rules. Preserve existing singleton rules.

- [ ] **Step 4: Verify GREEN and commit**

Run the compatibility tests/typecheck and commit:
```bash
git add packages/compatibility/src/rules.ts packages/compatibility/src/rules.test.ts
git commit -m "feat: validate repeated build hardware"
```

### Task 3: Shared quantity mutation primitives

**Files:**
- Create: `packages/compatibility/src/quantity-transaction.ts`
- Test: `packages/compatibility/src/quantity-transaction.test.ts`
- Modify: `packages/compatibility/src/index.ts`

**Interfaces:**
- Produces: `previewAdd(lines, productId)`, `addOne(lines, productId)`, `removeOne(lines, productId)`, `replaceSingleton(lines, productId)`, and `maxSafeQuantity(lines, productId)`.
- Every preview returns candidate lines, compatibility report, and `committed` based on rejecting `INCOMPATIBLE`/`UNKNOWN`.

- [ ] **Step 1: Write failing mutation tests**

```ts
const base: BuildLine[] = [
  { productId:"cpu-am5-7600", quantity:1 },
  { productId:"mb-b650-atx", quantity:1 },
  { productId:"ram-ddr5-32", quantity:1 },
  { productId:"gpu-mid-300", quantity:1 },
  { productId:"case-atx-340", quantity:1 },
  { productId:"psu-atx-750", quantity:1 },
  { productId:"cooler-air-158", quantity:1 },
  { productId:"ssd-nvme-2tb", quantity:1 },
];
expect(addOne(base, "ssd-nvme-2tb").lines.find(l => l.productId === "ssd-nvme-2tb")?.quantity).toBe(2);
expect(removeOne(addOne(base, "ssd-nvme-2tb").lines, "ssd-nvme-2tb").lines)
  .toEqual(base);
expect(replaceSingleton(base, "mb-asus-p8h61-m-lx3-r2").committed).toBe(false);
expect(maxSafeQuantity(base, "ram-ddr5-32")).toBe(2);
```

- [ ] **Step 2: Verify RED**

Run compatibility tests and confirm missing quantity mutation APIs.

- [ ] **Step 3: Implement minimal mutations**

Repeatables increment/decrement quantities. Singletons replace the existing category line. `maxSafeQuantity` repeatedly previews `+1` until the next mutation rejects, with a defensive hard cap of 64 to prevent unbounded loops on categories whose physical capacity is not modeled.

- [ ] **Step 4: Verify GREEN and commit**

Run compatibility typecheck/tests, then:
```bash
git add packages/compatibility/src/quantity-transaction.ts packages/compatibility/src/quantity-transaction.test.ts packages/compatibility/src/index.ts
git commit -m "feat: add quantity-safe build mutations"
```

### Task 4: Migrate web builder state and quantity controls

**Files:**
- Modify: `apps/web/lib/builder.ts`
- Modify: `apps/web/lib/builder.test.ts`
- Modify: `apps/web/lib/catalog-compatibility.ts`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Web state becomes `BuildLine[]` instead of `string[]`.
- Snapshot exposes `lines`, expanded `products`, `report`, `resourceUsage`, and selected-market total later.
- Repeatable catalog rows render `− quantity/max +`; singleton rows remain click-to-select.

- [ ] **Step 1: Write failing builder tests**

Assert presets migrate to quantity 1, adding the same SSD increments instead of replacing, adding a second distinct storage product coexists, and decrementing quantity 1 removes the line.

- [ ] **Step 2: Verify RED**

Run `npx -y pnpm@11.24.0 --filter @howtopc/web test`.

- [ ] **Step 3: Migrate builder helpers**

Wrap compatibility quantity transactions and preserve helper names where practical. `productsFor` expands quantities for geometry/compatibility. `catalogApplyState` must preview the same add/replace action used by the row control.

- [ ] **Step 4: Implement compact controls/resource summary**

For repeatables render buttons with accessible labels and a center count:

```tsx
<div className="quantity-control">
  <button aria-label={`Remove one ${product.displayName}`}>−</button>
  <span>{quantity}/{max}</span>
  <button aria-label={`Add one ${product.displayName}`} disabled={!canAdd}>+</button>
</div>
```

Add `DIMM 2/4 · M.2 1/3 · SATA 2/6 · GPU PCIe 1/2` from known resource values only.

- [ ] **Step 5: Verify and commit**

Run web typecheck/tests and commit the builder/UI migration.

### Task 5: Render repeated devices without overlap

**Files:**
- Modify: `packages/geometry/src/scene.ts`
- Modify: `packages/geometry/src/scene.test.ts`
- Modify: `apps/web/components/digital-twin.tsx` only if scene identifiers need quantity-aware keys.

**Interfaces:**
- Consumes: expanded repeated product instances.
- Produces: deterministic mount positions for multiple DIMM kits/modules, GPUs, M.2/SATA storage, NICs, and HBAs using available logical mount zones.

- [ ] **Step 1: Write failing geometry tests**

Build a scene with two GPUs and two storage devices and assert distinct centers plus no AABB overlap for devices that occupy different logical slots. Add a four-DIMM test that places all DIMM modules in distinct board-relative positions.

- [ ] **Step 2: Verify RED**

Run `npx -y pnpm@11.24.0 --filter @howtopc/geometry test` and confirm current category-only placement overlaps duplicates.

- [ ] **Step 3: Implement indexed mount placement**

Pass an instance index/category count into placement. Use deterministic board-relative spacing for DIMMs, PCIe cards, and M.2 locations; use lower-front drive-bay spacing for SATA devices. Do not invent exact manufacturer slot coordinates—the scene remains parametric and labels this distinction.

- [ ] **Step 4: Verify GREEN and commit**

Run geometry typecheck/tests and commit:
```bash
git add packages/geometry/src apps/web/components/digital-twin.tsx
git commit -m "feat: place repeated devices in digital twin"
```

### Task 6: Quantity-aware WebMCP

**Files:**
- Modify: `packages/webmcp/src/tools.ts`
- Modify: `packages/webmcp/src/tools.test.ts`
- Modify: `apps/web/components/webmcp-inspector.tsx`

**Interfaces:**
- `get_build` / `analyze_build` return quantity lines and resource usage.
- `preview_build_change` / `apply_build_change` accept an action `add | decrement | replace` plus `productId` and optional `quantity`.
- `search_components` includes apply-now status and max safe quantity.

- [ ] **Step 1: Write failing WebMCP tests**

Assert `apply_build_change` can add a second storage item, rejects a third RAM kit when DIMMs are full, and returns updated resource usage.

- [ ] **Step 2: Verify RED**

Run `npx -y pnpm@11.24.0 --filter @howtopc/webmcp test`.

- [ ] **Step 3: Route tools through shared quantity mutations**

Remove category-replacement assumptions for repeatables. Preserve safe rejection and deterministic error reasons.

- [ ] **Step 4: Verify GREEN and commit**

Run WebMCP tests/typecheck and commit:
```bash
git add packages/webmcp/src apps/web/components/webmcp-inspector.tsx
git commit -m "feat: expose quantity-aware WebMCP mutations"
```

### Task 7: Full quantity milestone verification

- [ ] Run `npx -y pnpm@11.24.0 install --frozen-lockfile`.
- [ ] Run `npx -y pnpm@11.24.0 -r --if-present typecheck`.
- [ ] Run `npx -y pnpm@11.24.0 exec vitest run`.
- [ ] Run `npx -y pnpm@11.24.0 -r --if-present build`.
- [ ] Run a production HTTP smoke and verify quantity controls/resource labels render.
- [ ] Run `git diff --check` and ensure no generated/runtime-only files are staged.
- [ ] Push `chatgpt/implementation` only after all checks pass.
