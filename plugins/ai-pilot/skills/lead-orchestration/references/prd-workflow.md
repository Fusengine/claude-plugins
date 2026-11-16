---
name: prd-workflow
description: Lead-side PRD procedure (harness >= 0.1.121) -- init before a multi-agent launch, slots in briefs, status on resume, validate before done
when-to-use: Steps 5, 6, 8 and 9 of lead-orchestration in a write mandate whose ownership table has 2+ agents (never in a read-only mandate)
keywords: prd, fuse_prd, router, task prd, agent report, slot, prd init, prd status, prd validate, resume
priority: high
related: brief-template.md
---

# PRD workflow (lead side)

## Why

With many agents on one mandate, the lead loses track after an interruption (killed session, compaction, a new session) and re-runs work already done. The harness PRD module gives each agent one report file only it may write; `prd status` then says which agent finished, and `prd validate` proves every report matches its assignment. It is opt-in (`FUSE_PRD=1` in `~/.claude/.env` or `<project>/.env`) and inert until the router `.claude/apex/prd.json` exists -- and the lead cannot Write the router (protected path), so `prd init` creates it.

## Commands

`<H>` = the harness the hooks run, so CLI and hooks are the same version:

```bash
bun $HOME/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/dist/cli/bin.mjs
```

Never the global `harness` binary (it may be older and lack `prd init`). Always pass `--id claude-code --root <project root>`: without `--id`, init fails in a project that has no `.claude/` directory yet.

| Step | Who runs it | Command | Result |
|------|-------------|---------|--------|
| 5 | the first task's domain expert (lead executes nothing; never `general-purpose`) | `<H> prd init --task <task> --id claude-code --root <root>` | see "init outcomes" |
| 5 | lead, Write tool | task PRD `.claude/apex/prd/<task>-prd.json` | one slot per agent |
| 8 | lead (read-only) | `<H> prd status --json --root <root>` | done / pending per slot |
| 9 | lead | `<H> prd validate <task> --id claude-code --root <root>` | exit 0 silent = all reports match |
| 9 | lead | `<H> prd compact <task> --id claude-code --root <root>` | `compacted: <slots>` |

`<task>` = the mandate slug, `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (e.g. `fix-utils`, `auth-refactor`).

### init outcomes

| Output | Exit | Meaning -> lead action |
|--------|------|------------------------|
| `prd init: created <path> with task "<task>"` | 0 | PRD on -> write the task PRD |
| `prd init: router already present at <path>` | 0 | PRD on, task already routed (resume) -> step 8 |
| `prd init: router <path> exists without task "<task>"` | 1 | PRD on, router from an earlier mandate -> the lead Edits the router to add `"<task>": { "prd": "prd/<task>-prd.json", "status": "assigned" }`, then writes the task PRD |
| `prd init requires FUSE_PRD=1 ...` | 1 | PRD off -> skip every PRD step; flow unchanged |
| `prd init: <router state>` (malformed router) or `prd init: cannot create router: ...` | 1 | PRD unusable for this mandate -> skip every PRD step, flow unchanged; tell the owner once with the exact message |
| `harness prd: unknown sub-command "init"` | 2 | installed harness predates 0.1.121 -> PRD off; tell the owner once that a plugin update enables it |
| init created the router, but the task PRD Write is refused `[BLOCKED] Protected path` | -- | the hooks see `FUSE_PRD` off while the agent's shell sees it on (shell profile sourcing `~/.claude/.env`, a process-level override) -> PRD off for this mandate, flow unchanged; tell the owner once, never retry the Write |

## Slots and the task PRD

A slot is named after the agent's **plugin-prefixed `agent_type`** (the `subagent_type` you pass to `Agent`), not after the `name` you give it. Several agents of one type get `<type>`, `<type>-2`, `<type>-3`, ... Example: four `fuse-typescript:typescript-expert` agents -> slots `fuse-typescript:typescript-expert`, `fuse-typescript:typescript-expert-2`, `-3`, `-4`.

Task PRD (lead-written, Write tool -- the harness denies it to sub-agents and denies any Bash write under `apex/prd/`):

```json
{
  "fuse-typescript:typescript-expert":   { "files": ["src/math.ts"], "sub-tasks": { "fix-add": { "status": "assigned" } } },
  "fuse-typescript:typescript-expert-2": { "files": ["src/str.ts"],  "sub-tasks": { "fix-shout": { "status": "assigned" } } }
}
```

Keep the step 5 table's file ownership: `files` = that agent's exclusive files.

## Brief line (step 6)

Each brief carries its slot in WRITE (brief-template "PRD report"): the agent, once its PROOF passes, Writes `.claude/apex/prd/agents/<slot>-prd.json`:

```json
{ "<task>": { "<sub-task>": { "status": "done", "modified": ["src/math.ts"], "unchanged": [] } } }
```

`status` must be `done`; `modified` and `unchanged` are both arrays (empty allowed). Only its own slot; first write binds the slot to that agent.

## Resume (step 8)

`prd status --json` returns `router`, `taskFiles` and `reports`; a slot whose report is `null` or lacks `done` for a sub-task is pending. Relaunch only pending slots, each brief naming the same slot; a slot already reported done is never relaunched (the harness refuses a new agent rewriting it). The finished agents' files are not touched again.

## Validate (step 9)

Exit 1 prints `prd validate: N violation(s)` and one `  - <task>/<slot>/<sub>: <reason>` per gap -> resume that agent to write its report; the lead never writes an agent report (the harness denies it). Exit 0 promotes the router entry to `validated`. The harness Stop hint "ready to compact" is answered with `prd compact`.

## Forbidden

- Writing a report for an agent, or any PRD file through Bash.
- Running PRD steps when init said PRD is off, or in a read-only mandate (audit, analyse, explain, check, question).
- Using the global `harness` binary.
