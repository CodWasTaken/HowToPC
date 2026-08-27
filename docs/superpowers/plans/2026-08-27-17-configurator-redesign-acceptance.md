# Configurator Redesign Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Plans 13–16, prove the redesigned configurator solves the reported usability/correctness failures, and publish a verified testing link before pricing work resumes.

**Architecture:** This plan adds no new subsystem. It is an integration gate over mutation semantics, responsive shell, public catalog/facets, geometry allocation/collisions, and WebMCP behavior; failures are fixed at their owning layer and the whole gate is rerun.

**Tech Stack:** pnpm workspace, Vitest, Next.js production build/runtime, browser/runtime smoke, Cloudflare quick tunnel only for temporary testing when permanent deployment is unavailable.

**Spec:** `docs/superpowers/specs/2026-08-27-configurator-redesign-full-catalog-geometry-design.md`

## Global Constraints

- Plans 13, 14, 15, and 16 must be complete first.
- No regional-pricing implementation is merged into this redesign baseline.
- A temporary tunnel is never described as a permanent deployment.
- User visual approval is required before pricing work resumes.

---

### Task 1: Cross-system deterministic verification

**Files:**
- Modify only where a failing integration test identifies an owning-layer defect.

**Interfaces:**
- Final branch contains the approved editing, UI, catalog, and geometry contracts together.

- [ ] **Step 1: Confirm branch ancestry and paused pricing exclusion**

Verify the redesign line descends from verified quantity milestone `fc09870` plus redesign commits, and does not contain the paused regional-pricing commit `05499e9` unless explicitly reimplemented later under a separate approved pricing plan.

- [ ] **Step 2: Frozen install**

Run `pnpm install --frozen-lockfile`.

- [ ] **Step 3: Full static/test gate**

Run `pnpm typecheck && pnpm test && pnpm build && git diff --check`; require zero failures.

- [ ] **Step 4: Generated catalog invariants**

Verify deterministic shard checksums, coverage-report arithmetic, public fixture exclusion, BuildCores attribution, and no client-side import of all full-catalog shards.
### Task 2: Reproduce every reported user failure against production runtime

**Files:**
- Modify only if a scenario fails.

**Interfaces:**
- Acceptance scenarios use the production build, not the dev server.

- [ ] **Step 1: Empty-build recovery**

Clear all components. Confirm the Parts browser stays actionable, adding a case works, adding a motherboard first also works, incomplete status is presented intentionally, and a later known hard conflict is rejected.

- [ ] **Step 2: Parts-row readability**

Search for several unusually long real product names. Confirm two-line truncation/tooltip behavior, fixed dot X alignment, compact quantity controls, and no horizontal overflow.

- [ ] **Step 3: Catalog/facet breadth**

Browse/search real current and older hardware across CPU, motherboard, memory, GPU, storage, PSU, case, cooler, fan, and network categories. Exercise at least three category-specific filters per major category and `Compatible only`.

- [ ] **Step 4: Dense Twin scenarios**

Recreate multiple GPUs, multiple M.2/SATA drives, four DIMMs, and PCIe expansion cards. Confirm placeable instances do not overlap and unplaceable instances produce explicit mechanical issues.

- [ ] **Step 5: Viewport scenarios**

At 1920×1080 require no body scrollbar; at 1280×800 require drawer behavior; below 900 px require Parts/Twin/Build tabs. Verify internal lists remain scrollable at each size.

- [ ] **Step 6: Generic UI audit**

Confirm there are no use-case-specific preset buttons such as the ≤500 zł homelab shortcut and the permanent WebMCP debug box is gone.

### Task 3: Agent/native parity smoke

**Files:**
- Modify only if parity fails.

**Interfaces:**
- WebMCP uses the same public catalog and mutation decision as visible UI.

- [ ] **Step 1: Search and inspect a real public product through WebMCP**

Confirm fixture-only products are absent and provenance/specs are returned for the real product.

- [ ] **Step 2: Perform safe and unsafe agent edits**

From empty build add a case successfully; then create a known conflict and verify agent apply rejects it with the same apply-state/blocking reason surfaced by UI preview.

- [ ] **Step 3: Verify repeated-device quantity behavior**

Add/decrement repeatable storage or GPU quantities and confirm Build resources + Twin instances update consistently.
### Task 4: Publish a verified visual-testing build

**Files:**
- No source change unless smoke exposes a defect.

**Interfaces:**
- Produces one verified testing URL for user visual review.

- [ ] **Step 1: Start the production server from the verified redesign commit**

Record commit SHA and local HTTP status. Do not serve uncommitted or deliberately RED work.

- [ ] **Step 2: Prefer configured permanent deployment when available**

If the connected permanent deploy path is still blocked, start a temporary Cloudflare quick tunnel and label it temporary.

- [ ] **Step 3: Verify the public URL externally**

Require HTTP 200 and smoke markers for Parts filters, Clear build, Digital twin controls, Build resources, and Agent status.

- [ ] **Step 4: Push the verified redesign branch**

Push only the redesign branch/approved integration target; never push main/master without explicit instruction.

- [ ] **Step 5: Hand off for visual approval**

Provide the URL plus a compact list of changed behaviors to test. Do not resume regional pricing until the user explicitly approves the redesigned site.