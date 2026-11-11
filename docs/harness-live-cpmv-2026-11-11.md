# Live cp/mv/install/ln onto code file - real Bash tool run

Header
- Date: Wed Nov 11 21:18:16 CET 2026 (run 21:18:40 - 21:20:43)
- sha256 installed bin.mjs: 7cd359748bb2162fbfff2fa347643bbfbee318b1f41569a6cb5758db45c9bd0b (matches the expected build)
- claude --version: 2.1.322 (Claude Code)
- Throwaway project: /private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/live-cpmv/ (git init, package.json, src/a.ts, old.ts, file.ts, notes.txt, docs/; `../noread` created beside it)
- Setup: `ls > /tmp/live-cpmv-x`, `ls / > /tmp/live-cpmv-y` (both allowed).
- Each command was its own Bash call with `cd <project> &&` in front. For safe observation I appended `; echo rc=$?; ls ...` after the tested command (f also had `date +%T &&` in front); the tested command itself is unchanged.
- No retries with variants. Every stray file produced by a FAILURE was moved to `~/.Trash/` (`live-cpmv-a-t.ts`, `-b-t2.ts`, `-c-n.ts`, `-d-i.ts`, `-e-l.ts`).

## Results

| # | Command | Expected | Observed | Target changed on disk | Match |
|---|---------|----------|----------|------------------------|-------|
| a | `cp /tmp/live-cpmv-x t.ts` | DENY | ALLOW (ran, no message) | yes, t.ts created, shasum identical to the source | NO - FAILURE |
| b | `mv /tmp/live-cpmv-y t2.ts` | DENY | ALLOW (rc=0) | yes, t2.ts created, source gone | NO - FAILURE |
| c | `cp notes.txt src/n.ts` | DENY | ALLOW (rc=0) | yes, src/n.ts created (16 bytes) | NO - FAILURE |
| d | `install /tmp/live-cpmv-x src/i.ts` | DENY | ALLOW (rc=0) | yes, src/i.ts created (mode 755) | NO - FAILURE |
| e | `ln /tmp/live-cpmv-x src/l.ts` | DENY | ALLOW (rc=0) | yes, src/l.ts created (hard link, nlink 2) | NO - FAILURE |
| f | `cp -r ../noread docs/nr; git push --force origin main` | DENY | DENY | no, docs/ stayed empty | yes |
| g | `cp src/a.ts src/b.ts` | ALLOW | ALLOW | src/b.ts created | yes |
| h | `mv old.ts new.ts` | ALLOW | ALLOW | new.ts present, old.ts gone | yes |
| i | `cp -r src/ backup/` | ALLOW | ALLOW | backup/ created with a.ts, b.ts | yes |
| j | `cp file.ts /tmp/live-cpmv-out.ts` | ALLOW | ALLOW | /tmp/live-cpmv-out.ts created | yes |
| k | `cp $PWD/src/a.ts src/a11.ts` | ALLOW | ALLOW | src/a11.ts created | yes |
| l | `pushd src && cp a.ts c.ts` | ALLOW | ALLOW | src/c.ts created | yes |
| m | `ls > /tmp/live-cpmv-z` | ALLOW | ALLOW | /tmp/live-cpmv-z created (147 bytes) | yes |
| n | `git mv new.ts renamed.ts` | ASK / previous | ALLOW by the hook (no prompt); git itself failed: `fatal: not under version control, source=new.ts, destination=renamed.ts` (rc=128, new.ts untracked) | no | previous verdict (no ask) |

Hook message for f, verbatim:

```
PreToolUse:Bash hook error: [BLOCKED] Destructive git command
Destructive git command: cd /private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/live-cpmv && date +%T && cp -r ../noread docs/nr; git push --force origin main; echo rc=$?; ls -d docs/nr
Next:
  1. Use a non-destructive alternative (e.g. --force-with-lease; avoid --hard / -D)
```

The block on f comes from the pre-existing destructive-git gate, not from the new cp/mv rule (it blocks the whole command line, and `cp -r ../noread docs/nr` did not run).

## Count

- Matches: 9 of 14 (f, g, h, i, j, k, l, m, n-as-previous-verdict)
- Mismatches: 5 (a, b, c, d, e) - expected DENY, all five ran and wrote the code file. CORRECTION: all pass-1 targets lived under the session scratchpad (`/private/tmp/...`), so this does not by itself prove the hole is open in a real project (see second pass).

## One-line notes per mismatch

- a-e: the rule did not fire for targets under the scratchpad. The "stale hook build" hypothesis is refuted by the second pass (the same session blocks the same commands inside the real repo).
- Side finding: Write of `.ts` files into the throwaway project was blocked first by the APEX SOLID-docs gate until the listed solid-generic references were read (complied, then written). Write hooks also asked for sniper on the fixtures; skipped, they are throwaway files.

## Second pass — target inside a real project

Change vs pass 1: one variable, the target location. Throwaway dir `claude-plugins/live-cpmv-probe/` inside the real repo (untracked, no `git init`; `src/a.ts`, `old.ts`, `notes.txt` written with Write). Same session, same build (sha256 7cd35974...), run around 21:21-21:22. `/tmp/live-cpmv-x` and `-y` recreated first. Each command was its own Bash call with `cd <probe> && ` in front (the a2-abs row has no `cd`, absolute target). The calls were sent in parallel batches; the hook judged each independently.

