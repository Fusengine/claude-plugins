# Agents

41 specialized agents across all plugins.

## Core Agents (fuse-ai-pilot)

| Agent | Description |
|-------|-------------|
| `sniper` | 7-phase code validation, DRY detection, zero linter errors |
| `sniper-faster` | Quick validation, minimal output |
| `skill-creator` | Scaffolds/restructures/repairs SKILL.md + references/ structure |
| `explore-codebase` | Architecture discovery, patterns |
| `research-expert` | Documentation with Context7/Exa |
| `websearch` | Quick web research |
| `seo-expert` | SEO/SEA/GEO optimization |
| `brainstorming` | Requirements refinement for new features, before Analyze |
| `challenger` | Challenges root-cause, done and irreversible-action claims (consultative verdict) |
| `commit` | WIP commits and the end-of-mandate release flow |

## Framework Experts

| Agent | Plugin | Description |
|-------|--------|-------------|
| `nextjs-expert` | fuse-nextjs | Next.js 16+, App Router, Prisma 7 |
| `astro-expert` | fuse-astro | Astro 7, content sites, islands, Starlight |
| `go-expert` | fuse-go | Go services, concurrency, tooling |
| `php-expert` | fuse-php | Non-Laravel PHP 8.1+, PSR, quality tooling |
| `rust-expert` | fuse-rust | Rust 2024, async, axum, Cargo tooling |
| `tanstack-start-expert` | fuse-tanstack-start | TanStack Start, server functions, middleware |
| `typescript-expert` | fuse-typescript | Framework-less TypeScript, tsconfig, Bun/Node runtimes |
| `laravel-expert` | fuse-laravel | Laravel 12+, Livewire, Eloquent |
| `react-expert` | fuse-react | React 19, hooks, TanStack |
| `swift-expert` | fuse-swift-apple-expert | Swift/SwiftUI, all Apple platforms |
| `tailwindcss-expert` | fuse-tailwindcss | Tailwind CSS v4.1 |
| `design-expert` | fuse-design | UI/UX, shadcn/ui, 21st.dev |
| `shadcn-ui-expert` | fuse-shadcn-ui | shadcn/ui, Radix/Base UI detection |
| `prompt-engineer` | fuse-prompt-engineer | Prompt creation & optimization |
| `security-expert` | fuse-security | OWASP Top 10, CVE research, dependency audit |
| `motion-expert` | fuse-motion | Product motion films and ads: brief, beat map, G0 art direction (sketches, blind tone lock, board, look.md + key frames), HTML scene, mp4/GIF render |
| `motion-critic` | fuse-motion | Blind motion reviewer (writes only review-pack frames; write sandbox enforced by the harness `motion` scope): frame-based PASS / REVISE / FAIL / UNCERTAIN verdict |
| `hermes-expert` | fuse-hermes | Nous Research Hermes Agent: deploy a chief-of-staff system from a free-form company description over SSH (dry-run, apply after one go, verify); configure, audit, upgrade installs (config.yaml, SOUL.md, profiles, delegation, cron, gateways, security) |

## SEO Agents

| Agent | Plugin | Description |
|-------|--------|-------------|
| `seo-cluster` | fuse-seo | Keyword clusters from SERP overlap |
| `seo-content` | fuse-seo | E-E-A-T scoring, cannibalization, keyword distribution |
| `seo-geo` | fuse-seo | LLM-readiness for AI Overviews, ChatGPT, Perplexity |
| `seo-images` | fuse-seo | Alt text, formats, lazy loading, responsive sizing |
| `seo-local` | fuse-seo | Google Business Profile, NAP, Local Pack |
| `seo-schema` | fuse-seo | Structured data detection, validation, generation |
| `seo-sitemap` | fuse-seo | sitemap.xml and robots.txt analysis/generation |
| `seo-technical` | fuse-seo | robots.txt, Core Web Vitals, crawlability, indexability |

## Monitoring Agents

| Agent | Plugin | Description |
|-------|--------|-------------|
| `changelog-watcher` | fuse-changelog | Claude Code update tracking, breaking changes, community pulse |

## Utility Agents

| Agent | Plugin | Description |
|-------|--------|-------------|
| `commit-detector` | fuse-commit-pro | Detect optimal commit type |
| `solid-orchestrator` | fuse-solid | SOLID validation across languages |
| `cartographer` | fuse-cartographer | Ecosystem map of plugins, agents, skills |
| `lessons-compactor` | fuse-lessons | Dedupe and compact MEMORY/LESSON.md |

## Agent Teams

Agents can work in parallel via `TeamCreate` with separate context windows. The lead delegates tasks with exclusive file ownership per teammate.

See [Agent Teams](agent-teams.md) for delegation rules, anti-patterns, and examples.

## Usage

Agents are launched automatically based on project detection, or manually:

```
User: "Use nextjs-expert to fix the routing"
```

Or via Task tool:
```typescript
Task({
  subagent_type: "fuse-nextjs:nextjs-expert",
  prompt: "Fix the routing issue"
})
```
