# Bash-write gate battery on the installed harness build (2026-11-11)

Owner: `bw-battery` (read-only measurement; nothing in the fuse-harness repo, `~/.claude` or `~/.codex` was written).
Started 2026-11-11 16:32:38 CET, ended 2026-11-11 16:57 CET.

## Verdict

**REGRESSIONS: NONE.** 284 cases, 0 hook errors, 0 live-vs-replay mismatches, 0 run-to-run differences (two full replays compared, 278 cases at that time, identical verdict vectors).

- No case went allow->ask/deny or deny->ask/allow except through the two intended changes.
- Every HARDENED row (35, all ask->deny) is a purely literal text write (`echo`/`printf`/`cat <<EOF`/`tee <<EOF`/`tee <<<`, also chained after `&&` or `cd <abs> &&`) to an ordinary non-code file: intended change 1. (`cat <<< 'x' > file` was already deny in 0.1.115, C241/C242 UNCHANGED.)
- Every RELAXED row (23, all ask->allow) is the output of one allowlisted single-command producer redirected to a direct child of `/tmp`, `/private/tmp` or the literal `$TMPDIR` path: intended change 2. The producer allowlist is **readers** (`ls`, `pwd`, `cat`, `head`, `wc`, `sort`, `grep`, ...), read-only `git status|diff|log|show`, **and runners** (`bun test|run`, `npm test|run`, `npx`, `bunx`, `tsc`, `biome`, `eslint`, `prettier`, `ruff`, `pyright`, also behind a `VAR=x` prefix or `timeout N`). Runners execute arbitrary code (the challenger showed `npx prettier --write $S/src/x.ts > /tmp/x` goes ask -> allow, `tsc -p` can emit files), but the same commands without the redirect are already allowed in 0.1.115, so no new capability; the rows C256-C258 are runners, not read-only tools.
- Everything else is byte-identical between the installed build and 0.1.115, including the deny/ask message text.

| Class | Count |
|---|---|
| UNCHANGED | 226 |
| HARDENED (change 1) | 35 |
| RELAXED (change 2) | 23 |
| REGRESSION | 0 |
| ERROR | 0 |

Live layer: 42 real Bash tool calls (14 denied, 28 allowed and executed), every one matches its replay verdict.

## Builds tested

| Build | Path | sha256 of `dist/cli/bin.mjs` |
|---|---|---|
| installed (commit aa1d13c, 16:26 today) | `~/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/dist/cli/bin.mjs` | `3d38651f7db7c92c404e79ea5590474776f0283badeca1ab8845d714e8ac02cb` (re-checked at the end, unchanged) |
| previous (0.1.115) | same package, `dist.bak-2026-11-11-0115/cli/bin.mjs` | `5944a2ea9aacd221544ced9dff109b629b93e4ebcfe02488301958334dadf007` |

## Method

- **Invocation form** (taken from the installed `core-guards/hooks/hooks.json`, not guessed): `bun <PKG>/dist/cli/bin.mjs hook claude-code`, JSON payload on stdin. Verdict read from stdout `hookSpecificOutput.permissionDecision` (`deny` / `ask` / empty = allow).
- **Payload**: `{session_id, cwd, hook_event_name:"PreToolUse", tool_name:"Bash", tool_input:{command}, scratchpad_dir}`; `cwd` = the scratch project, `scratchpad_dir` = the session scratchpad. Family `nocwd` omits both fields.
- **Isolation**: fresh `session_id` per case and per build, `HOME` pointed at `$S/home` on the command line only (the real `~/.fuse-harness` was never touched), real `TMPDIR` kept (the `$TMPDIR` window needs it).
- **Live layer**: real Bash tool calls from this session (hooks = the installed build). Commands that would only ask the owner were NOT run live (they went to replay only), so no owner prompt was triggered.
- **Classification**: verdict rank allow < ask < deny. HARDENED = installed rank higher than 0.1.115, RELAXED = lower. "Expected?" is yes only when HARDENED belongs to a literal-text-write case (change 1) or RELAXED to a command-output-to-temp case (change 2); anything else would print `NO - REGRESSION?` (none did).
- Scratch project: `$S` = `/private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/battery-bw` (git repo, `.ts`/`.json`/`.md`/`.log` fixtures, a space-named dir, a symlink, a FIFO and hard links as fixtures). `$SP` = the session scratchpad, `$TD` = the resolved `$TMPDIR` (`/var/folders/.../T`). Tool and case list: `$S/battery.mjs`, `$S/cases.txt`, `$S/results.json`, `$S/live.json`.

## Family coverage (cases / HARDENED / RELAXED / UNCHANGED / live)

| Family | Cases | H | R | U | Live |
|---|---|---|---|---|---|
| redir-code (`>`, `>>`, `1>`, `>|`, bare `>` to code) | 13 | 1 | 0 | 12 | 2 |
| redir-noncode | 8 | 6 | 0 | 2 | 3 |
| heredoc (quoted, unquoted, `<<-`, `<<<`, with expansion) | 18 | 6 | 0 | 12 | 3 |
| echo / printf | 14 | 8 | 0 | 6 | 3 |
| tee / tee -a | 18 | 3 | 0 | 15 | 1 |
| dd of= | 5 | 0 | 0 | 5 | 1 |
| sed -i / perl -i / patch | 13 | 0 | 0 | 13 | 3 |
| node -e / python -c / ruby -e / bun -e / perl -e | 17 | 0 | 0 | 17 | 1 |
| fd-dup, /dev/null, /dev/stderr, devices | 17 | 0 | 0 | 17 | 3 |
| command output to temp | 48 | 0 | 21 | 27 | 6 |
| command output to project code | 7 | 0 | 0 | 7 | 2 |
| command output to project non-code | 7 | 0 | 0 | 7 | 0 |
| chains (`&&`, `;`, `|`, `( )`, `{ }`, `bash -c`, `sh -c`, `env`, `xargs`, `cd &&`) | 23 | 2 | 0 | 21 | 3 |
| cp / mv / ln / install | 15 | 0 | 0 | 15 | 1 |
| paths (spaces, quotes, `$f`, `~`, `..`, glob, symlink, FIFO, hard link, dir, outside project) | 30 | 7 | 1 | 22 | 0 |
| nocwd (payload without cwd / scratchpad_dir) | 6 | 2 | 1 | 3 | 0 |
| false-positive controls (`>` in quotes, `grep '>'`, `awk`, `git log --format`, `test -gt`, `sed` stdin) | 25 | 0 | 0 | 25 | 9 |

(Family totals are the sum of the rows in the full table below; the live count per family is the number of live-marked rows.)

## Coverage of the existing test plan (`real-condition-test-plan-2026-11-11.md`, F0 and section 3b)

