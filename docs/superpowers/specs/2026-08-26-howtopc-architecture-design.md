# HowToPC Architecture and Product Design

**Date:** 2026-08-26  
**Status:** Approved product direction; architecture baseline before implementation planning  
**Repository:** `CodWasTaken/HowToPC`  
**MVP:** Desktop PC + Homelab  

## 1. Executive summary

HowToPC is an engineering-grade, agent-native PC and homelab configurator. A build is represented as a real system rather than a shopping list: physical geometry, mounting relationships, electrical connections, logical resource topology, workload requirements, compatibility state, performance estimates, power behavior, pricing, availability, and provenance all describe the same machine.

The central product experience is a live, dimensionally accurate 3D digital twin. Components are placed using real mounting anchors and dimensions. A specific GPU SKU is rendered at its real scale, attached to the correct motherboard PCIe slot and case expansion slots, and checked for physical interference against the case, radiator, fans, RAM, CPU cooler, drive cages, and other keep-out zones. The renderer is not decorative; it is a visual representation of the same mechanical data used by the compatibility engine.

WebMCP is the agent interface. The user can manually build and inspect a system, or ask an AI agent to construct, modify, compare, optimize, and explain builds through structured domain tools. The agent does not click UI controls and does not get a separate implementation path: both the human UI and WebMCP call the same deterministic domain operations and compatibility engine.

The hackathon thesis is:

> Agents should not merely recommend PC parts in chat. They should be able to engineer the actual computer.

## 2. Product principles

### 2.1 Never claim compatibility without evidence

Compatibility has four states:

- `COMPATIBLE`: all required checks with sufficient evidence passed.
- `INCOMPATIBLE`: at least one hard requirement failed.
- `WARNING`: the configuration can work but carries an important caveat, prerequisite, or compromise.
- `UNKNOWN`: HowToPC lacks enough verified information to guarantee the result.

Unknown is a valid and important result. Missing radiator clearance, incomplete BIOS support information, unknown cable bend space, or unverified server memory support must never silently become a green check.

### 2.2 Exact SKU identity, not family identity

Hardware families are not physical products. `RTX 4060` is a chipset family; specific cards from ASUS, MSI, Gigabyte, Zotac, and others can have different lengths, heights, slot thicknesses, coolers, connector positions, and power requirements.

Canonical products therefore use manufacturer-specific SKUs/MPNs wherever possible. Product identity is based on stable identifiers such as:

- manufacturer
- manufacturer part number / MPN
- GTIN / EAN / UPC when available
- source-specific IDs
- revision where physically or electrically meaningful

Retailer listings map to canonical products; retailer titles never define product identity.

### 2.3 The 3D model and compatibility engine share mechanical truth

The renderer must not use visually convenient placements that differ from compatibility calculations. Both systems consume the same mechanical profile:

- real dimensions
- anchors
- mounts
- allowed orientations
- collision geometry
- keep-out zones
- connector positions
- installation dependencies

### 2.4 Deterministic engineering first, AI orchestration second

The AI agent decides what the user wants and which domain actions to invoke. It does not invent electrical, geometric, pricing, or benchmark facts.

Operations such as `checkCompatibility`, `estimatePower`, `optimizeForBudget`, and `inspectClearances` are deterministic application capabilities. WebMCP exposes them to an agent.

### 2.5 Provenance is part of the product

A specification is not just a value. It includes its source, confidence, observation time, and rights metadata.

Example conceptually:

```text
GPU length: 304 mm
source: ASUS manufacturer specification
confidence: AUTHORITATIVE
verified_at: 2026-08-25
usage_right: FACT_ONLY
```

This allows HowToPC to explain why it believes a part fits and avoids silently mixing conflicting data.

## 3. MVP product scope

### 3.1 Desktop PC builder

Supported use cases include:

- gaming
- workstation / rendering
- creator / video editing
- software development
- local AI / ML workstation
- quiet workstation
- low-power desktop
- general purpose desktop

### 3.2 Homelab builder

Supported workload profiles include:

- Proxmox
- TrueNAS
- Plex / Jellyfin
- Home Assistant
- Docker
- Kubernetes
- generic Linux VM
- generic Windows VM
- game server
- backup server
- NAS
- local AI inference

The same build can combine workloads.

### 3.3 MVP component categories

Core categories:

- CPU
- GPU
- motherboard
- memory / RAM kits
- PC case
- PSU
- CPU air cooler
- AIO / radiator cooling
- case fan
- SSD / NVMe
- HDD
- network adapter
- HBA / storage controller

Additional categories can be modeled by the same interfaces after the MVP.

### 3.4 Explicit non-goals for the hackathon

The architecture supports future breadth, but the initial delivery does not require:

- every hardware SKU to have a handcrafted photorealistic 3D asset
- full computational fluid dynamics
- exact acoustic prediction under every room condition
- every retailer in every country
- complete enterprise server hardware coverage
- laptop internal reconfiguration
- full cable routing simulation
- every historic part ever produced

These omissions are implementation-scope decisions, not architectural limitations.

## 4. Product positioning and differentiation

BuildCores already provides a mature 3D PC-building product and an open PC component database. HowToPC therefore must not position itself as merely a 3D PCPartPicker alternative.

HowToPC differentiates around:

