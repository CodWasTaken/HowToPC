# HowToPC Adversarial Architecture Review and Resolutions

**Date:** 2026-08-26  
**Applies to:** `2026-08-26-howtopc-architecture-design.md`  
**Status:** Normative amendments after adversarial review  

This document deliberately attacks the approved HowToPC design from the perspectives of correctness, data quality, licensing, geometry, maintainability, browser performance, agent safety, and hackathon delivery. Each weakness below is paired with a concrete architectural resolution.

Where this document adds a stricter rule than the baseline architecture document, the stricter rule is authoritative.

## 1. Weak point: the product is too large to ship as one hackathon implementation

### Risk

The complete vision includes catalog ingestion, mechanical 3D, exact compatibility, pricing, performance, power, thermals, homelab workload planning, optimization, and WebMCP. Treating all of those as equally required creates a high risk of producing many half-working systems instead of one coherent product.

### Resolution: vertical-slice delivery with capability levels

The product vision remains intact, but hackathon implementation is split into capability levels.

**P0 — must be complete for submission**

- canonical product schema and curated dataset
- core specification compatibility
- one fully verified digital-twin PC path with multiple alternative components
- at least three cases/form-factor variations demonstrating the system is data-driven
- real-scale component placement
- analytic clearance checks
- collision/keep-out checks for demo parts
- clear `COMPATIBLE / INCOMPATIBLE / WARNING / UNKNOWN` UX
- PC builder flow
- minimal homelab workload flow
- WebMCP tools controlling the same build domain as the UI
- deterministic validation before mutations
- public live deployment and tests

**P1 — high-value if P0 is stable**

- curated price observations
- idle/typical/peak power estimates
- electricity cost
- basic workload performance observations
- deterministic cost/power optimization
- expanded homelab storage/NIC/HBA rules

**P2 — roadmap, never allowed to destabilize P0**

- broad live retailer aggregation
- advanced thermals/noise
- price history at production scale
- large benchmark ingestion
- mechanical editor
- community verification
- full cable routing
- advanced rack topology

A feature flag/capability registry should allow the application to hide incomplete analysis modules rather than ship fake results.

## 2. Weak point: “manufacturer data is authoritative” does not grant redistribution rights

### Risk

A manufacturer page, Icecat feed, retailer page, manual, image, or CAD file may be accurate while still having different copyright, trademark, contractual, or distribution restrictions. Treating all discovered data/media as reusable could make the catalog legally fragile.

### Resolution: facts and media have separate rights pipelines

HowToPC stores factual observations separately from source artifacts.

Each source observation has:

```text
source_id
source_type
source_reference
observed_at
factual_confidence
```

Each stored/published asset has independent rights metadata:

```text
rights_class
license_name
attribution_text
redistribution_allowed
transformation_allowed
commercial_use_allowed
source_reference
```

Allowed publication classes:

- `REDISTRIBUTABLE`
- `REDISTRIBUTABLE_WITH_ATTRIBUTION`
- `LINK_ONLY`
- `FACT_ONLY`
- `INTERNAL_RESEARCH_ONLY`
- `BLOCKED`

The asset publication pipeline fails closed. A missing or ambiguous media right means the asset is not published.

Manufacturer logos/textures are not required for MVP 3D accuracy. If rights are unclear, use original neutral materials without copied logos while preserving exact mechanical dimensions.

## 3. Weak point: mixed licenses could contaminate the public hackathon repository

### Risk

The application code can be Apache-2.0 while imported databases such as BuildCores OpenDB use ODC-By. Committing a large imported dataset under the repository root could create confusing or incorrect licensing claims.

### Resolution: keep external catalog data out of the code license boundary

The public source repository contains:

- application code
- importer code
- schema definitions owned by HowToPC
- tiny, clearly attributed test fixtures only

Bulk external datasets are ingested into the database/object store and are not implicitly covered by the code license.

Required files before Devpost submission:

- `LICENSE` — application source license
- `NOTICE` — attribution notices
- `DATA_LICENSES.md` — dataset/source licenses
- `ASSET_LICENSES.md` — 3D/media licenses