| Plan case | Equivalent here | Installed | 0.1.115 |
|---|---|---|---|
| A1 `printf 'x' > notes.txt` | C040 (`printf 'x' > ep3.log`), C014 (`echo hi > new-a.txt`, live) | deny | ask |
| A2 `echo hi > out.md` | C038 (live) | deny | ask |
| A3 `cat > data.json <<'EOF'` | C031 | deny | ask |
| A4 `printf 'x' >> log.txt` | C271 (`echo hi >> guide.md`); C016 is ask in both builds because its fixture `notes.log` is hard-linked (nlink 2, see C266) | deny | ask |
| B1 output to scratchpad | C119 (live) | allow | allow (already allowed in 0.1.115, not part of change 2) |
| B2 `git status > /tmp/...` | C243 (live), C245, C244 | allow | ask |
| B3 `date > /tmp/...` | C115 | **ask** | ask |
| C1 `/dev/null` | C100 (live), C283 | allow | allow |
| C1 `/dev/tty` | C107 | ask | ask |
| C3 symlink target | C264 (`link.md`), C260 (symlink in /tmp) | ask | ask |
| C4 FIFO target | C265 (`ff.md`), C262 (FIFO in /tmp) | ask | ask |
| D1 `printf 'export const b=2' > b.ts` | C001 (live) | deny | deny |
| pairing `cp /tmp/x ./t.ts` must be deny (section 3b) | C180, C279 (live) | **allow** | allow |

Two plan expectations are not met by this build, both UNCHANGED versus 0.1.115 (not regressions, but the plan text is wrong or the allowlist is narrower than the plan assumed): `date > /tmp/...` stays ask (`date` is not in the producer allowlist: READERS = cd pwd echo true false cat head tail wc ls grep sort tr cut basename dirname which stat du df, plus runners and read-only git), and the cp/mv/ln pairing rule belongs to the F1 branch, which is not in this build.

## Observations (all UNCHANGED, present in 0.1.115 too; listed because they bear on "pas de publication sans test complet")

1. **Wrapped writes to code files are allowed** (both builds): `bash -c 'echo hi > $S/src/c5.ts'` (C160, executed live, file created), `sh -c "echo hi > $S/src/c6b.ts"` (C163), `env FOO=1 sh -c '...ts'` (C164), `xargs ... sh -c` (C166). Same for non-code through the wrapper (C161, C162 executed live, C167), so the new literal-text deny is bypassed by `sh -c`/`bash -c`. This is the F1 (wrappers) scope, not in this build.
2. **cp / mv / ln / install onto a code file are allowed** (C178-C189; C279 executed live: `cp /tmp/bw-o12.txt $S/src/pair-live.ts` created a code file). Combined with change 2 (output to `/tmp` now allowed) the two-step path "produce content in /tmp, then `cp` onto a code file" is two allowed commands (C114/C125 + C279). It is not a new capability class: the same content could already be placed in `/tmp` through `echo x | tee /tmp/x` (C054-C060, absolute-path `tee` is allowed in both builds; C054 executed live).
3. **`tee` residuals**: absolute-path `tee`, `tee -a`, `cd X && tee ...` and `tee /dev/stderr` are allowed in both builds (C054-C061, C234, C236, C240) because the ASK_WRITERS pattern `tee\s+[^-/\s]` does not match them and `cd ` is a SAFE_PREFIX. Only relative, non-`-a` `tee <file> <<EOF` / `<<<` is hardened (C233, C238, C239).
4. `echo hi > /dev/stderr` is **ask** in both builds (C104, C106 `> /dev/stdout`); `echo hi >&2` and `ls >&2` are allow. The brief says `/dev/stderr` "must stay allowed": the baseline is ask, so it did stay as it was.
5. Not relaxed by change 2 (still ask in both): `$TMPDIR` as a variable (C118, only the resolved literal path works, C117), `date` / `whoami` / `curl` / `find` / `bun --version` / `node --version` as producers (C115, C124, C134, C135, C137, C253), `git -C <dir> ...` (C116, C126), pipes and lists around the producer (C131-C133), sub-directories and `..` in the temp path (C129, C130), symlink / hard link / FIFO / directory targets in `/tmp` (C260-C263), and any temp redirect when the payload has no `scratchpad_dir` and the target is the scratchpad (C277).
6. Hard-linked, symlink, FIFO, directory and `..` targets keep the old ask even for literal text (C264-C267, C201, C202, C270): the "ordinary file" allowlist behaves as documented.
7. `.sh` is not in the code-extension list: C013 (`printf 'x' > new10.sh`) was ask in 0.1.115 and is now denied as literal text (change 1), not as a code write.
8. The 0.1.115 false block seen live by the test plan author (`sed -E` on stdin ending a pipeline) did not reproduce with the forms tried (C079, C224, C232, C280, C284: all allow in both builds, C079/C224/C280 live).
9. Without payload `cwd`, a relative literal target stays ask (C273); an absolute target or `cd <abs> &&` still denies (C274, C275).
10. C212 (`ls $S > /tmp/bw-sp ace.txt`) is labelled "space in path" but the shell reads it as `ls $S ace.txt > /tmp/bw-sp`; it is a plain relaxed temp redirect, C140 (quoted target with a space) stays ask.

## Challenger pass (fuse-ai-pilot:challenger, once, read-only, independent re-run)

- Claim "zero regressions": no real regression; the original wording "read-only producers" was wrong (runners are in the allowlist) and has been corrected above.
- Tag bias: all 58 changed rows checked by hand: the 35 `lit` rows are literal writes, the 23 `out` rows are one producer writing to a direct child of a temp dir, no `-` row changed.
- Pre-existing holes (wrappers, cp/mv onto code, absolute `tee`): identical in both builds (CONFIRMED). No same-verdict row has a different message; no deny->other or allow->ask change anywhere.
- Its independent re-run of 31 table cases matched the table in every case (C014 C027 C031 C033 C233 C238 C239 deny/ask; C114 C117 C121 C243 C258 allow/ask; C115 C016 C107 C029 ask/ask; C128 C001 C022 C024 C036 C037 deny/deny; C100 C160 C163 C180 C189 C054 C234 C236 C240 allow/allow).
- Extra forms it tried (installed / 0.1.115), all consistent with the two changes: temp redirect spelled `> "/tmp/x"`, `> '/tmp/x'`, `>/tmp/x`, `> /tmp/x ls`, `1>> /tmp/x`, `>& /tmp/x`, `/private/var/folders/.../T/x` = allow/ask; `> /tmp//x`, temp plus a project file in one command, `git diff --output=...`, `sort -o ...` = ask/ask; `grep ... > /tmp/x.TS` = deny/deny; runners incl. `npx prettier --write`, `bun run build`, `tsc -p`, `NODE_OPTIONS=x bun test`, `timeout 5 bun test` = allow/ask; literal `>|`, double-quoted body, `.html`/`Dockerfile`/upper-case `.TXT` targets, `> f.md 2>&1`, `true && echo ...`, `echo ... && ls` = deny/ask; `echo $HOME > f.md`, `echo hi 1> f.md` = ask/ask.

## Intended changes, verbatim deny messages

- Change 1 (literal text): `[BLOCKED] Bash write of literal text` / `Bash file write of literal text — use the Write tool to create/overwrite <file>, or the Edit tool to append/change it` / `Next: 1. Use the Write/Edit tool instead`.
- Code file (unchanged text): `[BLOCKED] Bash write to code file` / `Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)`.
- The section "Verbatim messages" at the end lists one message per family and verdict (installed build).