1. **Agent-native engineering through WebMCP.** The agent manipulates a real engineering model through typed domain actions.
2. **Compatibility confidence and provenance.** Unknown information is explicit, and each conclusion can be traced to source evidence.
3. **Mechanical digital twin as system truth.** Exact mounts, collision volumes, keep-out zones, and connector placement participate in compatibility.
4. **Topology/resource reasoning.** PCIe lanes, M.2/SATA sharing, expansion slots, fan headers, power connectors, storage ports, and homelab resources matter.
5. **Homelab-first reasoning.** Workloads, 24/7 energy use, storage topology, virtualization, networking, transcoding, ECC, HBAs, and expansion planning are first-class.
6. **Optimization over a real constrained system.** The agent can reduce cost, power, noise, or size while preserving user-specified performance constraints.

## 5. System model

A build is not represented as an array of selected products. It is a domain object with multiple connected views:

```text
Build
├── identity and owner
├── mode: PC | HOMELAB
├── goals and constraints
├── workload profile
├── installed components
├── physical topology
├── electrical topology
├── logical resource topology
├── thermal configuration
├── price snapshot
├── power model
├── performance model
├── compatibility report
└── provenance summary
```

### 5.1 Build goals

Examples:

- maximum budget
- preferred manufacturers
- excluded manufacturers
- target gaming resolution
- target software/workloads
- minimum storage capacity
- minimum networking speed
- noise priority
- power priority
- upgradeability priority
- case size limit
- rack / footprint constraints later

### 5.2 Build item

A build item references one canonical product plus installation state:

```text
BuildItem
├── product_id
├── quantity
├── placement
├── mount_id
├── logical_connection
├── electrical_connection
└── configuration
```

This distinction matters because the same fan SKU can be installed in different mounts, the same SSD can occupy different M.2 slots, and slot choice can affect other resources.

## 6. Compatibility architecture

Compatibility is divided into independent rule families so the system can explain failures precisely and evolve without becoming one giant boolean function.

### 6.1 Specification compatibility

Examples:

- CPU socket equals motherboard socket.
- CPU appears in motherboard CPU support list where such a list is required.
- required BIOS version is available.
- RAM generation matches motherboard memory generation.
- RAM capacity, DIMM count, rank constraints, and speed profiles are supported.
- motherboard form factor is supported by the case.
- PSU form factor is supported by the case.
- CPU cooler supports CPU socket.
- storage interface is supported.

### 6.2 Firmware compatibility

Some physically compatible combinations require firmware conditions.

A result may therefore be:

```text
WARNING
CPU is supported only with BIOS version >= X.
```

Firmware support data must store:

- motherboard revision
- CPU identifier
- minimum BIOS version
- release date where known
- source URL/reference
- verification date

A missing CPU support table produces `UNKNOWN`, not an assumption.

### 6.3 Electrical compatibility

Checks include:

- PSU sustained output vs calculated system requirement
- transient headroom policy
- motherboard 24-pin supply
- CPU EPS connector count/type
- GPU 6-pin / 8-pin / 12VHPWR / 12V-2x6 requirements
- SATA power requirements
- fan and pump header counts/current limits where data exists
- ARGB/RGB voltage compatibility

A PSU is not considered compatible simply because its wattage number is large enough.

### 6.4 Resource and topology compatibility

Motherboards expose resources that can conflict or share bandwidth.

The engine models:

- CPU PCIe lanes
- chipset lanes
- physical PCIe slots
- negotiated lane widths
- M.2 slots
- SATA ports
- shared/disabling relationships
- NIC requirements
- HBA requirements
- USB headers
- fan headers
- pump headers
- RGB/ARGB headers

Rules may include:

```text
When M.2_3 is occupied, SATA_5 and SATA_6 are disabled.
```

or:

```text
PCIe x16 slot 2 operates at x4 when M.2 slot 2 is occupied.
```

For homelabs this prevents physically valid but functionally impossible configurations.

### 6.5 Physical compatibility

Physical fit is checked in two passes.

#### Pass 1: analytic checks

Fast, deterministic checks use structured values:

- GPU length vs currently available GPU corridor
- GPU thickness vs expansion-slot availability
- CPU cooler height vs case clearance
- PSU length vs PSU bay
- radiator length/thickness vs supported mount
- fan size vs mount size
- motherboard format vs tray support

These checks run during catalog filtering and every build mutation.

#### Pass 2: geometric checks

For components with sufficient mechanical profiles, simplified collision geometry validates real placement.

Examples:

- GPU vs front radiator
- GPU vs drive cage
- GPU power cable keep-out vs side panel
- tower cooler vs RAM
- cooler vs VRM heatsink
- radiator/fan stack vs motherboard heatsinks
- PSU vs storage cage
- vertical GPU vs CPU cooler

If a required mechanical profile is missing, the relevant physical rule returns `UNKNOWN`.

### 6.6 Thermal suitability

Thermal suitability is separate from hard physical compatibility.

A build may physically fit but produce a warning because estimated thermal load is too high for its configured cooling or airflow assumptions.

Thermal results must be labeled estimates, not measurements.

### 6.7 Compatibility report

The engine returns explainable rule results:

```text
CompatibilityReport
├── status
├── rules[]
│   ├── id
│   ├── category
│   ├── status
│   ├── message
│   ├── components[]
│   ├── measured values
│   ├── source evidence
│   └── remediation options
└── confidence summary
```

The report is consumed by the UI and WebMCP unchanged.

## 7. Mechanical and 3D architecture

### 7.1 Coordinate system

All physical dimensions are stored in millimetres.

Canonical convention:

- `+X`: case width direction
- `+Y`: vertical
- `+Z`: case depth direction
- world scale: 1 logical geometry unit = 1 mm

