# Cleanup fuse-harness — 2026-11-16

## Done
- Worktrees: 31 -> 13. 18 removed with `git worktree remove` (no --force): all merged into origin/main, status empty, mtime older than 5 min.
  - Branch worktrees (12): receipt, wt-docs, wt-f1, wt-f3, wt-f4, wt-guards, wt-noask, wt-prd, wt-prdinit, wt-prdpath, wt-release, wt-wc.
  - Detached bases (6): wt-f5-base, wt-mainbase, wt-prd-base, wt-prdinit-base, wt-prdpath-base, wt-wc-base.
  - Kept: wt-f1-base1 (dirty). The main checkout was untouched.
- Local branches `git branch -d`: 8 deleted (fix/receipt-own-writes, fix/bash-write-monotone, fix/fail-open-paths, feat/lead-outcome-scope-guards, fix/commit-agent-no-ask, fix/prd-bootstrap-resume, fix/prd-init-idempotent, fix/prd-report-path). 4 refused by `-d` (not merged to the HEAD of the main checkout, which sits on fix/bash-write-ask-to-block): docs/rm-confirm-relay, fix/git-rm-patterns, fix/lead-guards-receipt-noask, fix/precommit-worktree. All 4 are ancestors of origin/main (verified), so they hold no unique work. Kept, no `-D`. Remote branches untouched.
- Scratch dir: 4 session folders moved (not removed) to `~/.Trash/harness-scratch-2026-11-16/`. Before 20G, now 0B; the Trash holds 20G. Nothing was newer than 60 min.
- Note: the main checkout is on `fix/bash-write-ask-to-block`, not `main`.

## Triage: unmerged branches
Each is a single commit that merges cleanly into origin/main, and `git cherry` shows `+` (no equivalent patch on main).

| Branch | What it does | Verdict |
|---|---|---|
| fix/one-shot-crediting | Credits the Bash-write gate in one-shot tracking when the denied target is fixed via Write/Edit. 9 files, +360/-68; new one-shot-target.ts. | worth a PR (code absent from main) |
| fix/tool-payloads | Normalizes NotebookEdit/MultiEdit payloads to Edit so the write gates see them. New write-tool-aliases.ts and a test. | worth a PR (file absent from main) |
| test/hermetic-flakes | Makes 3 flaky tests hermetic (pins SOLID_FILE_LIMIT, the REPEAT window, signed-line seeding). Tests only. | worth a PR |
| test/robust-heredoc-perf | Takes the min of 5 samples in the 500-heredoc lexer perf test. Main already uses min-of-3 on the sibling test but not on this one. | worth a PR (tiny, tests only) |

## Triage: dirty worktrees

| Worktree / file | Nature | Verdict |
|---|---|---|
| main checkout: MEMORY/LESSON.md (+1), docs/decisions.md (+165) | owner journal, real changes | keep (commit via the commit agent) |
| main: docs/real-condition-results-2026-11-11.md | real-run report, absent from main | keep (commit under docs/) |
| main: logs_2.sqlite (0 B), t2.sh (119 B) | scratch artifacts | discard (Trash) once the owner agrees |
| main: .kimi/, .kimi-code/ | Kimi tool dirs, dated Oct 9 | keep or gitignore (owner's call) |
| wt-mac: 9 M (integrity, session-state, store, track-compact, track-journal + 4 tests) and 7 untracked (track-chain.ts, track-verify.ts, 4 receipt-mac tests, mac-track helper) | real code, MAC binding of the receipt; absent from main | keep, commit and PR |
| wt-fa: 2 M (protected-path.ts, paths.ts) and 7 untracked (protected-path-commands/targets.ts, receipt-tamper tests and probe) | real code, receipt-tamper guard; absent from main | keep, commit and PR |
| wt-f1-base1: 6 untracked (monotone-atoms/contexts/measure/oracle, monotone-verdict, bash-write-monotone/) | 4 helpers byte-identical to main; verdict.ts and cpmv.test.ts differ from main | discard the identical files; before discarding, compare verdict.ts and cpmv.test.ts with main (probably older drafts) |
| wt-codexrm: docs/codex-rm-rule-2026-11-13.md | doc edit: "Blocked" section rewritten as "Install" (owner installed it at 11:29) | commit (docs fix) |
| wt-rdvfix: docs/reports/2026-11-15-rdv-sim-root-cause.md | real report (rdv-sim flake = NOISE), absent from main | commit |
| wt-combined, wt-cxweb, wt-remote: node_modules | symlink to the main checkout's node_modules | discard (the symlink only, never the target) |

Not verified: whether mac and fa overlap with later receipt commits on main. Their files are absent on main, but I did not run their tests.