Any committed ODC-By fixture is stored in a clearly labeled fixture directory with its source/license note.

## 4. Weak point: exact geometry is often unavailable

### Risk

Manufacturers frequently publish outer dimensions but not case interior CAD, exact motherboard connector coordinates, keep-out geometry, or installation paths. Claiming an exact digital twin from a few dimensions would simply move hallucination from AI into geometry.

### Resolution: mechanical verification levels

Every mechanical profile has a verification level:

```text
AUTHORITATIVE_CAD
VERIFIED_MEASUREMENT
MANUFACTURER_DIMENSIONS
PARAMETRIC_INFERENCE
BOUNDING_ONLY
UNKNOWN
```

Each geometric rule declares the minimum evidence it needs.

Examples:

- gross GPU-length check may accept `MANUFACTURER_DIMENSIONS`
- exact radiator/VRM collision requires verified placement geometry
- cable-side-panel clearance requires connector anchor + keep-out evidence

A detailed-looking model does not automatically increase compatibility confidence. Render fidelity and mechanical verification are separate fields.

## 5. Weak point: dimensions have measurement uncertainty

### Risk

A GPU advertised as 320 mm and a case advertised as 320 mm do not imply guaranteed real-world fit. Manufacturer rounding, protrusions, model revisions, installation tolerance, and measurement origin can matter.

### Resolution: interval-based clearance instead of false exactness

Dimensions carry uncertainty/tolerance metadata when known.

Conceptually:

```text
value_mm = 320
uncertainty_mm = ±1
```

Clearance is evaluated conservatively using intervals.

If the worst-case available clearance is still above the required safety margin, result can be `COMPATIBLE`.

If the best-case result still collides, result is `INCOMPATIBLE`.

If uncertainty spans the boundary, result becomes `WARNING` or `UNKNOWN` depending on evidence quality.

The geometry package defines an explicit floating-point epsilon and a separate real-world fit safety margin. Numerical epsilon must never be mistaken for physical manufacturing tolerance.

## 6. Weak point: collision-free does not mean installable

### Risk

A component can fit in its final position but have no feasible insertion path through the chassis opening, or it may require removing another part first.

### Resolution: model assembly state and installation path

Mechanical profiles can include:

- `assembly_dependencies`
- `required_removed_parts`
- `insertion_direction`
- `installation_corridor`
- `installation_sequence_constraints`

Compatibility distinguishes:

```text
FINAL_STATE_FIT
INSTALLATION_PATH_VALID
```

For MVP, installation-path checks are required only for the curated Tier-A mechanical subset. For parts without installation-path evidence, final-state geometry may pass while installation confidence remains `UNKNOWN`.

This prevents “no collision in final coordinates” from being presented as “guaranteed to install.”

## 7. Weak point: radiators, fans, cages, and risers form compound assemblies

### Risk

A radiator plus fans occupies a stack; fan mounts can be mutually exclusive; a drive cage may move to multiple positions; a vertical GPU mount can consume expansion slots. Treating each item independently misses shared mounting constraints.

### Resolution: mount groups and assemblies

Introduce:

```text
MountGroup
Assembly
AssemblyMember
```

A `MountGroup` can define:

- mutually exclusive mounts
- shared rails/holes
- maximum aggregate thickness
- position alternatives
- occupancy rules

An `Assembly` represents a stack such as:

```text
case mount
  -> radiator
    -> fan layer
```

Clearance is calculated from the actual assembled stack, not a static case `max_gpu_length` field.

## 8. Weak point: case specification “max GPU length” values are conditional

### Risk

Case marketing specs often quote a maximum under one configuration. Front radiators, fans, cages, pumps, or alternative layouts can reduce it.

### Resolution: conditional clearance rules

Case data supports conditional constraints, not only a scalar maximum.

Examples:

```text
base_gpu_corridor = X
if front_radiator:
  subtract radiator_depth + fan_depth
if drive_cage_position == FRONT:
  limit corridor to Y
```

When exact geometry exists, geometry is authoritative. When it does not, documented conditional formulas provide the analytic fallback.

## 9. Weak point: form-factor names are not enough for physical fit

