# Configurator redesign verification — 2026-08-28

Verified branch: `chatgpt/ux-redesign`
Pinned BuildCores source: `7f759ec353714e9dca2adab9e62bd80311fc373e`

## Catalog generation and honesty

- Source rows: 29,632 total; 26,360 accepted; 3,272 rejected.
- Rejections: 14 `MISSING_IDENTITY`, 2,990 `MISSING_REQUIRED_FIELD`, 268 `AMBIGUOUS_VALUE`.
- All 26,360 generated products validate against their canonical category Zod schema.
- Generated price/offer fields: 0.
- Public API rows paginated and inspected: 26,367; `REFERENCE` evidence rows: 0; maximum page size observed: 100.
- Regeneration produced no tracked shard diff; full generated JSON is 32.95 MB and remains server-only.
- Browser static output contains 32 curated BuildCores IDs, not the full generated catalog.

## Coverage and filtering

- Modern/historical search passed for Ryzen 9 9950X3D, RTX 5090, GTX 1080, and curated Core i5-3470 with canonical provenance.
- Representative filtered totals: CPU 30; motherboard 52; memory 1,994; GPU 600; storage 441; PSU 880; case 860; cooler 614; fan 504.
- Network remains honestly empty: 0 products and 0 facets because source records lack required canonical facts.
- Zero-known storage sequential-write facet is omitted rather than rendered empty.
- Full-set compatibility ordering/filtering before pagination is covered by the server regression tests and production `compatibleOnly` smoke.

## Builder, Twin, and responsive UI

- An offset-100 storage product installs, survives browser query/category changes, increments 1→2, and decrements 2→1.
- An offset-100 case becomes the Twin `caseBox`.
- Real dense scene: sourced ATX case + X470 board + four DIMMs + four drives produced zero collisions.
- A second GPU with unknown GPU-capable slot topology is not guessed into place; the Twin emits explicit `TOPOLOGY_UNKNOWN`.
- 1920×1080: no body scrollbar; Parts and Build are fixed workspace columns; Parts list scrolls internally.
- 1280×800: Parts/Build are working drawers with backdrop and internal scroll; no body overflow.
- 390×844: Parts/Twin/Build tabs select one panel at a time; Parts and Build retain internal scrolling.
- Empty-build recovery passed for case-first and motherboard-first flows; both intentionally show `INCOMPLETE`.
- AM5 CPU + LGA1700 motherboard results were 50/50 visibly blocked incompatible with zero enabled add buttons.
- Long hardware names clamp to two lines with full tooltip, fixed compatibility-dot X alignment, and no horizontal overflow.

## Agent/native parity

- Production browser registered all 10 WebMCP tools through `document.modelContext`.
- WebMCP real search/inspect returns `OPEN_DATA` provenance; fixture-only inspect returns catalog-not-found.
- WebMCP public responses contain no paused price fields.
- A safe case edit commits through WebMCP; a too-long GPU is `BLOCKED_INCOMPATIBLE` in both catalog apply-state and agent mutation decision.
- Repeatable SATA storage changed 1→2→1 through WebMCP while visible Build quantity and Twin mechanical checks changed 1→2→1.

## Final gates

- Branch descends from quantity milestone `fc09870`; paused pricing commit `05499e9` is not an ancestor.
- `pnpm typecheck`: passed for all workspace packages.
- `pnpm test`: 48 test files / 147 tests passed.
- `pnpm build`: passed; production exposes `/`, `/api/catalog/search`, and `/api/catalog/product/[id]`.
- `git diff --check`: passed.
- The exact `pnpm install --frozen-lockfile` command and an offline variant were blocked before execution by the remote command safety layer.
- Equivalent lock consistency was checked independently: 32 workspace dependency specifiers compared to `pnpm-lock.yaml`, 0 mismatches; installed workspace listing succeeded.
- Pricing remains paused and excluded from the redesign baseline.