Every imported asset is normalized to this convention during the asset pipeline.

### 7.2 Mechanical profile

Every mechanically relevant product may have a `MechanicalProfile`:

```text
MechanicalProfile
├── dimensions_mm
├── render_asset
├── collision_asset
├── anchors[]
├── mounts[]
├── keepout_zones[]
├── connectors[]
├── allowed_orientations[]
├── assembly_dependencies[]
├── source_evidence[]
└── verification_state
```

### 7.3 Anchors

An anchor identifies a connection point or placement reference.

Examples:

- motherboard PCIe slot anchor
- GPU edge-connector anchor
- GPU rear-bracket anchor
- motherboard tray origin
- PSU bay origin
- CPU socket origin
- RAM slot origin
- fan center and plane
- radiator mount plane
- M.2 connector origin

Parts are positioned through anchor relationships instead of manually authored per-build XYZ coordinates.

### 7.4 Mounts

A mount defines what can be installed at a location and under which constraints.

Example conceptually:

```text
front_fan_1
supported_sizes: [120, 140]
max_thickness_mm: 30
position: ...
normal: ...
```

Mounts are first-class data for:

- fans
- radiators
- motherboards
- GPUs / PCIe cards
- PSUs
- 2.5-inch drives
- 3.5-inch drives
- M.2 devices
- rack devices later

### 7.5 Collision geometry

Visible GLB assets can contain detailed meshes. Compatibility uses optimized collision assets instead.

Collision representations should prefer:

- oriented bounding boxes for simple components
- small sets of convex hulls for irregular components
- simplified static triangle meshes only where necessary

`three-mesh-bvh` accelerates geometric queries.

Collision output includes intersection parties, approximate penetration, and affected keep-out zones where useful.

### 7.6 Keep-out zones

Some required space is not occupied by the part itself.

Examples:

- GPU power-connector bend radius / cable clearance
- side-panel cable clearance
- AIO tube emergence region
- RAM insertion/removal clearance
- air intake/exhaust exclusion region
- PSU cable exit region

These volumes should be separate from visible geometry and tagged by purpose so warnings can explain the issue.

### 7.7 3D asset tiers

HowToPC must support broad catalog coverage without requiring a handcrafted model for every SKU.

**Tier A — Exact visual model**

- accurate dimensions
- recognizable exterior model
- correct anchors/connectors
- optimized render mesh
- collision geometry

**Tier B — Parametric model**

- exact mechanical dimensions and mounts
- generated/simplified visual appearance
- accurate collision behavior

**Tier C — Bounding model**

- verified dimensions
- dimensionally accurate placeholder
- clearly marked as simplified

Compatibility accuracy is not allowed to depend on visual asset fidelity.

### 7.8 Asset pipeline

Authoring path:

```text
Blender / source geometry
        ↓
unit + axis normalization
        ↓
anchor / mount metadata validation
        ↓
render mesh optimization
        ↓
collision mesh generation
        ↓
glTF / GLB
        ↓
Meshopt / texture compression
        ↓
Cloudflare R2
```

Binary assets are stored in object storage, not in the application repository.

### 7.9 Mechanical editor

A future internal/admin tool should allow a contributor to load a component model and visually define:

- anchors
- mounts
- keep-out zones
- collision volumes
- connector positions

This is the scalable path for onboarding physical data and should eventually replace manual JSON editing for geometry.

## 8. Catalog and data-source strategy

No single public source provides every trustworthy field HowToPC needs. The application therefore owns a canonical normalized catalog and treats external datasets as observations.

### 8.1 BuildCores OpenDB

Use BuildCores OpenDB as a major seed and enrichment source for PC-specific structured data.

Verified properties of the current project:

- structured PC component database organized by category
- schemas for CPU, GPU, motherboard, RAM, PC case, PSU, coolers, fans, storage, network cards, and other categories
- fields useful for PC compatibility
- Open Data Commons Attribution License (ODC-By 1.0)
- open database does not provide price data / retailer-specific pricing because of restrictions

Important constraint:

- BuildCores' proprietary 3D models must **not** be copied or reused without explicit collaboration/permission.

HowToPC may ingest ODC-By-compatible OpenDB records while preserving source attribution and licensing notices.

### 8.2 Icecat

Icecat is a secondary catalog enrichment source.

Open Icecat currently advertises free brand-authorized structured content from 600+ brands and millions of product records, including identifiers, specifications, logistics data, dimensions, images, manuals, variants, and rich media depending on the brand/content rights.

Use policy:

- ingestion must be through documented account/API/feed mechanisms
- every field/asset stores source and rights metadata
- do not assume a specification license automatically grants the right to redistribute images, PDFs, videos, or 3D assets
- Full Icecat is not an MVP requirement
- HowToPC must function if Icecat is unavailable

### 8.3 Manufacturer sources

Manufacturer specifications and support documents are highest-priority factual evidence when legally/technically accessible.

However, "authoritative" and "redistributable" are different concepts.

HowToPC therefore separates:

- factual observation rights
- cached document rights
- image/media redistribution rights
- 3D/CAD asset rights

A manufacturer page may support a factual value without HowToPC copying the original media.

### 8.4 Community and other datasets

Scraped PCPartPicker datasets may be useful for development coverage comparison and discovering missing model identities, but should not be the canonical production dependency.

Unlicensed or unclear datasets are never bulk-imported into production merely because they are technically downloadable.

