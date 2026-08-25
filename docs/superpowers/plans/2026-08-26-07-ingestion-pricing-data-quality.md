# HowToPC Data Ingestion, Pricing, and Data Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a provider-independent ingestion pipeline that seeds/enriches the canonical hardware catalog while preserving source provenance, licensing/rights boundaries, product identity, conflicts, freshness, and retailer observations.

**Architecture:** External sources produce raw observations through adapters. Observations pass through rights/source gates, normalization, product identity resolution, validation, conflict detection, and canonical revision creation. No external provider is required for the builder runtime. Retail offers/prices remain separate from product specifications.

**Tech Stack:** TypeScript, PostgreSQL/Drizzle, Zod, scheduled scripts/jobs, BuildCores OpenDB, optional authorized Icecat, retailer adapters such as eBay where credentials/terms permit.

**Spec:** baseline architecture plus adversarial review.

## Global constraints

- BuildCores OpenDB data must retain ODC-By attribution requirements.
- BuildCores proprietary 3D models are not reusable without explicit permission.
- A factual source being authoritative does not imply redistribution rights for its images/PDFs/CAD.
- Provider raw payloads never become canonical domain schemas.
- Retail offers never define canonical product identity by title alone.
- External provider failure reduces freshness/coverage; it must not take down the builder.
- Manufacturer/source conflicts are preserved and auditable rather than silently deleted.

---

## Task 1: Define ingestion adapter, raw observation, and rights/source gate contracts

**Codex effort:** **High** — these boundaries protect the entire dataset from provider coupling and licensing mistakes.

**Files:**
- Create: `packages/ingestion/package.json`
- Create: `packages/ingestion/src/source.ts`
- Create: `packages/ingestion/src/adapter.ts`
- Create: `packages/ingestion/src/raw-observation.ts`
- Create: `packages/ingestion/src/rights.ts`
- Create: `packages/ingestion/src/pipeline.ts`
- Create: `packages/ingestion/src/index.ts`
- Test: `packages/ingestion/src/*.test.ts`

**Interfaces:**
- Produces `SourceAdapter`, `RawProductObservation`, `RawOfferObservation`, `SourcePolicy`, `RightsClass`, `runIngestionBatch`.

- [ ] **Step 1: Write source-policy tests**

A source can permit factual observation while disallowing cached/redistributed image/PDF/3D assets.

- [ ] **Step 2: Define adapter contract**

Adapters identify provider/version and return raw observations plus stable source references and observed timestamps.

- [ ] **Step 3: Implement pipeline stages as separate functions**

```text
rights/source gate -> normalize -> identity resolution -> validate -> conflict detection -> canonical revision
```

- [ ] **Step 4: Persist source sync health**

Track last successful sync, last failure, provider version, and freshness.

- [ ] **Step 5: Commit**

```bash
git add packages/ingestion
git commit -m "feat: add provider-independent ingestion pipeline"
```

---

## Task 2: Implement BuildCores OpenDB seed adapter

**Codex effort:** **Medium** — structured source with published schemas; main risk is mapping/attribution, not deep reasoning.

**Files:**
- Create: `packages/ingestion/src/providers/buildcores/adapter.ts`
- Create: `packages/ingestion/src/providers/buildcores/map.ts`
- Create: `packages/ingestion/src/providers/buildcores/license.ts`
- Create: `scripts/ingestion/import-buildcores.ts`
- Create: `docs/data/buildcores-opendb.md`
- Test: provider mapping tests

**Interfaces:**
- Produces normalized observations for P0 categories without using/copying proprietary BuildCores 3D assets.

- [ ] **Step 1: Map only source fields we understand semantically**

Preserve source-specific IDs and source URL/revision metadata. Unknown fields stay raw/source-side rather than being guessed into canonical fields.

- [ ] **Step 2: Add ODC-By attribution metadata**

Document required attribution and database notices.

- [ ] **Step 3: Import categories required by P0 first**

CPU, GPU, motherboard, RAM, PC case, PSU, coolers, fans, storage, network cards where available.

