# Full Real Catalog and Faceted Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the public Parts browser from the broad real hardware catalog and add retailer-style category-specific filtering without shipping tens of thousands of products in the client bundle.

**Architecture:** Synthetic fixtures are separated from public products; category schemas gain optional sourced fields useful for filtering; BuildCores is normalized into deterministic server-side category shards plus identity/facet indexes. A server search engine applies query, facets, compatibility annotation, sorting, and compatible-only filtering before pagination, while the client renders returned pages/facets and retains installed broad-catalog products through an explicit resolver.

**Tech Stack:** TypeScript, Zod, Node.js generation scripts, BuildCores OpenDB ODC-By 1.0, Next.js Route Handlers, React 19, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-27-configurator-redesign-full-catalog-geometry-design.md`

## Global Constraints

- Public search contains real sourced products only; synthetic MVP fixtures remain test-only.
- Source coverage is generation-neutral: current, previous, and historical hardware are equal inputs.
- Missing specifications are never guessed into known facet buckets.
- Search/facets/compatibility ordering operate on the filtered full dataset before pagination.
- BuildCores supplies specs, not prices; pricing work remains frozen.
- Browser runtime never fetches the upstream BuildCores repository and never statically imports the whole generated catalog.
- Use pinned local BuildCores commit `7f759ec353714e9dca2adab9e62bd80311fc373e` for deterministic generation.

---
### Task 1: Separate public products from fixtures and preserve searchable identity metadata

**Files:**
- Create: `packages/catalog/src/product.ts`
- Create: `packages/catalog/src/fixture-catalog.ts`
- Create: `packages/catalog/src/curated-real-catalog.ts`
- Modify: `packages/catalog/src/reference.ts`
- Modify: `packages/catalog/src/combined-reference.ts`
- Modify: `packages/catalog/src/index.ts`
- Modify: `packages/catalog/src/reference.test.ts`
- Modify: category schemas under `packages/catalog/src/categories/*.ts`
- Create: `packages/catalog/src/categories/hba.ts`

**Interfaces:**
- `ReferenceProduct` moves to `product.ts` and gains optional `identifiers`, `series`, `variant`, and `releaseYear`.
- Exports: `fixtureCatalog`, `curatedRealCatalog`, `referenceCatalog` (test/backward-compatible union), `publicSeedCatalog` (real only).
- Synthetic source evidence `REFERENCE` is forbidden in `publicSeedCatalog`.

- [ ] **Step 1: Write failing public-vs-fixture tests**

```ts
expect(fixtureCatalog.some(p => p.id === "gpu-mid-300")).toBe(true);
expect(publicSeedCatalog.some(p => p.id === "gpu-mid-300")).toBe(false);
expect(publicSeedCatalog.every(p => p.source?.evidence !== "REFERENCE")).toBe(true);
expect(publicSeedCatalog.some(p => p.id === "cpu-intel-i5-3470")).toBe(true);
```

- [ ] **Step 2: Verify RED because catalogs are currently mixed**
- [ ] **Step 3: Split catalog files without changing deterministic fixture IDs**

Move only `source.evidence === "REFERENCE"` products to `fixture-catalog.ts`; move manufacturer/retailer-sourced real curated products to `curated-real-catalog.ts`. Preserve IDs/revision IDs so compatibility tests do not churn.

- [ ] **Step 4: Extend category schemas with optional sourced facet fields**

Add optional fields without weakening existing required compatibility fields:

- CPU: `family`, `cores`, `threads`, `unlocked`.
- MOTHERBOARD: `chipset`, `wireless`, `ethernetSpeedMbps`, `eccSupport`.
- MEMORY: `formFactor: "DIMM"|"SO_DIMM"`, `casLatency`, `timings`.
- GPU: `chipsetManufacturer`, `chipset`, `vramBytes`, `memoryType`, `interface`, `videoOutputs`.
- STORAGE: `storageType: "SSD"|"HDD"|"SSHD"`, `pcieGeneration`, `sequentialReadMbps`, `sequentialWriteMbps`, `enduranceTbw`, `rpm`, `cacheBytes`.
- PSU: `efficiencyRating: "STANDARD"|"BRONZE"|"SILVER"|"GOLD"|"PLATINUM"|"TITANIUM"`, `modularity`, `lengthMm`, `fanless`.
- CASE: `internal25Bays`, `internal35Bays`, `expansionSlots`, `sidePanel`, `dimensionsMm`.
- COOLER/FAN: sourced fan size/count/RPM/noise/airflow fields.
- NETWORK/HBA: only explicit interface/ports/speed/protocol fields.

Fields unsupported by the current source remain absent. In particular, BuildCores currently has no storage sequential read/write or endurance field, so those schema/facet capabilities exist but are not fabricated during BuildCores mapping.

- [ ] **Step 5: Verify all catalog tests/typecheck and commit**

```bash
git add packages/catalog/src
git commit -m "refactor: separate public catalog from test fixtures"
```
### Task 2: Normalize broad BuildCores categories with explicit rejection reasons

**Files:**
- Split: `packages/ingestion/src/buildcores.ts`
- Create: `packages/ingestion/src/buildcores/common.ts`
- Create focused mappers: `cpu.ts`, `motherboard.ts`, `memory.ts`, `gpu.ts`, `storage.ts`, `psu.ts`, `case.ts`, `cooler.ts`, `fan.ts`, `network.ts`
- Modify: `packages/ingestion/src/observation.ts`
- Create/modify tests under `packages/ingestion/src/buildcores/*.test.ts`

**Interfaces:**
- `BuildCoresRejectionReason = "INVALID_RECORD" | "MISSING_IDENTITY" | "MISSING_REQUIRED_FIELD" | "AMBIGUOUS_VALUE" | "SCHEMA_VALIDATION_FAILED" | "UNSUPPORTED_CATEGORY"`.
- `mapBuildCoresProductDetailed(category,raw)` returns `{ ok:true, observation } | { ok:false, reason, detail }`.
- Existing `mapBuildCoresProduct(category,raw)` remains a compatibility wrapper returning observation/null.
- Observation preserves identifiers, `series`, `variant`, and `releaseYear` when explicitly sourced.

- [ ] **Step 1: Write one RED real-shape mapping test per supported category**

Use checked-in small fixture objects matching the pinned source schemas. Assert GPU VRAM/vendor/length/slot width/connectors, Storage type/interface/capacity/PCIe generation, PSU wattage/efficiency/modularity/connectors, Case clearances/bays/dimensions, Cooler socket/type/dimensions, and Fan size/PWM/airflow when present.

- [ ] **Step 2: Add rejection-reason tests**

```ts
expect(mapBuildCoresProductDetailed("NetworkCard", metadataOnly)).toMatchObject({ ok:false, reason:"MISSING_REQUIRED_FIELD" });
expect(mapBuildCoresProductDetailed("Chair", raw)).toMatchObject({ ok:false, reason:"UNSUPPORTED_CATEGORY" });
```

HBA remains unsupported unless a source record explicitly supplies HBA semantics; NetworkCard records are never guessed into HBA.
- [ ] **Step 3: Verify RED with ingestion tests**

Run: `pnpm --filter @howtopc/ingestion test`
Expected: new categories/detailed result are unsupported.

- [ ] **Step 4: Implement strict canonical mappings from pinned source fields**

Important mappings include: PSU `80+`/White/Standard -> `STANDARD`, Bronze/Silver/Gold/Platinum/Titanium to matching canonical tiers; Storage interface strings to SATA/NVME/SAS plus parsed PCIe generation; RAM pin form factors to DIMM/SO_DIMM; GPU `chipset_manufacturer` to sourced vendor; motherboard chipset/wireless/ECC and maximum known Ethernet speed. Do not derive `gpuPcieSlots` from lane count alone because physical GPU-slot topology is not explicit.

- [ ] **Step 5: Preserve filter metadata during materialization**

Modify `toCatalogSeedProduct` so identifiers/series/variant/releaseYear survive into `ReferenceProduct`. MPN/source ID search must work after generation.

- [ ] **Step 6: Run ingestion + catalog typechecks/tests and commit**

```bash
git add packages/ingestion/src packages/ingestion/src/materialize.ts packages/catalog/src/categories
git commit -m "feat: normalize broad sourced hardware specifications"
```

### Task 3: Generate deterministic full category shards and indexes

**Files:**
- Create: `packages/ingestion/src/catalog-artifacts.ts`
- Create: `packages/ingestion/src/catalog-artifacts.test.ts`
- Create: `packages/ingestion/scripts/generate-buildcores-catalog.ts`
- Modify: `packages/ingestion/package.json`
- Generate: `packages/catalog/data/buildcores/*.json`

**Interfaces:**
- Generator reads `BUILDCORES_DB_DIR` and requires source commit `7f759ec353714e9dca2adab9e62bd80311fc373e` unless `ALLOW_BUILDCORES_COMMIT_MISMATCH=1` is explicitly set for local investigation.
- Outputs one product shard per canonical category, `id-index.json`, and `import-report.json`.
- [ ] **Step 1: Write failing artifact-generation tests**

Given a mixed accepted/rejected fixture batch, assert products sort deterministically, duplicate IDs fail the generation, `id-index.json` maps every emitted product ID to its category, and the report contains total/accepted/rejected counts plus rejection reasons and known/missing counts for important facet fields.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement pure artifact generation then the filesystem wrapper**

`generateCatalogArtifacts(records)` must be network-free. The script walks only `CPU`, `Motherboard`, `RAM`, `GPU`, `Storage`, `PSU`, `PCCase`, `CPUCooler`, `CaseFan`, and `NetworkCard`, routes each JSON through the detailed mapper, materializes accepted products, and writes canonical category shards sorted by manufacturer/displayName/id.

`import-report.json` includes source commit, per-source-category totals, accepted canonical categories, rejected reasons, and missing/known counts for important filter fields. `facet-summary.json` records distinct enum values and numeric min/max/known counts only; it is descriptive metadata, not a substitute for dynamic facet counts.

- [ ] **Step 4: Generate from the pinned local checkout**

```bash
BUILDCORES_DB_DIR=/home/nataniel/Desktop/buildcores-open-db pnpm --filter @howtopc/ingestion generate:buildcores
```

Expected: broad deterministic output across every safely supported category; NetworkCard may legitimately have zero accepted rows if the source schema contains identity only.

- [ ] **Step 5: Regenerate and prove determinism**

Run the generator a second time, then `git diff --exit-code packages/catalog/data/buildcores` relative to the first generated output. Any ordering/time-dependent diff is a failure.

- [ ] **Step 6: Commit generated data and report**

```bash
git add packages/ingestion/src/catalog-artifacts.ts packages/ingestion/src/catalog-artifacts.test.ts packages/ingestion/scripts/generate-buildcores-catalog.ts packages/ingestion/package.json packages/catalog/data/buildcores
git commit -m "data: generate full sourced hardware catalog"
```
### Task 4: Build the schema-driven facet engine and category definitions

**Files:**
- Create: `packages/catalog/src/facets/types.ts`
- Create: `packages/catalog/src/facets/definitions.ts`
- Create: `packages/catalog/src/facets/engine.ts`
- Create: `packages/catalog/src/facets/engine.test.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- `FacetSelection` is a discriminated union for ENUM, BOOLEAN, and RANGE selections with optional `includeUnknown`.
- `FacetDefinition` owns `id`, `label`, `control`, `unit`, `includeUnknown`, and a pure extractor `(product) => string|string[]|number|boolean|null`.
- `applyFacetFilters(products,selections,definitions)` and `calculateFacetResults(products,selections,definitions)`.
- `facetDefinitionsForCategory(category)` returns only category-relevant definitions; a facet with zero known values is omitted from response/UI.

- [ ] **Step 1: Write failing engine tests for enum, boolean, range, unknown, and combined filters**

Use a small real-shaped CPU/storage/PSU fixture. Assert manufacturer+socket combinations, numeric capacity/wattage bounds, boolean integrated-graphics selection, and explicit unknown inclusion. Missing values must never satisfy a known range/enum choice.

- [ ] **Step 2: Test standard faceted counts**

When two facets are active, counts for a facet are computed with all other active facet filters applied but with that facet's own selection removed. This lets users see alternative choices instead of every unselected option dropping to zero.

- [ ] **Step 3: Verify RED**

Run catalog tests; expected missing facet modules.
- [ ] **Step 4: Implement category definitions from sourced canonical fields**

At minimum expose: CPU manufacturer/socket/family/cores/threads/iGPU/TDP/release year; motherboard manufacturer/socket/chipset/form factor/memory/DIMM/max RAM/PCIe/M.2/SATA/wireless/Ethernet/ECC; memory manufacturer/type/kit capacity/module count/module capacity/speed/ECC/form factor/CAS; storage manufacturer/type/interface/form factor/capacity/PCIe generation/read/write/endurance/RPM/cache; GPU vendor/board manufacturer/chipset/VRAM/memory/card length/slot width/TDP/connectors/interface; PSU manufacturer/wattage/form factor/80 PLUS/modularity/connectors/fanless; and the sourced Case/Cooler/Fan/Network/HBA fields from the spec.

Do not emit the future price facet in this milestone. Read/write/endurance storage definitions may exist but must be hidden automatically when the current dataset has zero known values.

- [ ] **Step 5: Run catalog tests/typecheck and commit**

```bash
git add packages/catalog/src/facets packages/catalog/src/index.ts
git commit -m "feat: add category-specific hardware facets"
```

### Task 5: Introduce resolver-aware compatibility for broad products

**Files:**
- Modify: `packages/compatibility/src/build-lines.ts`
- Modify: `packages/compatibility/src/quantity-transaction.ts`
- Create: `packages/compatibility/src/catalog-resolver.ts`
- Create: `packages/compatibility/src/catalog-resolver.test.ts`
- Modify: `packages/compatibility/src/resources.ts`
- Modify: `packages/compatibility/src/index.ts`
- Modify: `packages/compatibility/src/quantity-transaction.test.ts`
- Modify: `packages/compatibility/src/resources.test.ts`

**Interfaces:**
- `CatalogResolver { get(productId:string): ReferenceProduct | undefined }`.
- `referenceCatalogResolver` preserves current deterministic fixture behavior.
- `createCatalogResolver(products)` and `overlayCatalogResolver(base,products)` support installed/server candidates.
- `expandBuildLines(lines,resolver=referenceCatalogResolver)` resolves through the supplied resolver.
- Add/replace/max-safe APIs accept a candidate `ReferenceProduct | string`; string lookup uses the resolver, while an explicit product is overlaid for candidate evaluation.
- [ ] **Step 1: Write failing external-candidate resolver tests**

Create a valid `ReferenceProduct` whose ID is absent from `referenceCatalog`. Assert `previewAdd(lines, candidate, resolver)` evaluates/commits it, a second compatible increment can resolve the already-installed ID, `calculateResourceUsage(lines,resolver)` includes it, and unknown IDs still fail explicitly rather than disappearing silently.

- [ ] **Step 2: Verify RED**

Expected: current package-level maps throw/skip because every function closes over `referenceCatalog`.

- [ ] **Step 3: Thread `CatalogResolver` through expansion, resources, and quantity transactions**

Default arguments preserve current tests. Candidate products are overlaid during preview; callers that commit a broad candidate must retain it in their session resolver before the next snapshot/mutation.

- [ ] **Step 4: Run compatibility typecheck/full tests and commit**

```bash
git add packages/compatibility/src
git commit -m "refactor: resolve compatibility products from catalog context"
```

### Task 6: Implement full-dataset server search before pagination

**Files:**
- Create: `apps/web/lib/catalog-search-contract.ts`
- Create: `apps/web/lib/server/catalog-repository.ts`
- Create: `apps/web/lib/server/catalog-repository.test.ts`
- Create: `apps/web/lib/server/catalog-search.ts`
- Create: `apps/web/lib/server/catalog-search.test.ts`

**Interfaces:**
- `apps/web/lib/catalog-search-contract.ts` defines `CatalogSearchRequest { query?, category?, filters, compatibleOnly, sort, limit, offset, buildLines }` and `CatalogSearchResponse { items, total, limit, offset, facets }`; this app-layer contract may import `BuildLine`/apply-state types from compatibility without creating a package cycle.
- Catalog remains a pure data/facet dependency; the Next server search layer depends on both `@howtopc/catalog` and `@howtopc/compatibility`.
- Each item returns canonical product, `applyState`, and `maxSafeQuantity` for the returned page.
- Repository resolves product IDs through `id-index.json` and lazily caches parsed category shards.
- [ ] **Step 1: Write repository tests for real-only loading and identity resolution**

Assert category loading excludes fixture IDs, `getById` resolves a generated product from the correct shard, global identity search includes MPN/source IDs, and page size clamps to `1..100`.

- [ ] **Step 2: Write search-order tests proving operations happen before pagination**

Create more than one page of mixed compatible/incompatible candidates. With `limit:2`, assert a compatible item located late in source order appears before incompatible early rows. Add facet+query tests where the matching product would be beyond page 1 before filtering. `compatibleOnly:true` must remove both blocked-unknown and incompatible items before pagination.

- [ ] **Step 3: Implement the search pipeline in this exact order**

1. Load public real category/global records.
2. Apply text query to manufacturer, display name, series/variant, MPN/GTIN/EAN/UPC/source IDs.
3. Resolve current installed build products and annotate every remaining candidate once with mutation state.
4. Calculate dynamic facet counts/bounds using the text-matched annotated set, other active facet selections, and `compatibleOnly` when enabled.
5. Apply all active facet selections and compatible-only filtering.
6. Stable-sort apply state `CAN_APPLY`, `BLOCKED_UNKNOWN`, `BLOCKED_INCOMPATIBLE`; secondary sort is query relevance or newest-known-release/name fallback.
7. Paginate.
8. Calculate max safe quantity only for returned repeatable rows.

- [ ] **Step 4: Add build-signature caching without changing semantics**

Cache candidate apply-state annotation by stable sorted `{productId,quantity}` build signature plus candidate product ID. Never cache across different build signatures.

- [ ] **Step 5: Run catalog + compatibility tests/typechecks and commit**

```bash
git add apps/web/lib/catalog-search-contract.ts apps/web/lib/server
git commit -m "feat: search full catalog with facets and compatibility"
```
### Task 7: Add the catalog API and retain broad products in builder sessions

**Files:**
- Create: `apps/web/app/api/catalog/search/route.ts`
- Create: `apps/web/lib/catalog-client.ts`
- Create: `apps/web/lib/catalog-client.test.ts`
- Create: `apps/web/lib/builder-session.ts`
- Create: `apps/web/lib/builder-session.test.ts`
- Modify: `apps/web/lib/builder.ts` only to expose resolver-aware snapshot helpers needed by the session.

**Interfaces:**
- Route: `POST /api/catalog/search` with JSON `CatalogSearchRequest`; returns `CatalogSearchResponse`.
- `fetchCatalogPage(request, signal?)` calls the route and throws a typed error for non-2xx responses.
- `BuilderSession { lines:BuildLine[]; knownProducts:Record<string,ReferenceProduct> }`.
- `sessionSnapshot(session)` resolves all installed IDs from `knownProducts` plus the reference resolver.
- `addProductToSession(session,candidate)` retains the canonical candidate when a mutation commits.

- [ ] **Step 1: Write failing builder-session tests with a product absent from `referenceCatalog`**

Add a broad candidate, assert it appears in the committed snapshot, then increment/decrement it after the original search page is gone. Clearing lines leaves the product cache harmlessly retained; the public UI may later evict unused cached products as an optimization, but correctness does not depend on page presence.

- [ ] **Step 2: Write client serialization/error tests**

Stub `globalThis.fetch` and assert category, nested facet selections, build lines, compatible-only, sort, limit, and offset survive JSON serialization. Assert HTTP 400/500 become useful errors rather than empty result sets.

- [ ] **Step 3: Implement strict route validation**

Reject malformed filters, invalid categories, negative offsets, and limits outside accepted input shape with HTTP 400. Server search still clamps a numeric limit to maximum 100 after schema validation. No price/market fields are accepted in this milestone.

- [ ] **Step 4: Implement builder-session resolver retention and client fetch helper**

Default public workspace session is empty, not seeded with synthetic fixtures. Existing fixture helpers such as `createInitialBuild()` remain available to unit tests/development scenarios only.

- [ ] **Step 5: Run web/catalog/compatibility tests and production API smoke, then commit**

```bash
git add apps/web/app/api/catalog/search apps/web/lib/catalog-client.ts apps/web/lib/catalog-client.test.ts apps/web/lib/builder-session.ts apps/web/lib/builder-session.test.ts apps/web/lib/builder.ts
git commit -m "feat: connect builder sessions to real catalog search"
```
### Task 8: Render category-specific retailer-style filters and paged real results

**Files:**
- Create: `apps/web/lib/catalog-browser-state.ts`
- Create: `apps/web/lib/catalog-browser-state.test.ts`
- Create: `apps/web/hooks/use-catalog-browser.ts`
- Create: `apps/web/components/catalog-filters.tsx`
- Create: `apps/web/components/facet-section.tsx`
- Create: `apps/web/components/active-filter-chips.tsx`
- Modify: `apps/web/components/parts-browser.tsx`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Browser state owns `query`, `category`, `filters`, `compatibleOnly`, `sort`, and accumulated page items.
- Category change clears category-specific facets and resets offset; query may remain.
- `useCatalogBrowser` debounces text input about 200 ms, aborts stale fetches, and exposes `loadMore()`.
- Parts rows use server-returned apply state/max quantity; they do not re-sort only the current page.

- [ ] **Step 1: Write failing pure browser-state tests**

Assert category change resets filters/page offset, toggling one enum facet is reversible, range selection preserves units/data, and appending page 2 deduplicates by product ID while preserving server order.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement the request hook with stale-request cancellation**

New query/category/filter/compatible-only/sort starts at offset 0 and replaces results. `loadMore` requests the next offset and appends. Loading/errors are inline in Parts; failed searches never erase installed builder state.
- [ ] **Step 4: Implement contextual facet UI**

Search/category stay pinned at the top of Parts. `Filters (N)` expands the facet area. Each facet is a collapsed `<details>` section: enum facets use checkboxes with counts, boolean facets use Any/Yes/No plus Unknown when returned, and range facets use min/max number inputs with the returned unit/bounds. Active selections render removable chips and `Clear filters`.

High-signal subtype facets such as Storage Type (SSD/HDD/SSHD), interface (NVMe/SATA/SAS), RAM DDR generation/form factor, and PSU efficiency appear naturally from their category definitions rather than hard-coded special buttons.

- [ ] **Step 5: Add generic compatibility filtering and sorting controls**

Expose `Compatible with current build only`. Status order remains green, gray, red by default. Do not introduce use-case-specific presets or problem-specific buttons.

- [ ] **Step 6: Replace `referenceCatalog` browsing with server results**

Normal Parts UI must not import/filter `referenceCatalog`. Selection passes the returned canonical product into `BuilderSession`, so any real broad-catalog item remains buildable after pagination/search changes.

- [ ] **Step 7: Run web tests/typecheck/build and runtime-smoke representative filters**

Verify at least: CPU AMD+AM5; motherboard Mini-ITX+DDR5+M.2; RAM DDR5+capacity+speed; Storage SSD+NVMe+capacity+PCIe generation; PSU Gold+wattage+form factor. If a sourced field such as storage sequential write speed has zero known values, verify that facet is hidden rather than populated with guessed data.

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/catalog-browser-state.ts apps/web/lib/catalog-browser-state.test.ts apps/web/hooks/use-catalog-browser.ts apps/web/components/catalog-filters.tsx apps/web/components/facet-section.tsx apps/web/components/active-filter-chips.tsx apps/web/components/parts-browser.tsx apps/web/components/builder-workspace.tsx apps/web/app/globals.css
git commit -m "feat: browse real hardware with category facets"
```
### Task 9: Give WebMCP the same public catalog and broad builder session

**Files:**
- Create: `apps/web/app/api/catalog/product/[id]/route.ts`
- Modify: `apps/web/lib/catalog-client.ts`
- Modify: `packages/webmcp/src/tools.ts`
- Modify: `packages/webmcp/src/tools.test.ts`
- Modify: `apps/web/lib/agent-change.ts`
- Modify: `apps/web/lib/agent-change.test.ts`
- Modify: `apps/web/components/webmcp-inspector.tsx`
- Modify: `apps/web/components/builder-workspace.tsx`

**Interfaces:**
- `GET /api/catalog/product/<id>` resolves real curated/generated public products and returns 404 for fixture-only/unknown IDs.
- `search_components` accepts query/category/facet/compatible-only/page inputs supported by the public search boundary.
- Agent add/replace resolves the canonical product by ID before mutation and commits it into the same `BuilderSession` used by the human UI.
- Agent decrement operates on installed session products without a network lookup.

- [ ] **Step 1: Write failing WebMCP schema tests for public facet search inputs**

Assert `search_components` exposes category/query/filters/compatibleOnly/limit/offset and remains read-only. Keep `apply_build_change` quantity-aware.

- [ ] **Step 2: Write failing session-agent tests with a broad product absent from fixtures**

Mock catalog product resolution, add it from an empty session, then call get/analyze semantics and assert canonical specs/quantity are retained. Assert fixture-only IDs are not discoverable through the public product endpoint/search adapter.

- [ ] **Step 3: Implement async public search/product adapters in the inspector**

All search/inspect/apply responses include source provenance and apply-now state, but no PLN/market-specific price fields during the pricing freeze.

- [ ] **Step 4: Run WebMCP + web + catalog tests/typechecks and commit**

```bash
git add apps/web/app/api/catalog/product apps/web/lib/catalog-client.ts packages/webmcp/src apps/web/lib/agent-change.ts apps/web/lib/agent-change.test.ts apps/web/components/webmcp-inspector.tsx apps/web/components/builder-workspace.tsx
git commit -m "feat: expose real faceted catalog through WebMCP"
```
### Task 10: Verify catalog coverage, honesty, performance, and public UI

- [ ] Regenerate from `/home/nataniel/Desktop/buildcores-open-db` and record accepted/rejected/missing-field counts from `import-report.json` in the verification notes/commit message.
- [ ] Validate every emitted product against its canonical Zod category schema and assert no generated product contains offer/price fields.
- [ ] Assert `publicSeedCatalog` and `/api/catalog/search` contain zero `source.evidence === "REFERENCE"` rows.
- [ ] API-smoke modern and historical coverage: search `Ryzen 9 9950X3D`, `RTX 5090`, `GTX 1080`, plus the curated real `Core i5-3470`; verify canonical source provenance in each result where present.
- [ ] API-smoke category filters: AMD+AM5 CPU, Mini-ITX DDR5 motherboard, DDR5 memory capacity/speed, NVMe capacity/PCIe generation, and Gold PSU wattage/form factor.
- [ ] Verify `/api/catalog/search` with `limit:50` returns at most 50 rows and initial page HTML does not contain the complete category dataset.
- [ ] Verify a product found on a later page can be installed, remains in Build after search/category changes, can be incremented/decremented when repeatable, and appears in the Twin when its category is renderable.
- [ ] Verify `Compatible with current build only` is computed against the full filtered set before pagination.
- [ ] Verify a field with no sourced values (for example sequential write speed if still absent from all imported storage records) does not render a fake/empty facet.
- [ ] Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check`.
- [ ] Production-smoke the final desktop/laptop/mobile configurator together with the real catalog, geometry diagnostics, and compact Agent tools UI.
- [ ] Push the verified redesign branch and create a fresh public test tunnel only after every gate above passes.

## Superseded plan note

This plan supersedes `docs/superpowers/plans/2026-08-27-12-broad-hardware-catalog-ingestion.md` for the redesign branch. Plan 12 remains historical documentation but its page-local compatibility sorting is intentionally replaced here by full-result-set compatibility ordering before pagination.