### Risk

Labels such as E-ATX are used inconsistently. Two “E-ATX” boards can have different widths, and some cases support only a subset.

### Resolution: physical dimensions and mounting patterns override labels

Form factor is a search/classification hint.

Physical case compatibility uses, when available:

- board dimensions
- standardized mounting-hole pattern
- tray envelope
- connector/edge keep-out

A form-factor label alone cannot produce `COMPATIBLE` for an ambiguous oversized board.

## 10. Weak point: motherboard QVL data can be misinterpreted

### Risk

A RAM kit missing from a motherboard QVL is not necessarily incompatible; QVLs are generally validation subsets, not exhaustive support lists.

### Resolution: distinguish specification compatibility from validation evidence

Memory results can carry:

```text
SPEC_COMPATIBLE
VENDOR_VALIDATED
NOT_VENDOR_VALIDATED
```

Absence from the QVL does not by itself produce `INCOMPATIBLE`.

By contrast, an explicit CPU support list/minimum BIOS requirement can be treated as authoritative when the manufacturer defines it that way.

## 11. Weak point: motherboard resource-sharing rules are too complex to hardcode globally

### Risk

M.2/SATA/PCIe lane sharing varies by individual motherboard and firmware configuration. A growing set of `if motherboard == X` application-code rules would be unmaintainable.

### Resolution: board-specific resource graph + constraint DSL

Each motherboard can define a resource graph and declarative conditional rules.

Rule concept:

```text
WHEN m2_slot_3.occupied
THEN disable sata_port_5, sata_port_6
SOURCE manual.page_reference
```

Another:

```text
WHEN pcie_slot_2.occupied
THEN pcie_slot_1.max_lanes = 8
```

Rules are data, schema validated, provenance-backed, and tested with board fixtures.

The compatibility engine interprets the DSL generically.

## 12. Weak point: PCIe slot size and electrical bandwidth are different

### Risk

A physical x16 slot can operate electrically at x4, and lane generation/CPU/chipset origin can affect homelab suitability.

### Resolution: separate physical and electrical topology

A PCIe slot stores at least:

- physical connector size
- maximum electrical lanes
- generation
- lane source
- bifurcation capability where known
- conditional lane-sharing rules

The homelab planner checks required electrical bandwidth in addition to physical fit.

## 13. Weak point: product revisions can silently invalidate saved builds

### Risk

Manufacturers sometimes revise coolers, motherboards, PCBs, connector placement, BIOS behavior, or accessory bundles without changing the high-level product family. Updating canonical catalog data could make an old saved build appear to change.

### Resolution: version canonical products and analyses

Canonical records have immutable revisions/versions.

A saved build records:

- canonical product revision IDs
- mechanical profile versions
- compatibility engine version
- calculation model version
- price snapshot timestamp

The UI can later offer “re-analyze with latest data” instead of silently changing historic results.

## 14. Weak point: cooler compatibility can depend on accessory kits/revisions

### Risk

A cooler may support a socket only with a particular bracket included in newer packages or bought separately.

### Resolution: accessory requirements are explicit compatibility prerequisites

Socket compatibility can return:

```text
WARNING / CONDITIONAL
requires mounting_kit_id = X
```

Adapters/brackets are explicit accessory records when necessary. The engine must not assume an adapter exists merely because one can theoretically be purchased.

## 15. Weak point: PSU compatibility cannot assume adapters are safe or present

### Risk

Power adapters and modular cables can be model-specific. Incorrect cable assumptions can be dangerous.

### Resolution: native connector compatibility by default

The default compatibility path requires the selected PSU/package to provide the required connector.

Adapters are explicit products/build items with their own compatibility rules.

Never treat modular PSU-side pinouts as interoperable across brands/models unless explicit verified compatibility exists.

## 16. Weak point: WebMCP is still an evolving proposed standard

### Risk

Chrome currently documents WebMCP as origin-trial/experimental technology. API details may change during or after the hackathon.

### Resolution: isolate WebMCP behind a versioned adapter

The `packages/webmcp` package owns all direct `document.modelContext` use.

