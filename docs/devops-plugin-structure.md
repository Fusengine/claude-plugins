# New expert plugin checklist (basis for `plugins/devops-expert`, marketplace `fuse-devops`)

Read-only exploration, 2026-11-10. Models: `plugins/go-expert` (fuse-go), `plugins/rust-expert` (fuse-rust), `plugins/hermes-expert` (fuse-hermes, non-language). Evidence: `git show --stat 8c2f9bc9` (added go/rust/typescript/php/tanstack-start, 2026-07) and `git show --stat 556b2657` (added hermes), plus a repo-wide grep for `fuse-go`, `fuse-rust`, `fuse-hermes`.

Baseline measured today (branch `docs/skills-index-agentic-security`): 27 plugins in `.claude-plugin/marketplace.json` (`grep -c '"source": "./plugins/'` = 27, plus 2 `core` entries), 41 agent files (`ls plugins/*/agents/*.md`), 218 `SKILL.md` (`ls plugins/*/skills/*/SKILL.md`). `bun test` = 384 pass / 0 fail; `scripts/validate-agents.sh` = no critical error; `bunx tsc --noEmit` in `scripts/` = exit 0.

## 1. File tree of a complete expert plugin

```
plugins/devops-expert/
├── .claude-plugin/plugin.json          # manifest (14 lines in go/rust, 25 in hermes)
├── README.md                           # 45-57 lines
├── agents/devops-expert.md             # one agent file, 85-112 lines
├── hooks/hooks.json                    # identical in go/rust/hermes (30 lines)
└── skills/<skill-name>/
    ├── SKILL.md                        # 80-150 lines
    ├── .gitkeep                        # go/rust only (hermes has none); optional
    └── references/
        ├── <topic>.md                  # 95-120 lines each
        └── templates/<name>.md|.yaml   # copy-paste templates
```
Real examples: `plugins/go-expert/skills/go-tooling-security/{SKILL.md, references/{go-fix-modernizers,govulncheck,modules-workspaces,golangci-lint-v2}.md, references/templates/{ci-workflow,golangci-v2-config}.md}`; `plugins/hermes-expert/skills/hermes-deploy/references/{apply-verify-rollback,company-tree,doc-to-profile,dry-run,ssh-discovery}.md` + `templates/{distribution.yaml,MEMORY.seed.md,A-COMPLETER.md}`. Skill folders: go 5, rust 7, hermes 13. A plugin has NO `package.json` (the 8c2f9bc9 commit deleted the per-plugin ones; one shared `plugins/package.json` installs `@fusengine/harness`).

### 1.1 `.claude-plugin/plugin.json` (exact fields, `plugins/go-expert/.claude-plugin/plugin.json`)
`name` (marketplace id, `fuse-<x>`), `version` ("1.0.x"), `description`, `author {name:"Fusengine", email:"hello@fusengine.ch", url:"https://github.com/fusengine"}`, `homepage` and `repository` = `https://github.com/fusengine/agents`, `license:"MIT"`, `keywords[]` (go: 10, hermes: 10). The marketplace entry duplicates it (see 2.1), minus `email`.

### 1.2 Agent frontmatter (`plugins/go-expert/agents/go-expert.md:1-8`)
Fields actually used across all 41 agents (`grep` on `agents/*.md`): `name` (41), `description` (41), `model` (41), `effort` (41), `color` (41), `tools` (41), `skills` (39). Never used: `hooks`, `memory`, `maxTurns`, `permissionMode`, `disallowedTools`, `isolation`, `background`.
- `name: go-expert` (= file name).
- `description: "Use when: go.mod present. Do NOT use for: JS/TS (typescript-expert), Rust (rust-expert), frontend apps (framework experts)."` Language experts: one short line, double-quoted. Hermes (non-language) uses a long "Use when: ... Do NOT use for: ..." (`plugins/hermes-expert/agents/hermes-expert.md:3`). Skills use an unquoted "Use when ... Not for ..." (`plugins/go-expert/skills/go-tooling-security/SKILL.md:3`).
- `model: sonnet`, `effort: medium` (go, rust, typescript, hermes; `docs/decisions.md` 2026-11-09: executors on sonnet). `color:` go=cyan, rust=orange, hermes=magenta (pick an unused one).
- `tools:` (identical in go/rust/hermes): `Read, Edit, Write, Bash, Grep, Glob, Agent, Skill, mcp__context7__resolve-library-id, mcp__context7__query-docs, mcp__exa__web_search_exa, mcp__exa__get_code_context_exa, mcp__sequential-thinking__sequentialthinking, mcp__fuse-browser__browser_fetch, mcp__fuse-browser__browser_fetch_batch, SendMessage`. Note: `security-expert` dropped `Edit` (CHANGELOG 1.39.47, audit-only) — relevant if a devops agent must stay read-only on a host.
- `skills:` the plugin's own skills (bare names) + `fuse-ai-pilot:fuse-browser-usage`.

