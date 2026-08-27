# HowToPC Configurator Redesign, Full Catalog, and Geometry Design

**Status:** approved in chat; written-spec review pending  
**Baseline:** `fc09870` (`chatgpt/quantity-builder`)  
**Implementation branch:** `chatgpt/ux-redesign`  
**Date:** 2026-08-27

## Goal

Turn the current MVP-style three-panel prototype into a usable engineering configurator: roomy and responsive, recoverable from empty/partial builds, backed by the full safely-normalized real hardware catalog, equipped with category-specific faceted filters, and driven by a 3D mounting system that does not visually stack components on top of each other.

Pricing work is explicitly paused for this milestone. Existing price UI may be hidden or reduced to `NO PRICE`; no regional-price architecture is advanced until the redesigned configurator is visually approved.

## Product principles

- The 3D twin remains the visual center of the product.
- The public catalog shows real hardware, not old MVP placeholder products.
- Missing information remains unknown; it is never guessed into compatibility or filter buckets.
- An incomplete build is a normal editing state, not a dead end.
- Known hard conflicts are rejected; missing prerequisite parts alone do not prevent continued building.
- Compatibility, resource accounting, UI actions, WebMCP actions, and geometry all use the same build state.
- Visual fidelity is distinct from mechanical verification; parametric placement must be labeled honestly.

## 1. Build editing semantics and empty-build recovery

The canonical compatibility states remain exactly `COMPATIBLE`, `INCOMPATIBLE`, `WARNING`, and `UNKNOWN`. The UI may additionally derive an **INCOMPLETE** presentation label when the only unresolved checks are missing prerequisite categories; INCOMPLETE is not a fifth engine status.

Mutation admissibility must be separated from whole-build completeness. Today a mutation is rejected whenever the candidate build is `UNKNOWN`, which makes an empty build impossible to recover. The new mutation decision has two concepts:

- **Whole-build report:** the normal four-state compatibility result.
- **Mutation decision:** whether the requested change is safe to commit now.

A mutation is allowed when the candidate introduces no known incompatibility and every blocking fact required specifically to validate that mutation is known. Missing unrelated prerequisites are non-blocking. Examples:

- Empty build + case: allowed; build remains UNKNOWN/INCOMPLETE because CPU/board/etc. are absent.
- CPU-only build + motherboard with matching known socket: allowed.
- Empty build + motherboard: allowed.
- Existing motherboard + second GPU when GPU-capable slot topology is unknown: blocked as UNKNOWN because that missing fact is required to validate the requested addition.
- Any known socket, memory-generation, physical-capacity, connector, or clearance conflict: blocked as INCOMPATIBLE.

Compatibility rule results therefore gain explicit mutation metadata such as `reasonKind: MISSING_PREREQUISITE | KNOWN_CONFLICT | REQUIRED_FACT_UNKNOWN | INFORMATIONAL` and `blocksMutation: boolean`. Safe mutation primitives inspect this metadata rather than rejecting every UNKNOWN wholesale.

`Clear build` empties all build lines and never disables the Parts browser. There are no problem-specific preset buttons in the main interface.

## 2. Desktop, laptop, and mobile shell

Wide desktop uses three regions without body scrolling:

- Parts: 340–360 px.
- Digital Twin: `minmax(0, 1fr)` and receives the majority of width.
- Build: 360–400 px.

The application shell uses `height: 100dvh` and `overflow: hidden`. Lists that can exceed their allocated space use their own internal scrolling. At normal desktop zoom, the document body must not gain a vertical scrollbar from application content.

At roughly 900–1400 px, the Twin remains central and Parts/Build become toggleable overlay drawers rather than permanently compressing the canvas. On mobile, `Parts | Twin | Build` becomes primary tab navigation. Breakpoints are behavior changes, not merely progressively narrower columns.

The visual language remains an engineering configurator/CAD utility, but with more breathing room: larger base text, fewer always-visible borders, stronger hierarchy, square-ish controls, neutral surfaces, and status colors only for semantic state. Dark mode remains first-class.

## 3. Parts browser row structure