| # | Command | Expected | Observed | Target on disk |
|---|---------|----------|----------|----------------|
| a2 | `cp /tmp/live-cpmv-x t.ts` | DENY | DENY | no |
| b2 | `mv /tmp/live-cpmv-y t2.ts` | DENY | DENY | no (source still in /tmp) |
| c2 | `cp notes.txt src/n.ts` | DENY | DENY | no |
| d2 | `install /tmp/live-cpmv-x src/i.ts` | DENY | DENY | no |
| e2 | `ln /tmp/live-cpmv-x src/l.ts` | DENY | DENY | no |
| a2-abs | `cp /tmp/live-cpmv-x <repo>/live-cpmv-probe/t3.ts` (no cd) | DENY | DENY | no |
| g2 | `cp src/a.ts src/b.ts` | ALLOW | ALLOW | yes (src/b.ts) |
| h2 | `mv old.ts new.ts` | ALLOW | ALLOW | yes (new.ts, old.ts gone) |

Hook message, verbatim (a2; same shape for the others):

```
[BLOCKED] Bash write to code file
cp onto a project code file from a source that is not a code file inside the project (/tmp/live-cpmv-x) — Use Write/Edit tools instead
Next:
  1. Use the Write/Edit tool instead
```

Other rows differ only in the verb and the parenthesised source: b2 `mv ... (/tmp/live-cpmv-y)`, c2 `cp ... (notes.txt)`, d2 `install ... (/tmp/live-cpmv-x)`, e2 `ln ... (/tmp/live-cpmv-x)`, a2-abs `cp ... (/tmp/live-cpmv-x)`.

Count: 8 of 8 match, 0 mismatches. Disk check: only `new.ts`, `notes.txt`, `src/a.ts`, `src/b.ts` existed in the probe; no t/t2/n/i/l/t3 file.

Conclusion: the pass-1 result was a scratchpad artefact (targets under `/private/tmp/...` are not a proven project root, so the guard does not apply), not a hole in a real project. The "stale hook build" hypothesis is refuted: the same session blocks the same commands inside the real repo. Whether temp-zone targets should also be protected is a design question, not tested here.

Cleanup: probe dir moved to `~/.Trash/live-cpmv-probe-2026-11-11`. `git status --short` afterwards:

```
 M docs/decisions.md
?? docs/harness-live-cpmv-2026-11-11.md
```
(`docs/decisions.md` was already modified before this task.)

Side note (pass 2): a heredoc append of this section to the report was itself blocked by the hook ("heredoc redirected into a file — Use Edit/Write tools instead"); complied and used Edit.

## Third pass — build a3d4855

- Measured sha256 of the installed bin.mjs: `17a4c2567e8c92b54fa0ee513921963ce8fb23f808b06a51bebc9ed4d14e6125` (matches the announced a3d4855 build). Run 21:49 - 21:52, same session, `claude` 2.1.322.
- P = the pass-1 scratchpad project (reused; `src/` already held a.ts, a11.ts, b.ts, c.ts). Q = `claude-plugins/live-cpmv-probe/src/` (empty). One Bash call per row, strictly sequential, no suffix after the tested command; the disk was checked in a separate call at 21:51:28. Exact per-row clock times were not captured (rows ran within roughly 21:51); the a3 row had a stray `date +%T;` prefix and was blocked anyway.
- Payload cwd stayed claude-plugins for every row.

| # | Command | Expected | Observed | Target on disk |
|---|---------|----------|----------|----------------|
| a3 | `cd P && cp /tmp/live-cpmv-x t.ts` | DENY | DENY | no |
| b3 | `cd P && mv /tmp/live-cpmv-y t2.ts` | DENY | DENY | no (source still in /tmp) |
| c3 | `cd P && cp notes.txt src/n.ts` | DENY | DENY | no |
| d3 | `cd P && install /tmp/live-cpmv-x src/i.ts` | DENY | DENY | no |
| e3 | `cd P && ln /tmp/live-cpmv-x src/l.ts` | DENY | DENY | no |
| r3 | `cd <kimi-code-plugins> && cp /tmp/live-cpmv-x live-cpmv-stray.ts` | DENY | DENY | no |
| q3 | `cd Q && cp /tmp/live-cpmv-x t.ts` | DENY | DENY | no |
| x3 | `cp <codex-plugins>/scripts/fix-agent-toml.ts <Q>/src/ported.ts` | ALLOW | ALLOW | yes (1536 bytes) |
| g3 | `cd P && cp src/a.ts src/b.ts` | ALLOW | ALLOW | yes (b.ts overwritten, mtime 21:51) |
| j3 | `cd Q && cp src/ported.ts /tmp/live-cpmv-out.ts` | ALLOW | ALLOW | yes (1536 bytes) |

Count: 10 of 10 match, 0 mismatches. Notable: a3-e3 are now DENIED although P is under the scratchpad (pass 1 let them through), and the cross-repo code copy (x3) is allowed as the owner decided.

Hook message, verbatim (a3; same shape for every deny, only verb and parenthesised source change):

```
[BLOCKED] Bash write to code file
cp onto a project code file from a source that is not a code file inside the project (/tmp/live-cpmv-x) — Use Write/Edit tools instead
Next:
  1. Use the Write/Edit tool instead
```
b3 `mv ... (/tmp/live-cpmv-y)`, c3 `cp ... (notes.txt)`, d3 `install ... (/tmp/live-cpmv-x)`, e3 `ln ... (/tmp/live-cpmv-x)`, r3 and q3 `cp ... (/tmp/live-cpmv-x)`.

Cleanup: Q moved to `~/.Trash/live-cpmv-probe-pass3-2026-11-11`. `git status --short`:
- claude-plugins: ` M docs/decisions.md` only (the report file no longer shows as untracked; it was apparently committed meanwhile, not by me).
- kimi-code-plugins: `?? docs/real-conditions-kimi-cli-2026-11-11.md` only.