- [ ] **Step 4: Validate import idempotency and schema rejects**

A second import of the same source revision must not duplicate products/observations.

- [ ] **Step 5: Commit**

```bash
git add packages/ingestion scripts/ingestion docs/data
git commit -m "feat: seed catalog from BuildCores OpenDB"
```

---

## Task 3: Implement canonical product identity resolution

**Codex effort:** **High** — incorrectly merging two SKUs or splitting one SKU corrupts pricing, geometry, and compatibility.

**Files:**
- Create: `packages/ingestion/src/identity/identifier.ts`
- Create: `packages/ingestion/src/identity/match.ts`
- Create: `packages/ingestion/src/identity/candidate.ts`
- Create: `packages/ingestion/src/identity/review.ts`
- Test: `packages/ingestion/src/identity/*.test.ts`

**Interfaces:**
- Produces `IdentityMatchResult = EXACT | HIGH_CONFIDENCE | REVIEW_REQUIRED | NEW_PRODUCT`.

- [ ] **Step 1: Prioritize exact identifiers**

Manufacturer + MPN/revision, GTIN/EAN/UPC, trusted source IDs.

- [ ] **Step 2: Treat fuzzy title/model matching as candidate generation, never automatic authority at low confidence**

- [ ] **Step 3: Distinguish physically meaningful revisions/variants**

Do not collapse board revisions, cooler dimensions, VRAM variants, connector changes, or materially different case revisions.

- [ ] **Step 4: Add adversarial matching fixtures**

Examples: same GPU chipset across multiple board-partner SKUs; same marketing series with different dimensions; color-only variant; revised PSU with same family name.

- [ ] **Step 5: Commit**

```bash
git add packages/ingestion/src/identity
git commit -m "feat: add canonical hardware identity resolution"
```

---

## Task 4: Add conflict detection, canonical selection, and manual override queue

**Codex effort:** **High** — data trust is central and automatic source priority alone is insufficient.

**Files:**
- Create: `packages/ingestion/src/conflicts/detect.ts`
- Create: `packages/ingestion/src/conflicts/tolerance.ts`
- Create: `packages/ingestion/src/conflicts/canonicalize.ts`
- Create: `packages/ingestion/src/conflicts/report.ts`
- Create: `packages/db/src/schema/conflict.ts`
- Create: `scripts/data/conflict-report.ts`
- Test: conflict tests

**Interfaces:**
- Produces auditable canonical field selection and `DataConflict` records.
- P0 exposes conflicts through a CLI/report. A browser admin review UI is explicitly post-hackathon/P1 and is not part of this task.

- [ ] **Step 1: Define field-specific conflict tolerances**

Exact identifiers/socket/memory generation tolerate no semantic mismatch; measurements may have explicit unit/rounding tolerances.

- [ ] **Step 2: Implement source confidence priority as default, not silent final authority**

Manufacturer evidence usually outranks retailer/community observations but every losing observation remains stored.

- [ ] **Step 3: Implement versioned manual override**

Store chosen value, reviewer, reason, evidence, timestamp; keep it reversible.

- [ ] **Step 4: Generate a deterministic conflict report**

The report lists unresolved conflicts and current canonical selection without requiring an admin web page.

- [ ] **Step 5: Commit**

```bash
git add packages/ingestion packages/db scripts/data
git commit -m "feat: add auditable hardware data conflict resolution"
```

---

## Task 5: Add optional Icecat enrichment adapter behind an entitlement/config gate

**Codex effort:** **Medium** — adapter work; do not make this block P0 if credentials/rights are unavailable.

**Files:**
- Create: `packages/ingestion/src/providers/icecat/adapter.ts`
- Create: `packages/ingestion/src/providers/icecat/map.ts`
- Create: `docs/data/icecat.md`
- Test with redacted/local fixtures only

**Interfaces:**
- Produces optional identifier/spec/media-reference observations according to actual account/content rights.

- [ ] **Step 1: Keep credentials outside repository and logs**

- [ ] **Step 2: Map GTIN/MPN/dimensions/specs only when source semantics are known**