Every result row uses a fixed grid rather than nested flex layouts:

`12px status | minmax(0,1fr) identity | auto action`

Compatibility indicators therefore share an exact X coordinate. Public presentation uses:

- green: the mutation decision is ALLOWED, even when the whole candidate build remains UNKNOWN/INCOMPLETE because unrelated prerequisite parts are missing,
- gray: the mutation is blocked because a fact required to prove this specific change safe is UNKNOWN,
- red: the mutation is blocked by a known INCOMPATIBLE conflict.

Default result ordering is green, then gray, then red, stable within each group. `Compatible only` removes gray/red rows.

Names occupy at most two lines with ellipsis; the full display name is available via title/accessible text. Metadata is concise and category-specific. Repeatable rows render compact `− q/max +`; singleton rows use a compact select/add action. Installed state is visually separate from compatibility state.

## 4. Public catalog versus test fixtures

The current `referenceCatalog` mixes real imported hardware with deterministic MVP placeholder products. That separation becomes explicit:

- `fixtureCatalog`: deterministic synthetic/reference parts used by unit tests and focused development scenarios.
- `publicCatalog`: real normalized products only.
- Curated real products with manufacturer/retailer/open-data provenance may remain public.
- Synthetic names such as `Reference B650`, `Value 1440p GPU`, and similar MVP parts never appear in normal user search/browse results.

Compatibility tests may continue using fixture products so tests remain deterministic. Production UI and public WebMCP catalog search use the real catalog.

Every public product retains source provenance and stable identity. Product matching uses source IDs plus manufacturer part numbers/GTINs when available; title-only identity is not accepted.

## 5. Full real hardware ingestion

BuildCores OpenDB remains a specification source, not a price source. The ingestion pipeline expands from the existing CPU/MOTHERBOARD/MEMORY subset to every HowToPC component category whose source schema can be mapped without invention.

Target public categories for this milestone are CPU, MOTHERBOARD, MEMORY, GPU, STORAGE, PSU, CASE, COOLER, FAN, NETWORK, and HBA. For each source category we either:

1. normalize the record and expose it publicly, or
2. reject it with an explicit deterministic reason recorded in an ingestion coverage report.

The generator produces coverage counts per source category: total source records, accepted, rejected, rejection reasons, and missing-field rates for important filter/compatibility properties. No category is silently represented by a tiny hand-picked sample when a broader safe import is possible.

Generation is deterministic and performed ahead of runtime. The browser does not download the raw upstream repository. BuildCores attribution and ODC-By requirements remain visible and preserved in generated metadata.

## 6. Catalog search architecture

The full catalog is too large to embed in the initial React bundle. Generated normalized data is split into category shards plus compact metadata/facet indexes. A server-side catalog search boundary owns full-dataset filtering and pagination.

The web app calls a catalog search route with:

- text query,
- selected category,
- active facet filters,
- sort mode,
- `compatibleOnly`,
- current quantity-aware build lines,
- cursor/page size.

The search service filters the full relevant shard before pagination. It evaluates apply-now compatibility against the supplied build using the same mutation preview primitives as the UI/WebMCP. This guarantees compatibility ordering applies to the filtered full result set, not merely to whichever 50 rows happened to load first.

Search responses return only the fields needed for browsing plus compatibility state and current quantity metadata. Full normalized specifications are fetched/returned when inspecting or selecting a product. Server work is cached by a stable build signature plus normalized search/filter input; max-safe-quantity calculation is performed for returned rows rather than every record in a huge result set.

Default category browsing favors sensible real-hardware relevance/newness when trustworthy release/generation metadata exists. When it does not, ordering falls back to deterministic manufacturer/name/source identity; missing dates are never invented.

Global search covers manufacturer, model/display name, manufacturer part number, GTIN, and source identifier where present.

## 7. Category-specific faceted filters

Facets are schema-driven and change with the selected category. Each facet definition declares a normalized field, control type (`enum`, `multi-enum`, `boolean`, `numeric-range`), label, units, and whether an explicit `Unknown` bucket is useful. Missing values are never coerced into known buckets.

