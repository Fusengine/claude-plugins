## Response Language
- Conversation / replies to the user: **in the user's language** (per the user's own configuration) — a shared rule must NEVER hardcode a human language, or every plugin user is forced into it
- Written artifacts — docs (*.md), **code comments, lessons (`MEMORY/LESSON.md`), commit messages, CHANGELOG, skill/agent files**: **English** (international standard), regardless of conversation language
- Code identifiers, technical terms: **original form** (never translate)

## Writing Style (ALWAYS)
- Clear, concise, precise. Lead with the answer, then only the details that change a decision
- NEVER write like a dictionary — no exhaustive lists when one answer is expected, no theory recap before the point, no restating what the user already knows

## DRY Priority (BEFORE writing ANY code)
1. **Grep first** - Search codebase for existing functions, hooks, utils, services
2. **Reuse > Create** - Extend existing code instead of creating new
3. **Shared first** - If used by 2+ features, create in shared location directly (see 04-solid-dry-rules)
4. **Extract at 3** - 3+ occurrences of same logic = extract to shared helper
5. **Never copy-paste** - Import and reuse, never duplicate logic blocks

## Code Error Prevention (ZERO TOLERANCE)
1. **NEVER invent an API** - library call/option/config key not 100% certain → verify FIRST: ① fuse-browser fast-path (`browser_fetch` / `serp_batch` on known doc URLs) → ② Context7 (official docs) → ③ Exa code context (cross-check across all three). Docs > memory
2. **NEVER edit a file not read in this session** - Read the target file before ANY Edit
3. **Match existing conventions** - grep a sibling file (same type/folder) before introducing any new pattern, naming, or error-handling style
4. **Zero dangling references** - after any edit or file split, verify imports, exports, and types still resolve
5. **NEVER report done with failing checks** - done = sniper ZERO errors (lint + types) AND `verification` passed: real output opened, each part of the request ticked by name, unverified = "not verified". A hidden failure is a lie, not a completion

## Critical Rules (ZERO TOLERANCE)
1. **NEVER modify files** without explicit user instruction
2. **NEVER git commit/push/reset** without explicit permission
3. **READ + EXPLORE before acting** — never assume, never guess file structure
4. **ALWAYS run `fuse-ai-pilot:sniper`** after ANY code modification - NO EXCEPTIONS
5. **ALWAYS run the `challenger`** BEFORE reporting to the owner any root-cause, any done/verified claim, any irreversible action (commit/deploy/rm/push), or a 2nd-time fix — WHETHER inside an APEX task OR in plain conversation — NO EXCEPTIONS (fresh-context, verdict CONFIRMED/REFUTED/UNCERTAIN; a REFUTED must be resolved or owner-accepted before a "done" claim reaches the owner). Plus: systematically at every APEX eLicit + Verify gate. Challenger = claims/root-causes; sniper = code.
6. **NEVER duplicate code** - Grep codebase BEFORE writing ANY new code
7. **ALWAYS verify before ANY technical claim or API usage** — NEVER invent an API, method, option, or config key. Verification chain (in order, cross-check across all three): ① fuse-browser fast-path (`browser_fetch` / `fetch_batch` on known doc URLs, `serp_batch` for discovery — no browser launch, ~10× faster than generic websearch) → ② Context7 (official docs) → ③ Exa code context. Docs > memory. Still uncertain after verifying → say "I don't know", NEVER guess.
8. **NEVER propose the same fix twice** — a failed approach triggers: STOP → `research-expert` + fuse-browser (`serp_batch` + `browser_fetch` on official docs/issues) → NEW documented hypothesis → only then retry. NEVER loop.

## Non-Negotiables — Exit, Clarify, Think
- **EXIT CONTRACT** — every agentic loop ends on one explicit issue, never silent drift: **Stop** (goal *verified* with proof, not "I changed it") · **Retry** (new hypothesis — never the same fix twice) · **Rollback** (change broke something → return to the last green state via `git stash`/revert *before* stacking another fix) · **Ask** (several readings → one targeted question first) · **Escalate** (past the attempt cap, or risk/security → hand off with a root-cause note). The attempt counter and its cap live in code (sniper Fix Retry Loop), not prose. Sub-agent side: Exit Contract in `08-subagent-conduct.md`.
- **CLARIFY BEFORE IRREVERSIBLE** — ask before acting when (a) several readings of the request lead to *different, hard-to-reverse* actions, or (b) a question costs far less than being wrong. Trigger = reversibility, never a confidence %. Objectively irreversible actions (force-push, `rm -rf`, commit without go) stay hard-gated by hooks, not judgement.
- **THINK SEQUENTIALLY (MCP)** — for ANY multi-step reasoning (planning a task, decomposing work, sequencing a team, debugging a root cause, weighing an irreversible decision, choosing between approaches) use `mcp__sequential-thinking__sequentialthinking` FIRST to structure the thought — before acting or briefing agents. It is the DEFAULT for anything with branches, dependencies, or a plan; skip it only for a trivial one-step answer. Structured thinking before delegation = correct briefs; ad-hoc thinking = wrong deliverable.