## Live deny messages received (verbatim, family sample)

- redir-code C001 (`printf 'x' > $S/src/new1.ts`): `PreToolUse:Bash hook error: [BLOCKED] Bash write to code file` / `Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)` / `Next: 1. Use the Write/Edit tool instead`.
- redir-noncode C014 (`echo hi > $S/new-a.txt`): `[BLOCKED] Bash write of literal text` / `Bash file write of literal text — use the Write tool to create/overwrite $S/new-a.txt, or the Edit tool to append/change it`.
- heredoc C027 (`cat > $S/h-doc1.md <<'EOF'`): same literal-text message, file `h-doc1.md`.
- echo C038: same literal-text message, file `ep1.md`.
- dd C062: `[BLOCKED] Bash write to code file` / `tee/dd into a code file — Use Edit/Write tools instead`.
- inplace C067: `[BLOCKED] Bash write to code file` / `sed in-place edit — Use Edit/Write tools instead`.
- out-code C141 / C142 / chain C168 / out-temp C128 (`.ts` in `/tmp`): `Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)`.

## Residues and deviations (disclosed)

- One file was written at a mistyped path by this session: `/private/tmp/claude-501/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/battery-bw/src/a.ts` (20 bytes, outside the WRITE path, inside the same `/private/tmp` tree). Left in place (no deletion rule); the owner/lead may remove it.
- Live runs created files, all harmless and left in place: `$S/src/c5.ts`, `$S/c6.md`, `$S/t3.md`, `$S/src/pair-live.ts`, `$SP/bw-ep6.txt`, `$SP/bw-o6.txt`, `/tmp/bw-o1.txt`, `/tmp/bw-o12.txt`, `/tmp/bw-g1.txt`, `$TD/bw-o4.txt`, plus fixtures `/tmp/bw-sym.txt` (symlink), `/tmp/bw-hard.txt` (hard link to `$S/README.md`), `/tmp/bw-fifo.txt` (FIFO), `/tmp/bw-dir/`.
- Two live commands carried a harmless suffix compared with their case rows (the first `grep '>'` run also had `; echo`, and one `cp` run had `; ls -l`); both were re-run in their exact form.
- The edit hook asked for sniper after each scratch `.ts`/`.mjs` write; those are throwaway scratch files outside any repo, so sniper was not run on them.

## NOT MEASURED

- The `ask` verdicts were never presented to the owner (replay only, by design). Whether Claude Code renders the ask dialog correctly was not observed.
- Hosts other than Claude Code (Codex, Kimi, Cursor adapters): not tested, their harness copies are older builds.
- Concurrency / adaptive escalation: each case used a fresh session; repeated denials in one session (one-shot / escalation state) were not exercised.
- Commands longer than 4096 characters (the window cap) and non-ASCII bytes beyond one UTF-8 file name (C211) were not swept.
- Other gates (git, rm, protected paths, APEX): `gates-battery` scope.
- zsh vs bash semantics of the real shell for exotic spellings (`=cmd`, `>|`, brace expansion): only the hook verdict was measured, never what the shell would have done.
- `perl -e`/`python -c` writing to `/tmp` (C082, C086) and `dd of=/tmp/..` (C064): ask or deny in both builds, unchanged; not run live.

## Counts

- UNCHANGED: 226
- HARDENED: 35
- RELAXED: 23
- total: 284
- rows flagged not-expected: none
- live vs replay mismatches: none

## Full table