Initial facet coverage:

- **CPU:** manufacturer, socket, family/generation, core count, thread count, integrated graphics, TDP, unlocked status where known, release year.
- **MOTHERBOARD:** manufacturer, socket, chipset, form factor, memory generation, DIMM slots, maximum memory, PCIe slots, GPU-capable slots where known, M.2 slots, SATA ports, Wi-Fi, Ethernet speed, ECC support where known.
- **MEMORY:** manufacturer, DDR generation, total kit capacity, modules per kit, capacity per module, speed MT/s, ECC, DIMM/SO-DIMM where available, latency/timings when trustworthy.
- **STORAGE:** SSD/HDD, SATA/NVMe/SAS, M.2/2.5-inch/3.5-inch, capacity, PCIe generation, sequential read/write speed, endurance/TBW, HDD RPM, cache, manufacturer.
- **GPU:** GPU vendor, board manufacturer, family/generation, VRAM capacity/type, card length, slot width, TDP, power connectors, display outputs, PCIe interface.
- **PSU:** manufacturer, wattage, ATX/SFX/SFX-L, verified 80 PLUS tier (Standard/White, Bronze, Silver, Gold, Platinum, Titanium), modularity, PCIe connector counts, 12VHPWR/12V-2x6, EPS count, ATX specification version where known.
- **CASE:** supported motherboard form factors, max GPU length, cooler clearance, PSU form factors, radiator support, fan positions, drive bays, side-panel type where sourced.
- **COOLER:** air/AIO, supported sockets, height, radiator size, fan size/count, sourced cooling ratings only when defensible.
- **FAN/NETWORK/HBA:** category-appropriate interface, dimensions, speed/ports, connector/interface generation, and other safely normalized fields.

Price range is reserved in the facet API but disabled during this milestone. When pricing work resumes, it will filter native offers in the selected market rather than product specs or FX-converted estimates.

## 8. Facet interaction design

The left pane keeps search and category navigation visible while results scroll. Facets are collapsed sections rather than a permanently expanded wall of controls. Active filters appear as removable chips above the result count, with a single `Clear filters` action.

Selecting a category immediately swaps the available facet definitions. Numeric ranges display real units and derive min/max bounds from matching known data. Facet counts reflect the current query and other active filters. The `Unknown` option is shown only where it helps users intentionally include products with missing source data.

Category navigation does not wrap into several rows on desktop; it uses a compact horizontally scrollable strip or equivalent single-line navigation. Keyboard focus, labels, and checkbox/range semantics remain accessible.

## 9. Parametric mount topology

The 3D twin changes from category-based offsets to a discrete logical mount allocator. Mechanical convention remains 1 logical unit = 1 mm, +X width, +Y vertical, +Z depth.

A `MountTopology` is derived from known case and motherboard specifications. It contains logical zones/slots rather than invented manufacturer coordinates: motherboard tray, CPU socket anchor, DIMM slots, PCIe expansion slots, M.2 anchors, SATA 2.5-inch bays, SATA 3.5-inch bays, PSU zone, fan/radiator zones where known.

Every physical instance receives a unique mount assignment before scene boxes are created. Allocation is deterministic. If a required mount cannot be assigned safely, geometry reports an unresolved/invalid placement instead of drawing two components in the same space.

DIMM kits expand to physical modules before mounting. A 2-module kit at quantity 2 therefore creates four DIMM instances occupying four distinct logical slots. M.2 devices occupy one M.2 anchor each. SATA devices occupy individual bays. PCIe devices consume logical expansion capacity according to known physical slot width/topology.

## 10. Correct global component dimensions

Scene dimensions are expressed in global XYZ rather than category-specific ad hoc axes. Examples:

- Motherboard: `[board thickness X, board height Y, board depth Z]`.
- GPU/PCIe card: `[slot thickness X, card height Y, card length Z]`; GPU slot width therefore extends away from the board in X rather than being treated as vertical height.
- DIMM: `[module thickness X, module height Y, module length Z]`.
- M.2: `[module thickness X, module width/height Y, module length Z]` after applying the board-relative mount orientation.
- PSU/storage/case geometry follows the same global convention.