- [ ] **Step 3: Treat media/PDF/3D rights separately from factual fields**

- [ ] **Step 4: Add graceful disabled mode**

If no Icecat entitlement/config exists, ingestion pipeline still passes and application works.

- [ ] **Step 5: Commit**

```bash
git add packages/ingestion/src/providers/icecat docs/data
git commit -m "feat: add optional Icecat catalog enrichment"
```

---

## Task 6: Define retailer offer model and implement first provider adapter

**Codex effort:** **Medium** — isolated provider integration; use High only if product matching becomes ambiguous.

**Files:**
- Create: `packages/db/src/schema/offer.ts`
- Create: `packages/ingestion/src/offers/offer.ts`
- Create: `packages/ingestion/src/providers/ebay/adapter.ts` or another approved first retailer provider
- Create: `scripts/ingestion/sync-offers.ts`
- Test: offer mapping/matching tests

**Interfaces:**
- Produces `Offer` and immutable `OfferObservation` with product mapping, region, condition, currency, shipping/tax status, stock, observed timestamp.

- [ ] **Step 1: Store offers separately from product specs**

A retailer listing can disappear without deleting the canonical product.

- [ ] **Step 2: Match offer using identifiers first**

Title-only fuzzy matching below high confidence goes to review/unmapped state.

- [ ] **Step 3: Include freshness and region**

The UI/agent must be able to say when/where a price was observed.

- [ ] **Step 4: Implement provider-disabled/no-credentials behavior**

- [ ] **Step 5: Commit**

```bash
git add packages/db packages/ingestion scripts/ingestion
git commit -m "feat: add retailer offer observations"
```

---

## Task 7: Implement production/availability lifecycle classification

**Codex effort:** **Medium** — data policy logic.

**Files:**
- Create: `packages/ingestion/src/availability/classify.ts`
- Create: `packages/ingestion/src/availability/evidence.ts`
- Test: availability tests

**Interfaces:**
- Separates `productionStatus` from `marketAvailabilityStatus`.

- [ ] **Step 1: Define production states**

Examples: current, discontinued, unknown.

- [ ] **Step 2: Define market states**

`CURRENT`, `AVAILABLE`, `SCARCE`, `USED`, `ARCHIVED` as approved product-facing lifecycle states.

- [ ] **Step 3: Base market classification on observed availability over time, not one missing retailer**

- [ ] **Step 4: Keep discontinued-but-well-stocked products searchable**

- [ ] **Step 5: Commit**

```bash
git add packages/ingestion/src/availability
git commit -m "feat: classify hardware production and market availability"
```

---

## Task 8: Add coverage profile computation and data-quality reports

**Codex effort:** **Low** — deterministic reporting over established metadata.

**Files:**
- Create: `packages/ingestion/src/coverage/compute.ts`
- Create: `scripts/data/coverage-report.ts`
- Create: `docs/data/quality-gates.md`
- Test: coverage tests

**Interfaces:**
- Produces independent dimensions:

```text
catalog_specs: COMPLETE | PARTIAL
mechanical: VERIFIED | PARAMETRIC | BOUNDING | NONE
price: FRESH | STALE | NONE
benchmark: STRONG | LIMITED | NONE
firmware_topology: VERIFIED | PARTIAL | NONE
```

- [ ] **Step 1: Implement coverage computation without conflating dimensions**

- [ ] **Step 2: Generate CLI/CI report for reference and demo catalog**

- [ ] **Step 3: Fail only on P0 reference-set quality gates, not on broad catalog incompleteness**

- [ ] **Step 4: Commit**

```bash
git add packages/ingestion scripts/data docs/data
git commit -m "feat: report hardware catalog coverage and quality"
```

## Exit criteria

Plan 07 is complete when HowToPC can ingest an open PC-specific seed source with correct attribution, normalize/provider-isolate observations, safely resolve canonical product identities, preserve conflicts/provenance/rights, optionally enrich from additional authorized sources, attach region/freshness-aware offers without coupling price to product identity, and report exactly how complete each product is.