| # | family | exact command | layer | verdict installed | verdict 0.1.115 | class | expected? |
|---|---|---|---|---|---|---|---|
| C001 | redir-code | `printf 'x' > $S/src/new1.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C002 | redir-code | `echo hi > $S/src/b.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C003 | redir-code | `echo hi >> $S/src/b.ts` | replay | deny | deny | UNCHANGED | yes |
| C004 | redir-code | `echo hi 1> $S/src/new2.ts` | replay | deny | deny | UNCHANGED | yes |
| C005 | redir-code | `> $S/src/new3.ts` | replay | deny | deny | UNCHANGED | yes |
| C006 | redir-code | `echo hi > src/new4.ts` | replay | deny | deny | UNCHANGED | yes |
| C007 | redir-code | `echo hi >> src/b.ts` | replay | deny | deny | UNCHANGED | yes |
| C008 | redir-code | `echo hi >\| $S/src/new5.ts` | replay | deny | deny | UNCHANGED | yes |
| C009 | redir-code | `echo 'export const z = 1;' > "$S/src/new6.ts"` | replay | deny | deny | UNCHANGED | yes |
| C010 | redir-code | `printf 'x' > $S/src/new7.py` | replay | deny | deny | UNCHANGED | yes |
| C011 | redir-code | `printf 'x' > $S/new8.js` | replay | deny | deny | UNCHANGED | yes |
| C012 | redir-code | `printf 'x' > $S/new9.tsx` | replay | deny | deny | UNCHANGED | yes |
| C013 | redir-code | `printf 'x' > $S/new10.sh` | replay | deny | ask | HARDENED | yes (change 1) |
| C014 | redir-noncode | `echo hi > $S/new-a.txt` | live+replay (live: denied) | deny | ask | HARDENED | yes (change 1) |
| C015 | redir-noncode | `echo hi > $S/guide.md` | live+replay (live: denied) | deny | ask | HARDENED | yes (change 1) |
| C016 | redir-noncode | `printf 'x' >> $S/notes.log` | replay | ask | ask | UNCHANGED | yes |
| C017 | redir-noncode | `echo '{"a":2}' > $S/config.json` | live+replay (live: denied) | deny | ask | HARDENED | yes (change 1) |
| C018 | redir-noncode | `echo hi > new-b.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C019 | redir-noncode | `echo hi >> notes.log` | replay | ask | ask | UNCHANGED | yes |
| C020 | redir-noncode | `echo hi > $S/new-c.yaml` | replay | deny | ask | HARDENED | yes (change 1) |
| C021 | redir-noncode | `echo hi > $S/lib/new-d.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C022 | heredoc | `cat > $S/src/h1.ts <<'EOF' ⏎ export const h = 1; ⏎ EOF` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C023 | heredoc | `cat > $S/src/h2.ts <<EOF ⏎ export const h = 2; ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C024 | heredoc | `cat <<EOF > $S/src/h3.ts ⏎ export const h = 3; ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C025 | heredoc | `cat <<'EOF' > $S/src/h4.ts ⏎ export const h = 4; ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C026 | heredoc | `cat >> $S/src/b.ts <<'EOF' ⏎ export const h = 5; ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C027 | heredoc | `cat > $S/h-doc1.md <<'EOF' ⏎ # title ⏎ EOF` | live+replay (live: denied) | deny | ask | HARDENED | yes (change 1) |
| C028 | heredoc | `cat > $S/h-doc2.md <<EOF ⏎ plain text ⏎ EOF` | replay | deny | ask | HARDENED | yes (change 1) |
| C029 | heredoc | `cat > $S/h-doc3.md <<EOF ⏎ user $USER here ⏎ EOF` | replay | ask | ask | UNCHANGED | yes |
| C030 | heredoc | `cat > $S/h-doc4.md <<"EOF" ⏎ quoted dq $USER ⏎ EOF` | replay | deny | ask | HARDENED | yes (change 1) |
| C031 | heredoc | `cat > $S/h-doc5.json <<-'EOF' ⏎ {"a":1} ⏎ EOF` | replay | deny | ask | HARDENED | yes (change 1) |
| C032 | heredoc | `cat > /tmp/bw-h6.txt <<'EOF' ⏎ x ⏎ EOF` | replay | deny | ask | HARDENED | yes (change 1) |
| C033 | heredoc | `cat > $S/h-doc7.md <<'EOF' ⏎ line1 ⏎ line2 ⏎ EOF ⏎ echo done` | replay | deny | ask | HARDENED | yes (change 1) |
| C034 | heredoc | `cat <<'EOF' ⏎ hello ⏎ EOF` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C035 | heredoc | `cat <<EOF \| wc -l ⏎ a ⏎ b ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C036 | heredoc | `bash <<'EOF' ⏎ echo hi > $S/src/h8.ts ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C037 | heredoc | `cat > $S/src/h9.ts <<EOF ⏎ $(whoami) ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C038 | echoprintf | `echo hi > $S/ep1.md` | live+replay (live: denied) | deny | ask | HARDENED | yes (change 1) |
| C039 | echoprintf | `printf '%s\n' a b > $S/ep2.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C040 | echoprintf | `printf 'x' > $S/ep3.log` | replay | deny | ask | HARDENED | yes (change 1) |
| C041 | echoprintf | `echo hi > /tmp/bw-ep4.txt` | replay | deny | ask | HARDENED | yes (change 1) |
| C042 | echoprintf | `echo hi > /private/tmp/bw-ep5.txt` | replay | deny | ask | HARDENED | yes (change 1) |
| C043 | echoprintf | `echo hi > $SP/bw-ep6.txt` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C044 | echoprintf | `echo $HOME > $S/ep7.md` | replay | ask | ask | UNCHANGED | yes |
| C045 | echoprintf | `echo "$(date)" > $S/ep8.md` | replay | ask | ask | UNCHANGED | yes |
| C046 | echoprintf | `echo hi > $S/ep10.md && echo ok` | replay | deny | ask | HARDENED | yes (change 1) |
| C047 | echoprintf | `echo hi > $S/ep11.md; echo hi > $S/ep12.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C048 | echoprintf | `echo hi` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C049 | echoprintf | `printf 'x\n' \| wc -c` | replay | allow | allow | UNCHANGED | yes |
| C050 | echoprintf | `echo -e 'a\nb' > $S/ep13.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C051 | echoprintf | `printf '%(%Y)T' > $S/ep14.md` | replay | ask | ask | UNCHANGED | yes |
| C052 | tee | `echo x \| tee $S/src/t1.ts` | replay | deny | deny | UNCHANGED | yes |
| C053 | tee | `tee $S/src/t2.ts <<'EOF' ⏎ x ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C054 | tee | `echo x \| tee $S/t3.md` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C055 | tee | `echo x \| tee -a $S/t4.md` | replay | allow | allow | UNCHANGED | yes |
| C056 | tee | `tee $S/t5.md <<'EOF' ⏎ x ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C057 | tee | `tee -a $S/t6.md <<'EOF' ⏎ x ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C058 | tee | `ls $S \| tee $S/t7.md` | replay | allow | allow | UNCHANGED | yes |
| C059 | tee | `ls $S \| tee /tmp/bw-t8.txt` | replay | allow | allow | UNCHANGED | yes |
| C060 | tee | `echo x \| tee /dev/null` | replay | allow | allow | UNCHANGED | yes |
| C061 | tee | `tee $S/t9.md $S/t10.md <<'EOF' ⏎ x ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C062 | dd | `dd if=/dev/zero of=$S/src/d1.ts bs=1 count=1` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C063 | dd | `dd if=/dev/zero of=$S/d2.md bs=1 count=1` | replay | ask | ask | UNCHANGED | yes |
| C064 | dd | `dd if=$S/README.md of=/tmp/bw-d3.bin` | replay | ask | ask | UNCHANGED | yes |
| C065 | dd | `dd if=/dev/zero of=$S/d4.bin bs=1 count=1` | replay | ask | ask | UNCHANGED | yes |
| C066 | dd | `dd if=$S/README.md of=/dev/null` | replay | ask | ask | UNCHANGED | yes |
| C067 | inplace | `sed -i 's/a/b/' $S/src/b.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C068 | inplace | `sed -i '' 's/a/b/' $S/src/b.ts` | replay | deny | deny | UNCHANGED | yes |
| C069 | inplace | `sed -i.bak 's/a/b/' $S/guide.md` | replay | deny | deny | UNCHANGED | yes |
| C070 | inplace | `sed -i 's/#/x/' $S/guide.md` | replay | deny | deny | UNCHANGED | yes |
| C071 | inplace | `sed -n 1p $S/src/a.ts` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C072 | inplace | `sed 's/a/b/' $S/src/a.ts` | replay | allow | allow | UNCHANGED | yes |
| C073 | inplace | `sed -E 's/a/b/g' $S/src/a.ts \| head -1` | replay | allow | allow | UNCHANGED | yes |
| C074 | inplace | `perl -pi -e 's/a/b/' $S/src/b.ts` | replay | deny | deny | UNCHANGED | yes |
| C075 | inplace | `perl -pi -e 's/a/b/' $S/guide.md` | replay | deny | deny | UNCHANGED | yes |
| C076 | inplace | `perl -pe 's/a/b/' $S/src/a.ts` | replay | allow | allow | UNCHANGED | yes |
| C077 | inplace | `patch $S/src/b.ts < $S/x.patch` | replay | deny | deny | UNCHANGED | yes |
| C078 | inplace | `patch -p1 --dry-run < $S/x.patch` | replay | deny | deny | UNCHANGED | yes |
| C079 | inplace | `echo 'a' \| sed -E 's/a/b/Ig'` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C080 | inline | `node -e "require('fs').writeFileSync('$S/src/n1.ts','x')"` | replay | deny | deny | UNCHANGED | yes |
| C081 | inline | `node -e "require('fs').writeFileSync('$S/n2.md','x')"` | replay | ask | ask | UNCHANGED | yes |
| C082 | inline | `node -e "require('fs').writeFileSync('/tmp/bw-n3.txt','x')"` | replay | ask | ask | UNCHANGED | yes |
| C083 | inline | `node -e "console.log(1)"` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C084 | inline | `python3 -c "open('$S/src/p1.ts','w').write('x')"` | replay | deny | deny | UNCHANGED | yes |
| C085 | inline | `python3 -c "open('$S/p2.md','w').write('x')"` | replay | deny | deny | UNCHANGED | yes |
| C086 | inline | `python3 -c "open('/tmp/bw-p3.txt','w').write('x')"` | replay | deny | deny | UNCHANGED | yes |
| C087 | inline | `python3 -c "print(1)"` | replay | allow | allow | UNCHANGED | yes |
| C088 | inline | `ruby -e "File.write('$S/src/r1.ts','x')"` | replay | deny | deny | UNCHANGED | yes |
| C089 | inline | `ruby -e "File.write('$S/r2.md','x')"` | replay | ask | ask | UNCHANGED | yes |
| C090 | inline | `ruby -e 'puts 1'` | replay | allow | allow | UNCHANGED | yes |
| C091 | inline | `bun -e "await Bun.write('$S/src/b1.ts','x')"` | replay | deny | deny | UNCHANGED | yes |
| C092 | inline | `bun -e "await Bun.write('$S/b2.md','x')"` | replay | ask | ask | UNCHANGED | yes |
| C093 | inline | `bun -e "console.log(1)"` | replay | allow | allow | UNCHANGED | yes |
| C094 | inline | `perl -e 'open(F,">$S/src/pl1.ts");print F "x"'` | replay | deny | deny | UNCHANGED | yes |
| C095 | inline | `perl -e 'open(F,">$S/pl2.md");print F "x"'` | replay | ask | ask | UNCHANGED | yes |
| C096 | inline | `perl -e 'print 1'` | replay | allow | allow | UNCHANGED | yes |
| C097 | fd-dup | `ls $S 2>&1 \| head -2` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C098 | fd-dup | `ls $S >&2` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C099 | fd-dup | `ls $S &>/dev/null` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C100 | fd-dup | `ls $S > /dev/null` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C101 | fd-dup | `ls $S 2> /dev/null` | replay | allow | allow | UNCHANGED | yes |
| C102 | fd-dup | `ls $S/nonexist 2>&1 >/dev/null` | replay | allow | allow | UNCHANGED | yes |
| C103 | fd-dup | `echo hi >&2` | replay | allow | allow | UNCHANGED | yes |
| C104 | fd-dup | `echo hi > /dev/stderr` | replay | ask | ask | UNCHANGED | yes |
| C105 | fd-dup | `echo hi 1>&2` | replay | allow | allow | UNCHANGED | yes |
| C106 | fd-dup | `ls $S > /dev/stdout` | replay | ask | ask | UNCHANGED | yes |
| C107 | fd-dup | `echo hi > /dev/tty` | replay | ask | ask | UNCHANGED | yes |
| C108 | fd-dup | `echo hi > /dev/tcp/127.0.0.1/9` | replay | ask | ask | UNCHANGED | yes |
| C109 | fd-dup | `ls $S &> $S/fd1.log` | replay | ask | ask | UNCHANGED | yes |
| C110 | fd-dup | `ls $S >/dev/null 2>&1` | replay | allow | allow | UNCHANGED | yes |
| C111 | fd-dup | `ls $S/nonexist 2>/dev/null; echo ok` | replay | allow | allow | UNCHANGED | yes |
| C112 | fd-dup | `echo hi 2>&1` | replay | allow | allow | UNCHANGED | yes |
| C113 | fd-dup | `true >&-` | replay | allow | allow | UNCHANGED | yes |
| C114 | out-temp | `ls $S > /tmp/bw-o1.txt` | live+replay (live: allowed) | allow | ask | RELAXED | yes (change 2) |
| C115 | out-temp | `date > /tmp/bw-o2.txt` | replay | ask | ask | UNCHANGED | yes |
| C116 | out-temp | `git -C $S status > /private/tmp/bw-o3.txt` | replay | ask | ask | UNCHANGED | yes |
| C117 | out-temp | `ls $S > $TD/bw-o4.txt` | live+replay (live: allowed) | allow | ask | RELAXED | yes (change 2) |
| C118 | out-temp | `ls $S > "$TMPDIR/bw-o5.txt"` | replay | ask | ask | UNCHANGED | yes |
| C119 | out-temp | `ls $S > $SP/bw-o6.txt` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C120 | out-temp | `ls $S >> /tmp/bw-o7.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C121 | out-temp | `ls $S 2> /tmp/bw-o8.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C122 | out-temp | `ls $S &> /tmp/bw-o9.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C123 | out-temp | `pwd > /tmp/bw-o10.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C124 | out-temp | `whoami > /tmp/bw-o11.txt` | replay | ask | ask | UNCHANGED | yes |
| C125 | out-temp | `cat $S/README.md > /tmp/bw-o12.txt` | live+replay (live: allowed) | allow | ask | RELAXED | yes (change 2) |
| C126 | out-temp | `git -C $S log --oneline > /tmp/bw-o13.txt` | replay | ask | ask | UNCHANGED | yes |
| C127 | out-temp | `ls $S > /tmp/bw-o14.log` | replay | allow | ask | RELAXED | yes (change 2) |
| C128 | out-temp | `ls $S > /tmp/bw-o15.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C129 | out-temp | `ls $S > /tmp/sub/bw-o16.txt` | replay | ask | ask | UNCHANGED | yes |
| C130 | out-temp | `ls $S > /tmp/../tmp/bw-o17.txt` | replay | ask | ask | UNCHANGED | yes |
| C131 | out-temp | `ls $S \| sort > /tmp/bw-o18.txt` | replay | ask | ask | UNCHANGED | yes |
| C132 | out-temp | `ls $S; ls > /tmp/bw-o19.txt` | replay | ask | ask | UNCHANGED | yes |
| C133 | out-temp | `ls $S > /tmp/bw-o20.txt && echo ok` | replay | ask | ask | UNCHANGED | yes |
| C134 | out-temp | `bun --version > /tmp/bw-o21.txt` | replay | ask | ask | UNCHANGED | yes |
| C135 | out-temp | `node --version > /tmp/bw-o22.txt` | replay | ask | ask | UNCHANGED | yes |
| C136 | out-temp | `ls $S > /tmp/bw-o24.txt 2>&1` | replay | allow | ask | RELAXED | yes (change 2) |
| C137 | out-temp | `curl -s example.com > /tmp/bw-o25.txt` | replay | ask | ask | UNCHANGED | yes |
| C138 | out-temp | `tr a b < $S/README.md > /tmp/bw-o26.txt` | replay | ask | ask | UNCHANGED | yes |
| C139 | out-temp | `cp $S/README.md /tmp/bw-o27.txt` | replay | allow | allow | UNCHANGED | yes |
| C140 | out-temp | `ls $S > "/tmp/bw-o28 sp.txt"` | replay | ask | ask | UNCHANGED | yes |
| C141 | out-code | `ls $S > $S/src/o1.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C142 | out-code | `date > $S/src/o2.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C143 | out-code | `git -C $S status > $S/src/o3.py` | replay | deny | deny | UNCHANGED | yes |
| C144 | out-code | `ls $S >> $S/src/b.ts` | replay | deny | deny | UNCHANGED | yes |
| C145 | out-code | `ls $S > src/o4.ts` | replay | deny | deny | UNCHANGED | yes |
| C146 | out-code | `ls $S 2> $S/src/o5.ts` | replay | deny | deny | UNCHANGED | yes |
| C147 | out-code | `ls $S &> $S/src/o6.ts` | replay | deny | deny | UNCHANGED | yes |
| C148 | out-noncode | `ls $S > $S/out1.md` | replay | ask | ask | UNCHANGED | yes |
| C149 | out-noncode | `date > $S/out2.log` | replay | ask | ask | UNCHANGED | yes |
| C150 | out-noncode | `ls $S > $S/out3.json` | replay | ask | ask | UNCHANGED | yes |
| C151 | out-noncode | `git -C $S status > $S/out4.txt` | replay | ask | ask | UNCHANGED | yes |
| C152 | out-noncode | `ls $S >> $S/notes.log` | replay | ask | ask | UNCHANGED | yes |
| C153 | out-noncode | `ls $S > out5.md` | replay | ask | ask | UNCHANGED | yes |
| C154 | out-noncode | `ls $S > $S/lib/out6.md` | replay | ask | ask | UNCHANGED | yes |
| C155 | chain | `ls $S && echo hi > $S/c1.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C156 | chain | `ls $S; echo hi > $S/src/c2.ts` | replay | deny | deny | UNCHANGED | yes |
| C157 | chain | `ls $S \| tee $S/c3.md` | replay | allow | allow | UNCHANGED | yes |
| C158 | chain | `(echo hi > $S/src/c4.ts)` | replay | deny | deny | UNCHANGED | yes |
| C159 | chain | `(echo hi > $S/c4b.md)` | replay | ask | ask | UNCHANGED | yes |
| C160 | chain | `bash -c 'echo hi > $S/src/c5.ts'` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C161 | chain | `bash -c 'echo hi > $S/c5b.md'` | replay | allow | allow | UNCHANGED | yes |
| C162 | chain | `sh -c "echo hi > $S/c6.md"` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C163 | chain | `sh -c "echo hi > $S/src/c6b.ts"` | replay | allow | allow | UNCHANGED | yes |
| C164 | chain | `env FOO=1 sh -c 'echo hi > $S/src/c7.ts'` | replay | allow | allow | UNCHANGED | yes |
| C165 | chain | `env FOO=1 echo hi > $S/c7b.md` | replay | ask | ask | UNCHANGED | yes |
| C166 | chain | `echo $S/src/c8.ts \| xargs -I@ sh -c 'echo hi > @'` | replay | allow | allow | UNCHANGED | yes |
| C167 | chain | `echo $S/c8b.md \| xargs -I@ sh -c 'echo hi > @'` | replay | allow | allow | UNCHANGED | yes |
| C168 | chain | `cd $S && echo hi > src/c9.ts` | live+replay (live: denied) | deny | deny | UNCHANGED | yes |
| C169 | chain | `cd $S && echo hi > c10.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C170 | chain | `true \|\| echo hi > $S/c11.md` | replay | ask | ask | UNCHANGED | yes |
| C171 | chain | `{ echo hi > $S/src/c12.ts; }` | replay | deny | deny | UNCHANGED | yes |
| C172 | chain | `{ echo hi > $S/c12b.md; }` | replay | ask | ask | UNCHANGED | yes |
| C173 | chain | `if true; then echo hi > $S/c13.md; fi` | replay | ask | ask | UNCHANGED | yes |
| C174 | chain | `for i in 1; do echo hi > $S/c14.md; done` | replay | ask | ask | UNCHANGED | yes |
| C175 | chain | `echo hi > $S/c15.md &` | replay | ask | ask | UNCHANGED | yes |
| C176 | chain | `time echo hi > $S/c16.md` | replay | ask | ask | UNCHANGED | yes |
| C177 | chain | `nohup echo hi > $S/c17.md` | replay | ask | ask | UNCHANGED | yes |
| C178 | cpmvln | `cp $S/src/a.ts $S/src/cp1.ts` | replay | allow | allow | UNCHANGED | yes |
| C179 | cpmvln | `cp $S/README.md $S/src/cp2.ts` | replay | allow | allow | UNCHANGED | yes |
| C180 | cpmvln | `cp /tmp/bw-x $S/src/cp3.ts` | replay | allow | allow | UNCHANGED | yes |
| C181 | cpmvln | `mv $S/src/b.ts $S/src/mv1.ts` | replay | allow | allow | UNCHANGED | yes |
| C182 | cpmvln | `mv $S/README.md $S/src/mv2.ts` | replay | allow | allow | UNCHANGED | yes |
| C183 | cpmvln | `mv /tmp/bw-x $S/src/mv3.ts` | replay | allow | allow | UNCHANGED | yes |
| C184 | cpmvln | `ln -s $S/src/a.ts $S/src/ln1.ts` | replay | allow | allow | UNCHANGED | yes |
| C185 | cpmvln | `ln $S/README.md $S/src/ln2.ts` | replay | allow | allow | UNCHANGED | yes |
| C186 | cpmvln | `install -m 644 /tmp/bw-x $S/src/i1.ts` | replay | allow | allow | UNCHANGED | yes |
| C187 | cpmvln | `cp $S/src/a.ts $S/src/cp4.md` | replay | allow | allow | UNCHANGED | yes |
| C188 | cpmvln | `cp $S/README.md $S/cp5.md` | replay | allow | allow | UNCHANGED | yes |
| C189 | cpmvln | `mv $S/notes.log $S/mv5.log` | replay | allow | allow | UNCHANGED | yes |
| C190 | cpmvln | `ls $S > /tmp/bw-pair1.txt && cp /tmp/bw-pair1.txt $S/src/pair1.ts` | replay | ask | ask | UNCHANGED | yes |
| C191 | cpmvln | `ls $S > /tmp/bw-pair2.txt && mv /tmp/bw-pair2.txt $S/src/pair2.ts` | replay | ask | ask | UNCHANGED | yes |
| C192 | paths | `echo hi > "$S/sp ace/n1.md"` | replay | deny | ask | HARDENED | yes (change 1) |
| C193 | paths | `echo hi > "$S/sp ace/my file.ts"` | replay | deny | deny | UNCHANGED | yes |
| C194 | paths | `echo hi > '$S/sp ace/q.ts'` | replay | deny | deny | UNCHANGED | yes |
| C195 | paths | `echo hi > $S/sp\ ace/n2.md` | replay | ask | ask | UNCHANGED | yes |
| C196 | paths | `echo hi > $HOME/bw-x.md` | replay | ask | ask | UNCHANGED | yes |
| C197 | paths | `echo hi > ~/bw-x.md` | replay | ask | ask | UNCHANGED | yes |
| C198 | paths | `f=$S/src/v.ts; echo hi > $f` | replay | ask | ask | UNCHANGED | yes |
| C199 | paths | `f=$S/v2.md; echo hi > "$f"` | replay | ask | ask | UNCHANGED | yes |
| C200 | paths | `echo hi > $S/src/*.ts` | replay | deny | deny | UNCHANGED | yes |
| C201 | paths | `echo hi > $S/../battery-bw/dd.md` | replay | ask | ask | UNCHANGED | yes |
| C202 | paths | `echo hi > $S/src/../dd2.md` | replay | ask | ask | UNCHANGED | yes |
| C203 | paths | `echo hi > =ls` | replay | ask | ask | UNCHANGED | yes |
| C204 | paths | `echo hi > $S/src/link.ts` | replay | deny | deny | UNCHANGED | yes |
| C205 | paths | `echo hi > $S/src/ff.ts` | replay | deny | deny | UNCHANGED | yes |
| C206 | paths | `echo hi > $S/src/` | replay | ask | ask | UNCHANGED | yes |
| C207 | paths | `echo hi > $S/nonexistdir/x.md` | replay | ask | ask | UNCHANGED | yes |
| C208 | paths | `echo hi > $S/src//dbl.md` | replay | ask | ask | UNCHANGED | yes |
| C209 | paths | `echo hi > ./rel.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C210 | paths | `echo hi > $S/.hidden.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C211 | paths | `echo hi > $S/src/ünï.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C212 | paths | `ls $S > /tmp/bw-sp ace.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C213 | fp | `grep '>' $S/README.md` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C214 | fp | `awk '$1 > 3' $S/notes.log` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C215 | fp | `git -C $S log --format='%h > %s'` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C216 | fp | `test 3 -gt 2` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C217 | fp | `echo "a > b"` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C218 | fp | `echo 'x > y.ts'` | replay | allow | allow | UNCHANGED | yes |
| C219 | fp | `grep -n "=>" $S/src/a.ts` | replay | allow | allow | UNCHANGED | yes |
| C220 | fp | `python3 -c "print(1 > 0)"` | replay | allow | allow | UNCHANGED | yes |
| C221 | fp | `node -e "console.log(2>1)"` | replay | allow | allow | UNCHANGED | yes |
| C222 | fp | `ls $S \| grep '>'` | replay | allow | allow | UNCHANGED | yes |
| C223 | fp | `[ 3 -gt 2 ] && echo ok` | replay | allow | allow | UNCHANGED | yes |
| C224 | fp | `cat $S/README.md \| sed -e 's/#/x/'` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C225 | fp | `ls $S` | replay | allow | allow | UNCHANGED | yes |
| C226 | fp | `git -C $S status` | replay | allow | allow | UNCHANGED | yes |
| C227 | fp | `cat $S/src/a.ts` | replay | allow | allow | UNCHANGED | yes |
| C228 | fp | `echo "redirect > file.ts is text"` | replay | allow | allow | UNCHANGED | yes |
| C229 | fp | `git log --oneline -1 --format='%s >> x'` | replay | allow | allow | UNCHANGED | yes |
| C230 | fp | `awk 'BEGIN{print 2 > 1}'` | replay | allow | allow | UNCHANGED | yes |
| C231 | fp | `echo '$x > 3' \| wc -c` | replay | allow | allow | UNCHANGED | yes |
| C232 | fp | `echo abc \| sed -E 's/(a)/\1***/Ig'` | replay | allow | allow | UNCHANGED | yes |
| C233 | tee | `tee t5r.md <<'EOF' ⏎ x ⏎ EOF` | replay | deny | ask | HARDENED | yes (change 1) |
| C234 | tee | `tee -a t6r.md <<'EOF' ⏎ x ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C235 | tee | `echo x \| tee t3r.md` | replay | ask | ask | UNCHANGED | yes |
| C236 | tee | `cd $S && tee t5r2.md <<'EOF' ⏎ x ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C237 | tee | `tee src/t2r.ts <<'EOF' ⏎ x ⏎ EOF` | replay | deny | deny | UNCHANGED | yes |
| C238 | tee | `tee t9r.md t10r.md <<'EOF' ⏎ x ⏎ EOF` | replay | deny | ask | HARDENED | yes (change 1) |
| C239 | tee | `tee t11r.md <<< 'x'` | replay | deny | ask | HARDENED | yes (change 1) |
| C240 | tee | `tee /dev/stderr <<'EOF' ⏎ x ⏎ EOF` | replay | allow | allow | UNCHANGED | yes |
| C241 | heredoc | `cat <<< 'x' > $S/hs1.md` | replay | deny | deny | UNCHANGED | yes |
| C242 | heredoc | `cat <<< 'x' > $S/src/hs2.ts` | replay | deny | deny | UNCHANGED | yes |
| C243 | out-temp | `git status > /tmp/bw-g1.txt` | live+replay (live: allowed) | allow | ask | RELAXED | yes (change 2) |
| C244 | out-temp | `git diff > /private/tmp/bw-g2.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C245 | out-temp | `git log --oneline -5 > /tmp/bw-g3.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C246 | out-temp | `git diff --output=/tmp/bw-g4.txt` | replay | allow | allow | UNCHANGED | yes |
| C247 | out-temp | `git status > $S/src/g5.ts` | replay | deny | deny | UNCHANGED | yes |
| C248 | out-temp | `git status > $S/g6.md` | replay | ask | ask | UNCHANGED | yes |
| C249 | out-temp | `git show HEAD:README.md > /tmp/bw-g7.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C250 | out-temp | `grep -r foo $S > /tmp/bw-g8.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C251 | out-temp | `head -3 $S/README.md > /tmp/bw-g9.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C252 | out-temp | `wc -l $S/README.md > /tmp/bw-g10.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C253 | out-temp | `find $S -name '*.ts' > /tmp/bw-g11.txt` | replay | ask | ask | UNCHANGED | yes |
| C254 | out-temp | `sort $S/notes.log > /tmp/bw-g12.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C255 | out-temp | `sort -o /tmp/bw-g13.txt $S/notes.log` | replay | allow | allow | UNCHANGED | yes |
| C256 | out-temp | `bun test > /tmp/bw-g14.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C257 | out-temp | `npm test > /tmp/bw-g15.txt 2>&1` | replay | allow | ask | RELAXED | yes (change 2) |
| C258 | out-temp | `tsc --noEmit > /tmp/bw-g16.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C259 | out-temp | `cat $S/README.md >> /tmp/bw-o12.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C260 | out-temp | `ls $S > /tmp/bw-sym.txt` | replay | ask | ask | UNCHANGED | yes |
| C261 | out-temp | `ls $S > /tmp/bw-hard.txt` | replay | ask | ask | UNCHANGED | yes |
| C262 | out-temp | `ls $S > /tmp/bw-fifo.txt` | replay | ask | ask | UNCHANGED | yes |
| C263 | out-temp | `ls $S > /tmp/bw-dir` | replay | ask | ask | UNCHANGED | yes |
| C264 | paths | `echo hi > $S/link.md` | replay | ask | ask | UNCHANGED | yes |
| C265 | paths | `echo hi > $S/ff.md` | replay | ask | ask | UNCHANGED | yes |
| C266 | paths | `echo hi > $S/hard.log` | replay | ask | ask | UNCHANGED | yes |
| C267 | paths | `echo hi > $S/src` | replay | ask | ask | UNCHANGED | yes |
| C268 | paths | `echo hi > /etc/bw-test.md` | replay | ask | ask | UNCHANGED | yes |
| C269 | paths | `echo hi > /var/tmp/bw-x.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C270 | paths | `echo hi >> $S/README.md` | replay | ask | ask | UNCHANGED | yes |
| C271 | paths | `echo hi >> $S/guide.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C272 | paths | `echo hi > $S/new-e.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C273 | nocwd | `echo hi > new-b.md` | replay | ask | ask | UNCHANGED | yes |
| C274 | nocwd | `echo hi > $S/new-b2.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C275 | nocwd | `cd $S && echo hi > c10b.md` | replay | deny | ask | HARDENED | yes (change 1) |
| C276 | nocwd | `ls $S > /tmp/bw-nc1.txt` | replay | allow | ask | RELAXED | yes (change 2) |
| C277 | nocwd | `ls $S > $SP/bw-nc2.txt` | replay | ask | ask | UNCHANGED | yes |
| C278 | nocwd | `echo hi > $S/src/nc3.ts` | replay | deny | deny | UNCHANGED | yes |
| C279 | cpmvln | `cp /tmp/bw-o12.txt $S/src/pair-live.ts` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C280 | fp | `ls $S \| sed -E 's/a/b/Ig'` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C281 | fp | `bun --version > /dev/null` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C282 | fp | `grep -n a $S/src/a.ts` | live+replay (live: allowed) | allow | allow | UNCHANGED | yes |
| C283 | fp | `printf x > /dev/null` | replay | allow | allow | UNCHANGED | yes |
| C284 | fp | `ls $S \| sed -E 's/(a)/\1***/Ig'` | replay | allow | allow | UNCHANGED | yes |

