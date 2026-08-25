# HowToPC Integration, Verification, Deployment, and Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the finished subsystems into one reliable hackathon product, enforce correctness/performance gates, deploy it, prepare the mechanically verified demo path, and produce submission-ready evidence without introducing late architectural changes.

**Architecture:** Integration is driven by golden build scenarios and vertical slices rather than feature-by-feature manual clicking. CI protects domain/compatibility/geometry contracts; Playwright protects the primary user/agent journeys. Deployment uses Vercel for the web app, Supabase/PostgreSQL for canonical data, and Cloudflare R2 for 3D assets. External ingestion providers remain out of the request-critical path.

**Tech Stack:** GitHub Actions, Vercel, Supabase, Cloudflare R2, Vitest, fast-check, Playwright, Chrome/WebMCP evaluation tooling.

**Spec:** baseline architecture plus adversarial review.

## Global constraints

- P0 stability beats P1/P2 breadth.
- No completion claim without a fresh full verification run.
- The live app must work anonymously for judges.
- Demo hardware claims use verified evidence or clearly labeled uncertainty.
- External retailer/Icecat/provider failures do not block the core build flow.
- The repository must become public with an open-source code license before submission, while data/assets retain separate license notices.

---

## Task 1: Establish end-to-end golden build scenarios

**Codex effort:** **High** — this is the first full-system consistency test across domain, compatibility, geometry, calculations, UI, and agent actions.

**Files:**
- Create: `test/golden/gaming-pc.json`
- Create: `test/golden/homelab.json`
- Create: `test/golden/gpu-radiator-conflict.json`
- Create: `test/golden/unknown-mechanical-data.json`
- Create: `apps/web/e2e/golden-builds.spec.ts`
- Create: `docs/testing/golden-builds.md`

**Interfaces:**
- Produces stable full-system fixtures reused in CI, demo, regression testing, and WebMCP evals.

- [ ] **Step 1: Define one fully compatible PC scenario**

Must include all P0 categories required by the demo and a mechanically verified 3D result.

- [ ] **Step 2: Define one homelab scenario**

Workloads such as Proxmox + Plex + storage; include explicit assumptions and at least one topology requirement.

- [ ] **Step 3: Define recoverable physical-conflict scenario**

Example: front radiator reduces GPU corridor and selected GPU no longer fits; expected remediation includes top radiator/shorter GPU/different case.

- [ ] **Step 4: Define incomplete-evidence scenario**

Expected state must be `UNKNOWN`, proving the app does not false-green missing data.

- [ ] **Step 5: Commit**

```bash
git add test apps/web/e2e docs/testing
 git commit -m "test: add full-system golden build scenarios"
```

---

## Task 2: Add unified CI quality gates

**Codex effort:** **Medium** — deterministic CI integration.

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/e2e.yml` if separation is useful
- Create: `scripts/ci/verify-reference-data.ts`
- Create: `scripts/ci/verify-assets.ts`

**Interfaces:**
- Produces one repeatable pre-merge/full verification path.

- [ ] **Step 1: Run formatting/lint/typecheck/unit/property tests**

- [ ] **Step 2: Validate migrations and reference catalog**

- [ ] **Step 3: Validate reference mechanical assets and rights/provenance manifests**

- [ ] **Step 4: Build production Next app**

- [ ] **Step 5: Run core Playwright golden path in CI-capable environment**

- [ ] **Step 6: Commit**

```bash
git add .github scripts/ci
 git commit -m "ci: enforce HowToPC full quality gates"
```

---

## Task 3: Define and enforce browser/3D performance budgets

**Codex effort:** **Medium** — measurement and targeted fixes, not architectural invention.

**Files:**
- Create: `docs/performance/budgets.md`
- Create: `scripts/performance/asset-budget.ts`
- Modify: asset/viewport loaders as measurements require

**Interfaces:**
- Produces explicit asset/interaction budgets for demo hardware/browser.

- [ ] **Step 1: Set measurable P0 budgets**

Examples to define using real measurement rather than arbitrary promises:
- initial builder JS/asset loading budget;
- reference scene total compressed asset budget;
- maximum oversized single asset;
- interaction frame-time target on a representative machine;
- time to useful builder before all optional textures/models finish.

- [ ] **Step 2: Measure current reference scene**

- [ ] **Step 3: Apply LOD/lazy loading/instancing/compression only where data says needed**

- [ ] **Step 4: Keep collision checks out of the render-frame hot path**

- [ ] **Step 5: Commit**

```bash
git add docs/performance scripts/performance apps/web packages/geometry
 git commit -m "perf: enforce digital twin performance budgets"
```

---

## Task 4: Configure production infrastructure and environment boundaries

**Codex effort:** **Medium** — deployment integration; avoid High unless diagnosing provider-specific failure.

**Files:**
- Create: `.env.example`
- Create: `docs/deployment/production.md`
- Add Vercel/Supabase/R2 configuration files as required
- Modify DB/storage clients for environment validation

**Interfaces:**
- Produces deployable web/database/asset configuration with no secrets committed.

- [ ] **Step 1: Configure Supabase/Postgres production environment**

Migrations run explicitly and safely; service credentials remain server-only.

- [ ] **Step 2: Configure Cloudflare R2 asset bucket**

Use immutable/versioned asset paths or hashes and appropriate CORS/cache headers.

- [ ] **Step 3: Configure Vercel deployment**

Ensure builder routes, server actions/API routes, and asset origins work in production.

- [ ] **Step 4: Add startup/build-time environment validation**

Optional provider credentials are not treated as required P0 environment variables.

- [ ] **Step 5: Commit**

```bash
git add .env.example docs/deployment apps packages
 git commit -m "chore: configure HowToPC production deployment"
