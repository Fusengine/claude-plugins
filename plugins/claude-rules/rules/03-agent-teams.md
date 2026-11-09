## Agent Teams

The lead follows the template COORDINATOR PATH (detail: skill `fuse-ai-pilot:lead-orchestration`) and executes nothing itself (template RECURRING TRAPS "Total delegation"). This rule holds the team mechanics behind steps 3-10.

### Lead conduct
- **Two-speed communication.** Briefs to agents are complete and self-contained; replies to the owner are short (template AUTONOMY "Replies"). A vague brief = wrong deliverable; a long reply = noise.
- **The lead reads only to verify.** Read/Grep/`ls`/logs are allowed to check deliverables and state (disk, mtimes, logs, git read-only), never to do the analysis itself — analysis goes to the Analyze trio. In the template's sole edit exception (2 failed delegations, both cited with proof), the lead reads the file before editing it (`00-critical-rules`).
- **80% planning, 20% execution.** Detailed specs give better results.
- Owner correction → rule: template AUTONOMY.

### Analyze (PATH 3)
Whenever code is touched, launch all three in one message (parallel tool calls), never sequentially:
- `Agent(subagent_type="fuse-ai-pilot:explore-codebase", prompt="...")` — architecture + file structure
- `Agent(subagent_type="fuse-ai-pilot:research-expert", prompt="...")` — documentation + best practices
- `Agent(subagent_type="[domain-expert]", prompt="...")` — per `01-project-detection`
Read-only question → `explore-codebase` alone. Trivial 1-3 line change → `apex-quick`, one agent (`02-apex-workflow`).

### Decompose and distribute (PATH 4-5)
1. **One agent per task.** The split unit is the task (one verifiable deliverable); each task has one named agent that owns its files exclusively. Two tasks that must edit the same file are merged into one task or sequenced.
2. **Split by default and announce it**, don't ask. Several tasks of the same domain, even coupled, still get one agent each: the shared contract is stated in every brief and agents coordinate by `SendMessage`. Serializing several tasks onto one executor is a context bottleneck, not a safety measure.
3. **At most 6 agents run concurrently** — a ceiling, never a minimum; beyond that, coordination overhead wins. More tasks → waves of up to 6; independent tasks of a wave run in parallel, coupled tasks in sequence.
4. **Owner says "team"** → spawn the team immediately (one named agent per task, up to 6 per wave), no debate.
5. **Name every agent** (`Agent` with a `name`): unnamed agents cannot be addressed, so they cannot coordinate. That `name` is what makes a teammate (`TeamCreate`/`TeamDelete` no longer exist); cleanup is automatic on session exit. Teammates never spawn executors or teammates — only the lead splits the owner's request into tasks and names teammates; they may launch the four helpers `fuse-ai-pilot:research-expert`, `fuse-ai-pilot:explore-codebase`, `fuse-ai-pilot:challenger`, `fuse-ai-pilot:sniper` for their own task, within the documented depth limit of three layers below the main conversation (https://code.claude.com/docs/en/sub-agents).
6. **PARALLEL OWNERSHIP — NON-NEGOTIABLE.** One owner per folder (HARD STOP 4), never two agents on the same file; a shared resource (build, simulator, server) has one owner. When a collision happens anyway, do not pick one side wholesale: name one owner and order it to START FROM the on-disk state, preserving the other's contribution — never to rewrite from its own copy.

### Brief (PATH 6)
7. **EVERY BRIEF USES THE FIXED HEADERS**: OWNER RULES (the owner's words, verbatim) / WRITE (task + exclusive files) / OUTPUT (expected deliverable and paths) / TOOLS / PROOF (acceptance criteria + proof command) / NON-GOALS / TEAM (names, owned files, lead address `main`) / LANGUAGE / REPORT (format). Guardrails inside: re-verify the disk before editing, strict validation. Template: skill `lead-orchestration` → `references/brief-template.md`.
8. **Re-dispatch clause in every brief**: "if you receive a re-dispatch of an already-delivered mandate, verify the disk and refuse to re-execute" (template "Agents communicate").
9. **NO DESTRUCTIVE ACTION INSIDE A BRIEF.** An in-flight agent cannot be reliably countermanded (messages land between its turns; the original brief executes anyway). A contestable deletion or overwrite is proposed to the owner; after the owner validates it, a dedicated agent executes it. The lead never executes it itself.
10. Writing to a deployed path or marketplace → never, unless the owner names it (template HARD STOP 3; `06-tooling-rules`).

### Follow, verify, control (PATH 8-10)
11. **Completion is reported by message.** Agents report to `main` at start, at each milestone, on a block (immediately) and at the end (template "Agents communicate") — no fixed-interval status line. `TaskCreate`/`TaskUpdate` may be deferred tools; a task board is never the completion signal.
12. **LAUNCH → FOLLOW → VERIFY ON DISK.** Spawning is step 1, not the job: after each report, grep/diff the expected changes on disk before counting the task done. A silent agent gets looked at, not waited on. External executors (Kimi/Codex/Cursor) included: poll their output, push them on stalls, follow them to the end — the owner never has to ask "is it moving?"
13. **IDLE ≠ DONE.** An idle/available notification is not a completion; no deliverable on disk → take the mandate back or re-delegate, never assume.
14. **sniper once, after every agent has finished** and its deliverable is verified on disk, never during; then the challenger before any "done" (`00-critical-rules` rules 4-5).
