# Cleanup report: Codex / Kimi / Cursor ports (2026-11-16, 22:16-22:20 CET)

Scope: three port repos and their worktrees. Hands off kept: Kimi `h122` and the Kimi scratch dir (Kimi run pid 1051 alive, 07 min elapsed at start).

## Removed worktrees (merged into origin/main AND `git status --porcelain` empty, no --force)

| Repo | Worktree | Branch | `git branch -d` |
|------|----------|--------|-----------------|
| codex | codex-plugins-wt-prd | feat/harness-prd-mode | Deleted (was 75faf147) |
| codex | codex-plugins-wt-swift | feat/solid-swift-load-state | Deleted (was fbefffc0) |
| kimi | kimi-code-plugins-wt-swift | feat/solid-swift-load-state | Refused: "not fully merged". The branch IS an ancestor of origin/main, but `-d` compares to the checked-out HEAD (`fix/kimi-yolo-confirm-deny`). Branch kept; `-D` not run (not in mandate). |

`git worktree list` after: codex = 1 (main); kimi = main dir + brain, h122, pmem, port140, prdw; cursor = 2 (unchanged).

## Not removed (reason)

- Kimi brain, pmem, port140, prdw: merged, but inside the hands-off Kimi scratch dir and each holds untracked `node_modules` (porcelain not empty). Kept.
- Kimi h122: hands off.
- Cursor wt-swift: unmerged (+1) and dirty.

## Scratch

| Dir | Before | After | Action |
|-----|--------|-------|--------|
| codex | 1.8G | 1.8G | Trashed 2 empty/stale session dirs (24K + 0B): 5aa366bc..., 9bbb0d8a.... Skipped 1806af80 (1.8G, 411 files < 60 min, newest ~24 min, `realrun-prd`) and 80dff84b (5 files < 60 min). |
| cursor | 34M | 34M | Trashed 01e7e57b... (8K) and 681002e8... (0B). Skipped f621cc5b (34M, 4 files < 60 min). |

Trash: `~/.Trash/ports-scratch-2026-11-16/{codex,cursor}/`. Trashed total ~32K. The 1.8G Codex session was not freed: it is under the 60-minute rule. Re-run after ~23:20 to free it.

## Triage (nothing changed)

### Unmerged branches

| Branch | Content | Verdict |
|--------|---------|---------|
| kimi `fix/kimi-yolo-confirm-deny` (+1, 90036e5, 2026-11-13) | Shim forwards `[CONFIRM]` denies when Kimi cannot prompt; adds `kimi-permission-mode.mjs` in every plugin (88 lines each). `git cherry` = `+` (not on main by patch). origin/main only suppresses `[CONFIRM]` in the shim and has no `kimi-permission-mode.mjs`. `merge-tree` against origin/main: no conflict. | Worth a PR (not on main, merges clean). Branch is behind main by ~17+ commits, so rebase/merge main first. Currently checked out in the kimi main dir. |
| cursor `feat/solid-swift-load-state` (+1, bf5a22f) | Adds `state-machines.md` (186 lines) + LoadState edits to solid-swift references. File absent on origin/main. `merge-tree`: only `CHANGELOG.md` conflicts (bump-only). Branch base is old: `git diff origin/main bf5a22f` shows 166 files, so open the PR from a rebase, not from this tip. | Worth a PR (rebase on main, re-bump CHANGELOG). |

### Dirty trees

| Tree | File(s) | Nature | Verdict |
|------|---------|--------|---------|
| codex main | 10 `*.sh` templates (8 devops-expert, 2 hermes-expert); the "11 files" are 10 modified + 1 untracked dir | `git diff --numstat` = 0/0 on all. Mode change only `100644 => 100755`. No content or line-ending change. | commit (templates are scripts; +x is intended) or discard (`git checkout`); owner choice, nothing touched. Recommend commit via commit agent. |
| codex main | `docs/reports/2026-11-15-codex-coordination-amnesia-audit.md` (untracked, 23 KB) | Audit report from 2026-11-15 | keep, commit with the mode change. |
| kimi main dir | (reported: `.kimi-code/`, `.kimi/`, `MEMORY/LESSON.md`, `docs/decisions.md`, an untracked doc) | At check time (22:19) `git status --porcelain` and `git diff --stat` are EMPTY. Already committed, ignored or cleaned by another agent. | nothing to do; not re-verified beyond status. |
| kimi brain, pmem, port140, prdw | `node_modules` (untracked, 1 entry each) | Installed deps in scratch worktrees | discard with the worktree later (merged branches); not touched (hands off). |
| cursor wt-swift | `docs/real-test-solid-swift-load-state-2026-11-13.md` (untracked) | Real-test report, verdict BLOCKED (Cursor usage limit hit mid-run, no Swift produced, criteria not run). | keep; commit with the branch PR, or redo the test. Do not remove the worktree before. |

## Not verified

- Kimi main dir "dirty" list from the brief no longer matches disk (clean now).
- `git branch -d` for kimi `feat/solid-swift-load-state` left as is.
