# fuse-hermes

Expert configuration and deployment of Nous Research Hermes Agent ([NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)).

## Overview

Baseline Hermes version 0.23.0, with a mandatory freshness check against the latest release before any config is written. Universal Hermes knowledge lives in the skills; one owner's specifics come from the owner's own description of the organisation, which the agent turns into an internal profile. The reference deployment the patterns are aligned on is a live chief-of-staff install: `company/` deploy tree, `distribution.yaml`, profiles, kanban, delegation, security config and workspace filing rules.

## Agent (1)

| Agent | Description |
|-------|-------------|
| `hermes-expert` | Deploys a chief-of-staff system end to end from a free-form description of your organisation: reads the document, connects to the server over SSH, derives the profile, dry-runs, applies after your go, verifies. Also configures, audits and evolves existing installs |

## Skills (13)

| Skill | Description |
|-------|-------------|
| `hermes-core` | Install, update channels, profiles, `config.yaml` schema, models/providers, SOUL.md / `.hermes.md` / AGENTS.md resolution, sessions, logs/health |
| `hermes-delegation` | `delegation.*` keys, pluggable backends, `advanced-delegation`, spawn depth, concurrency, manager/employee topology |
| `hermes-cron` | `hermes cron` jobs — schedules, `--workdir`, timezone, catch-up, reasoning effort, delivery, preflight |
| `hermes-gateways` | Multiplexed gateway, Slack/Telegram/Discord/email adapters, voice TTS/STT, building a fallback |
| `hermes-extend` | Skills system, memory providers, MCP, plugins, `browser_exec` |
| `hermes-security` | Approval model, `approvals.deny`, sandbox/terminal backends, secrets, go gate |
| `hermes-chief-of-staff` | Chief → managers → employees, three paths, eight rules, private/pro partition, `profile.yaml` template |
| `hermes-rhythm` | Morning brief, evening review, weekly review, monthly dashboard, commitments, decisions channel |
| `hermes-outbound` | Nothing-internal-leaves checklist, owner's voice, show-exact-before-go, irreversible go gate |
| `hermes-mail-triage` | Bulk, SPF/DKIM/DMARC, blocklists, scam checks, learning, never moves mail alone |
| `hermes-workspace` | Layout, naming, scratch outside workspace, end-of-task checklist, weekly cleanup |
| `hermes-migration` | Backup, new SOUL/workflow, test day, before/after measures |
| `hermes-deploy` | Document → profile, read-only SSH discovery, dry run + diff, one go, apply, verify, rollback |

## Workflow

```
1. Read the owner's document  → derive the operating profile (the owner never writes YAML)
2. SSH discovery (read-only)  → version, profiles, config, cron, hermes doctor
3. One grouped question       → only decisions that belong to the owner
4. Dry run                    → everything prepared locally, diff of what changes on the server
5. One go                     → backup, apply, verify, rollback kept ready
```

Secret values are never printed: the owner sets them, or tells the agent where they live on the server.

## Freshness

Every skill starts with the same check: `hermes --version`, `hermes update --check`, and the [latest release notes](https://github.com/NousResearch/hermes-agent/releases/latest). Newer than 0.23.0 → read every release note since before applying any guidance.

## Installation

```bash
/plugin install fuse-hermes
```