### 8.5 Product trust / manufacturer registry

Instead of an informal "no weird off-brand products" rule, HowToPC uses manufacturer trust states:

- `TRUSTED`
- `COMMUNITY`
- `UNVERIFIED`
- `ARCHIVED`

Default search shows trusted products.

A manufacturer can qualify for trusted status based on criteria such as:

- stable official identity/site
- consistent manufacturer part numbers
- sufficient specification availability
- legitimate distribution
- warranty/support information
- product identity quality

The criteria should be documented and applied consistently rather than manually based on brand recognition.

## 9. Canonical catalog data model

### 9.1 Core tables/entities

```text
manufacturer
product
product_identifier
product_source_link
spec_observation
canonical_spec
source
source_license
asset
asset_rights
mechanical_profile
mechanical_anchor
mechanical_mount
mechanical_keepout
compatibility_rule_data
firmware_support
retailer
offer
offer_observation
benchmark
benchmark_result
build
build_item
build_goal
build_workload
```

Category-specific tables hold typed fields:

```text
cpu_spec
gpu_spec
motherboard_spec
memory_spec
case_spec
psu_spec
cooler_spec
fan_spec
storage_spec
network_spec
hba_spec
```

### 9.2 Product identity matching

Entity matching priority:

1. exact manufacturer + MPN
2. exact GTIN/EAN/UPC
3. known source ID mapping
4. normalized manufacturer/model/revision match
5. fuzzy matching only as a review candidate

Fuzzy matching must never automatically merge products when physical variants could differ.

### 9.3 Observations vs canonical values

External source values are stored as observations.

Example:

```text
spec_observation
product: X
field: gpu.length_mm
value: 304
source: manufacturer
observed_at: ...
confidence: AUTHORITATIVE
```

Canonical selection applies source priority and validation policy.

Conflicting observations remain stored and visible for review.

### 9.4 Source priority

Default factual evidence priority:

1. manufacturer specification/support document
2. manufacturer-authorized structured feed
3. licensed structured catalog with direct brand content
4. BuildCores OpenDB
5. reputable retailer
6. verified community observation
7. unverified community submission

This priority can be field-specific. For example, real-world measured noise may be more useful from a reputable lab than a manufacturer marketing specification.

### 9.5 Rights metadata

Every source/asset record includes a rights classification such as:

- `FACT_ONLY`
- `REDISTRIBUTABLE_WITH_ATTRIBUTION`
- `REDISTRIBUTABLE`
- `LINK_ONLY`
- `INTERNAL_RESEARCH_ONLY`
- `BLOCKED`

The pipeline must refuse to publish an asset unless its rights permit publication.

### 9.6 Availability lifecycle

Product lifecycle:

- `CURRENT`: actively manufactured and normally stocked
- `AVAILABLE`: production ended/unclear but meaningful new retail stock exists
- `SCARCE`: limited new stock
- `USED`: primarily second-hand
- `ARCHIVED`: not realistically purchasable

The catalog remains useful for recently discontinued hardware with stock instead of hiding it solely because production ended.

## 10. Ingestion architecture

Each external source implements a source adapter that outputs normalized observations rather than writing canonical tables directly.

```text
Source adapter
   ↓
raw observation staging
   ↓
identity resolution
   ↓
schema validation
   ↓
rights validation
   ↓
conflict detection
   ↓
canonical selection
   ↓
search index refresh
```

Adapters may include:

- `BuildCoresOpenDbImporter`
- `IcecatImporter`
- `ManufacturerObservationImporter`
- `EbayOfferImporter`
- `AmazonOfferImporter` (later/onboarding dependent)
- benchmark importers

### 10.1 Data quality gates

A record cannot become trusted canonical data if:

- identity is ambiguous
- required units are unknown
- dimensional axes are ambiguous
- the source cannot be attributed
- publication rights are incompatible
- validation constraints fail

### 10.2 Unit normalization

Internal standard units:

- length: mm
- mass: g
- power: W
- voltage: V
- current: A
- capacity: bytes plus human-facing units
- bandwidth: bits/s
- temperature: °C
- price: integer minor currency units + ISO currency code

Original values/units remain stored in observations for traceability.

## 11. Pricing and stock

Pricing is intentionally separate from hardware specifications.

### 11.1 Offer model

```text
Offer
├── product_id
├── retailer
├── retailer_item_id
├── region
├── currency
├── price
├── shipping
├── condition
├── availability
└── source URL/reference
```

A canonical component can have many offers.

### 11.2 Offer history

Periodic `offer_observation` records enable:

- current price
- 30-day average
- 90-day low
- stock trend
- regional comparisons

### 11.3 Initial provider strategy

Use provider adapters and avoid coupling the product to one store.

Potential sources include documented affiliate/commerce APIs such as eBay Browse API and, after required account onboarding, Amazon's current affiliate product APIs.

No retailer integration is allowed to block the core builder from functioning.

### 11.4 Price confidence

The UI must distinguish:

- live/recent offer
- stale observation
- MSRP/reference price
- unknown price

An optimizer must not claim a budget-compliant build using stale/unknown offers without warning the user.

## 12. Performance engine

HowToPC does not use one universal "performance score" as its ground truth.

Performance is workload-specific.

### 12.1 Workload families

Gaming:

- 1080p
- 1440p
- 4K

Creation:

- Blender/rendering
- video encode/decode
- editing

Development:

- compilation
- containers
- VMs

AI:

- VRAM capacity
- supported precision/features
- inference workloads