Core domain packages never reference WebMCP browser globals.

The adapter:

- feature-detects API support
- keeps tool schemas in one registry
- uses current `document.modelContext`
- can be swapped for a new API revision without changing compatibility/build logic
- gracefully degrades to a normal human builder if WebMCP is unavailable

WebMCP is essential to the hackathon experience but not to application correctness.

## 17. Weak point: an agent can leave the build half-mutated during a multi-step change

### Risk

If the agent removes a PSU and then fails before adding the replacement, or adds an incompatible part before checking, the shared product state can become confusing.

### Resolution: transactional domain mutations

Add a command/transaction layer.

Mutating operations perform:

1. clone/derive candidate build state
2. apply requested change
3. run required validation/compatibility checks
4. return a compatibility delta
5. commit only if mutation policy allows it

Default agent policy:

- reject hard-incompatible mutations
- reject critical `UNKNOWN` physical fit unless the user explicitly allows uncertainty
- allow warnings with structured explanation

Provide:

- `preview_build_change`
- `apply_build_change`
- `undo_last_change`

The UI uses the same transaction path.

## 18. Weak point: optimization search can explode combinatorially

### Risk

Trying every CPU × motherboard × RAM × GPU × PSU × case combination is infeasible as catalog size grows.

### Resolution: staged constraint optimization, not brute force

Optimizer pipeline:

1. translate user request into hard constraints and weighted soft objectives
2. prefilter catalog using hard typed constraints
3. build candidate groups by compatibility dependencies
4. prune dominated candidates
5. evaluate only top-N candidates per category/price-performance band
6. run full compatibility on candidate builds
7. maintain a Pareto frontier
8. rank according to user preferences

The optimizer records why each candidate was eliminated.

MVP optimization operates on the curated catalog, where exhaustive final validation remains tractable.

## 19. Weak point: unknown compatibility has unclear mutation behavior

### Risk

If unknown parts are silently allowed, the product can generate unsafe confidence. If all unknowns are blocked, users cannot experiment with incomplete catalog data.

### Resolution: explicit mutation modes

Build session mode:

- `SAFE` (default): hard incompatibilities blocked; critical unknowns blocked
- `EXPERIMENTAL`: unknowns allowed with prominent unresolved checks

WebMCP operates in `SAFE` mode unless the user explicitly changes the build session mode.

An agent cannot silently enable experimental mode.

## 20. Weak point: external text can prompt-inject an agent

### Risk

Retailer listings, community descriptions, and imported product text are untrusted content. Returning raw text through WebMCP creates indirect prompt-injection surface.

### Resolution: agent outputs are structured and minimized

WebMCP tools return normalized fields by default:

```text
product_id
manufacturer
model
price
spec fields
compatibility facts
```

They do not return raw retailer descriptions unless a specific read-only tool requests them.

Imported textual content is classified untrusted and, where the WebMCP API supports it, outputs use relevant untrusted-content annotations/hints.

State-changing tools have narrow schemas and never execute instructions contained in source text.

## 21. Weak point: 3D detail can destroy browser performance

### Risk

A detailed case, motherboard, cooler, fans, GPU, and cables can easily create millions of triangles and huge texture downloads, especially on mobile.

### Resolution: explicit rendering budgets and LOD

Asset pipeline enforces budgets.

MVP target budgets should be measured and tuned, with starting constraints such as:

- optimized GLB assets
- separate collision geometry
- LOD tiers
- compressed textures (KTX2)
- mesh compression
- lazy loading for non-visible detail
- instancing for repeated parts such as fans/RAM when appropriate
- prebuilt/reused BVHs rather than expensive per-frame collision construction

The viewer implements adaptive quality based on device capability.

A dimensionally accurate low-detail model is preferred over a photorealistic model that makes the builder unusable.

## 22. Weak point: geometry work on the main UI thread can cause jank

### Risk

Repeated collision checks and geometry analysis during component search or dragging may block rendering.

### Resolution: split immediate and heavy checks

