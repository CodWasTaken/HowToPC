# Broad Hardware Catalog Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-picked BuildCores sample with broad current/previous/historical PC-component coverage without loading tens of thousands of parts into the browser bundle.

**Architecture:** Normalize all safely supported BuildCores component categories into deterministic category shards plus an import report. Next.js server-side catalog search reads those generated shards and returns paginated canonical products; the client keeps only search results and installed products needed for mutation/compatibility. Pricing remains a separate regional-offer pipeline.

**Tech Stack:** TypeScript, Zod, Node.js import scripts, BuildCores OpenDB ODC-By 1.0, Next.js Route Handlers, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-27-multi-device-builder-regional-catalog-design.md`

## Global Constraints

- Coverage is generation-neutral: current, previous, and historical hardware are equal inputs.
- BuildCores contains 47,551 source JSON records as of 2026-08-27; supported PC categories are about 29,600 records, so they must not be statically bundled into the client UI.
- No source value is guessed into a canonical socket, dimension, topology, capacity, or electrical field.
- Unsupported/ambiguous records are rejected with explicit reasons and counted in the import report.
- Specs and prices stay separate.
- BuildCores facts retain ODC-By 1.0 attribution; images/PDF/3D assets are not imported by this pipeline.
- Browser runtime does not fetch BuildCores directly.

---

### Task 1: Normalize every safely supported PC component category

**Files:**
- Split/modify: `packages/ingestion/src/buildcores.ts`
- Create focused mappers under `packages/ingestion/src/buildcores/`: `gpu.ts`, `storage.ts`, `psu.ts`, `case.ts`, `cooler.ts`, `fan.ts`, `network.ts`
- Modify/create tests under `packages/ingestion/src/buildcores/*.test.ts`

**Interfaces:**
- `mapBuildCoresProduct(category, raw)` supports `CPU`, `Motherboard`, `RAM`, `GPU`, `Storage`, `PSU`, `PCCase`, `CPUCooler`, `CaseFan`, and `NetworkCard` when source data satisfies current schemas.
- HBA remains unsupported unless a provider record explicitly identifies HBA semantics; NetworkCard records must not be guessed into HBA.
- [ ] **Step 1: Write one RED mapping test per new category**

Use real BuildCores fixture shapes and assert canonical fields only when explicitly present. Examples:

```ts
expect(mapBuildCoresProduct("GPU", rawGpu)?.category).toBe("GPU");
expect(mapBuildCoresProduct("Storage", rawNvme)?.specs).toMatchObject({ interface:"NVME" });
expect(mapBuildCoresProduct("PCCase", rawCase)?.specs).toMatchObject({ supportedMotherboardFormFactors: expect.any(Array) });
expect(mapBuildCoresProduct("NetworkCard", ambiguousNetworkCard)).toBeNull();
```

- [ ] **Step 2: Verify RED**

Run `npx -y pnpm@11.24.0 --filter @howtopc/ingestion test`.
Expected: new categories are unsupported.

- [ ] **Step 3: Implement strict focused mappers**

Each mapper returns `NormalizedProductObservation | null`. Reuse shared text/number/socket/form-factor helpers. Do not manufacture missing case clearances, connector counts, fan dimensions, or network speeds.

- [ ] **Step 4: Verify GREEN and commit**

Run ingestion typecheck/tests and commit:
```bash
git add packages/ingestion/src/buildcores packages/ingestion/src/buildcores.ts
git commit -m "feat: normalize broad BuildCores PC categories"
```

### Task 2: Full deterministic import and category shards

**Files:**
- Create: `packages/ingestion/scripts/generate-buildcores-catalog.ts`
- Create: `packages/catalog/data/buildcores/*.json` generated category shards
- Create: `packages/catalog/data/buildcores/import-report.json`
- Modify: `packages/ingestion/package.json`

**Interfaces:**
- Generator accepts `BUILDCORES_DB_DIR` pointing at a checked-out BuildCores OpenDB repository.
- Output shards contain canonical products sorted by category/manufacturer/displayName/id.
- `import-report.json` records source commit, source counts, accepted counts, rejected counts, and rejection-reason counts by category.

- [ ] **Step 1: Write a failing generator-unit test**

Extract a pure `generateCatalogArtifacts(records)` helper and assert deterministic ordering plus rejection reporting from a small mixed fixture batch.

- [ ] **Step 2: Verify RED**

Run ingestion tests; expect missing artifact generator.

- [ ] **Step 3: Implement generator**

Walk only approved BuildCores category directories, parse JSON, route through `mapBuildCoresProduct`, materialize canonical products, and write one JSON shard per category. Include source commit from `git -C "$BUILDCORES_DB_DIR" rev-parse HEAD` when available.

- [ ] **Step 4: Generate the full catalog from a pinned BuildCores checkout**

Run:
```bash
BUILDCORES_DB_DIR=/path/to/buildcores-open-db npx -y pnpm@11.24.0 --filter @howtopc/ingestion generate:buildcores
```
Expected: deterministic accepted/rejected counts, no runtime network dependency.

- [ ] **Step 5: Regenerate twice and compare**

Run generator twice and verify `git diff --exit-code packages/catalog/data/buildcores` after the second run.

- [ ] **Step 6: Commit generated shards/report**

```bash
git add packages/ingestion/scripts packages/ingestion/package.json packages/catalog/data/buildcores
git commit -m "data: generate broad BuildCores catalog"
```

### Task 3: Server-side catalog repository and paginated search

**Files:**
- Create: `packages/catalog/src/server/catalog-repository.ts`
- Create: `packages/catalog/src/server/catalog-repository.test.ts`
- Create: `apps/web/app/api/catalog/route.ts`
- Modify: `packages/catalog/package.json` only if a server-only export path is required.

**Interfaces:**
- `searchCatalog({ query?, category?, limit, offset }): { products: ReferenceProduct[]; total: number }`.
- Route: `GET /api/catalog?q=<text>&category=<category>&limit=50&offset=0`.
- Limit is clamped to `1..100`; default 50. Results are deterministic and contain canonical specs/provenance, not offer data.

- [ ] **Step 1: Write failing repository tests**

Load small fixture shards and assert case-insensitive manufacturer/name search, category filtering, stable pagination, and max-limit clamping.

- [ ] **Step 2: Verify RED**

Run catalog tests; expect missing server repository.

- [ ] **Step 3: Implement lazy server shard loading**

Cache parsed category shards in process memory after first use. When a category is supplied, load only that shard; global searches may scan all supported shards server-side. Never import the full generated dataset from a Client Component.

- [ ] **Step 4: Implement Route Handler validation**

Return HTTP 400 for invalid category/offset/limit values; return JSON `{ products, total, limit, offset }` for valid searches.

- [ ] **Step 5: Verify and commit**

Run catalog + web typecheck/tests, then commit:
```bash
git add packages/catalog/src/server apps/web/app/api/catalog packages/catalog/package.json
git commit -m "feat: serve broad catalog search from server"
```

### Task 4: Client catalog paging with candidate-aware mutations

**Files:**
- Create: `apps/web/lib/catalog-client.ts`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `packages/compatibility/src/quantity-transaction.ts`
- Modify: corresponding web/compatibility tests.

**Interfaces:**
- `fetchCatalogPage({ query, category, offset, limit }): Promise<CatalogPage>`.
- Quantity mutation APIs accept a resolver or candidate product instead of assuming every product exists in the small bundled reference fixture.
- Installed build state retains canonical product data for selected broad-catalog items so compatibility remains deterministic after the search page changes.

- [ ] **Step 1: Write failing resolver tests**

Create a candidate product absent from `referenceCatalog` and assert `previewAdd(lines, candidate, resolver)` can evaluate it using its canonical specs rather than throwing `Unknown reference product`.

- [ ] **Step 2: Verify RED**

Run compatibility/web tests.

- [ ] **Step 3: Introduce explicit catalog resolution**

Define:
```ts
export interface CatalogResolver { get(productId: string): ReferenceProduct | undefined }
```
Pass the resolver/candidate into quantity mutations. Keep `referenceCatalogResolver` for existing tests/presets.

- [ ] **Step 4: Replace full client catalog import with paginated API results**

The Parts panel fetches pages after query/category changes, displays loading/error states inline, and applies compatibility sorting to only the current result page. Keep initial curated/default installed products available immediately.

- [ ] **Step 5: Verify and commit**

Run web/compatibility typecheck/tests and a production API smoke; commit after pagination and selected-candidate mutation pass.

### Task 5: Broad catalog WebMCP search

**Files:**
- Modify: `packages/webmcp/src/tools.ts`
- Modify: `packages/webmcp/src/tools.test.ts`
- Modify: `apps/web/components/webmcp-inspector.tsx`

**Interfaces:**
- `search_components` becomes async and queries the same `/api/catalog` search surface (or injected catalog-search adapter) used by the human UI.
- Tool response includes canonical product ID, category, manufacturer/name, apply-now state, max safe quantity when repeatable, selected-market offer metadata when available, and source provenance.

- [ ] **Step 1: Write failing async search tests**

Inject a fake `CatalogSearchAdapter` returning products that are not in the curated fixture and assert WebMCP returns them with apply-now state.

- [ ] **Step 2: Verify RED**

Run WebMCP tests and confirm current synchronous fixture-only search fails the new case.

- [ ] **Step 3: Implement injected async search adapter**

Define:
```ts
export interface CatalogSearchAdapter {
  search(input: { query?: string; category?: string; limit?: number; offset?: number }): Promise<{ products: ReferenceProduct[]; total: number }>;
}
```
Use browser `fetch('/api/catalog?...')` in the inspector integration. Keep pure tests adapter-driven and network-free.

- [ ] **Step 4: Verify GREEN and commit**

Run WebMCP/web tests/typecheck and commit:
```bash
git add packages/webmcp/src apps/web/components/webmcp-inspector.tsx
git commit -m "feat: search broad catalog through WebMCP"
```

### Task 6: Catalog coverage and performance verification

- [ ] Run the full BuildCores generator and record accepted/rejected counts from `import-report.json`.
- [ ] Assert every accepted product validates its canonical category Zod schema.
- [ ] Verify no generated shard includes embedded offer price fields.
- [ ] Verify `/api/catalog?category=GPU&limit=50` returns at most 50 results without shipping all category data in initial HTML.
- [ ] Verify a search for at least one modern and one historical CPU/GPU/motherboard returns results, proving generation-neutral coverage.
- [ ] Run frozen install, workspace typecheck, full Vitest suite, production build, `git diff --check`, and production API/UI smoke.
- [ ] Push `chatgpt/implementation` only after all verification passes.

## Follow-on provider work

Regional retailer/marketplace adapters are a separate milestone after this plan. They attach NEW/USED/REFURBISHED market observations to canonical products by identifiers (MPN/GTIN/EAN/UPC/source IDs) and must not alter canonical hardware specs.