Homelab:

- virtualization
- containers
- transcoding
- storage
- networking

### 12.2 Evidence types

Every displayed performance claim is labeled:

- `MEASURED`
- `DERIVED`
- `ESTIMATED`
- `MANUFACTURER_RATED`

### 12.3 Benchmark normalization

Benchmark results are stored with enough context to avoid comparing unlike runs:

- benchmark/version
- workload preset
- OS where relevant
- CPU/GPU/RAM configuration
- resolution/settings
- driver/version when available
- source
- result unit

An estimate engine may interpolate between known results but must expose uncertainty.

### 12.4 Bottleneck language

Avoid simplistic "X% bottleneck" scores that imply fake precision.

Instead explain workload constraints:

```text
1440p gaming: primarily GPU-limited in selected workload set
Blender GPU render: strong
Local LLM: limited by 8 GB VRAM
VM profile: memory capacity is the first constraint
```

## 13. Power and electricity engine

Power output includes:

- idle
- typical workload
- peak
- transient allowance where relevant
- estimated wall power

### 13.1 Component profiles

Where possible, components store multiple power observations rather than relying only on TDP/TBP.

### 13.2 PSU efficiency

Wall power estimation uses PSU efficiency curves or an appropriately labeled approximation.

### 13.3 Homelab cost

For 24/7 systems, the user can provide electricity cost and duty cycle.

The product can calculate:

```text
annual kWh
annual electricity cost
multi-year energy cost
```

This enables optimization by total ownership cost instead of purchase price alone.

## 14. Thermal, airflow, and noise estimation

HowToPC can provide useful engineering estimates but must not pretend a simplified browser model is CFD or a calibrated acoustic lab.

### 14.1 Inputs

- CPU/GPU heat estimate
- fan sizes and quantities
- fan airflow/static-pressure data where available
- fan RPM
- radiator configuration
- case intake/exhaust configuration
- major obstruction geometry
- ambient temperature assumption

### 14.2 Outputs

- intake vs exhaust balance
- qualitative airflow path
- thermal risk warning
- cooling headroom estimate
- approximate acoustic/noise category

### 14.3 3D visualization

The viewer may show airflow arrows/path hints derived from configured fan orientations. They are explanatory visualization, not a claim of solved fluid dynamics.

## 15. Homelab planner

Homelab mode starts with services and requirements rather than components.

### 15.1 Workload definition

A workload can specify:

- cores/threads target
- RAM minimum/recommended
- storage capacity
- storage performance
- redundancy target
- GPU/iGPU/transcoding need
- network bandwidth
- PCIe expansion requirements
- availability/uptime importance
- expected growth

### 15.2 Virtualization capacity

The planner estimates whether the configured host can support the workload mix with configurable oversubscription assumptions.

It must distinguish hard constraints from operator preferences.

### 15.3 Storage topology

Storage planning checks:

- physical bays
- SATA/SAS/NVMe connectivity
- motherboard ports
- HBA/controller needs
- PCIe slots and lanes
- power connectors
- estimated spin-up load
- airflow around drives

Later phases can add RAID/ZFS layout and usable/redundant capacity modeling.

### 15.4 Networking

MVP networking reasoning includes:

- onboard NICs
- add-in NIC compatibility
- physical slot/lane requirements
- requested throughput

Future versions can extend to switch, transceiver, cable, VLAN, and rack topology planning.

## 16. WebMCP design

WebMCP is a progressive enhancement over the same domain application.

Current Chrome documentation describes WebMCP as a proposed standard/origin-trial technology for websites to register structured tools with agents. The architecture must therefore isolate WebMCP behind an adapter so changes to the experimental API cannot affect core build logic.

### 16.1 Tool strategy

Tools expose domain actions, never UI mechanics.

Initial tool set:

```text
get_build
search_components
inspect_component
add_component
remove_component
replace_component
set_build_goals
set_workloads
check_compatibility
inspect_clearances
analyze_build
estimate_power
estimate_performance
compare_components
compare_builds
optimize_build
suggest_upgrade
```

### 16.2 Shared command path

```text
Human UI ───────┐
                ├── Domain command ──> validation/compatibility ──> build state
WebMCP tool ────┘
```

There must not be an "agent-only" mutation implementation.

### 16.3 Tool contracts

Each tool has:

- narrow purpose
- Zod/JSON Schema input validation
- typed result
- stable error codes
- read-only annotation where appropriate
- mutation classification

### 16.4 Structured failures

Example:

```json
{
  "success": false,
  "code": "PHYSICAL_COLLISION",
  "componentId": "gpu-x",
  "conflictWith": "front-radiator-y",
  "requiredClearanceMm": 338,
  "availableClearanceMm": 316,
  "remediations": ["TOP_MOUNT_RADIATOR", "SHORTER_GPU", "DIFFERENT_CASE"]
}
```

This enables an agent to recover without guessing.

### 16.5 Security

WebMCP is used inside authenticated browser sessions and must be treated as a security-sensitive interface.

HowToPC adopts these principles:

- catalog/retailer text returned to agents is untrusted data, never instructions
- tools are origin-scoped
- all inputs are schema validated
- tools do not accept arbitrary executable code or URLs
- destructive/account-impacting actions require explicit user confirmation
- state-changing tools are clearly marked
- read-only tools are explicitly annotated
- third-party descriptions are sanitized/minimized in tool outputs
- sensitive tokens/credentials are never returned through WebMCP
- rate limits apply independently of UI access

