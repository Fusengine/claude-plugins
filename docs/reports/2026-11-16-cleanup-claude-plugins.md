# Cleanup report: claude-plugins worktrees and scratch (2026-11-16)

## Worktrees (before: 5 entries, after: 2)

| Worktree | Branch | State | Action |
|---|---|---|---|
| claude-plugins-wt-senior | feat/lead-senior-mode | merged, clean | removed, `git branch -d` ok (was ca0776e9) |
| claude-plugins-wt-swift | feat/solid-swift-load-state | merged, clean | removed, `git branch -d` ok (was ffcd5bc7) |
| wt-template-scope-and-tone | chore/template-scope-and-tone | merged, clean | removed, `git branch -d` ok (was 6b64974c) |
| claude-plugins-wt-loader | perf/hooks-loader-dedupe | merged, 5 dirty files | kept (dirty, owner decides) |

All branches: 0 commits ahead of origin/main (97ceb21d).

## Scratch

- 69 session subfolders, all files older than 60 min, moved to `~/.Trash/claude-plugins-scratch-2026-11-16/` (40K total).
- Protected and untouched: `2723977a-...` and `928c2cb8-...`. The 2.6 GB is entirely inside them: scratch is still 2.6G after the move.

## wt-loader triage (nothing touched)

Owner decision on record (c09d0571): "harness dedupe left out". The doc itself says "abandoned, equivalence corpus FAILED"
(PreToolUse Edit .ts loses the APEX deny with dedup).

| File | Nature | On origin/main? | Verdict |
|---|---|---|---|
| scripts/hooks-loader.ts (M, 3+/2-) | wires `dedupeHooks` | file exists, change absent | discard (abandoned, breaks a deny) |
| scripts/src/services/hook-dedupe.ts (??) | dedupe helper | no | discard |
| scripts/src/__tests__/hook-dedupe.test.ts (??) | unit test of helper | no | discard |
| scripts/src/__tests__/hooks-loader-dedupe.test.ts (??) | loader spawn-count test | no | discard |
| docs/perf-hooks-loader-dedupe-2026-11-13.md (??) | negative-result write-up with evidence | no | keep (unique evidence; commit to docs/ if the owner wants the record) |

Discarding needs the owner's go: wt-loader and its branch remain until then.
