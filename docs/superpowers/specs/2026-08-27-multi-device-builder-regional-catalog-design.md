# HowToPC Multi-Device Builder, Compatibility Sorting, and Regional Catalog Design

Date: 2026-08-27
Branch: `chatgpt/implementation`

## Goal

Make HowToPC behave like an engineering configurator rather than a one-part-per-category picker. The builder must support real motherboard resource limits, repeated devices, broad hardware coverage across generations, and region-specific offers without conflating product specifications with price data.

The product goal is broad hardware coverage: current, previous-generation, and historical parts are all first-class. Older hardware remains useful for low-budget and homelab builds, but ingestion must not preferentially target legacy hardware.

## Build model

The domain already has `BuildItem { productRevisionId, quantity }`; the web builder will migrate from a flat `string[]` of product IDs to quantity-aware build lines.

Singleton categories remain replacement-based: CPU, MOTHERBOARD, CASE, PSU, and COOLER. Selecting a different singleton replaces the installed product of that category.

Repeatable categories are additive: MEMORY, GPU, STORAGE, FAN, NETWORK, and HBA. Each distinct product can coexist with other products in the same category and has an installed quantity.

The UI uses compact `−  quantity/max  +` controls for repeatable products. `max` means the maximum quantity of that exact product that the current machine can safely contain while leaving all other installed products unchanged. The Build panel separately shows physical resource use so kit quantities are not misleading.

A RAM product may represent a kit. One quantity of a 2×8 GB kit consumes two DIMM slots; two quantities consume four DIMM slots. Storage and expansion cards consume motherboard resources per physical device.
## Motherboard and device resource accounting

Motherboard specifications continue to expose DIMM, M.2, SATA, and aggregate PCIe capacity. They will additionally expose GPU-capable PCIe slot capacity when reliable source data exists. BuildCores PCIe lane/quantity data will be normalized into this field; curated fixtures will receive explicit values.

Resource calculations are deterministic:

- DIMM used = sum of `memory quantity × modules per kit`; it must not exceed `dimmSlots` or `maxMemoryBytes`.
- M.2 used = number of installed NVMe/M.2 storage devices; it must not exceed `m2Slots`.
- SATA used = number of SATA storage devices; it must not exceed `sataPorts`.
- GPU slots used = installed GPU quantity; it must not exceed known GPU-capable PCIe slots.
- General PCIe use includes GPUs, NETWORK cards, and HBAs where the source provides enough slot information.
- PSU demand and GPU connector requirements are summed over every installed GPU quantity, not only the first GPU.

If precise slot topology is unavailable, HowToPC must not invent it. A mutation whose safety depends on missing topology is rejected as `UNKNOWN` rather than treated as compatible.

Mixed same-generation RAM is permitted when it fits motherboard capacity. Different kits, module capacities, ECC modes, or rated speeds produce a `WARNING` where the combination is electrically possible but may run at a common lower configuration or have uncertain behavior. Different DDR generations remain incompatible.

## Catalog compatibility dots and sorting

Every visible part receives an apply-now state derived from the same safe mutation logic used by the actual `+` or selection action. There is no separate UI-only compatibility heuristic.

Green means the requested mutation would commit with overall `COMPATIBLE` or `WARNING`. Red means it would be rejected because the resulting build is `INCOMPATIBLE` or `UNKNOWN`. Installed products retain a separate installed marker so a full slot count does not make an already-installed part appear invalid.

After search/category filtering, green rows sort before red rows. Ordering inside each group remains stable and deterministic. The dot has an accessible text/ARIA label such as `Can add to current build` or `Cannot add to current build`.
## Regional offers and currency display

Price data is modeled as market observations, not a single canonical currency. `OfferObservation` will replace `amountPln` with a generic monetary amount plus `currency` and `market` fields. Examples include `US · USD`, `PL · PLN`, and later other supported markets.

Selecting a market changes which offers participate in best-price calculations, build totals, optimizer savings, and WebMCP price summaries. HowToPC does not convert Polish listings to USD or US listings to PLN to fabricate local availability. FX conversion may be added later as an explicitly labeled estimate, separate from native market offers.