The builder itself mostly performs reversible build-state mutations, but future purchasing or account actions must have a separate confirmation barrier.

### 16.6 WebMCP evals

Testing includes both deterministic integration tests and probabilistic WebMCP evals for:

- correct tool selection
- correct arguments
- multi-tool journeys
- handling incompatible parts
- optimization requests
- ambiguous user requests
- refusal to invent unknown compatibility facts

## 17. User experience

### 17.1 Main builder layout

Desktop composition:

```text
┌─────────────────────────────────────────────────────────────┐
│ Build name      price      power      compatibility         │
├───────────────┬─────────────────────────┬───────────────────┤
│ Catalog       │                         │ Build / Analysis  │
│ / categories  │      LIVE 3D            │ selected parts    │
│ / filters     │     DIGITAL TWIN        │ warnings          │
│               │                         │ workload results  │
├───────────────┴─────────────────────────┴───────────────────┤
│ Compatibility | Performance | Power | Prices | Workloads    │
└─────────────────────────────────────────────────────────────┘
```

Mobile/tablet layouts reflow around the same builder state rather than loading a separate experience.

### 17.2 Catalog compatibility filtering

Default:

```text
Show compatible and verified candidates
```

A user can enable incompatible/unknown results for learning or deliberate experimentation.

Filtered products should display reason codes when excluded.

### 17.3 3D controls

- orbit
- pan
- zoom
- transparent case / side-panel removal
- exploded view
- isolate component
- select component
- measurement tool
- highlight mounts
- highlight collision
- airflow visualization
- geometry confidence indicator

Clicking a 3D component selects the corresponding build item.

### 17.4 Compatibility explanations

Do not show only icons.

Example:

```text
INCOMPATIBLE
GPU requires 338 mm of effective front clearance.
Current front radiator + fans leave 316 mm.

Options:
- move radiator to top
- choose a GPU <= 316 mm
- change case
```

### 17.5 Confidence UI

Important fields may display evidence quality:

```text
304 mm GPU length
Verified from manufacturer specification
```

or:

```text
Top radiator / RAM clearance
Not verified for this case + motherboard combination
```

## 18. Optimization engine

Optimization is implemented in HowToPC, not improvised by an LLM.

Supported objective dimensions include:

- total purchase cost
- gaming/workload performance
- power consumption
- 24/7 ownership cost
- acoustic priority
- size
- upgradeability

### 18.1 Constraint model

An optimization request includes hard constraints and weighted preferences.

Example:

```text
hard:
  budget <= EUR 1500
  1440p target performance >= baseline * 0.95
  case <= ATX mid tower

soft:
  noise = high priority
  upgradeability = medium priority
```

### 18.2 Deterministic candidate validation

Every optimizer candidate is passed through the same compatibility engine. The optimizer cannot select a candidate whose result is incompatible, and it must report unknown critical fit if evidence is incomplete.

## 19. Technology stack

### 19.1 Language and application framework

- TypeScript
- Next.js
- React
- Next.js App Router

Reasons:

- product/catalog pages benefit from server rendering
- builder can use client-side React state
- server routes/actions support ingestion-facing/application APIs
- one deployable web application is appropriate for the hackathon

### 19.2 UI

- Tailwind CSS
- shadcn/ui

### 19.3 3D

- Three.js
- React Three Fiber
- Drei
- three-mesh-bvh

### 19.4 Client state/data

- Zustand for live builder session state
- TanStack Query for remote catalog/query caching

### 19.5 Validation

- Zod
- JSON Schema generation/definitions where required by WebMCP

### 19.6 Database

- PostgreSQL
- Supabase hosting
- Drizzle ORM

### 19.7 Authentication

- Supabase Auth

Authentication is not required for the basic public demo flow; anonymous/local builds should work. Accounts enable saved builds and user history.

### 19.8 Object storage

- Cloudflare R2 for GLB and texture assets

### 19.9 Search

Initial:

- PostgreSQL full-text search
- `pg_trgm`

Do not introduce Elasticsearch/OpenSearch for MVP-scale data unless measured search performance requires it.

Potential later replacement/addition: Typesense.

### 19.10 Asset tooling

- Blender
- glTF / GLB
- glTF Transform
- Meshopt compression
- KTX2 texture compression

### 19.11 Testing

- Vitest
- fast-check for property-based compatibility tests
- Playwright for application journeys
- WebMCP eval tooling for probabilistic agent/tool tests

### 19.12 CI/CD

- GitHub Actions
- Vercel deployment

## 20. Repository structure

Initial repository structure:

```text
HowToPC/
├── apps/
│   └── web/
├── packages/
│   ├── domain/
│   ├── db/
│   ├── catalog/
│   ├── compatibility/
│   ├── geometry/
│   ├── calculations/
│   ├── webmcp/
│   └── shared/
├── scripts/
│   └── ingestion/
├── assets/
│   └── source/
├── docs/
│   ├── architecture/
│   ├── data/
│   └── superpowers/
└── .github/
    └── workflows/
```

This is a single repository and initially a single deployed product. Do not create microservices prematurely.

### 20.1 Package boundaries

`domain`

- Build, BuildItem, goals, workloads, common result types
- pure TypeScript domain types/operations
- no React, DB, or WebMCP dependency

`catalog`

- product/category schemas
- product search contracts
- identifiers and source observations

`compatibility`

- deterministic rule engine
- compatibility report
- no UI dependency

`geometry`

- anchors
- mounts
- transforms
- collision/clearance checks