This corrects the current orientation bug visible in screenshots where GPU and memory boxes can occupy implausible volumes.

## 11. Collision detection and mechanical honesty

After mount allocation, the scene runs AABB collision checks between component instances that are not intentionally allowed to intersect. Intentional parent/child relationships such as CPU beneath a CPU cooler are represented explicitly as allowed-overlap relationships rather than globally disabling collision checks for those categories.

Unexpected intersections produce mechanical diagnostics such as `GPU intersects drive-bay zone` or `cooler intersects DIMM module`. Collision results are separate from exact manufacturer CAD verification: passing the parametric model means the simplified known constraints pass, not that every screw hole or PCB component has been verified.

Unknown case/board topology never causes invented exact coordinates. The UI states: `Parametric mounting preview — verified capacities where known; exact component coordinates may differ.`

## 12. Twin presentation and camera

The center canvas receives most desktop space and automatically fits the current scene after material build changes. A compact floating toolbar provides `Iso`, `Front`, `Side`, `Top`, `Fit`, and case-shell visibility. `Reset view` resets only the camera, never the build.

Hover labels remain compact and readable. Mechanical clearance information collapses to a small status summary by default and expands on request rather than permanently covering the model. Empty builds show a neutral message; builds without a case explain that the mechanical preview needs a case while still allowing all other editing actions.

## 13. Build panel redesign

The Build panel prioritizes installed hardware, capacity usage, and actionable problems. It no longer permanently displays every routine compatible rule.

Installed hardware is grouped by category. Singleton rows use a compact remove control; repeatable rows use compact decrement/increment controls with quantity. `Clear build` is generic and replaces problem-specific presets such as the old budget-homelab button.

Resource counters are grouped together (`DIMM`, `M.2`, `SATA`, `GPU slots`, general `PCIe`) and shown only when a meaningful capacity is known. Compatibility summary shows blocking issues first, then warnings. Routine successful checks live behind `View all checks`.

When the build is empty, the panel says `Build is empty. Choose any component to begin.` Missing required categories may be summarized as INCOMPLETE in the UI without changing the canonical engine state.

## 14. WebMCP presentation

WebMCP remains fully functional and quantity-aware, but the normal user interface no longer gives it a large debug panel. It becomes a compact `Agent tools` status/control that can expand to advanced diagnostics when needed.

The same public catalog search/facet boundary is available to agent tools, and agent mutations use the same mutation-decision semantics as UI actions. Agents must be able to build from an empty machine just as a human can. Public WebMCP search excludes synthetic fixture products.

## 15. Responsive behavior

Wide desktop (approximately 1400 px and above): Parts, Twin, and Build are simultaneously visible.

Laptop/narrow desktop (approximately 900–1400 px): Twin remains central; Parts and Build are overlay drawers opened by persistent controls. Opening a drawer does not permanently shrink the canvas to an unusable width.

Mobile: primary navigation is `Parts | Twin | Build`; one workspace is visible at a time. Quantity controls, filters, search, and build editing remain usable with touch targets appropriate for mobile.

The breakpoints are validated at representative widths rather than inferred only from CSS compilation.

## 16. Testing strategy

Implementation follows TDD at each boundary. Required regression coverage includes:

- Empty build can accept a case, CPU, motherboard, storage, or other component when no known conflict exists.
- Missing prerequisites produce non-blocking incomplete/unknown results; a required unknown safety fact such as second-GPU slot topology still blocks the mutation.
- Public catalog contains no synthetic MVP fixture products.
- Real catalog search operates over generated full-category data, honors query/facets before pagination, and preserves stable identity/provenance.
- Facet tests cover enum, boolean, range, unknown-value handling, active-filter combinations, counts, and category-specific facet definitions.
- Compatibility ordering is green, gray, red and `Compatible only` removes non-green results.
- Long result names do not change status-dot/action column alignment.
- Two RAM kits with two modules each allocate four distinct DIMM mounts.
- Multi-GPU, M.2, SATA, NIC/HBA, and mixed-device scenes allocate distinct mounts or report inability to place them.
- GPU/global axis dimensions use the documented XYZ convention.
- Collision checks catch unintended AABB intersections while explicit allowed-overlap relationships remain valid.
- Camera fit/view controls do not mutate build state.
- Desktop application shell has no body overflow at representative desktop viewport sizes; pane lists scroll internally.
- Laptop drawer and mobile tab modes preserve editing functionality.
- WebMCP can search real products and construct a build from empty state with the same mutation rules as the UI.