## Verbatim messages (installed build, one per family and verdict)

- C001 [redir-code] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C013 [redir-code] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/new10.sh, or the Edit tool to append/change it
- C014 [redir-noncode] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/new-a.txt, or the Edit tool to append/change it
- C015 [redir-noncode] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/guide.md, or the Edit tool to append/change it
- C016 [redir-noncode] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C017 [redir-noncode] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/config.json, or the Edit tool to append/change it
- C018 [redir-noncode] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite new-b.md, or the Edit tool to append/change it
- C020 [redir-noncode] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/new-c.yaml, or the Edit tool to append/change it
- C021 [redir-noncode] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/lib/new-d.md, or the Edit tool to append/change it
- C022 [heredoc] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C024 [heredoc] deny: [BLOCKED] Bash write to code file / heredoc redirected into a file — Use Edit/Write tools instead
- C027 [heredoc] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/h-doc1.md, or the Edit tool to append/change it
- C028 [heredoc] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/h-doc2.md, or the Edit tool to append/change it
- C029 [heredoc] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C030 [heredoc] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/h-doc4.md, or the Edit tool to append/change it
- C031 [heredoc] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/h-doc5.json, or the Edit tool to append/change it
- C032 [heredoc] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite /tmp/bw-h6.txt, or the Edit tool to append/change it
- C033 [heredoc] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/h-doc7.md, or the Edit tool to append/change it
- C038 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/ep1.md, or the Edit tool to append/change it
- C039 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/ep2.md, or the Edit tool to append/change it
- C040 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/ep3.log, or the Edit tool to append/change it
- C041 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite /tmp/bw-ep4.txt, or the Edit tool to append/change it
- C042 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite /private/tmp/bw-ep5.txt, or the Edit tool to append/change it
- C044 [echoprintf] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C046 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/ep10.md, or the Edit tool to append/change it
- C047 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/ep11.md, $S/ep12.md, or the Edit tool to append/change it
- C050 [echoprintf] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/ep13.md, or the Edit tool to append/change it
- C052 [tee] deny: [BLOCKED] Bash write to code file / tee/dd into a code file — Use Edit/Write tools instead
- C062 [dd] deny: [BLOCKED] Bash write to code file / tee/dd into a code file — Use Edit/Write tools instead
- C063 [dd] ask: [CONFIRM] Bash file write / dd output to file detected. Authorize?
- C067 [inplace] deny: [BLOCKED] Bash write to code file / sed in-place edit — Use Edit/Write tools instead
- C074 [inplace] deny: [BLOCKED] Bash write to code file / perl in-place edit — Use Edit/Write tools instead
- C077 [inplace] deny: [BLOCKED] Bash write to code file / patch file modification — Use Edit/Write tools instead
- C080 [inline] deny: [BLOCKED] Bash write to code file / Inline JS/TS script writes a code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C081 [inline] ask: [CONFIRM] Bash file write / Inline JS/TS script write operation detected. Authorize?
- C084 [inline] deny: [BLOCKED] Bash write to code file / Python inline script mutates files/spawns a process — Use Edit/Write tools instead
- C088 [inline] deny: [BLOCKED] Bash write to code file / Inline Ruby script writes a code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C089 [inline] ask: [CONFIRM] Bash file write / Inline Ruby script write operation detected. Authorize?
- C094 [inline] deny: [BLOCKED] Bash write to code file / Inline Perl script writes a code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C095 [inline] ask: [CONFIRM] Bash file write / Inline Perl script write operation detected. Authorize?
- C104 [fd-dup] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C115 [out-temp] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C128 [out-temp] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C141 [out-code] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C148 [out-noncode] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C155 [chain] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/c1.md, or the Edit tool to append/change it
- C156 [chain] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C159 [chain] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C169 [chain] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite c10.md, or the Edit tool to append/change it
- C190 [cpmvln] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C192 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/sp ace/n1.md, or the Edit tool to append/change it
- C193 [paths] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
- C195 [paths] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C209 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite ./rel.md, or the Edit tool to append/change it
- C210 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/.hidden.md, or the Edit tool to append/change it
- C211 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/src/ünï.md, or the Edit tool to append/change it
- C233 [tee] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite t5r.md, or the Edit tool to append/change it
- C235 [tee] ask: [CONFIRM] Bash file write / tee to file detected. Authorize?
- C238 [tee] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite t9r.md, t10r.md, or the Edit tool to append/change it
- C239 [tee] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite t11r.md, or the Edit tool to append/change it
- C268 [paths] ask: [CONFIRM] Dangerous command / DANGEROUS PATTERN: write to /etc.
- C269 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite /var/tmp/bw-x.md, or the Edit tool to append/change it
- C271 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Edit tool to append to/change $S/guide.md (or the Write tool if it does not exist yet)
- C272 [paths] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/new-e.md, or the Edit tool to append/change it
- C273 [nocwd] ask: [CONFIRM] Bash file write / Shell redirect to file detected. Authorize?
- C274 [nocwd] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite $S/new-b2.md, or the Edit tool to append/change it
- C275 [nocwd] deny: [BLOCKED] Bash write of literal text / Bash file write of literal text — use the Write tool to create/overwrite c10b.md, or the Edit tool to append/change it
- C278 [nocwd] deny: [BLOCKED] Bash write to code file / Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)
