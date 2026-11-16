# PRD in the lead workflow: real run (harness 0.1.121), 2026-11-16

Verdict: **the lead workflow drives PRD end to end.** Init, resume and validate work, and read-only mandates create nothing.

Method: throwaway TS project (4 files, one bug each, git), real `claude -p` runs with the branch's `lead-orchestration` skill (stream-json logs kept in the session scratchpad `prdlead/logs/`). One sample per scenario (n=1). Opus lead plus 4 `fuse-typescript:typescript-expert` sub-agents.

| Scenario | Log | Result |
|---|---|---|
| PRD on, write mandate, 4 agents, killed after 2 reports | `r1.jsonl` (wall 108 s, exit 143 by design) | `prd init --task fix-four-bugs` was run by a sub-agent. The prompt never mentions init: the skill made the lead brief it |
| Resume in a fresh session | `r2.jsonl` (wall 207 s, exit 0) | `prd status --json` ran first. Only the 2 pending slots were relaunched. `prd validate fix-four-bugs` exit 0. Router `prd.json` → `status: validated`, with 4 reports under `.claude/apex/prd/agents/` |
| Read-only audit, 4 agents | `ro3.jsonl` (wall 65 s, exit 0) | Nothing was created: no `.claude/apex`, no roadmap, no project skill. `git status` shows only the seeded `CLAUDE.md`. This fixes the v1.40.5 defect where read-only mandates created the roadmap and project skill |
| PRD off control, same write mandate | `off.jsonl` (wall 287 s, exit 0) | Same workflow as before: 4 files fixed, no PRD artifacts |

Challenger round 3: CONFIRMED.

Precondition: PRD needs the installed `@fusengine/harness` at 0.1.121 or later. Earlier versions deadlock on bootstrap and resume (see `2026-11-16-prd-real-run.md`).

Not verified: block-once on `SubagentStop`/lead `Stop`, `prd compact`, and repeatability (n=1 per scenario).