### 1.3 Agent body conventions (go-expert.md, 100 lines; rust 90; hermes 112)
In order: `<role>` block (3 paragraphs: identity, "Your posture is ...", "You own X specifically; Y belongs to ... specialists") -> `# <Name> Agent` -> `## Agent Workflow (MANDATORY)` (parallel `fuse-ai-pilot:explore-codebase` + `fuse-ai-pilot:research-expert`, then `mcp__context7__query-docs` directly, then `fuse-ai-pilot:sniper`) -> `## MANDATORY SKILLS USAGE (CRITICAL)` (table Task -> Required Skill) -> `## SOLID Rules (MANDATORY)` (points at `fuse-solid:solid-<lang>`, table Files/Interfaces/Documentation/Validation) -> `## Coding Standards` -> `## Core Rule` (Verify Before Writing; chain fuse-browser -> Context7 -> Exa) -> `## fuse-browser (ZERO TOLERANCE)` (fast-path only, no browser_open) -> `## Completion Criteria` (concrete commands + sniper ZERO errors) -> `## Forbidden` -> `## Output Format` (status / files_changed / verification / remaining_issues / sources_verified). Hermes adds `## Universal knowledge vs owner profile`, `## Core Rules`. `scripts/validate-agents.sh` requires: `name:`, `description:`, `model:`, `color:`, `tools:` (check 1), a `## Forbidden` heading (check 2, warning), Edit+Write coherence (4), valid model (5), the word workflow/protocol/process (6).

### 1.4 `hooks/hooks.json` (byte-identical shape in go, rust, hermes)
Only the `description` string changes ("Go Expert — SOLID/skill/DRY/file-size/interface enforcement via @fusengine/harness (framework-routed by applies-to) | ..."). Two entries, both running `bun $HOME/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/dist/cli/bin.mjs hook claude-code`:
- `PreToolUse`, matcher `Write|Edit`.
- `PostToolUse`, matcher `""` (records doc/ref/agent activity feeding the APEX gates).
There are no per-plugin hook scripts.

