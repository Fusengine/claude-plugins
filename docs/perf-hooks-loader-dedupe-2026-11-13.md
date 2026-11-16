# Hooks loader dedupe: abandoned (verdict changes)

Date: 2026-11-13. Branch: `perf/hooks-loader-dedupe` (worktree `claude-plugins-wt-loader`). Status: abandoned, diff left uncommitted.

## Idea

`scripts/hooks-loader.ts` spawns one harness process per plugin hook. On PreToolUse Edit, 14 of 17 children run the same bare command
(`bun .../@fusengine/harness/dist/cli/bin.mjs hook claude-code`). The change ran each distinct expanded command once on
PreToolUse/PostToolUse (`scripts/src/services/hook-dedupe.ts`, wired in `hooks-loader.ts`).

## Dedup key and evidence

- Key: the command string after `$HOME` expansion, plugin path ignored, only for the harness bin on PreToolUse/PostToolUse.
- The only env difference between children is `CLAUDE_PLUGIN_ROOT` (`hook-executor.ts:34`).
- Harness 0.1.115 reads it only in `notification-sound.ts:40`, `rules-root.ts:91`, `inject-apex.ts:42`,
  `cartographer/session-start.ts:18`, `adapters/cursor/plugin-root.ts` (none on PreToolUse/PostToolUse).

## Tests (green)

`hook-dedupe.test.ts` (unit) and `hooks-loader-dedupe.test.ts` (real loader, counting harness stand-in; RED before: 5 spawns for 5 plugins).
Full `scripts` suite: 432 pass, 0 fail; `tsc --noEmit` exit 0.

## Equivalence corpus: FAILED

14 cases (Pre/Post x Bash `ls`, Bash code-write, `git push`, `rm -rf`, Edit .ts, Write .md, Write .ts), real installed plugin set
symlinked read-only into a sandbox HOME, fresh session id per case. Baseline stable over 3 runs; with dedup stable over 3 runs, but:

- PreToolUse Edit .ts: baseline `deny` (APEX: explore + research required); with dedup only the SECURITY `additionalContext`. The deny is lost
  (first diff at byte 1702, line 44 of the corpus JSON).
- PreToolUse Write .ts: `deny` kept, but a `systemMessage` is added.
- The other 12 cases are byte-identical (deny on Bash code-write, ask on `git push` and `rm -rf`, allows).

## Ruled out

- Harness rendezvous: `FUSE_HARNESS_RENDEZVOUS=0` gives the same divergence.
- `CLAUDE_PLUGIN_ROOT` dependence on tool events (see the list above).

## Open hypothesis (unproven)

The 14 bare children are not equivalent: sibling shared state or execution order (the harness has a fan-out `burst-window`, deny-loop and
freshness state) makes the emitted verdict depend on how many identical siblings run.

## Implied risk (unverified)

If an Edit deny depends on the number of identical siblings, it may vanish when plugins are disabled or removed. Not tested.

## Not done

Before/after CPU and wall measurements, real `claude -p` session, challenger, sniper: skipped, since equivalence failed.