`calculations`

- power
- electricity cost
- performance estimators
- thermals/noise
- homelab capacity

`webmcp`

- maps WebMCP tools to domain operations
- API-specific feature detection and registration

`db`

- Drizzle schema
- repositories/query implementations

`shared`

- narrow utilities shared across packages

## 21. Testing strategy

Compatibility correctness is safety-critical to product trust and receives disproportionate testing effort.

### 21.1 Unit tests

Rule-level examples include:

- AM4 CPU + AM5 board => incompatible
- DDR4 kit + DDR5-only board => incompatible
- EATX board + ITX-only case => incompatible
- 355 mm GPU + 327 mm effective corridor => incompatible
- ATX PSU + SFX-only case => incompatible
- 180 mm air cooler + 160 mm clearance => incompatible
- required 12V-2x6 connector missing => incompatible
- CPU requiring later BIOS => warning

### 21.2 Property-based tests

fast-check generates broad combinations around invariants, for example:

- a motherboard supporting only DDR5 can never return compatible for DDR4 memory
- decreasing effective GPU clearance cannot turn an incompatible too-long GPU into compatible
- removing a required PSU connector cannot improve compatibility
- a valid mount transform preserves the component's anchor alignment within tolerance

### 21.3 Geometry tests

Curated fixtures test:

- GPU/radiator collision
- RAM/tower cooler collision
- PSU/cage collision
- top radiator/VRM collision
- non-collision when clearance is positive

### 21.4 Data tests

- source identifiers round-trip
- unit normalization
- duplicate detection
- rights gate prevents blocked assets from publication
- conflicting source observations are preserved

### 21.5 End-to-end tests

Playwright journeys include:

- build a compatible PC manually
- intentionally choose incompatible part and see explanation
- create homelab workload and obtain capacity result
- save/load build when authenticated
- use 3D selection to select build item

### 21.6 WebMCP evals

Prompts include direct and ambiguous requests such as:

- "Build a quiet 1440p PC under €1500."
- "Make this €100 cheaper without losing more than 5% gaming performance."
- "Add a 360 mm radiator." when it conflicts with a GPU
- "I need Plex + TrueNAS + 4 VMs at low idle power."

Success requires appropriate tool calls, correct handling of incompatibility, and no invented facts for unknown clearances.

## 22. MVP dataset strategy

The architecture supports a large catalog, while the hackathon demonstration uses a curated mechanically rich subset.

Target structured product breadth:

- CPUs: 30–50
- GPUs: 30–50
- motherboards: 15–25
- RAM: 15–25
- cases: 8–12
- PSUs: 15–20
- coolers: 10–15
- fans: 8–10
- storage: 20–30
- homelab/network/storage extras: 15–30

Target high-quality mechanical assets: roughly 25–35 parts covering meaningful variation.

Choose assets to exercise the engine rather than maximize count:

- Mini-ITX, mATX, compact ATX, normal ATX, large case
- short dual-slot, normal, thick 3-slot, very long GPU
- tower cooler, 240/280/360 AIO
- multiple motherboard formats
- ATX and SFX PSU

Other catalog products can use Tier B/C models if exact dimensions exist.

## 23. Hackathon execution roadmap

### Phase 1 — foundation

- initialize workspace and application
- configure TypeScript, linting, testing, CI
- configure Supabase/Postgres
- configure Vercel preview/production deployment
- establish domain package boundaries

Production deployment exists from the beginning rather than the final day.

### Phase 2 — canonical product model and ingestion

- implement product identity/provenance schemas
- import curated BuildCores OpenDB subset under ODC-By attribution
- seed source/license metadata
- implement search/filtering

### Phase 3 — deterministic compatibility

Implement and heavily test the first core rules:

- CPU ↔ motherboard
- RAM ↔ motherboard
- motherboard ↔ case
- GPU ↔ case
- GPU ↔ PSU
- PSU ↔ case
- cooler ↔ CPU/case
- storage ↔ motherboard

### Phase 4 — mechanical schema

Implement:

- anchors
- mounts
- collision volumes
- keep-out zones
- transforms

Encode one complete case and its relevant part placements.

### Phase 5 — one complete digital-twin build

Build one known configuration end-to-end:

- case
- motherboard
- CPU
- RAM
- GPU
- PSU
- cooler
- fans
- SSD

Acceptance: all parts are real-scale, anchor-mounted, rendered, and collision checked using shared mechanical data.

### Phase 6 — generalize geometry

Add additional cases/form factors/GPU sizes and at least one AIO configuration to prove the system is data-driven instead of hardcoded to the first machine.

### Phase 7 — builder UX

- component catalog
- compatibility-aware filters
- build list
- 3D digital twin
- compatibility explanations
- analysis tabs

### Phase 8 — calculations

- total/recent price snapshot
- idle/typical/peak power estimate
- PSU headroom
- annual electricity calculation
- initial workload performance model

### Phase 9 — homelab workflow

- workload profiles
- RAM/compute/storage requirements
- storage connectivity checks
- networking/HBA expansion checks

### Phase 10 — WebMCP adapter

Register the stable domain operations as tools after the human UI path works.

### Phase 11 — deterministic optimization

Implement initial optimization objectives:

- budget
- power
- performance preservation
- quiet preference
- upgradeability

### Phase 12 — polish/evals/submission

- WebMCP evals
- security checks
- production test
- clear README/testing instructions
- demo flow
- source/license notices
- public repository/open-source license before Devpost submission