- analytic compatibility runs synchronously and cheaply
- geometric validation runs on a bounded queue, preferably in a worker-compatible geometry module
- rendering never performs full collision scans every frame
- BVHs/collision shapes are prepared at asset ingestion/build time where possible
- build mutations trigger validation events instead of continuous brute-force checks

The geometry engine is written without React dependencies so it can move between main thread, Web Worker, or server tooling.

## 23. Weak point: thermal/noise prediction invites fake precision

### Risk

Exact °C/dBA predictions require detailed fan curves, case impedance, cooler tests, workload behavior, ambient conditions, and acoustics. A browser estimate can easily look more authoritative than it is.

### Resolution: calibrated evidence tiers and conservative outputs

MVP thermal/noise outputs use categories and ranges unless high-quality measured data exists.

Preferred language:

- cooling margin: `LOW / MODERATE / HIGH`
- airflow balance: `NEGATIVE / BALANCED / POSITIVE`
- noise expectation: `QUIET-LEANING / MODERATE / PERFORMANCE-LEANING`

Absolute dBA/temperature predictions are shown only when backed by an explicitly documented model and uncertainty band.

User-visible assumptions include ambient temperature and selected fan profile.

## 24. Weak point: TDP is not actual power consumption

### Risk

CPU TDP, GPU TBP, measured wall power, and workload power are not interchangeable.

### Resolution: power observations carry semantic type

Power records include:

```text
IDLE_MEASURED
LOAD_MEASURED
PEAK_MEASURED
MANUFACTURER_TDP
MANUFACTURER_TBP
DERIVED_ESTIMATE
```

The power engine prioritizes measured workload-appropriate evidence and falls back to conservative estimates.

PSU sizing includes configurable headroom and connector checks; it does not simply add manufacturer TDP values.

## 25. Weak point: benchmark data from different runs is not directly comparable

### Risk

Resolution, game version, quality preset, drivers, OS, memory, and benchmark version can change results.

### Resolution: benchmark normalization keys

A comparable result family requires a normalized key containing relevant variables.

The application does not combine results across incompatible benchmark configurations as if they were identical.

Sparse data produces ranges/unknowns, not fabricated interpolation.

The first MVP can deliberately support a small set of curated workload datasets instead of pretending to cover every game/application.

## 26. Weak point: “bottleneck percentage” is misleading

### Risk

A single percentage implies a universal property even though bottlenecks depend on workload, resolution, settings, and target frame rate.

### Resolution: workload-specific limiting-factor explanations

HowToPC does not publish a universal bottleneck percentage.

It reports findings such as:

- GPU-limited in selected 1440p gaming dataset
- VRAM-limited for selected model size
- memory-capacity-limited for configured VM workload
- storage/network throughput below requested target

## 27. Weak point: homelab workload requirements are subjective

### Risk

“Plex server” or “Proxmox host” does not have one correct CPU/RAM requirement. Concurrent streams, VM sizes, codecs, storage growth, and user expectations vary.

### Resolution: workload templates expose assumptions

A workload template is a parameterized recipe, not an unquestionable requirement.

Example:

```text
Plex
concurrent_streams
resolution
codec
transcode_or_direct_play
hardware_acceleration
```

VMs specify RAM/vCPU/storage individually or through editable defaults.

The planner shows the assumptions used to produce recommendations and allows the user/agent to alter them.

## 28. Weak point: “production status” and “available for sale” are different

### Risk

A discontinued product can have large remaining inventory, while an actively produced product can be unavailable in a region.

### Resolution: separate lifecycle dimensions

Store separately:

```text
production_status
market_availability_status
```

Production status values may include:

- `IN_PRODUCTION`
- `DISCONTINUED`
- `UNKNOWN`

Market availability is derived from recent offer observations:

- `WIDELY_AVAILABLE`
- `AVAILABLE`
- `SCARCE`
- `USED_ONLY`
- `NO_RECENT_OFFERS`

HowToPC's default catalog eligibility is driven by market availability, not only production status.

## 29. Weak point: stock/price data is inherently stale and region-dependent

### Risk

A price can change minutes after ingestion. Taxes, shipping, currency, region, and item condition matter.

### Resolution: freshness and region are mandatory offer dimensions

