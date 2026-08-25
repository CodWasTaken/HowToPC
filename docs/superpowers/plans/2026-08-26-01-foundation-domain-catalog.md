# HowToPC Foundation, Domain, and Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the repository, pure domain model, canonical catalog schema, persistence layer, and test/CI baseline that every later subsystem consumes.

**Architecture:** Use a pnpm workspace. Keep `packages/domain` pure TypeScript with no React, database, or WebMCP dependencies. Persist canonical products and revisions through PostgreSQL/Drizzle in `packages/db`; expose catalog queries through `packages/catalog`. External data ingestion is deferred to Plan 07 so the core catalog does not depend on any external provider at runtime.

**Tech Stack:** TypeScript, pnpm workspaces, Next.js, PostgreSQL/Supabase, Drizzle ORM, Zod, Vitest, fast-check, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-26-howtopc-architecture-design.md` and `docs/superpowers/specs/2026-08-26-howtopc-adversarial-review.md`

## Global constraints

- Compatibility state is exactly `COMPATIBLE | INCOMPATIBLE | WARNING | UNKNOWN`.
- Product family names never substitute for canonical SKU identity.
- Facts, source observations, and redistributable media/asset rights are separate concepts.
- The builder must be able to work anonymously; auth is not required for the core path.
- A canonical product is revisioned. Historical build analyses must be reproducible.
- Physical lengths are normalized to millimetres, electrical power to watts, storage capacity to bytes, and money to integer minor units plus ISO currency.
- `packages/domain` may not import Next.js, React, Drizzle, Supabase, browser APIs, or WebMCP.

---

## Task 1: Scaffold the workspace and baseline tooling

**Codex effort:** **Low** — deterministic repository setup; do not spend High reasoning on package wiring.

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `packages/domain/package.json`
- Create: `packages/shared/package.json`
- Create: `vitest.workspace.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces workspace packages `@howtopc/domain` and `@howtopc/shared`.
- Produces root scripts `typecheck`, `test`, `lint`, and `build`.

- [ ] **Step 1: Create the workspace manifests**

Use a pnpm workspace with `apps/*` and `packages/*`. Configure TypeScript strict mode in the shared base config.

- [ ] **Step 2: Create the minimal Next.js application shell**

The app should render a plain project landing page only. Do not implement builder UI in this plan.

- [ ] **Step 3: Add Vitest workspace configuration**

Configure package-local tests without browser dependencies.

- [ ] **Step 4: Verify the baseline**

