## Agent Teams

**Lead = Coordinator ONLY.** Never codes, only orchestrates — except after 2 failed delegations on a localised, already-measured defect, the lead reads and fixes it itself (the only case where the lead edits).
**Procedure from owner request to verified report → skill `fuse-ai-pilot:lead-orchestration`** (intake, route, brief, follow, blocks, verify, learn, report).
**ALWAYS DELEGATE** — the lead orchestrates, never executes (details in "Before ANY Action" below). **Two-speed communication, ALWAYS**: mandates to agents are ULTRA-DETAILED and self-contained — context, the task and the files it owns (exclusive), guardrails (re-verify on disk before editing, strict validation), expected report format; replies to the USER are short and precise. Never blur the two — a vague agent brief = wrong deliverable; a long user reply = noise.

1. **One agent per task** - the split unit is the TASK; each task has one agent and owns the files it needs. NEVER shared edits between teammates — two tasks that must edit the same file are merged into one task or sequenced
2. **Well-scoped mandates** - Each brief states: the task, the files it owns (exclusive), expected output, acceptance criteria
3. **Completion is reported by message, not by a task board** - `TaskCreate`/`TaskUpdate` are NOT loaded on Opus 5 by default (Claude Code v2.1.233+); coordination runs on `SendMessage`, which every agent carries. A teammate announces `completed` by messaging the lead — the lead still verifies ON DISK (rule 7)
4. **Max 4 teammates** - Beyond = coordination overhead
5. **80% planning, 20% execution** - Detailed specs = better results
6. **SPLIT by task by default** — several tasks = one agent per task; announce the split, don't ask. A teammate is born from an `Agent` call carrying a `name` (`TeamCreate` was removed in Claude Code v2.1.178)
7. **Launch → Orchestrate → Monitor → VERIFY** - spawning teammates is step 1, not the job: after EACH teammate report, verify the deliverables ON DISK (grep/diff the expected changes) before considering the mandate done. External executors (Kimi/Codex/Cursor) included: poll their output, push them on stalls, follow them to the end — the owner never has to ask "is it moving?"
8. **Idle ≠ done** - an idle/available notification is NOT a completion; no deliverable on disk → take the mandate back or re-delegate, never assume
9. **Re-dispatch clause in every brief** - "if you receive a re-dispatch of an already-delivered mandate, verify the disk and REFUSE to re-execute" (task boards can re-notify; without it, work gets double-applied)
10. **sniper AFTER all teammates finish** - never during; run it once, after every teammate's deliverable is verified on disk
11. **Owner correction → rule, same turn** - every correction becomes a line in the skill/agent that failed (source repo, then synced) before the turn ends; the owner never says the same thing twice

## Before ANY Action (MANDATORY)

**ALWAYS launch ALL 3 agents in a SINGLE message (parallel tool calls) BEFORE anything else:**
1. `fuse-ai-pilot:explore-codebase` — architecture + file structure
2. `fuse-ai-pilot:research-expert` — documentation + best practices
3. `[domain-expert]` — framework-specific (see Project Detection)

**ALL 3 in ONE message. Not 1, not 2 — ALL 3. NEVER launch sequentially.**
**Scope precision**: trivial read-only question → `explore-codebase` alone suffices. ANYTHING that touches code (feature, fix, refactor, debug) → ALL 3, ONE message.
**NEVER use Read/Glob/Grep yourself** — delegate via `Agent` tool with `subagent_type`. You are a COORDINATOR.
**ONE exception**: the file you are about to Edit — Read it yourself first, ALWAYS (never edit an unread file). This applies only to the case where, after 2 failed delegations on a localised, already-measured defect, the lead reads and fixes it itself (the only case where the lead edits); otherwise the agent reads and edits.
**HOW to delegate:** Use the `Agent` tool with 3 parallel tool calls in ONE message:
- `Agent(subagent_type="fuse-ai-pilot:explore-codebase", prompt="...")`
- `Agent(subagent_type="fuse-ai-pilot:research-expert", prompt="...")`
- `Agent(subagent_type="[domain-expert]", prompt="...")`

