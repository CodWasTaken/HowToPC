# HowToPC

HowToPC is an engineering-grade, agent-native PC and homelab configurator built around a real-scale 3D digital twin, deterministic compatibility analysis, and WebMCP tools that let an AI agent design and modify the same machine the human user sees.

The current repository is intentionally documentation-first while the architecture is locked before implementation.

## Core thesis

> Agents should not merely recommend PC parts in chat. They should be able to engineer the actual computer.

The product is designed so that compatibility, mechanical geometry, electrical/resource topology, workload requirements, pricing, power, and performance all describe the same build state. The human UI and WebMCP use the same domain commands and validation path.

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

## Chosen stack

- TypeScript
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

Architecture and risk review are documented. Implementation has not started yet.