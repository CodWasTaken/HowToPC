# Configurator Responsive UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped three-panel prototype with a viewport-locked configurator where the Twin dominates, Parts/Build remain readable, and narrower screens use drawers/tabs instead of squeezed columns.

**Architecture:** `BuilderWorkspace` becomes a state/controller shell while Parts, Twin controls, Build summary, and agent status are focused components. Pure presentation helpers derive INCOMPLETE/problem summaries and responsive mode; CSS owns 100dvh/internal scrolling and fixed row grids, while React owns drawer/tab state and camera controls.

**Tech Stack:** React 19, Next.js 16.3.3, CSS, React Three Fiber/Drei, Vitest node tests for pure UI state helpers.

**Spec:** `docs/superpowers/specs/2026-08-27-configurator-redesign-full-catalog-geometry-design.md`

## Global Constraints

- Wide desktop body must not scroll because of app content.
- Twin receives the majority of wide-desktop width.
- Long product names never move status/action columns.
- Green/gray/red dots use mutation decision state, not whole-build status.
- Remove the budget-homelab/use-case preset from the primary UI.
- Pricing UI is hidden/deemphasized during this milestone; pricing logic itself is not redesigned.
- Laptop uses overlay drawers; mobile uses Parts/Twin/Build primary views.

---
### Task 1: Create pure presentation and responsive-mode helpers

**Files:**
- Create: `apps/web/lib/presentation.ts`
- Create: `apps/web/lib/presentation.test.ts`
- Create: `apps/web/lib/workspace-mode.ts`
- Create: `apps/web/lib/workspace-mode.test.ts`

**Interfaces:**
- `presentBuildStatus(report): "COMPATIBLE" | "WARNING" | "INCOMPATIBLE" | "INCOMPLETE" | "UNKNOWN"`.
- `actionableResults(report)` returns blocking conflicts/unknowns first, then warnings, excluding routine compatible checks.
- `workspaceMode(width): "WIDE" | "DRAWERS" | "TABS"` with thresholds `>=1400`, `>=900`, `<900`.

- [ ] **Step 1: Write failing status/mode tests**

```ts
expect(workspaceMode(1920)).toBe("WIDE");
expect(workspaceMode(1366)).toBe("DRAWERS");
expect(workspaceMode(390)).toBe("TABS");
expect(presentBuildStatus(evaluateBuild([]))).toBe("INCOMPLETE");
```

Also assert a real socket conflict presents INCOMPATIBLE and routine COMPATIBLE results are absent from `actionableResults`.

- [ ] **Step 2: Verify RED**

Run `pnpm --filter @howtopc/web test`.

- [ ] **Step 3: Implement the pure helpers**

INCOMPLETE applies when UNKNOWN is caused only by non-blocking `MISSING_PREREQUISITE` results. A blocking required-fact unknown remains UNKNOWN.

- [ ] **Step 4: Verify web tests/typecheck and commit**

```bash
git add apps/web/lib/presentation.ts apps/web/lib/presentation.test.ts apps/web/lib/workspace-mode.ts apps/web/lib/workspace-mode.test.ts
git commit -m "feat: derive configurator presentation state"
```
### Task 2: Extract a readable Parts browser and aligned result row

**Files:**
- Create: `apps/web/components/parts-browser.tsx`
- Create: `apps/web/components/part-result-row.tsx`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- `PartResultRow` receives `{ product, applyState, installed, repeatable, quantity, maxQuantity, onAdd, onDecrement }`.
- `PartsBrowser` receives the current result array plus query/category/filter callbacks; Plan 16 may replace the result source without rewriting row layout.

- [ ] **Step 1: Add a long-name formatting regression helper/test**

Add `partRowTitle(product)` to `presentation.ts` and test it preserves the full display name for `title`/accessible text even though CSS visually clamps it. Keep metadata separate from identity text.

- [ ] **Step 2: Extract the row/browser components with a fixed three-column row grid**

The row CSS contract is:

```css
.part-result-row { display:grid; grid-template-columns:12px minmax(0,1fr) auto; }
.part-result-name { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
```

The status dot occupies only column 1, identity/meta only column 2, and add/quantity controls only column 3. Map `CAN_APPLY` to green, `BLOCKED_UNKNOWN` to gray, and `BLOCKED_INCOMPATIBLE` to red.

