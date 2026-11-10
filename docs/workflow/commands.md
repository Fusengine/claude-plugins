# Commands

35 slash commands across all plugins.

## APEX Workflow

| Command | Plugin | Description |
|---------|--------|-------------|
| `/apex` | fuse-ai-pilot | Full APEX workflow |
| `/apex-quick` | fuse-ai-pilot | Skip Analyze, direct Execute |
| `/epct` | fuse-ai-pilot | Systematic Explore-Plan-Code-Test methodology for structured development |
| `/run-tasks` | fuse-ai-pilot | Execute GitHub issues using full EPCT workflow (Explore-Plan-Code-Test) |
| `/deep-code-analysis` | fuse-ai-pilot | Comprehensive codebase investigation using research-expert for documentation, explore-codebase for structure, and deep analysis |
| `/explain-architecture` | fuse-ai-pilot | Analyze and explain software architecture with ASCII diagrams and pattern detection |

## Git Commits

| Command | Plugin | Description |
|---------|--------|-------------|
| `/commit` | fuse-commit-pro | Smart conventional commit |
| `/wip` | fuse-commit-pro | Work in progress |
| `/fix` | fuse-commit-pro | Bugfix commit |
| `/feat` | fuse-commit-pro | Feature commit |
| `/refactor` | fuse-commit-pro | Refactor commit |
| `/chore` | fuse-commit-pro | Maintenance commit |
| `/docs` | fuse-commit-pro | Documentation commit |
| `/test` | fuse-commit-pro | Test commit |
| `/undo` | fuse-commit-pro | Undo last commit |
| `/amend` | fuse-commit-pro | Amend last commit |

## Maintenance and Pull Requests

| Command | Plugin | Description |
|---------|--------|-------------|
| `/cleanup-context` | fuse-ai-pilot | Memory optimization - removes duplicates, consolidates knowledge, and cleans memory banks for better performance |
| `/create-pull-request` | fuse-ai-pilot | Auto-generate Pull Request with comprehensive description, test plan, and changelog |
| `/fix-pr-comments` | fuse-ai-pilot | Systematically resolve Pull Request review comments using gh CLI to fetch comments and apply requested changes |
| `/watch-ci` | fuse-ai-pilot | Monitor CI/CD pipeline and automatically fix failures |
| `/update-harness` | fuse-ai-pilot | Update the shared @fusengine/harness to the latest published version |

## Framework Specific

| Command | Plugin | Description |
|---------|--------|-------------|
| `/prisma-optimize` | fuse-ai-pilot | Optimize Prisma queries with automated analysis, N+1 detection, index recommendations, and performance patterns based on official documentation |

## Design

| Command | Plugin | Description |
|---------|--------|-------------|
| `/design` | fuse-design | UI/UX workflow |
| `/audit-design` | fuse-design | Audit an existing HTML/CSS design |
| `/design-component` | fuse-design | Generate a single component using existing design-system.md tokens |
| `/design-mobile` | fuse-design | iOS or Android mockup + handoff spec |
| `/design-page` | fuse-design | New page or screen in an existing project |

## Motion

| Command | Plugin | Description |
|---------|--------|-------------|
| `/motion` | fuse-motion | Short product film or social ad from real UI |

## Prompt Engineering

| Command | Plugin | Description |
|---------|--------|-------------|
| `/prompt` | fuse-prompt-engineer | Create/optimize prompts |
| `/prompt-history` | fuse-prompt-engineer | Prompt history |

## Ecosystem, Lessons and Security

| Command | Plugin | Description |
|---------|--------|-------------|
| `/map` | fuse-cartographer | Refresh and display the ecosystem map of all installed plugins, agents, skills, commands, and hooks |
| `/watch` | fuse-changelog | Check for Claude Code updates, detect breaking changes, analyze plugin compatibility, and optionally gather community pulse via Exa |
| `/lessons` | fuse-lessons | View project lessons in MEMORY/LESSON.md (project root) and append a compact "never reproduce" lesson |
| `/lessons-compact` | fuse-lessons | Compact MEMORY/LESSON.md by deduplicating near-identical lessons, merging same-root-cause lessons, and pruning stale ones |
| `/scan` | fuse-security | Launch a security audit on the current project (whole repository or a change vs its merge base) |

## Skills invocable as slash commands

Three examples of skills invocable as `/name`. They are skills, not command files, so they do not count in the 35 slash commands above. Most skills are invocable: 148 of 236 (120 with `user-invocable: true`, 28 without the field, which defaults to true). See [Skills](skills.md) for the list.

| Command | Plugin | Description |
|---------|--------|-------------|
| `/nextjs-stack` | fuse-nextjs | Full stack setup |
| `/laravel-api` | fuse-laravel | API scaffolding |
| `/code-quality` | fuse-ai-pilot | Linters, SOLID validation, DRY detection |

## Usage

```bash
# Full APEX for a feature
/apex Add user authentication

# Quick commit
/commit

# Security audit of the current project
/scan
```