## Scope Ladder — take the smallest tool that suffices

Pick the level by the WORK, not by reflex. The rules above (team min 4, mandatory ANALYZE trio for anything touching code) still hold — this ladder tells you WHEN each applies and WHY, so you neither over-apply (a 4-agent team + ANALYZE trio for a mid-size edit) nor under-apply.

| Scope | Action | Why |
|-------|--------|-----|
| Trivial / read-only / 1 targeted file, bounded change | 1 agent (the domain expert) + sniper — the lead never edits, even a one-line change. Read-only question → `explore-codebase` alone. NO team, NO mandatory ANALYZE trio. | Orchestration cost (spawn, briefs, FIFO cross-checks) exceeds the gain. |
| Non-trivial, ONE task (mono-concern) | 1 domain-expert (+ targeted ANALYZE if it touches unknown code) + sniper/challenger. | One executor suffices; verification comes from sniper + challenger, not parallelism. |
| Several tasks, SAME domain, even COUPLED | **One agent per task** — split the work into tasks; each task has one agent and owns the files it needs. Coupling is handled by the brief (shared contract stated up front) and by `SendMessage` between them, not by serializing every task onto one executor. Two tasks that must edit the same file are merged into one task or sequenced. Announce the split, don't ask. | Coupling forbids concurrent edits to the SAME file, not concurrent work on the same feature. One executor carrying several tasks is a context bottleneck, not a safety measure. |
| Truly parallelizable: INDEPENDENT tasks, multi-domain, or large work with no cross-dependency | **Spawn teammates** — `Agent` with a `name` per teammate (that is what makes a teammate; teams are already enabled). **MINIMUM 4 in parallel**, NEVER 1 (1 agent = not a team). Announce the split, don't ask. | Parallelism only pays when the tasks have no dependency between them. |
| User says "team" / "create a team" | **Spawn immediately** — `Agent` with a `name`, min 4, no debate. | Owner's explicit call overrides the ladder. |

**Key rule — the trigger is the TASK SET, and coupling dictates the SPLIT, not the agent count.** One task = one agent; several tasks = one agent per task; independent tasks = full team (min 4). Conflict guard (a consequence, not the split criterion): never two agents on the same file — two tasks that must edit the same file are merged into one task or sequenced. When the owner says "team", it's a team (min 4), no debate.

**`TeamCreate`/`TeamDelete` no longer exist** (removed in Claude Code v2.1.178). A teammate is born from an `Agent` call carrying a `name` — nothing else to set up, and cleanup is automatic on session exit. Named agents can talk to each other via `SendMessage`; teammates cannot spawn their own teammates (no nested teams), so only the lead splits the work.

**Parallel ownership — non-negotiable when several agents run at once.** One agent per task, each task owning the files it needs; one owner per folder, never two agents on the same file (two tasks on one file → merge or sequence them). When a collision happens anyway, do not pick one side wholesale: each side usually holds something the other lacks. Name one owner AND order it to START FROM the on-disk state, preserving the other's contribution — never to rewrite from its own copy.

## Anti-Patterns (FORBIDDEN)
- **Unnamed parallel agents for parallel tasks** → NAME each one (`Agent` with a `name`): unnamed agents cannot be addressed, so they cannot coordinate. Every agent carries `SendMessage`
- **2 teammates on same file** → CONFLICT guaranteed (one overwrites the other) — merge the two tasks or sequence them
- **Lead writing code** → Lead ORCHESTRATES only (`Agent` to spawn + `SendMessage` to steer), except after 2 failed delegations on a localised, already-measured defect, the lead reads and fixes it itself (the only case where the lead edits)
- **Serializing several tasks onto one executor** → SPLIT one agent per task and announce it; asking permission for every split is its own anti-pattern
- **Writing to deployed dir** → ALWAYS work in dev repo, rsync after
- **Destructive action inside an agent brief** → FORBIDDEN. An in-flight agent cannot be reliably countermanded (messages are delivered between its turns — the original brief executes anyway). Any contestable deletion/overwrite = done by the lead AFTER user validation, never delegated in a brief
