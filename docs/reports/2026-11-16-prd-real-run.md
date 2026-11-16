> Superseded: bugs fixed in @fusengine/harness 0.1.121, see harness docs/reports/2026-11-16-prd-fix-real-run.md

# PRD module real run (harness 0.1.120) — 2026-11-16

Verdict: **do not activate PRD yet.** It cannot be bootstrapped as documented and it deadlocks on resume. Status reporting itself is accurate.

Method: throwaway project (4 independent TS files, git), `FUSE_PRD=1` in `<project>/.env` only, installed marketplace hooks, real `claude -p` runs (stream-json logs kept in the session scratchpad `logs/`). One sample per scenario (n=1), Opus lead + 4 `fuse-typescript:typescript-expert` sub-agents.

Note: `~/.claude/.env` already contains `export FUSE_PRD="1"` (read only, not touched). PRD is therefore already globally on; only the absence of a router file keeps it inert. The control run used project `.env` `FUSE_PRD=0` plus no router, so "off" = inert by the doc's own table, not proof that a project `.env` overrides the global value.

## Results

| Check | Result |
|---|---|
| Coordinator can create the router (documented step 1) | **NO** — blocked, see Bug 1 |
| `status` correct after interruption (killed after 2 reports) | **YES** — `fix-utils assigned 4 agents 2/4, 0 violations`; disk agrees (math.ts, str.ts fixed with reports; list.ts, date.ts untouched) |
| Resume picks up from PRD state | **YES for scope** — fresh `claude -p` read the doc and state, relaunched only the 2 unfinished agents, did not touch the 2 finished files (mtimes unchanged) |
| Resume completes and `validate` passes | **NO** — both relaunched agents fixed their file but their report writes were denied; final `status` stays 2/4, `validate` exit 1 with 2 violations although all 4 files are correct on disk |
| Multi-slice `SubagentStart` injection | Works: each of the 4 same-type agents received all 4 slices with the disambiguation header |
| Block-once on `SubagentStop` / lead `Stop` | Never fired in any run (no undone sub-task at a stop; no cross-check violation) — not exercised |

## Cost (control = PRD off, same 4 agents, normal workflow)

| Run | Wall | Tool calls (lead / total) | Cost |
|---|---|---|---|
| Control (no router) | 158 s | 14 / 48 | $5.05 |
| PRD run 1 (placeholder-seeded router), killed after 2 reports | 133 s | 20 / 43 | n/a (killed, no result event); cache-read volume 2.9M vs control 3.8M, so about $3.8 by proportion (estimate) |
| PRD resume (fresh session, includes analysis helpers + 2 agents) | 130 s | 14 / 29 | $2.29 |
| PRD total (interrupt + resume) | 263 s | 34 / 72 | about $6.1 (estimate) |

Delta PRD vs control: about +105 s, +24 tool calls, about +$1 (+20 %), but the PRD path ended incomplete (2/4 validated), so this is a floor of the cost of a working cycle, not a clean comparison. The lead's extra calls are doc reading and PRD file writes; in the very first attempt it spent 11 Bash calls reading harness source to work out naming. Block counts per agent unrelated to PRD (APEX "read SOLID references", "Brief without the owner's words") were the same order in control and PRD runs (14 / 6 vs 18 / 6). Zero `SubagentStop` block-once stops observed.

Attempt 0 (PRD on, no router, normal prompt): 94 s, $1.40, 14 tool calls, no work done — see Bug 1.

## Bugs and friction

1. **Router cannot be created (bootstrap deadlock).** `isPrdEnabled()` needs the router file to exist; with no router the PRD pre-gate returns null, so the Write falls through to `protectedPathGuard`, whose fragment `.claude/apex/` blocks it: `[BLOCKED] Protected path — This is internal/generated enforcement state`. Verified in the real run (2 Write denials) and in source (`src/policy/prd/prd-enabled.ts`, `src/runtime/handle-pre.ts` comment lines 92-99, `src/policy/guards/protected-path.ts`). The "router-only repair" path in `prd-router-guard.ts` only runs once a (broken) router already exists. `harness prd` has only `status|validate|compact`, no `init`. Workaround used for the rest of the measurement (operator action, not a hook bypass: the guard allows it): `touch .claude/apex/prd.json`, after which the coordinator's Write of the real router and task file passed the documented repair path. `touch` is documented in prd.md as an uncaught write verb, so this may close if that gap is fixed.
2. **Same-type sub-agents deadlock on report binding after a resume.** All four agents share one `agent_type`; report names are `<agentType>`, `<agentType>-2`, ... and a `-n` slot is only writable once the exact-name slot is claimed. Bindings live in the session track (`track.prdOwners`, `prd-pre-gate.ts`), so a fresh lead session starts with no bindings (inferred from code and the observed denial; not instrumented). Relaunched agents writing `-3` and `-4` both see two free candidates and are denied (`name doesn't match your agent_type, or already bound to another agent`), and the exact-name slot belongs to a finished agent's report on disk. Even within one session, completion order matters: an agent finishing before the exact-name agent has claimed its slot is denied. The lead correctly refused to write the reports itself.
3. **Names are namespaced.** `agent_type` is `fuse-typescript:typescript-expert`, so report files are `fuse-typescript:typescript-expert-2-prd.json` (colon in file names) and the task PRD must use those exact keys; prd.md only shows bare `backend-expert`. The lead had to read harness source to learn this.
4. **Doc drift.** prd.md says the lead `Stop` gate never runs on claude-code (`--sound stop` wiring gap); the installed `core-guards/hooks/hooks.json` now has a separate `Stop[1]` entry for it. Not exercised here (no violation), so unverified either way.

## Suggestions (not built)

- Suggestion: exempt `apex/prd.json` and `apex/prd/` coordinator writes from `protectedPathGuard` when `FUSE_PRD=1` (or add `harness prd init`) → gain: the documented step 1 works without a placeholder file.
- Suggestion: derive report ownership from the sub-agent's `name` / task PRD key chosen by the coordinator, or persist bindings in the project (not the session track) and rebuild from existing report files on resume → gain: no completion-order dependence and no resume deadlock for same-type agents.

## Not verified

Block-once on `SubagentStop`/lead `Stop`, `compact`, a clean full uncorrupted PRD cycle, and whether project `.env` can turn off a global `FUSE_PRD=1`. Single sample per scenario; run 1 cost is an estimate.

## Artifacts

Scratchpad project `.../scratchpad/prd-run` (PRD) and `prd-control`; logs `.../scratchpad/logs/{prd1,ctl2,prd2,prd3}.jsonl`. No repo, plugin, harness or `~/.claude/.env` file was modified; no commit.