### 1.5 README (`plugins/go-expert/README.md`, 45 lines)
`# fuse-go` -> one-paragraph summary -> `## Agent` table (Agent | Description) -> `## Skills` table (Skill | Description) -> SOLID sentence (points at shared `fuse-solid:solid-go`, "no local duplicate") -> `## Architecture` (code block of the stack's layout) -> `## Installation` (`/plugin install fuse-go`) -> `## Usage` (activation condition + "for X use Y-expert"). Hermes (57 lines) swaps Architecture for Workflow/Freshness sections.

### 1.6 SKILL.md conventions (`plugins/go-expert/skills/go-tooling-security/SKILL.md`, 150 lines)
Frontmatter: `name`, `description` ("Use when ... Not for ..."), `versions:` map (tool -> version), `user-invocable: true` (hermes-deploy: `false`), `references:` (comma list in go; YAML list in hermes), `related-skills: solid-go`. Body: `<objective>...</objective>` (covers / does not cover) -> `# Title` -> `## Agent Workflow (MANDATORY)` (3 parallel agents: explore-codebase, research-expert, context7) -> `## Overview` -> `## Critical Rules` -> `## Architecture` -> `## Reference Guide` (`### Concepts`, `### Templates` tables linking `references/*.md`) -> `## Quick Reference` (command recipes) -> `## Best Practices` (`### DO`, `### DON'T`). References 95-120 lines; templates under `references/templates/`.

## 2. Edits OUTSIDE the plugin folder

Authoritative list: what 8c2f9bc9 / 556b2657 touched plus later doc commits. Hermes commit 556b2657 touched ONLY `.claude-plugin/marketplace.json` + the plugin folder; the docs/README/CHANGELOG entries came afterwards (commit `docs(workflow)` 1.39.44, README, `docs/plugins/hermes.md`). A complete add needs all rows below.

| # | File | Line(s) today | Edit |
|---|------|---------------|------|
| 2.1 | `.claude-plugin/marketplace.json` | `plugins[]` entries: fuse-rust 370, fuse-go 397, fuse-hermes 425-450; array continues to fuse-motion 666. `core[]` lines 12-24 is for core-guards/claude-rules only | Append an object: `name:"fuse-devops"`, `source:"./plugins/devops-expert"`, `description`, `version:"1.0.0"`, `author{name,url}`, `homepage`, `repository`, `license`, `keywords[]`, `category` (20 `development`, 4 `productivity`, 1 `security`; hermes = `development`), `strict:true`. Also `metadata.version` (line 8) is bumped by the release (1.39.47) |
| 2.2 | `README.md` | line 3 | Badges: `plugins-27` -> 28, `agents-41` -> 42, `skills-218` -> 218+N (these three are currently exact vs disk). `version-v1.39.47` is bumped by the commit agent (`git show 1d8d98c3` touches README 1 line) |
| 2.3 | `README.md` | line 32 | Append `fuse-devops` to the one-line `/plugin install ...` list (ends `... fuse-hermes fuse-statusline`) |
| 2.4 | `README.md` | tables: language experts rows 64-76 (`Detects` column), Productivity table 86-97 (hermes row at 96) | Add a row `\| [fuse-devops](docs/plugins/devops.md) \| <detects> \| <what the agent does> \|`. A devops expert has no single manifest: put it in Productivity (like hermes) or in the expert table with detects = `Dockerfile`, `docker-compose*.yml`, `*.tf`, k8s manifests |
| 2.5 | `README.md` | line 21 | Stale: says "196 skills" while the badge says 218. Not required for the add, but fix when touching counts |
| 2.6 | `docs/plugins/devops.md` (new) | model `docs/plugins/go.md` (35 lines), `docs/plugins/hermes.md` | Sections: `# fuse-devops`, summary, `## Agent(s)` table, `## Skills (N)` table, `## MCP Servers`, `## SOLID Rules`, install. 25 files exist in `docs/plugins/` |
| 2.7 | `docs/workflow/agents.md` | line 3 ("41 specialized agents"), table `## Framework Experts` lines 20-41 (`go-expert` 26, `hermes-expert` 41) | Count 41 -> 42, add row `\| devops-expert \| fuse-devops \| ... \|` |
| 2.8 | `docs/workflow/skills.md` | line 3 ("218 specialized skills"), per-plugin sections `## fuse-hermes (13 skills)` 168, `## fuse-go (5 skills)` 219, `## fuse-rust` 240 | Add `## fuse-devops (N skills)` table (Skill \| Description); update total. Commit cd0d9c1f is the precedent (`docs(workflow): list agentic-security in the skills index (218 skills)`) |
| 2.9 | `docs/README.md` | line 9 ("41 specialized agents"), plugin index 14-28; line 10 says "105 framework skills" (stale) | Update agents count; add `- [devops](plugins/devops.md) - ...` line (go/rust/hermes are NOT listed there today, so optional) |
| 2.10 | `plugins/claude-rules/rules/01-project-detection.md` | table lines 4-18 (`Cargo.toml` 15, `go.mod` 16); `Priority:` line 22 | Optional for devops: a row only if a reliable indicator is chosen (`Dockerfile`, `docker-compose.yml`, `*.tf`, `kubernetes/`...). Such files co-exist with `package.json`/`go.mod`, so priority conflicts with "Language" experts must be decided and the Priority line edited. `_archive/2026-07-15/rules/` holds an old copy (do not edit). hermes-expert has NO row (routed by explicit task, not by file) |
| 2.11 | `plugins/claude-rules/templates/CLAUDE.md.template` | line 20 and 59 reference `01-project-detection` only | No per-plugin table here: nothing to edit (verified: `grep go-expert|rust|fuse-go` = no hit) |
| 2.12 | `CHANGELOG.md` | top section `## [1.39.47] - 10-11-2026` | Entry in the style `feat(devops-expert): new fuse-devops plugin ... (fuse-devops 1.0.0)`; hermes: line 36, rust: line 286. Written by the commit agent at release (bump + CHANGELOG + marketplace mirror) |
| 2.13 | `.cartographer/` and `plugins/.cartographer/` | `.gitignore:25` ignores both | Nothing to commit: auto-generated at SessionStart by the cartographer hook (`git ls-files` = 0 files) |
| 2.14 | `setup.sh`, `setup.ps1`, `scripts/src/**` | grep for `fuse-rust|fuse-go|fuse-hermes|go-expert` = not found | No hard-coded plugin list: `scripts/src/services/plugin-scanner.ts:22` does `readdirSync(pluginsDir)`. Nothing to edit |
| 2.15 | `docs/reference/architecture.md`, `docs/reference/creating-skills-agents.md` | architecture lists some plugins (lines 8-64); creating-skills-agents.md:36,80,117 say "register in marketplace.json" | Not touched by go/rust/hermes adds; optional |
| 2.16 | `plugins/solid/skills/solid-detection`, `solid-<lang>` | `plugins/solid/skills/` has csharp, generic, go, java, python, ruby, rust | Only needed for a SOLID skill. A devops plugin links `fuse-solid:solid-generic` or none (see 3) |

Checked and not needed: `plugins/ai-pilot` (no per-expert list), `MEMORY/`, `docs/decisions.md` (the lead records owner decisions there; the owner's "fuse-devops" decision is its entry), `bunfig.toml`.

## 3. Hooks, SOLID and framework detection for a non-code expert

- Registered hooks (all three models): `PreToolUse` `Write|Edit` and `PostToolUse` `""`, both -> `@fusengine/harness ... hook claude-code`. hermes-expert (no code framework) carries the identical file (`plugins/hermes-expert/hooks/hooks.json`), so a devops plugin should copy it verbatim and only change `description`.
- Framework detection is done by the harness, not the plugin: `~/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src/policy/detect-framework.ts` maps by extension: `.swift`, `.php`, `.java`, `.go`, `.rb`, `.rs`, tailwind CSS content, JS family via project caps; everything else returns `"generic"` (fail-open). `Dockerfile`, `*.yml`, `*.tf`, `*.sh`, `*.yaml` therefore resolve to `generic`.
- The SOLID file-size gate only applies to `FILE_SIZE_CODE_EXT = ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro` (`src/policy/file-size-scope.ts:11`). Pure devops artefacts (YAML, Dockerfile, HCL, shell) are outside it; a `.py`/`.go`/`.ts` helper written by the devops agent is inside it (framework key from the file extension, then `solid-generic` for python/ts-without-framework).
- APEX authorization falls back to `solid-generic` for `generic` (`src/policy/apex-authorization.ts` ~line 82; lesson 2026-10-09: read `plugins/solid/skills/solid-generic/SKILL.md`). So a devops plugin needs no SOLID skill of its own; the agent should say "SOLID: `fuse-solid:solid-generic`, applies only to script/code files".
- No hook registers a plugin by name: the language experts are chosen by `01-project-detection.md`, not by the harness. A devops expert is selected by task (like hermes) unless a row is added (2.10).

## 4. Tests and checks after adding a plugin

Run from repo root (all green today):
1. `bun test` — 384 pass, 0 fail, 35 files (`bunfig.toml` ignores `plugins/core-guards/statusline-mod/**`). No test counts plugins/agents/skills or validates frontmatter: `grep -rnE '\b(27|41|218)\b' scripts/src/__tests__ test` = not found. `plugin-scanner.test.ts` uses fakes (`PLUGINS_DIR = "/fake/marketplace/plugins"`). So no test will fail because counts are not updated; counts live only in README/docs (2.2, 2.7-2.9) and are checked by eye.
2. `bunx tsc --noEmit -p scripts` (or `cd scripts && bunx tsc --noEmit`) — exit 0.
3. `bash scripts/validate-agents.sh` — checks the new agent file (frontmatter fields, `## Forbidden`, Edit/Write coherence, valid model, workflow word). It is the only automatic validation of the agent frontmatter.
4. Manual: `plugin.json` and marketplace entry must agree (name, version, description); `claude plugin validate` was not run (not found in repo docs). Skills `references:` in SKILL.md frontmatter must list files that exist (sniper "references <-> declarations").

## 5. Existing devops-flavoured content (do not duplicate)

| Path | Scope |
|------|-------|
| `plugins/security-expert/skills/dependency-audit/` (+ `references/ci-github-actions.md`, `supply-chain.md`, `audit-commands-systems.md`) | Read-only dependency/supply-chain audit and GitHub Actions workflow audit |
| `plugins/security-expert/skills/agentic-security/references/ci-agents.md`, `secrets.md`, `permissions.md` | Security of AI-agent setups in CI, secrets, permissions |
| `plugins/security-expert/skills/security-scan/`, `security-headers/`, `auth-audit/`, `cve-research/` | App code OWASP scan, live HTTP header check, auth, CVE research (host/OS hardening: not found) |
| `plugins/hermes-expert/skills/hermes-deploy/` (+ `references/ssh-discovery.md`, `apply-verify-rollback.md`, `dry-run.md`) | SSH read-only discovery, dry-run, one-go apply, verify/rollback pattern for a server. Reusable model for a devops "apply safely" skill |
| `plugins/hermes-expert/skills/hermes-security/references/sandbox-backends.md` | Hermes terminal backends (local / ssh / container) — Hermes-specific |
| `plugins/hermes-expert/skills/hermes-migration/`, `hermes-workspace/` | Hermes backup/migration steps, workspace layout |
| `plugins/rust-expert/skills/rust-tooling-cicd/` (`references/ci-gate.md`, `templates/`) | Rust CI pipeline (fmt, clippy, cargo-deny/audit, nextest) |
| `plugins/go-expert/skills/go-tooling-security/` (`references/templates/ci-workflow.md`) | Go CI quality gate, govulncheck |
| `plugins/astro-expert/skills/astro-deployment/` | Astro to Cloudflare/Vercel/Netlify/Node adapters, ISR, edge middleware |
| `plugins/tanstack-start-expert/skills/start-deployment/` | TanStack Start deployment (Cloudflare, Netlify, Vercel/Node/Bun, env vars) |
| `plugins/nextjs-expert/skills/nextjs-16/references/deployment.md`, `prisma-7/references/docker.md`, `prisma-7/800-guides/130-docker.md` | Next.js deployment, Prisma in Docker (app-level) |
| `plugins/commit-pro/skills/git-flow/`, `post-commit/` | Git flow, PR/merge/tag release flow |
| `plugins/ai-pilot/skills/web-performance/` | Web performance (not infra) |

Not found anywhere in `plugins/`: a Docker/Compose, Kubernetes, Linux/systemd, Proxmox, OpenStack, Terraform/Ansible, nginx/reverse-proxy, monitoring or backup skill (`grep -iE 'dockerfile|docker compose|kubernetes|systemd|terraform|ansible|proxmox|openstack'` hits only Prisma docs, Hermes sandbox/gateway refs, astro node-adapter and supply-chain). No existing agent covers infrastructure. Overlap risk for the new plugin: CI (language CI stays in `rust-tooling-cicd`/`go-tooling-security`), supply-chain/Actions (stay in `dependency-audit`), app deploy to PaaS (framework experts), SSH apply/verify/rollback protocol (borrow from `hermes-deploy`, link rather than copy).

## 6. Not verified

- Whether `claude plugin validate` accepts the manifest (command not run, no write allowed here).
- `docs/plugins/go.md` still says Go 1.26 while plugin.json says 1.27 (drift, unrelated).
- The release bump of marketplace/README version is done by the commit agent (precedent `1d8d98c3`); not re-checked beyond the stat.
