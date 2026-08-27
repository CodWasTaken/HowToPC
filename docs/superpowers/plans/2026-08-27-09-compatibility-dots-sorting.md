# Compatibility Dots and Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show apply-now green/red status for every catalog row and sort currently addable/selectable hardware before rejected hardware.

**Architecture:** Derive row state from the exact safe mutation primitive already used on click. Keep the evaluator in `apps/web/lib` so UI rendering stays dumb and deterministic; no duplicate compatibility heuristic is allowed.

**Tech Stack:** TypeScript, React 19, Next.js 16, Vitest, existing `@howtopc/compatibility` transaction API.

**Spec:** `docs/superpowers/specs/2026-08-27-multi-device-builder-regional-catalog-design.md`

## Global Constraints

- `COMPATIBLE` and `WARNING` mutations are green/apply-now.
- `INCOMPATIBLE` and `UNKNOWN` mutations are red/rejected.
- Green rows sort before red rows after search/category filtering.
- Installed state remains visually separate from add-now compatibility.
- No UI-only compatibility heuristic.
- Keep the existing utilitarian engineering visual language.

---
### Task 1: Apply-now catalog evaluator

**Files:**
- Create: `apps/web/lib/catalog-compatibility.ts`
- Test: `apps/web/lib/catalog-compatibility.test.ts`

**Interfaces:**
- Consumes: `replacePart(ids, productId)` from `apps/web/lib/builder.ts`.
- Produces: `catalogApplyState(ids, productId): "CAN_APPLY" | "CANNOT_APPLY"` and `sortCatalogForBuild(ids, products): ReferenceProduct[]`.

- [ ] **Step 1: Write the failing test**

```ts
const initial = createInitialBuild();
const sorted = sortCatalogForBuild(initial.ids, referenceCatalog);
expect(catalogApplyState(initial.ids, "mb-b650-atx")).toBe("CAN_APPLY");
expect(catalogApplyState(initial.ids, "mb-asus-p8h61-m-lx3-r2")).toBe("CANNOT_APPLY");
expect(sorted.findIndex(p => catalogApplyState(initial.ids, p.id) === "CANNOT_APPLY"))
  .toBeGreaterThan(sorted.findLastIndex(p => catalogApplyState(initial.ids, p.id) === "CAN_APPLY"));
```

- [ ] **Step 2: Run test to verify RED**

Run: `npx -y pnpm@11.24.0 --filter @howtopc/web test`
Expected: FAIL because `catalogApplyState` / `sortCatalogForBuild` are missing.

- [ ] **Step 3: Implement the evaluator**

```ts
export function catalogApplyState(ids: readonly string[], productId: string) {
  return replacePart(ids, productId).committed ? "CAN_APPLY" : "CANNOT_APPLY";
}
export function sortCatalogForBuild(ids: readonly string[], products: readonly ReferenceProduct[]) {
  return products.map((product, index) => ({ product, index, canApply: catalogApplyState(ids, product.id) === "CAN_APPLY" }))
    .sort((a, b) => Number(b.canApply) - Number(a.canApply) || a.index - b.index)
    .map(({ product }) => product);
}
```

- [ ] **Step 4: Run test to verify GREEN**

Run: `npx -y pnpm@11.24.0 --filter @howtopc/web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/catalog-compatibility.ts apps/web/lib/catalog-compatibility.test.ts
git commit -m "feat: rank catalog by build compatibility"
```

### Task 2: Catalog dots and green-first UI

**Files:**
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `catalogApplyState` and `sortCatalogForBuild` from Task 1.
- Produces: visible `.part-compat-dot.can-apply` / `.cannot-apply` status and stable green-first list ordering.

- [ ] **Step 1: Add UI assertions to the existing web test surface**

Use the evaluator test to assert stable ordering after filtering a known subset:

```ts
const subset = referenceCatalog.filter(p => ["mb-b650-atx", "mb-asus-p8h61-m-lx3-r2"].includes(p.id));
expect(sortCatalogForBuild(initial.ids, subset).map(p => p.id)).toEqual([
  "mb-b650-atx",
  "mb-asus-p8h61-m-lx3-r2",
]);
```

- [ ] **Step 2: Run the web tests**

Run: `npx -y pnpm@11.24.0 --filter @howtopc/web test`
Expected: PASS after Task 1; this is the regression gate before JSX changes.

- [ ] **Step 3: Wire sorting and status dots**

In `BuilderWorkspace`, filter first, then call `sortCatalogForBuild(ids, filtered)`. For each row compute the state once and render:

```tsx
<span
  className={`part-compat-dot ${applyState === "CAN_APPLY" ? "can-apply" : "cannot-apply"}`}
  aria-label={applyState === "CAN_APPLY" ? "Can add to current build" : "Cannot add to current build"}
  title={applyState === "CAN_APPLY" ? "Can add to current build" : "Cannot add to current build"}
/>
```

Keep installed styling unchanged and add `FAN` and `HBA` to the category tabs.

- [ ] **Step 4: Add restrained status CSS**

```css
.part-main{display:flex;align-items:center;gap:8px;min-width:0}
.part-compat-dot{width:8px;height:8px;border-radius:50%;flex:0 0 8px}
.part-compat-dot.can-apply{background:#16803c}
.part-compat-dot.cannot-apply{background:#b42318}
```

Use status colors only; do not alter the rest of the design language.

- [ ] **Step 5: Verify and commit**

Run:
`npx -y pnpm@11.24.0 --filter @howtopc/web typecheck && npx -y pnpm@11.24.0 --filter @howtopc/web test`

Then:
```bash
git add apps/web/components/builder-workspace.tsx apps/web/app/globals.css
git commit -m "feat: show apply-now compatibility in catalog"
```