Run:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold HowToPC workspace"
```

---

## Task 2: Define core domain primitives and revision contracts

**Codex effort:** **High** — these types become cross-system contracts; mistakes propagate into every later subsystem.

**Files:**
- Create: `packages/domain/src/product.ts`
- Create: `packages/domain/src/build.ts`
- Create: `packages/domain/src/compatibility.ts`
- Create: `packages/domain/src/provenance.ts`
- Create: `packages/domain/src/coverage.ts`
- Create: `packages/domain/src/units.ts`
- Create: `packages/domain/src/index.ts`
- Test: `packages/domain/src/*.test.ts`

**Interfaces:**
- Produces `ProductId`, `ProductRevisionId`, `BuildId`, `BuildRevisionId` branded string types.
- Produces `CompatibilityStatus`, `CoverageProfile`, `SourceObservation`, `RightsClass`, `Build`, `BuildItem`, and `BuildRevision`.
- Later plans must consume these types rather than inventing parallel equivalents.

- [ ] **Step 1: Write failing tests for domain invariants**

Required invariants include:

```text
money amount cannot be floating-point currency
physical dimension cannot be negative
BuildItem references a canonical product revision
compatibility UNKNOWN is distinct from WARNING
rights metadata is not inferred from source confidence
```

- [ ] **Step 2: Implement branded IDs and unit-safe value objects**

Use constructors/parsers that reject invalid values at boundaries. Keep persisted representation simple while preventing accidental mixing in TypeScript.

- [ ] **Step 3: Implement canonical product and revision model**

Minimum contract:

```ts
interface ProductRevision {
  id: ProductRevisionId;
  productId: ProductId;
  category: ProductCategory;
  manufacturerId: ManufacturerId;
  displayName: string;
  identifiers: ProductIdentifier[];
  productionStatus: ProductionStatus;
  marketAvailabilityStatus: MarketAvailabilityStatus;
  coverage: CoverageProfile;
  createdAt: string;
}
```

Do not put category-specific fields directly into a universal untyped blob.

- [ ] **Step 4: Implement build/revision contracts**

A build contains installed items, goals, workloads, and revision metadata. Do not encode permanent singleton properties such as `build.cpu`; items are cardinality-driven by mounts/resources.

- [ ] **Step 5: Run tests and typecheck**

```bash
pnpm --filter @howtopc/domain test
pnpm typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add packages/domain
 git commit -m "feat: define HowToPC core domain contracts"
```

---

## Task 3: Create the PostgreSQL/Drizzle canonical catalog schema

**Codex effort:** **High** — schema errors are costly to migrate and can destroy provenance/revision guarantees.

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/src/schema/manufacturer.ts`
- Create: `packages/db/src/schema/product.ts`
- Create: `packages/db/src/schema/source.ts`
- Create: `packages/db/src/schema/build.ts`
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/migrations/*`
- Test: `packages/db/src/schema/schema.test.ts`

**Interfaces:**
- Produces tables for manufacturers, products, product revisions, identifiers, source observations, rights metadata, coverage, builds, build revisions, build items, and analysis snapshots.
- Plan 07 adds ingestion/provider tables; do not bake provider-specific columns into canonical product tables.

- [ ] **Step 1: Write schema contract tests**

Test unique constraints for canonical identifiers, immutable revision relationships, and separate observation/asset-rights entities.

- [ ] **Step 2: Implement canonical identity tables**

Require a stable internal UUID for each canonical product and revision. Allow many identifiers per product/revision: MPN, GTIN, EAN, UPC, source IDs.

- [ ] **Step 3: Implement provenance and rights tables**

Facts reference source observations. Media/assets have independent rights class and attribution fields.

- [ ] **Step 4: Implement build revision tables**

Persist immutable build revisions and optional analysis snapshots with engine/model version strings.

- [ ] **Step 5: Generate and apply migration in a local/test database**

Run the Drizzle migration against an isolated development database and verify rollback/recreate from scratch.

- [ ] **Step 6: Commit**

```bash
git add packages/db
 git commit -m "feat: add canonical catalog and revision database"
```

---

## Task 4: Implement catalog category schemas and validation

**Codex effort:** **Medium** — substantial typing work, but constrained once domain contracts exist.

**Files:**
- Create: `packages/catalog/package.json`
- Create: `packages/catalog/src/categories/cpu.ts`
- Create: `packages/catalog/src/categories/gpu.ts`
- Create: `packages/catalog/src/categories/motherboard.ts`
- Create: `packages/catalog/src/categories/memory.ts`
- Create: `packages/catalog/src/categories/case.ts`
- Create: `packages/catalog/src/categories/psu.ts`
- Create: `packages/catalog/src/categories/cooler.ts`
- Create: `packages/catalog/src/categories/fan.ts`
- Create: `packages/catalog/src/categories/storage.ts`
- Create: `packages/catalog/src/categories/network.ts`
- Create: `packages/catalog/src/index.ts`
- Test: `packages/catalog/src/categories/*.test.ts`

**Interfaces:**
- Produces validated category-specific spec types using Zod.
- Consumed by compatibility, ingestion, calculation, and UI packages.

- [ ] **Step 1: Define the minimum P0 fields per category**

Only fields needed for MVP compatibility/calculation belong in P0. Keep extensibility through schema revisions rather than speculative fields.

- [ ] **Step 2: Write invalid-fixture tests**

Examples: impossible socket string, negative GPU length, malformed PSU connector counts, RAM kit with zero modules.

- [ ] **Step 3: Implement Zod schemas and inferred TypeScript types**

Normalize dimensions and units during validation; source adapters must not leak source-specific field names beyond ingestion.

- [ ] **Step 4: Add schema version identifiers**

Every category record must expose its schema version for future migration/reanalysis.

- [ ] **Step 5: Commit**

```bash
git add packages/catalog
 git commit -m "feat: add validated hardware category schemas"
```

---

## Task 5: Implement canonical catalog repository and compatibility-first search primitives

**Codex effort:** **Medium** — normal application data work; keep query API narrow.

**Files:**
- Create: `packages/catalog/src/repository.ts`
- Create: `packages/catalog/src/search.ts`
- Create: `packages/catalog/src/filters.ts`
- Test: `packages/catalog/src/repository.test.ts`
- Test: `packages/catalog/src/search.test.ts`

**Interfaces:**
- Produces `getProductRevision`, `searchProducts`, `getProductIdentifiers`, and structured `CatalogFilter`.
- `searchProducts` must accept compatibility prefilters but must not itself decide final build compatibility.

- [ ] **Step 1: Write query behavior tests**

Search by manufacturer/model, category, socket, memory generation, form factor, dimensions, availability status, and coverage level.

- [ ] **Step 2: Implement PostgreSQL-backed repository**

Use FTS/trigram indexes only after correctness is established. Keep search response DTOs separate from raw database rows.

- [ ] **Step 3: Implement freshness/coverage filters**

Allow the UI and WebMCP to request `mechanical >= PARAMETRIC` or exclude `ARCHIVED` products without deleting them from the database.

- [ ] **Step 4: Commit**

```bash
git add packages/catalog
 git commit -m "feat: add canonical catalog repository and search"
```

---

## Task 6: Add curated fixtures and CI quality gates

**Codex effort:** **Low** — deterministic fixtures/workflow configuration.

**Files:**
- Create: `packages/catalog/fixtures/reference-products/*.json`
- Create: `scripts/seed-reference-catalog.ts`
- Create: `.github/workflows/ci.yml`
- Create: `docs/data/reference-fixtures.md`

**Interfaces:**
- Produces stable test/reference hardware used by Plans 02–08.

- [ ] **Step 1: Add intentionally diverse reference fixtures**

Include at least:
- AM5 and incompatible AM4 CPU/board examples
- DDR4 and DDR5 examples
- short, medium, and oversized GPUs
- Mini-ITX, mATX, and ATX cases/boards
- ATX and SFX PSUs
- air cooler and AIO examples
- NVMe/SATA storage
- NIC/HBA examples

Do not claim these fixtures are manufacturer-verified until evidence is attached.

- [ ] **Step 2: Add deterministic seed command**

Repeated seeding must be idempotent.

- [ ] **Step 3: Add CI**

CI must run install, typecheck, unit/property tests, and build. Fail on schema drift or generated migration mismatch.

- [ ] **Step 4: Verify from a clean checkout**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add .github packages/catalog/fixtures scripts docs/data
 git commit -m "test: add reference hardware fixtures and CI"
```

## Exit criteria

Plan 01 is complete only when:

- the repo builds from a clean checkout;
- domain types are independent of frameworks;
- canonical product/build revisions persist correctly;
- category schemas reject malformed data;
- search can retrieve/filter canonical products;
- reference fixtures and CI are stable;
- no external catalog/provider is required for the application to start.