Every price displays:

- region
- currency
- condition
- observed_at
- shipping inclusion when known
- tax inclusion when known

Offer freshness policy controls whether a price can be used for optimization.

If no fresh eligible offer exists, the optimizer treats price as unknown or uses a user-supplied override; it does not silently assume MSRP equals current purchase price.

Live retailer APIs are an optional enrichment layer, never a core builder dependency.

## 30. Weak point: Icecat/retailer/API availability can change

### Risk

Accounts, terms, quotas, pricing, or API products can change and break ingestion.

### Resolution: no external source is architecturally mandatory

The canonical DB persists validated observations independently.

Each adapter has:

- source/version identifier
- rate limiting
- retries/backoff
- last successful sync
- health status
- license/terms metadata

Source loss reduces freshness/coverage but does not take down the builder.

## 31. Weak point: data conflicts require human intervention

### Risk

Manufacturer, OpenDB, Icecat, retailers, and community measurements can disagree. Pure automatic priority rules cannot safely resolve every ambiguity.

### Resolution: conflict queue and auditable override

Conflicts above field-specific tolerance enter a review queue.

A manual canonical override stores:

- chosen value
- reviewer
- reason
- evidence
- timestamp

Overrides are versioned and reversible.

The system never deletes conflicting evidence simply because one value won canonical selection.

## 32. Weak point: mechanical onboarding does not scale manually

### Risk

Hand-authoring anchors, mounts, collision shapes, and keep-outs for tens of thousands of parts would become the largest labor bottleneck.

### Resolution: prioritize cases/motherboards, generate commodity parts parametrically, and build an editor

Mechanical effort has unequal value.

Priority order:

1. cases/chassis
2. motherboards
3. large GPUs
4. coolers/radiators
5. PSUs
6. expansion cards
7. drives/fans/RAM through reusable parametric templates

Many components can share parametric families while preserving exact dimensions.

The post-hackathon mechanical editor becomes a core internal data tool, with automatic checks:

- bounding box matches declared dimensions
- anchors fall inside/near expected geometry
- mount normals/orientations valid
- no impossible default self-collisions
- unit scale verified

## 33. Weak point: exact-looking 3D models can create unjustified trust

### Risk

A photorealistic model may visually imply that connector or clearance geometry is verified when only the outer shape is known.

### Resolution: visible geometry confidence

Each displayed component can expose a mechanical confidence badge:

- verified mechanical model
- verified exterior, simplified internals/connectors
- dimensionally accurate parametric model
- bounding placeholder

A compatibility rule reports the evidence it actually used, independent of visual appearance.

## 34. Weak point: generated 3D assets can still violate source IP if copied from proprietary models

### Risk

Reverse-engineering or extracting a proprietary BuildCores/manufacturer mesh would violate the independent-asset requirement.

### Resolution: clean asset provenance

Every exact asset stores `asset_provenance` describing how it was created.

Allowed MVP sources include:

- original modeling from factual dimensions and independently observed references
- explicitly licensed/redistributable CAD/model assets
- original parametric generation

Blocked:

- extracted proprietary BuildCores assets
- copied game/simulator assets
- unlicensed manufacturer CAD redistribution

If logo/texture rights are unclear, omit them.

## 35. Weak point: client-side compatibility results can drift as data/engines update

### Risk

A build analyzed yesterday could produce different output today after a rule update, making bug reports and shared links hard to reproduce.

### Resolution: analysis snapshots

A `BuildAnalysisSnapshot` records:

- build revision
- product revisions
- mechanical profile revisions
- compatibility engine version
- calculation model versions
- result
- timestamp

Current analysis can always be recomputed, while historical snapshots remain explainable.

## 36. Weak point: the domain model could accidentally assume one CPU/GPU/etc.

### Risk

Consumer PCs usually have one CPU and one GPU, but homelab/server systems may have multiple sockets, GPUs, NICs, HBAs, or storage controllers.

### Resolution: resource/mount cardinality drives component count

Do not encode `build.cpu` as a permanent singleton concept.

The build contains installed components bound to available mounts/resources.

