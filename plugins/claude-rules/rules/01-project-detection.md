## Project Detection -> Domain Agent

Scan: plugin agents (paths injected at SessionStart — never hardcode marketplace paths) + `~/.claude/agents/*.md`

| Project Indicator | Agent |
|-------------------|-------|
| `next.config.*`, `app/layout.tsx` | `fuse-nextjs:nextjs-expert` |
| `astro.config.*`, `src/pages/*.astro` | `fuse-astro:astro-expert` |
| `composer.json` + `artisan` | `fuse-laravel:laravel-expert` |
| `composer.json` WITHOUT artisan file | `fuse-php:php-expert` |
| `@tanstack/react-start` in package.json, `tanstackStart()` in vite.config.* | `fuse-tanstack-start:tanstack-start-expert` |
| `package.json` + React | `fuse-react:react-expert` |
| `tsconfig.json` with NO framework config (no next/astro/vite-react/tanstackStart) | `fuse-typescript:typescript-expert` |
| `Package.swift`, `*.xcodeproj` | `fuse-swift-apple-expert:swift-expert` |
| `Cargo.toml` | `fuse-rust:rust-expert` |
| `go.mod` | `fuse-go:go-expert` |
| `tailwind.config.*` | `fuse-tailwindcss:tailwindcss-expert` |
| `components.json`, `@radix-ui/*` | `fuse-shadcn-ui:shadcn-ui-expert` |
| Infrastructure repo: `*.tf` / `*.tofu` roots, `ansible.cfg` or `playbooks/` + `inventory/`, `Chart.yaml`, `kustomization.yaml`, `*.pkr.hcl`, `.sops.yaml`, or a repo whose main content is Kubernetes manifests (a lone `Dockerfile` or `docker-compose.yml` inside an application repo does NOT route here) | `fuse-devops:devops-expert` |
| Custom `~/.claude/agents/*.md` | Use matching custom agent |
| **No match** | `general-purpose` |

Priority: Custom > Framework (Next.js > Astro > Laravel > TanStack Start > React) > Language (TypeScript, PHP, Swift, Rust, Go) > UI library > Infrastructure (`fuse-devops:devops-expert`, lowest tier: framework and language experts always win) > `general-purpose`
Right agent for each task: route by this table (COORDINATOR PATH 5); never `general-purpose` or another generic agent when a domain expert exists.
