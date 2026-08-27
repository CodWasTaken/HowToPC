# Regional Offers and Market Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PLN-specific pricing with native regional offer observations and a persistent market selector.

**Architecture:** Offer observations carry `market`, `currency`, and numeric `amount`; best-offer selection filters by market before condition/price. UI, optimizer, and WebMCP accept an explicit selected market; no FX conversion is used to fabricate local prices.

**Tech Stack:** TypeScript, Vitest, React 19, browser locale/localStorage, existing catalog/optimizer/WebMCP packages.

**Spec:** `docs/superpowers/specs/2026-08-27-multi-device-builder-regional-catalog-design.md`

## Global Constraints

- Native offers are market-specific observations.
- Supported initial markets: `US · USD` and `PL · PLN`.
- Browser locale maps to supported market when possible; otherwise default `US`.
- Explicit user selection persists and wins over locale.
- Missing selected-market price displays `NO PRICE · specs only` and never equals zero.
- No automatic FX conversion in this milestone.

---

### Task 1: Generalize offer observations

**Files:**
- Modify: `packages/catalog/src/offers.ts`
- Modify: `packages/catalog/src/offers.test.ts`
- Modify: `packages/catalog/src/reference-offers.ts`

**Interfaces:**
- `OfferObservation` becomes `{ amount: number; currency: "USD" | "PLN" | string; market: "US" | "PL" | string; ... }`.
- `bestOfferForProduct(offers, productId, { market, condition? })` selects only native market offers.
- [ ] **Step 1: Write failing market-selection tests**

```ts
const offers = [
  { id:"us", productId:"p", market:"US", currency:"USD", amount:99, condition:"NEW", source:"US Shop", observedAt:"2026-08-27", kind:"LISTING" },
  { id:"pl", productId:"p", market:"PL", currency:"PLN", amount:399, condition:"NEW", source:"PL Shop", observedAt:"2026-08-27", kind:"LISTING" },
] as const;
expect(bestOfferForProduct(offers, "p", { market:"US" })?.amount).toBe(99);
expect(bestOfferForProduct(offers, "p", { market:"PL" })?.amount).toBe(399);
expect(bestOfferForProduct(offers, "missing", { market:"US" })).toBeUndefined();
```

- [ ] **Step 2: Verify RED**

Run `npx -y pnpm@11.24.0 --filter @howtopc/catalog test`.

- [ ] **Step 3: Implement generic offer fields and migrate fixtures**

Convert existing Polish observations to `market:"PL", currency:"PLN", amount:<old amountPln>`. Add a small US fixture set for the default demo build so switching markets visibly changes native prices rather than currency formatting only.

- [ ] **Step 4: Verify GREEN and commit**

Run catalog typecheck/tests and commit:
```bash
git add packages/catalog/src/offers.ts packages/catalog/src/offers.test.ts packages/catalog/src/reference-offers.ts
git commit -m "feat: model offers by market and currency"
```

### Task 2: Market-aware totals and optimizer

**Files:**
- Modify: `apps/web/lib/builder.ts`
- Modify: `apps/web/lib/builder.test.ts`
- Modify: `packages/compatibility/src/optimizer.ts`
- Modify: `packages/compatibility/src/optimizer.test.ts`

**Interfaces:**
- `snapshot(lines, market)` returns `pricedTotal: { amount; currency; pricedItems; unpricedItems }`.
- `optimizeForPrice(lines, market)` compares only candidates/current parts that have offers in that market; unpriced parts are skipped.

- [ ] **Step 1: Write failing US/PL total tests**

Assert the same build can have different native totals per market and that a missing market offer increments `unpricedItems` rather than adding zero.

- [ ] **Step 2: Verify RED**

Run web + compatibility tests.

- [ ] **Step 3: Thread market through totals/optimizer**

Use selected-market offers only. Return `null`/unpriced metadata where a complete total cannot be honestly stated; do not silently sum only known items without labeling incompleteness.

- [ ] **Step 4: Verify GREEN and commit**

Commit market-aware totals and optimizer after tests/typecheck pass.

### Task 3: Persistent market selector

**Files:**
- Create: `apps/web/lib/market.ts`
- Create: `apps/web/lib/market.test.ts`
- Create: `apps/web/components/market-selector.tsx`
- Modify: `apps/web/components/builder-workspace.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Produces: `SupportedMarket = "US" | "PL"`, `marketForLocale(locale): SupportedMarket`, `currencyForMarket(market)`, and persisted key `howtopc-market`.
- `MarketSelector` calls `onChange(market)` and displays `United States · USD` / `Poland · PLN`.

- [ ] **Step 1: Write failing locale tests**

```ts
expect(marketForLocale("pl-PL")).toBe("PL");
expect(marketForLocale("en-US")).toBe("US");
expect(marketForLocale("de-DE")).toBe("US");
```

- [ ] **Step 2: Verify RED**

Run web tests and confirm missing market helper.

- [ ] **Step 3: Implement helper and selector**

Initialize from saved value when valid; otherwise map `navigator.language`; fall back to US. Persist explicit changes to localStorage. Use `Intl.NumberFormat` with the offer currency for formatting.

- [ ] **Step 4: Wire selected market through catalog offers/build totals**

All price cells, build totals, and optimizer presentation use the same current market. Products without a native offer show `NO PRICE · specs only`.

- [ ] **Step 5: Verify GREEN and commit**

Run web typecheck/tests and commit:
```bash
git add apps/web/lib/market.ts apps/web/lib/market.test.ts apps/web/components/market-selector.tsx apps/web/components/builder-workspace.tsx apps/web/app/globals.css
git commit -m "feat: add regional market pricing selector"
```

### Task 4: Market-aware WebMCP

**Files:**
- Modify: `packages/webmcp/src/tools.ts`
- Modify: `packages/webmcp/src/tools.test.ts`
- Modify: `apps/web/components/webmcp-inspector.tsx`

**Interfaces:**
- Build context supplied to WebMCP includes selected `market`.
- `search_components`, `inspect_component`, `get_build`, and `optimize_build` return `{ market, currency, offer? }` rather than PLN-specific fields.

- [ ] **Step 1: Write failing WebMCP market tests**

Assert US context returns USD offer metadata and PL context returns PLN; missing market offer is `undefined`, never amount 0.

- [ ] **Step 2: Verify RED**

Run WebMCP tests.

- [ ] **Step 3: Replace PLN-specific tool fields**

Rename `pricePln`/`savingsPln` outputs to generic amount/currency fields and thread selected market through tool context.

- [ ] **Step 4: Verify GREEN and commit**

Run WebMCP typecheck/tests and commit.

### Task 5: Full regional-pricing verification

- [ ] Frozen install.
- [ ] Workspace typecheck.
- [ ] Full Vitest suite.
- [ ] Production build.
- [ ] Runtime smoke in both US and PL selector states where browser automation is available; otherwise verify rendered selector/options and market helpers.
- [ ] `git diff --check`.
- [ ] Push only after all checks pass.