MVP consumer boards expose one CPU socket, but the domain can later represent multi-socket/server systems without schema replacement.

## 37. Weak point: three-way compatibility cannot always be reduced to pairwise rules

### Risk

ECC may depend on CPU + motherboard + memory type; radiator clearance can depend on case + motherboard + RAM; PCIe resources can depend on multiple installed devices.

### Resolution: rule engine operates on build context, not only pair pairs

Rules may declare dependencies on arbitrary build resources.

Pairwise checks remain optimized shortcuts, but the authoritative compatibility report is evaluated against the complete candidate build state.

## 38. Weak point: the user may want intentionally incompatible educational builds

### Risk

Hard-blocking every incompatible selection reduces the tool's educational value and makes it difficult to understand why something fails.

### Resolution: preview invalid candidates without committing them

Catalog items can be selected for inspection and shown ghosted in 3D with collision highlights.

`preview_build_change` can produce an invalid candidate report without mutating the real build.

Only explicit experimental/manual override can commit incompatible state, and the UI remains visibly invalid.

WebMCP safe mode does not commit hard incompatibilities.

## 39. Weak point: WebMCP tools can become too numerous or too low-level

### Risk

Exposing dozens of tiny mount/header tools can reduce agent tool-selection accuracy.

### Resolution: layered tool strategy

Public WebMCP tools remain task-oriented and composable:

- search/inspect
- preview/apply/replace component
- set goals/workloads
- analyze
- optimize

Fine-grained geometry actions remain internal unless a concrete user journey requires them.

Tool descriptions are evaluated and changed based on WebMCP eval results rather than intuition.

## 40. Weak point: user build actions need undo and provenance

### Risk

Agent-assisted modifications can be hard to follow if several components change quickly.

### Resolution: build command log

Every mutation produces a command/event record containing:

- actor: human/agent
- command name
- arguments
- previous build revision
- new build revision
- compatibility delta
- timestamp

This enables undo, audit, demo clarity, and debugging.

The UI can show “Agent replaced PSU because the previous unit lacked 12V-2x6” rather than silently changing the list.

## 41. Weak point: catalog breadth can hide incomplete mechanical coverage

### Risk

Importing tens of thousands of products creates the impression that all of them are equally supported by the 3D/compatibility engine.

### Resolution: independent coverage dimensions

Each product exposes support coverage:

```text
catalog_specs: COMPLETE | PARTIAL
mechanical: VERIFIED | PARAMETRIC | BOUNDING | NONE
price: FRESH | STALE | NONE
benchmark: STRONG | LIMITED | NONE
firmware/topology: VERIFIED | PARTIAL | NONE
```

Search filters can require a minimum coverage level.

The demo defaults to mechanically verified products.

## 42. Weak point: search can return a giant irrelevant catalog

### Risk

A “full list of all current parts” is valuable only if users and agents can narrow it quickly.

### Resolution: compatibility-first indexed search

Search indexing includes structured filters for:

- category
- manufacturer
- socket
- memory generation
- form factor
- dimensions
- power/connectors
- price/region
- availability
- mechanical verification
- workload-relevant features

Catalog search first filters impossible candidates using cheap deterministic rules before returning results to the UI/agent.

PostgreSQL FTS + trigram remains sufficient initially; move to a dedicated search engine only after measured need.

## 43. Weak point: network calls could make WebMCP tool execution slow/unreliable

### Risk

An agent journey that invokes many tools should not block on multiple retailer/benchmark providers.

### Resolution: WebMCP operates against canonical cached state

WebMCP tools query HowToPC's canonical DB and analysis services.

External provider synchronization happens out-of-band from the user mutation path.

A tool may expose data freshness but should not normally scrape/fetch third-party sources during the tool call.

## 44. Weak point: “everything properly calculated” is impossible without declaring assumptions

### Risk

Energy, thermals, performance, noise, virtualization capacity, and prices all depend on assumptions. Hiding them creates fake certainty.

### Resolution: first-class calculation assumptions

Every analysis result contains:

```text
model_version
assumptions
inputs
confidence
result/range
```

The user can inspect or adjust important assumptions such as:

