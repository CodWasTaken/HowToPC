# Native WebMCP Verification — 2026-08-29

## Scope

This verification covers the production WebMCP surface implemented on `chatgpt/ux-redesign` before screenshot work.

The site exposes exactly ten stable tools through `document.modelContext`:

- `builder_get_state`
- `catalog_search`
- `catalog_inspect_product`
- `builder_add_product`
- `builder_remove_product`
- `builder_replace_product`
- `builder_compatibility_report`
- `builder_resource_usage`
- `builder_geometry_diagnostics`
- `builder_find_compatible`

Tools register once and read the latest live `BuilderSession`; agent mutations and human UI mutations share the same state and deterministic compatibility path.
## Native browser evidence

Verification used headed Brave 151 with the current WebMCP testing flags against a fresh production Next.js build. No injected `document.modelContext` shim was used.

Native browser checks reported:

- `document.modelContext` present.
- `navigator.modelContextTesting` present.
- `window.originAgentCluster === true`.
- UI WebMCP status `registered`.
- `document.modelContext.getTools()` returned exactly 10 tools with the approved names, titles, schemas, and annotations.
- Every one of the ten tools was executed through native `document.modelContext.executeTool`.
- A `toolchange` listener recorded 0 events across all human and agent build edits; tool count remained 10.

Native WebMCP consumer input was passed as serialized JSON and tool results were parsed from the browser's serialized JSON return value.
## Shared-state and safety scenario

- Agent added sourced case `buildcores-104a508d-19cd-499d-896e-c5855ef4e338`; the visible Build UI updated and WebMCP state retained it.
- Human clicked `AMD Ryzen 7 7700X3D` in Parts; the next native `builder_get_state` immediately contained that CPU and the case.
- Catalog search returned ASUS ROG Astral RTX 5090 (357.6 mm) as `BLOCKED_INCOMPATIBLE` against the case's 280 mm GPU clearance.
- Native `builder_add_product` rejected that GPU with `CHANGE_REJECTED`, decision `BLOCKED_INCOMPATIBLE`, and the same clearance reason; build state stayed unchanged.
- `builder_find_compatible` returned only `CAN_APPLY` RTX 5090 candidates for the live build.
- Agent added MSI RTX 5090 LIGHTNING Z (260 mm); Twin diagnostics reported GPU clearance 260 / 280 mm, +20 mm, PASS.
- Resource usage reported one GPU PCIe/general PCIe consumer while motherboard capacities correctly remained unknown.
- Geometry returned explicit `NO_MOUNT` placement issues where topology was not known rather than guessing coordinates.
## Final repository gate

After native browser verification:

- `pnpm typecheck` passed for all workspace projects.
- `pnpm test` passed: 50 test files, 171 tests.
- `pnpm build` passed with Next.js 16.3.3.
- `git diff --check` passed.

The isolated Brave profile and temporary verification server were stopped after the native run.