The market selector maps the browser locale to a supported market when possible (for example `pl-PL → PL · PLN` and `en-US → US · USD`) and otherwise defaults to `US · USD`. An explicit user choice is persisted locally and always wins. A product with no offer in the selected market displays `NO PRICE · specs only`; it is never treated as zero cost. Offer condition (`NEW`, `USED`, `REFURBISHED`), source, observation time, and listing/estimate status remain visible metadata.

## Catalog breadth and ingestion

BuildCores OpenDB remains a specification source with ODC-By attribution. The ingestion goal expands from the initial legacy-biased snapshot to all categories that HowToPC can normalize safely, across all generations available from the provider.

Provider adapters normalize source-specific data into canonical observations; unsupported or ambiguous records are rejected with a reason. Ingestion must not guess missing sockets, dimensions, slot topology, capacities, or electrical properties.

Coverage expansion order is driven by schema readiness rather than age: CPU, MOTHERBOARD, MEMORY, GPU, STORAGE, PSU, CASE, COOLER, FAN, NETWORK, and HBA where source data is sufficient. Large source datasets are generated into deterministic catalog snapshots or database imports rather than fetched by the browser at runtime.

Pricing providers remain separate adapters. A canonical product may have many offers across markets and conditions without changing its hardware specifications.

## WebMCP and mutation semantics

Human UI and WebMCP use the same quantity-aware mutation primitives: preview add, add/increment, decrement/remove, replace singleton, and inspect resource usage. Agent mutations must return the resulting compatibility report and refuse `INCOMPATIBLE` or `UNKNOWN` changes.

`search_components` should surface apply-now compatibility and selected-market offer information. `get_build` and `analyze_build` should expose quantities plus DIMM/M.2/SATA/PCIe resource usage so agents can reason about remaining capacity.
## UI behavior

The Parts panel keeps the existing dense engineering layout. Singleton rows remain click-to-select. Repeatable rows expose compact quantity controls and compatibility dots without expanding into cards or modal flows.

The Build panel adds a concise resource summary such as `DIMM 2/4 · M.2 1/3 · SATA 2/6 · GPU PCIe 1/2`. Resource labels only appear when the current motherboard/case data can support a meaningful number.

When a repeatable part reaches its safe maximum, `+` becomes disabled and the row's add-now state becomes red; `−` remains available while quantity is above zero. Attempting a rejected mutation through WebMCP or another path returns the deterministic reason rather than silently substituting a different part.

## Testing and verification

TDD covers: green-before-red catalog sorting; dots matching actual safe mutation outcomes; singleton replacement; repeatable quantity increment/decrement; DIMM kit slot consumption; motherboard max-memory enforcement; mixed-memory warnings; multiple M.2/SATA devices; multiple GPUs; aggregate PSU demand/connectors; unknown PCIe topology; regional offer selection; no-price behavior; and WebMCP quantity mutations.

Full completion requires frozen install, workspace typecheck, all tests, production Next build, runtime smoke, and public deployment smoke where hosting access permits.

## Migration sequence

1. Finish apply-now compatibility sorting/dots using current single-item state.
2. Introduce quantity-aware builder state and mutation primitives while preserving existing presets.
3. Convert compatibility rules to aggregate repeatable resources and quantities.
4. Add repeatable `− quantity/max +` UI and Build resource summary.
5. Update WebMCP to quantity-aware mutations and capacity reporting.
6. Generalize offers from PLN-only observations to market + currency observations and add the market selector.
7. Expand BuildCores normalization/snapshots across all safely supported categories and generations.
8. Add regional retailer/marketplace offer adapters independently of spec ingestion.

## Non-goals for this milestone

No automatic FX conversion masquerading as local price data; no invented motherboard lane bifurcation or case slot geometry; no automatic prohibition on mixed RAM that real hardware can accept; no giant runtime download of the full external catalog; and no redesign of the site's established utilitarian visual language.