- [ ] **Step 3: Remove price cells from the primary Parts row during the pricing freeze**

Keep catalog price code/data untouched elsewhere; the redesign browser should show hardware identity/spec metadata without PLN totals or estimate labels.

- [ ] **Step 4: Run web typecheck/tests and production build**

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/parts-browser.tsx apps/web/components/part-result-row.tsx apps/web/components/builder-workspace.tsx apps/web/app/globals.css apps/web/lib/presentation.ts apps/web/lib/presentation.test.ts
git commit -m "feat: add readable aligned parts browser"
```
### Task 3: Simplify the Build panel around installed parts, resources, and problems

**Files:**
- Create: `apps/web/components/build-sidebar.tsx`
- Create: `apps/web/components/resource-summary.tsx`
- Create: `apps/web/components/compatibility-summary.tsx`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/lib/builder.test.ts`

**Interfaces:**
- `BuildSidebar` receives the current `BuilderSnapshot`, callbacks for increment/decrement/clear, and no pricing-specific props.
- `CompatibilitySummary` uses `presentBuildStatus` and `actionableResults`; all report results remain accessible behind `View all checks`.

- [ ] **Step 1: Add an empty-build snapshot regression**

```ts
const empty = snapshot([]);
expect(empty.lines).toEqual([]);
expect(presentBuildStatus(empty.report)).toBe("INCOMPLETE");
```

- [ ] **Step 2: Implement installed rows and generic Clear build**

Singleton rows use a compact `×` remove action. Repeatable rows use `− quantity +`. The empty state copy is exactly `Build is empty. Choose any component to begin.`. `Clear build` sets lines to `[]`; remove the budget-homelab button and the demo Reset-to-fixture button from the primary workspace.

- [ ] **Step 3: Implement compact resource and compatibility summaries**

Show only resource capacities whose `available !== null`. Show blocking results then warnings. Render routine compatible checks only inside a collapsed native `<details>` labelled `View all checks`.

- [ ] **Step 4: Remove PLN total/price observations from topbar and installed rows**

Do not delete pricing data APIs; simply keep pricing out of this visual-review milestone.

- [ ] **Step 5: Run web tests/typecheck/build and commit**

```bash
git add apps/web/components/build-sidebar.tsx apps/web/components/resource-summary.tsx apps/web/components/compatibility-summary.tsx apps/web/components/builder-workspace.tsx apps/web/app/globals.css apps/web/lib/builder.test.ts
git commit -m "feat: simplify build status and controls"
```
### Task 4: Lock the app to the viewport and add drawer/tab responsive behavior

**Files:**
- Create: `apps/web/components/workspace-navigation.tsx`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Wide (`>=1400px`): three visible columns `350px minmax(0,1fr) 380px`.
- Drawer (`900..1399px`): Twin fills workspace; Parts/Build are overlay side drawers controlled by state.
- Tabs (`<900px`): one of `PARTS | TWIN | BUILD` is visible; tab controls remain persistent.

- [ ] **Step 1: Add controller state without changing wide behavior**

`BuilderWorkspace` owns `leftDrawerOpen`, `rightDrawerOpen`, and `mobileView`. `WorkspaceNavigation` exposes generic `Parts`, `Twin`, `Build` controls; closing/opening panels never mutates build lines.

- [ ] **Step 2: Replace the global shell sizing rules**

```css
html, body { width:100%; height:100%; overflow:hidden; }
.app-shell { height:100dvh; overflow:hidden; display:grid; grid-template-rows:auto minmax(0,1fr); }
.workspace { min-height:0; overflow:hidden; }
.catalog-panel, .build-panel, .twin-panel { min-height:0; overflow:hidden; }
.part-results, .build-scroll { min-height:0; overflow:auto; }
```

At wide width use the fixed side columns above. At drawer width use absolute/fixed overlay panes with max width and a backdrop. At tab width hide non-active panes rather than stacking them vertically.

- [ ] **Step 3: Make category navigation single-line horizontally scrollable**

Use `white-space:nowrap; overflow-x:auto; flex-wrap:nowrap`; do not let category tabs become multiple rows.