```

---

## Task 5: Harden the hackathon demo flow and seed state

**Codex effort:** **Medium** — integration/product polish over established engine behavior.

**Files:**
- Create: `scripts/seed-demo.ts`
- Create: `docs/demo/demo-script.md`
- Create: `docs/demo/judge-testing.md`
- Modify UI only for observable demo clarity

**Interfaces:**
- Produces deterministic live demo/test environment.

- [ ] **Step 1: Seed mechanically verified demo products/builds**

- [ ] **Step 2: Write the main continuous agent demo**

Recommended story:

```text
Build a quiet ~€1,400 1440p gaming PC with upgradeability.
Add/request 360 mm radiator.
Expose GPU/radiator conflict.
Agent recovers by moving radiator to valid mount or choosing alternative.
Then reduce cost while preserving stated performance constraint.
```

- [ ] **Step 3: Write a short homelab secondary scenario**

Demonstrate explicit workload assumptions, low-power reasoning, storage/network topology.

- [ ] **Step 4: Ensure developer/engineering inspector makes WebMCP and compatibility work visible**

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-demo.ts docs/demo apps/web
 git commit -m "docs: prepare reproducible HowToPC hackathon demo"
```

---

## Task 6: Add code/data/asset licensing and attribution package

**Codex effort:** **Low** for file/setup work; use **High human review** outside Codex if legal interpretation is uncertain.

**Files:**
- Create: `LICENSE`
- Create: `NOTICE`
- Create: `DATA_LICENSES.md`
- Create: `ASSET_LICENSES.md`
- Modify: `README.md`

**Interfaces:**
- Clearly separates HowToPC code license from third-party data and asset rights.

- [ ] **Step 1: Add chosen open-source code license**

Architecture recommendation: Apache-2.0 for HowToPC code unless project owner chooses another compatible license before implementation.

- [ ] **Step 2: Document BuildCores OpenDB attribution/ODC-By status**

- [ ] **Step 3: Document every shipped exact 3D asset source/provenance/license**

- [ ] **Step 4: Explicitly state that proprietary BuildCores 3D assets are not included**

- [ ] **Step 5: Commit**

```bash
git add LICENSE NOTICE DATA_LICENSES.md ASSET_LICENSES.md README.md
 git commit -m "docs: add code data and asset licensing notices"
```

---

## Task 7: Make repository public and perform submission-readiness review

**Codex effort:** **Low** for repository cleanup; **High** for final technical review task.

**Files:**
- Modify/remove any files flagged by secret/license/debug scan
- Create: `docs/release/submission-checklist.md`

**Interfaces:**
- Produces public, judge-testable source repository.

- [ ] **Step 1: Secret/config scan**

No API keys, private URLs/tokens, database credentials, or private licensed source files.

- [ ] **Step 2: License/provenance scan**

Every distributed dataset/model/media asset has a known acceptable rights class.

- [ ] **Step 3: Documentation scan**

README includes setup, architecture summary, WebMCP usage/testing, demo path, limitations/UNKNOWN policy.

- [ ] **Step 4: Make repository public through GitHub settings/action when owner is ready**

Do not do this prematurely during implementation if secrets/private assets are still being handled.

- [ ] **Step 5: Commit cleanup/checklist**

---

## Task 8: Final full-system verification and release candidate freeze

**Codex effort:** **High** — reserve one High-effort Codex pass for adversarial final review rather than spending it on routine setup.

**Files:**
- Fix only defects discovered by verification
- Record: `docs/release/rc-verification.md`

**Interfaces:**
- Produces final release-candidate evidence.

- [ ] **Step 1: Run complete verification from a clean checkout**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test
```

Plus the project-specific reference data/asset/WebMCP eval commands established by earlier plans.

- [ ] **Step 2: Re-run golden mechanical configurations against source evidence**

- [ ] **Step 3: Run adversarial WebMCP scenarios**

Check false-green UNKNOWN, hard incompatibility commit, stale revisions, hostile third-party text, multi-step recovery.

- [ ] **Step 4: Run production deployment smoke test**

Anonymous new build, shared build, 3D assets, WebMCP registration, database access, no optional provider dependency.

- [ ] **Step 5: Record exact commit SHA and successful command output summary**

- [ ] **Step 6: Freeze submission code/site after deadline rules require it**

Continue future development in a fork/branch if necessary rather than altering submitted state.

## Exit criteria

Plan 08 is complete only when a clean checkout and production deployment pass the full verification suite, the live demo is deterministic and anonymous, the reference mechanical claims are evidence-backed, licensing/provenance are public and clear, and the submitted repository/site show the same verified release candidate.