## 24. Hackathon demonstration narrative

Primary demo:

1. User asks the agent for a quiet ~€1,400–€1,500 1440p gaming PC with upgradeability.
2. Agent invokes WebMCP build/search/add tools.
3. The 3D machine visibly assembles as domain state changes.
4. Compatibility and price/power analysis update live.
5. User asks for a 360 mm front radiator.
6. Engine detects that the configured GPU/radiator stack has insufficient physical clearance.
7. WebMCP returns structured failure plus remediations.
8. Agent moves the radiator to a compatible top mount or chooses another allowed remediation.
9. User asks to reduce cost while preserving at least 95% of estimated gaming performance.
10. Deterministic optimizer proposes and applies compatible substitutions.

Optional homelab segment:

- configure Proxmox + Plex + TrueNAS + several VMs
- show memory/storage/NIC/PCIe and 24/7 power implications

## 25. Security and trust boundaries

### 25.1 Untrusted external data

Retailer titles, descriptions, community notes, imported text, and third-party metadata are data, not instructions.

They must be sanitized and minimized before appearing in agent-visible tool output.

### 25.2 User-facing engineering claims

Every estimate has a type/confidence. The interface avoids unsupported precision.

Examples:

- exact verified geometry: can state measured clearance
- modeled energy estimate: state estimate and assumptions
- sparse benchmark interpolation: state range/uncertainty
- missing geometry: state unknown

### 25.3 Reversible agent actions

Build edits are reversible and should support undo/history.

Future high-impact actions such as purchasing or sharing sensitive information are explicitly outside the initial WebMCP tool set.

## 26. Licensing plan

Before Devpost submission the source repository must become public and contain a visible open-source license.

Recommended application code license: Apache-2.0.

Data/assets remain separately governed.

Required repository documents before submission:

- `LICENSE` for code
- `NOTICE` for required attributions
- `DATA_LICENSES.md` for imported datasets
- `ASSET_LICENSES.md` for 3D/textures/media

BuildCores OpenDB-derived data must retain ODC-By attribution/notice requirements.

Do not represent HowToPC's independently created 3D assets as derived from BuildCores proprietary 3D models.

## 27. Architecture diagram

```text
                     ┌────────────────────────┐
                     │ Manufacturer evidence  │
                     └───────────┬────────────┘
                                 │
 BuildCores OpenDB ──────────────┤
 Icecat/authorized feeds ────────┤
 Retailer APIs ──────────────────┤
 Benchmark providers ────────────┤
                                 ▼
                       ┌──────────────────┐
                       │ INGESTION / QA   │
                       │ identity/rights  │
                       └─────────┬────────┘
                                 ▼
                       ┌──────────────────┐
                       │ CANONICAL CATALOG│
                       │ + provenance     │
                       └─────────┬────────┘
                                 │
              ┌──────────────────┼───────────────────┐
              ▼                  ▼                   ▼
      COMPATIBILITY           GEOMETRY          CALCULATIONS
          ENGINE               ENGINE               ENGINE
              │                  │                   │
              └───────────┬──────┴──────────┬────────┘
                          ▼                 ▼
                    BUILD DOMAIN       3D DIGITAL TWIN
                          │                 │
                          └────────┬────────┘
                                   ▼
                              HOWTOPC UI
                                   ▲
                                   │
                                WebMCP
                                   ▲
                                   │
                               AI AGENT
```

## 28. Source/research references used for this design

- BuildCores OpenDB repository and schemas: https://github.com/buildcores/buildcores-open-db
- BuildCores FAQ/3D asset limitation: https://www.buildcores.com/faq
- Icecat content subscription/catalog information: https://icecat.com/content-subscription/
- Icecat structured product content overview: https://icecat.com/
- Chrome WebMCP overview: https://developer.chrome.com/docs/ai/webmcp
- Chrome WebMCP Imperative API: https://developer.chrome.com/docs/ai/webmcp/imperative-api
- Chrome WebMCP eval guidance: https://developer.chrome.com/docs/ai/webmcp/evals
- Chrome WebMCP tool security: https://developer.chrome.com/docs/ai/webmcp/secure-tools
- eBay Browse API documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html

## 29. Design decisions locked by this specification

1. MVP is PC + homelab, not laptop internals.
2. Next.js/React/TypeScript is the application stack.
3. PostgreSQL/Supabase + Drizzle owns canonical product/application data.
4. React Three Fiber/Three.js is the 3D stack.
5. Real dimensions are stored in millimetres and shared by compatibility and rendering.
6. Mechanical placement uses anchors/mounts instead of hardcoded per-build coordinates.
7. Compatibility has `COMPATIBLE`, `INCOMPATIBLE`, `WARNING`, and `UNKNOWN` states.
8. WebMCP is an adapter over stable domain commands, not a second implementation.
9. BuildCores OpenDB may seed product facts under its open-data license; BuildCores proprietary 3D assets are not reused.
10. External data enters as observations with provenance and licensing metadata.
11. Price/stock is separated from product identity/specification.
12. Homelab workloads and resource topology are first-class domain concepts.
13. Performance/power/thermal outputs expose evidence/estimate type instead of fake precision.
14. The hackathon proves architecture with a curated high-quality subset rather than pretending to have mechanically verified every product.
15. Code, data, and 3D/media assets have separate licensing/attribution documents.

---

This document is the architecture baseline. Implementation plans should decompose it into independently testable subsystem plans rather than attempting to build the entire architecture as one task.