- [ ] **Step 4: Run web typecheck/tests/build and manually inspect 1920, 1366, 900, and 390 px widths**

Expected: no desktop body scroll, Twin is never compressed into a narrow center strip, and each list scrolls inside its pane.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/workspace-navigation.tsx apps/web/components/builder-workspace.tsx apps/web/app/globals.css
git commit -m "feat: add viewport-locked responsive workspace"
```
### Task 5: Add Twin view controls, fit behavior, and compact mechanical diagnostics

**Files:**
- Create: `apps/web/lib/twin-camera.ts`
- Create: `apps/web/lib/twin-camera.test.ts`
- Create: `apps/web/components/twin-toolbar.tsx`
- Modify: `apps/web/components/digital-twin.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- `TwinView = "ISO" | "FRONT" | "SIDE" | "TOP"`.
- `cameraPoseForView(view, caseSize)` returns target/position without any build mutation capability.
- `TwinToolbar` exposes `Iso`, `Front`, `Side`, `Top`, `Fit`, and case-shell visibility.

- [ ] **Step 1: Write failing camera helper tests**

Assert each view returns a different expected axis direction and `Fit` distance increases for a larger case. The pure helper receives geometry bounds only, proving camera changes cannot alter build state.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement a camera rig inside the Canvas**

Use `useThree()` plus the OrbitControls ref to set camera position/target from the pure pose helper. Re-fit automatically when the case bounds materially change; do not reset the camera on hover or unrelated UI state.

- [ ] **Step 4: Replace always-open clearance boxes with compact mechanical status**

Default view shows a small summary such as `Mechanical · 3 checks` plus warning/error count. A `<details>` expansion lists clearances, placement issues, and collisions from `ParametricScene`. Add the exact honesty copy: `Parametric mounting preview — verified capacities where known; exact component coordinates may differ.`

- [ ] **Step 5: Add case-shell visibility and neutral empty/partial messages**

No case: `Add a case to begin the mechanical preview. You may still choose any other component first.`. An empty build is not styled as an error.

- [ ] **Step 6: Run web/geometry tests, typecheck, production build, and commit**

```bash
git add apps/web/lib/twin-camera.ts apps/web/lib/twin-camera.test.ts apps/web/components/twin-toolbar.tsx apps/web/components/digital-twin.tsx apps/web/app/globals.css
git commit -m "feat: improve digital twin controls and diagnostics"
```
### Task 6: Reduce WebMCP to an unobtrusive Agent tools control

**Files:**
- Modify: `apps/web/components/webmcp-inspector.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Registration/tool behavior stays unchanged.
- Normal presentation is a compact `Agent tools` status with registered/unsupported/error state; tool-name diagnostics are inside a collapsed advanced `<details>`.

- [ ] **Step 1: Separate registration state from expanded diagnostics markup**

Keep all existing bridge callbacks. Replace the large always-visible section with a compact summary row and optional expansion; do not remove tools or change their schemas in this task.

- [ ] **Step 2: Verify the component no longer reserves a large fixed block in the Build panel**

Production HTML/CSS smoke should contain `Agent tools` and the tool count but the Build panel should remain dominated by installed hardware/resources.

- [ ] **Step 3: Run web + WebMCP typechecks/tests/build and commit**

```bash
git add apps/web/components/webmcp-inspector.tsx apps/web/app/globals.css
git commit -m "feat: compact agent tools presentation"
```

### Task 7: Verify the visual-shell milestone

- [ ] Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [ ] Run `git diff --check`.
- [ ] Start production Next.js and verify HTTP 200.
- [ ] At 1920×1080 verify `document.documentElement.scrollHeight <= window.innerHeight` and `document.body.scrollHeight <= window.innerHeight`; scroll Parts and Build independently.
- [ ] At 1366×768 verify Parts/Build drawers overlay the Twin and closing them restores full Twin space.
- [ ] At 390×844 verify Parts/Twin/Build tabs each preserve editing controls with no three-column squeeze.
- [ ] Verify a deliberately long imported product name clamps to two lines while every status dot/action column remains aligned.
- [ ] Verify no primary-workspace text/button contains `Budget homelab`, `≤500 zł`, or fixture-reset wording.
- [ ] Push the verified checkpoint before full-catalog/facet integration.