Full milestone verification requires frozen install, all workspace typechecks, complete Vitest suite, production build, `git diff --check`, and runtime/browser checks at desktop, laptop, and mobile viewport sizes.

## 17. Implementation sequence

The redesign is executed in dependency order so each checkpoint remains usable:

1. Mutation-decision metadata and empty/partial-build recovery.
2. Public-vs-fixture catalog separation so synthetic MVP parts disappear from user surfaces early.
3. Broad ingestion/category schema expansion plus deterministic coverage reporting.
4. Full-catalog search service and generated category shards/indexes.
5. Schema-driven facet engine and category-specific filter definitions.
6. Parts browser row/grid redesign and compatibility status ordering.
7. Viewport shell, Build panel simplification, drawers/mobile navigation, and body-overflow removal.
8. Mount topology, corrected axes, collision detection, and geometry regression suite.
9. Twin camera/view controls and compact mechanical readouts.
10. Compact WebMCP presentation plus full-catalog/empty-build parity.
11. Full runtime/browser verification and public testing link.

Each checkpoint is committed independently. The existing verified quantity-aware mutation/resource model is preserved rather than rewritten unnecessarily.

## 18. Pricing freeze

Regional pricing development is explicitly out of scope for this redesign branch. The unfinished regional-price work is isolated on another branch/worktree and is not merged into this milestone.

During redesign, price UI may show `NO PRICE · specs only` or be visually deemphasized/hidden where it harms layout evaluation. No USD/PLN selector, FX logic, retailer adapters, price-range behavior, or optimizer-price redesign is advanced until the user visually approves this configurator milestone.

The facet architecture reserves a future price-range facet that will operate on native selected-market offers only.

## 19. Non-goals

- Photorealistic component models.
- Claiming exact manufacturer slot coordinates without source data.
- Inventing missing hardware specifications to improve filters.
- Treating UNKNOWN as compatible merely to keep an action enabled.
- Loading the full raw BuildCores repository into the browser.
- Reintroducing use-case-specific buttons or presets into the primary workspace.
- Pricing/retailer/marketplace integration during this milestone.

## 20. Acceptance criteria

This milestone is ready for visual review only when all of the following are true:

- Clearing the build never traps the user; useful parts remain addable from empty state.
- The public Parts browser is populated from the broad real catalog and hides synthetic MVP placeholders.
- Category-specific filters are useful for real shopping/configuration questions such as AM5 CPUs, Mini-ITX boards, DDR5 kit capacity/speed, NVMe capacity/read/write speed, and verified PSU efficiency tiers.
- Search/filtering addresses the full indexed catalog rather than a tiny browser-resident sample.
- Compatibility status indicators align exactly and long names remain readable without destroying row layout.
- Wide desktop has no application-induced body scrolling and the Twin has substantially more room than the current prototype.
- Laptop and mobile layouts do not compress all three panes together.
- The one-off `Budget homelab ≤500 zł` button is gone.
- Build compatibility presentation emphasizes actual problems/warnings instead of filling the panel with routine OK rows.
- Multi-device scenes do not silently stack repeated components into the same mount; unresolved placements are reported.
- The corrected geometry passes multi-DIMM, multi-GPU, M.2, SATA, expansion-card, and collision regression tests.
- WebMCP remains operational without dominating the normal interface.
- Full automated verification and representative browser/runtime checks pass.

After these criteria pass, a public test link is produced for visual approval. Pricing work resumes only after that approval.