- electricity price
- ambient temperature
- workload duty cycle
- gaming resolution/preset
- VM oversubscription
- target headroom

The agent may change assumptions only when consistent with the user's request, and must make consequential changes visible.

## 45. Weak point: compatibility correctness needs stronger quality gates than ordinary UI code

### Risk

A single false green compatibility result damages the central trust promise.

### Resolution: compatibility-release gate

Before a compatibility rule/data class is considered production-quality it needs:

- deterministic unit tests
- relevant property-based invariants
- at least one known-good fixture
- at least one known-bad fixture
- source/evidence requirements defined
- unknown behavior defined
- user-facing explanation defined

For mechanically verified demo configurations, compare HowToPC results against real manufacturer documentation and, where practical, a physically known build.

## 46. Weak point: the MVP could accidentally become dependent on user authentication

### Risk

Login problems would make judges unable to test the core experience.

### Resolution: authentication is optional for the primary flow

The builder, WebMCP tools, and demo configuration work anonymously.

Authentication is only needed for durable personal saved-build libraries. If auth is not stable before submission, saved builds can be deferred without affecting the core demo.

## 47. Weak point: demo quality can be lost inside technical complexity

### Risk

A sophisticated backend is not automatically visible to judges.

### Resolution: make engineering evidence observable

The submission build includes an optional developer/analysis panel showing:

- currently registered WebMCP tools
- most recent tool invocation
- compatibility rule results
- geometry clearance values
- data provenance/confidence
- current engine/model versions

This makes the non-trivial WebMCP and compatibility work easy to evaluate without requiring judges to inspect source code first.

## 48. Weak point: “all ideas” can keep expanding the MVP forever

### Risk

The product vision contains many valid future features. Adding every newly imagined feature to the hackathon critical path guarantees scope failure.

### Resolution: architecture accepts breadth; roadmap controls delivery

A feature can be part of the approved long-term product without being a P0 hackathon deliverable.

New ideas are classified as:

- required for architecture correctness
- P0 demo-critical
- P1 stretch
- post-hackathon roadmap

Only correctness issues are allowed to expand P0 automatically.

# Revised core contracts

The adversarial review adds the following domain concepts to the baseline architecture.

```text
MechanicalVerificationLevel
DimensionInterval / uncertainty
MountGroup
Assembly
InstallationConstraint
ConditionalConstraint
ResourceGraph
BuildRevision
BuildAnalysisSnapshot
BuildCommand
BuildTransaction
RightsClass
CoverageProfile
CalculationAssumptions
ProductionStatus
MarketAvailabilityStatus
```

## Revised mutation flow

```text
Human UI / WebMCP
        ↓
Domain command
        ↓
Create candidate build revision
        ↓
Specification/resource/electrical checks
        ↓
Analytic mechanical checks
        ↓
Geometric/installation checks when evidence permits
        ↓
Compatibility delta
        ↓
Policy decision
 ┌───────────────┴────────────────┐
 │                                │
commit revision               reject/preview
 │                                │
update 3D + analysis          explain + remediate
```

## Revised data flow

```text
External source
      ↓
rights + source gate
      ↓
raw observation
      ↓
identity resolution
      ↓
validation + unit normalization
      ↓
conflict detection
      ↓
canonical product revision
      ↓
coverage/confidence profile
      ↓
builder/search/analysis
```

# Final architecture verdict after review

The fundamental product direction remains sound, but the review changes the most important promise from:

> “HowToPC knows exactly whether every part fits.”

into the more defensible and more valuable promise:

> **“HowToPC never claims a part fits beyond the evidence it has, and when it has verified mechanical data it can prove the fit in the same real-scale digital twin the user and agent are manipulating.”**

That is stronger than pretending a universal parts catalog can be 100% mechanically complete on day one.

The hackathon implementation should demonstrate a small set of extremely well-verified configurations, a much broader specification-level catalog, and explicit unknowns everywhere mechanical evidence is incomplete. Post-hackathon scale comes from better ingestion, parametric assets, the mechanical editor, and evidence-driven community/manufacturer contributions—not by weakening compatibility standards.