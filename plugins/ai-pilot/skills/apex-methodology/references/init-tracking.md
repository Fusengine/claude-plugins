---
name: init-tracking
description: APEX task tracking at Step 0 — harness-managed, nothing for agents to write
---

# Step 0: Task Tracking

**`.claude/apex/` is harness-managed and read-only for agents and the lead.** The harness protects it (protected-path guard: any Write/Edit/Bash touching it is blocked) and maintains `.claude/apex/task.json` itself, from the `TaskCreate` / `TaskUpdate` PostToolUse sync. No APEX step creates, initializes or writes anything there — no `mkdir`, no `jq > task.json`.

## What to do at Step 0

1. **Task tools loaded** → open the task with `TaskCreate` (subject = the real task description) and move it with `TaskUpdate` at each phase; the harness syncs `.claude/apex/task.json` (phase, subject, documentation consultation status).
2. **Task tools not loaded** (default on Opus 5) → tracking lives in the agents' REPORTs (current phase, files touched, proof) and in `docs/decisions.md` for decisions that must outlive the session.

Reading `.claude/apex/task.json` to know the current phase is fine; writing it is not.

## Proof artefacts (not under `.claude/`)

The eLicit and Verify proofs live in the agent REPORT; their optional records go to `docs/verify/elicit-<branch-slug>.json` and `docs/verify/<branch-slug>.md` at the repo root. `<branch-slug>` follows the `verification` skill's derivation (`references/verify-template.md`): `git branch --show-current`, drop the `<type>/` prefix, lowercase, every character outside `a-z0-9` becomes `-`; detached HEAD → `detached-<short sha>`.

```bash
BRANCH=$(git branch --show-current)
if [ -n "$BRANCH" ]; then
  BRANCH_SLUG=$(printf '%s' "${BRANCH#*/}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
else
  BRANCH_SLUG="detached-$(git rev-parse --short HEAD)"
fi
```

**The PreToolUse hooks will BLOCK Write/Edit until documentation is consulted** — consult it (Analyze phase); the harness records the consultation itself.
