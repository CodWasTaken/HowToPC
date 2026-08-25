# HowToPC

HowToPC is an engineering-grade, agent-native PC and homelab configurator built around a real-scale 3D digital twin, deterministic compatibility analysis, and WebMCP tools that let an AI agent design and modify the same machine the human user sees.

The repository is documentation-first while architecture and implementation boundaries are locked before Codex begins building.

## Core thesis

> Agents should not merely recommend PC parts in chat. They should be able to engineer the actual computer.

Compatibility, mechanical geometry, electrical/resource topology, workload requirements, pricing, power, and performance all describe the same build state. The human UI and WebMCP use the same domain commands and validation path.

## MVP

The hackathon MVP targets:

- desktop PC building
- homelab/NAS/server planning
- dimensionally accurate 3D placement
- compatibility with explicit `COMPATIBLE`, `INCOMPATIBLE`, `WARNING`, and `UNKNOWN` states
- WebMCP-driven agent building and optimization
- curated mechanically verified parts plus a broader specification-level catalog

## Architecture documents

1. [Full product and architecture design](docs/superpowers/specs/2026-08-26-howtopc-architecture-design.md)
2. [Adversarial architecture review and normative resolutions](docs/superpowers/specs/2026-08-26-howtopc-adversarial-review.md)

The adversarial review is normative where it introduces stricter requirements than the baseline design. It covers geometry uncertainty, installation paths, data licensing, product revisions, resource-sharing rules, optimizer scalability, WebMCP safety, browser performance, benchmark/power uncertainty, pricing freshness, and hackathon scope control.

## Codex implementation handoff

Start with the [Codex execution and GPT-5.6 Sol effort guide](docs/CODEX_EXECUTION_GUIDE.md). It numbers all implementation work from Task 1 through Task 60 and recommends Low, Medium, or High reasoning effort for each task to conserve limited Codex usage.

Codex should execute one bounded task at a time, run the verification required by that task, commit it, and stop before beginning the next task.

### Implementation plans

1. [Foundation, domain, and catalog](docs/superpowers/plans/2026-08-26-01-foundation-domain-catalog.md)
2. [Compatibility and resource engine](docs/superpowers/plans/2026-08-26-02-compatibility-resource-engine.md)
3. [Mechanical geometry and 3D digital twin](docs/superpowers/plans/2026-08-26-03-mechanical-geometry-3d.md)
4. [Calculations, homelab, and optimization](docs/superpowers/plans/2026-08-26-04-calculations-homelab-optimization.md)
5. [Builder UI](docs/superpowers/plans/2026-08-26-05-builder-ui.md)
6. [WebMCP and agent integration](docs/superpowers/plans/2026-08-26-06-webmcp-agent-integration.md)
7. [Data ingestion, pricing, and data quality](docs/superpowers/plans/2026-08-26-07-ingestion-pricing-data-quality.md)
8. [Integration, verification, deployment, and demo](docs/superpowers/plans/2026-08-26-08-integration-verification-deployment-demo.md)

## Chosen stack

- TypeScript
- pnpm workspace
- Next.js + React
- Tailwind CSS + shadcn/ui
- Three.js + React Three Fiber + Drei + three-mesh-bvh
- Zustand + TanStack Query
- Zod
- PostgreSQL on Supabase
- Drizzle ORM
- Cloudflare R2 for 3D assets
- Blender + glTF/GLB asset pipeline
- Vitest + fast-check + Playwright + WebMCP evals
- GitHub Actions + Vercel

## Data strategy

HowToPC owns a canonical product model with source provenance and rights metadata. External sources are observations rather than the internal schema.

BuildCores OpenDB is planned as a major seed/enrichment source under its ODC-By license. Its proprietary 3D assets are not reused. Other sources such as manufacturer evidence, authorized Icecat content, retailer APIs, and benchmark providers are isolated behind adapters and rights/quality gates.

## Current state

Architecture, adversarial risk review, subsystem implementation plans, and the Codex effort/execution guide are documented. Application implementation has not started yet; Codex should begin with Task 1 in `docs/CODEX_EXECUTION_GUIDE.md`.
