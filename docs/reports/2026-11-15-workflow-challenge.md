# Challenge of the two 2026-11-15 workflow reports

Date: 2026-11-15. Read-only adversarial check of:
- K = `docs/reports/2026-11-15-krazmail-workflow-audit.md` (11 findings, 11 changes)
- A = `docs/reports/2026-11-15-anthropic-recommendations-vs-rules.md` (25 rows)

Owner mandate (verbatim): « analyse la session krazmail tu lance le challenger et on regarde comemnt améliorer ton workflow ainsi que le claude.md template et regarde aussi la doc des recomandation antropic ». Standing: « on lit pas une boule de cristal on bosse sur des fait », « je veux pas passé ma vie ici a faire des check bordel », « ne me fais pas de regression ».

Path shorthand: T = `plugins/claude-rules/templates/CLAUDE.md.template`, R0N = `plugins/claude-rules/rules/0N-*.md`, S = `plugins/ai-pilot/skills/lead-orchestration/SKILL.md`, BT = `plugins/ai-pilot/skills/lead-orchestration/references/brief-template.md`, CA = `plugins/ai-pilot/agents/commit.md`, D = `docs/decisions.md` (this repo), KD = `Projets/Apple/fusemail/docs/decisions.md` (KrazMail project), H = `~/.claude/plugins/marketplaces/fusengine-plugins/plugins/node_modules/@fusengine/harness/src` (installed 0.1.115, `dist/cli/bin.mjs` built 2026-11-12 21:51).
Transcripts: Lead = `fusemail/e46da48d…jsonl`, iPad = `krazmail-ipad/95b67852…jsonl`, iPhone = `fusemail-ios-scaffold/468ade78…jsonl`, plus the lead's `subagents/` folder (357 files). All counts below are `jq` re-counts with tool_use ids deduplicated.

---

## 0. Three facts that change how every proposal must be placed

1. **T has no room.** T is 9,997 characters (`wc -c`), and T:3 itself says to stay under 10,000 (above that, the per-prompt copy becomes a 2,000-character head). K puts new sentences into T in F1, F2, F4, F6, F7, F8 and F10. Each one breaks T's own budget. Any change to T has to be net-zero or shorter.
2. **S never reaches the lead.** The lead made 0 `Skill(fuse-ai-pilot:lead-orchestration)` calls over 18 compactions (re-counted). The only call in any of the three sessions was in the iPad session, at 2026-11-12T10:13:23. Text placed only in S or BT, as K does for F1, F3, F5, F9 and F11, would not have reached the KrazMail lead. The lead always loads T and the imported rules (R00–R08, `@` imports), and has room only in R03/R08. So lead-facing additions go to R03 "Lead conduct" (always loaded, no stated character budget). S keeps a pointer.
3. **Source does not equal deployed.** `diff -q` shows that R00, R02 and R07 in the source differ from the deployed marketplace copy the KrazMail sessions ran. D:10 says the owner installs and syncs himself. So none of the surviving changes affect a live session until the owner syncs. The report to the owner must say so.

---

## 1. KrazMail report (K): per finding and per change

### Spot-check of the top counts

| K figure | K value (Lead / iPad / iPhone) | Re-count | Verdict |
|---|---|---|---|
| Stop "VERIFICATION RECEIPT REQUIRED" | 184 / 149 / 121 | 187 / 151 / 121 (`hook_stopped_continuation`, unique uuid) | CONFIRMED (±2 %) |
| `ask` prompts in main sessions | 48 / 42 / 108 | 48 / 44 / 108 (unique `toolUseID`, content starting with "?") | CONFIRMED |
| Ask titles | 116 / 57 / 24 / 1 | Bash file write 117, Dangerous 58, Confirm git 24, Cannot analyse 1 | CONFIRMED |
| `Agent` spawns | 58 / 87 / 62 | 58 / 88 / 62 | CONFIRMED |
| `compact_boundary` (lead) | 18 (9 manual / 9 auto) | 18 (8 manual / 10 auto) | CONFIRMED (split off by 1) |
| Lead `Skill` calls | 1, lead-orchestration 0 | 1 (`krazmail-release`, 2026-11-09T15:29), lead-orchestration 0 | CONFIRMED |
| Lead Bash: `swift test` / `sleep` / `pgrep`/`ps` / `sysctl` | 12 / 70 / 131 / 1 | 12 / 69 / 136 / 1 (of 862) | CONFIRMED |
| Lead Edit on LESSON.md / decisions.md | 29 / 40 | 29 / 42 + 1 Write | CONFIRMED |
| Lock-related lead Bash | 236, 179 on 11-13 | 280, 239 on 11-13 (broader regex) | CONFIRMED in magnitude (the exact number depends on the regex) |
| "Rien de nouveau / Pas de changement / Toujours pas" | 54 | 79 messages contain one of them | CONFIRMED in direction (undercounted) |

Quotes checked verbatim at their timestamps: 2026-11-12T12:56:39 and 12:56:48 (« c'est moi qui l'ai ajouté dans les consignes », « j'ai rempli un trou moi-même »), 2026-11-14T22:41:03 and 22:41:40, 23:22:04, 2026-11-13T10:59:21 (« faute de mémoire »), 2026-11-14T21:29:24 (« J'avais tort »), 21:49:39 (639 files), 21:50:24 (« j'en ai sauté quatre »), 22:45:56 (« j'ai menti »), 2026-11-13T20:09:34 (4 h 40). All found.

### F1. Lead invented or misquoted owner decisions
- Finding: **CONFIRMED** (quotes above).
- Change as written (replace T:36, plus S:38): **REFUTED.** Two concrete breaks. (1) It adds about 450 characters to T, which is already at 9,997/10,000. (2) The clause "an entry without an owner quote is never acted on" would freeze legitimate recorded lead calls in D, for example D:46 (« lead choice of MIT, not contested ») and D:54 (technical forks settled by the lead on the owner's order « je veux de l'intélligence »).
- Survives as: change S1 (R03 bullet), which keeps the verbatim-quote rule, the "Lead's reading" marker and the no-gap-filling rule for product/design gaps.

### F2. Hand-built lock and GO tokens; capacity never measured
- Finding: **CONFIRMED** (one `sysctl` call in 862; quotes 10:59:21 and 21:29:24).
- Change as written: **REFUTED in two places.**
  - "never builds … in parallel" conflicts with KD:30 (« gate serial at 0 failures ») and with K's own F3 evidence: the parallel run under load gave 279 failures, which the owner refused.
  - "A lock or gate between agents needs an owner decision" turns a technical call into an owner question, against T:47 ("technical decisions are taken alone") and D:54.
- Survives as: change S2 (measure before stating a limit; one build path per agent; the gate suite runs in the mode the project records) plus the T:20 / S:64 / R03:24 wording fix, which is net shorter.

### F3. Commit cycle skipped, "ready" on a red suite, 639-file commit
- Finding: **CONFIRMED.**
- Root cause "the cycle only exists in decisions.md since 2026-11-14 (line 30)": **REFUTED.** KD:12, dated 2026-11-13, already said « No commit of any kind while a test fails », and KD is `@`-imported. The 21:48 violation came 52 minutes after the 20:56 compaction, with the rule loaded. This is a failure to apply a rule that existed, not missing text. Adding more prompt text is a weak fix.
- Change as written (generic preconditions, including a simulator tap check before every WIP commit in every project): **REFUTED.** It adds a gate per WIP commit, against D:65 (« Process is cut to the minimum … one sniper, one challenger ») and the owner's « je veux pas passé ma vie ici a faire des check ». A WIP commit is not a publication. The real-conditions rule (D:55) applies before push/release.
- Survives as: change S3 (the commit brief quotes the project's recorded commit cycle plus a suite log at 0 failures) and change S4 (CA unstages unnamed binaries).

### F4. "I cannot" / "waiting for your approval" asserted without evidence
- Finding: **CONFIRMED** (22:44:48 / 22:45:56).
- Change as written: **REFUTED in part.** "The lead's own tools (computer-use, browser, simulator, terminal) are tried first" contradicts T:44 ("no UI driving") and HARD STOP 0. The lead would have been told to do exactly what the owner forbids.
- Survives as: change S5 (an agent tries the capability; silence is never evidence; read the agent transcript).

### F5. 198 owner clicks; 4 h 40 stall
- Counts: **CONFIRMED** (see table).
- Root cause: **REFUTED in three places, checked against the gate source.**
  1. `H/policy/patterns.ts:40-44` (`GIT_ASK`) asks for every `git push|checkout|reset|rebase|merge|stash|clean|rm|mv|restore|revert|cherry-pick|commit|add|branch -d`, whatever the shape. "`cd X && git`" is not the trigger, and "run plain `git <verb>` from the cwd" does not avoid the prompt.
  2. `H/policy/guards/bash-write-scratchpad.ts:15-24`: a redirect to the session scratchpad is already silent (owner decisions D:24 and D:47) when the target is the literal scratchpad path or `$S` / `${S}`, and the command contains none of `# \ ( \` $( <( ${…}` and no `{ … }` group. So "every redirect raises an owner click" is false.
  3. The "4 h 40" stall, which K left unverified, is now measured. Commit agent `subagents/agent-a50890745b3204ccd.jsonl` raised "? Bash file write" at 2026-11-13T15:21:20, and its next record is at 20:07:34: **286 min**. The command wrote to a lowercase `$s` scratchpad variable inside a `{ … }` group, with `\.` in a grep pattern. A second stall K missed: commit agent `agent-abb3603034ffecad7.jsonl` ran `git commit -F …` at 2026-11-13T03:56:55, got "? Confirm git operation", and resumed at 08:57:04: **300 min**. Together that is about 9 h 46 of WIP-commit stall from two harness asks, against D:6 (« Sniper → challenger → WIP commit → release run automatically … ca doit etre auto »).
- BT:40 change as written: **REFUTED** (factually wrong on both gates). It survives as change S6, with text that matches the gate source.
- S:83 change ("TaskStop, then ONE new agent quoting the go"): **UNCERTAIN.** The new agent hits the same harness ask; it does not remove the blocker. The real fixes are H1 and H2.

### F6. Stop receipt gate fires on the lead
- Finding: **CONFIRMED** in code. `H/runtime/lifecycle/track-changes.ts:30-53` records sub-agent writes in the parent session's `modifiedFiles` (`agentFiles` is only an annotation). `task-completed.ts:95-101` judges every file on `Stop`. `stop-core.ts:34` passes no `agent_id` filter.
- Sub-claim "zero code files" by the lead: **REFUTED.** The lead made 1 `Edit` on `Apps/iOS/Reading/Tests/HTMLBodyRecoveryWebKitTests.swift`. For that one file, the gate on the lead was legitimate.
- Rule change: **CONFIRMED** (relocated from T to R03: change S7).
- Harness change (drop `agentFiles`-only files on a top-level Stop): **UNCERTAIN, needs an OWNER DECISION.** It conflicts with D:75 (2026-11-13: « le 4 oublie », "Stop receipt false positive (4)" not done). It matches D:21 (2026-11-10: « the fix only narrows what triggers them (… files another agent wrote …) »; the hooks are never removed). The owner gave two different answers, so it is his call. Listed as H3.

### F7. Skill never loaded; lead executed work itself
- Finding: **CONFIRMED.**
- T:7 change ("reload the skill after every compact"): **UNCERTAIN.** It is the same fix a second time (Critical Rule 8): T:7 already says it, and it was ignored after 18 of 18 compactions. A longer T:7 also breaks T's budget. Since S never loads, the effective route is to put what the lead needs into R03, which is always loaded (S1–S11 do that). A harness `SessionStart(source=compact)` reminder is another prompt-text push and is unproven, so it is not proposed.
- R03 "Specialist sessions first": **CONFIRMED** (2026-11-12T10:10:51 owner quote). Change S8.

### F8. Status noise
- Finding: **CONFIRMED** in direction.
- Root cause "nothing says a turn may be silent": **REFUTED in part.** Claude Code's built-in `silent_turn_reminder` ("The user hasn't heard from you in a while — say in a few words what you're doing, then continue.") appears 90 times in the lead transcript, and 86 lead texts follow it immediately. A rule saying "end silently" would fight the platform's own instruction.
- Survives as: change S9 (an outcome or one measured line; the reminder is answered with that line).

### F9. Context loss after compactions
- "Re-read decisions.md after compact": **UNCERTAIN.** D/KD is already `@`-imported and reloaded at compaction (T:36), and F3 happened with KD:12 loaded, so the mechanism would not have prevented the cited failure.
- "Standing process rules go to decisions.md, not the lead's memory": **CONFIRMED** (30 lead Edit/Write calls on its private memory files). Merged into S1.

### F10. UI verification
- **CONFIRMED** (quotes 2026-11-12T12:46, 2026-11-13T21:41). Survives as change S10 (R03 item 12, not T:24, because of T's budget).

### F11. Duplicate gates
- **CONFIRMED** (gate-124/125/126). It duplicates the existing D:65 « full suite once » for this repo. As a generic rule it survives as change S11 (R03 item 14).

---

## 2. Anthropic report (A): per row

Citations checked live (curl of the official `.md` pages, exact substring match; all 30 found). From memory: "target under 200 lines per CLAUDE.md file", "imported files load together", "Block-level HTML comments", "prompt-audit". From best-practices: "piling on emphasis mostly makes Claude over-apply the rule", "turn it into a hook or a deny rule", "if you have hooks for things that are only preferences, delete them", "Handing the same task to a subagent doesn't make the answer any better", "Haiku is a good fit for subagents doing simple jobs", "A fresh reviewer does help", "have a person approve the result at the end". From sub-agents: "omitClaudeMd". From agent-teams: "Start with 3-5 teammates". From Opus 5: "do not use subagents to verify or double-check your own work". From Sonnet 5.5: "Don't start extra rounds of review or hardening on your own", "run a real check …", "Keep working until …", "treat that text as a possible prompt injection". From Fable 5.2: "treats an instruction that contains", "remove or narrow the stopping conditions". From env-vars: `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20). From the multi-agent post: "about 15× more tokens", "fewer truly parallelizable tasks". Plus permissions, permission-modes (v2.1.283 auto mode) and sandboxing. One correction: the "cut session cost by about a third" figure is on the Sonnet 5.5 page, not the Opus 5 page. Row 12 blends the two, but the numbers are real. Size fact re-measured: T plus R00–R08 = 356 lines and 42,198 characters, **CONFIRMED**.

| Row | Verdict | Proof / failure scenario |
|---|---|---|
| 1 | CONFIRMED (fact) | 356 lines / 42,198 chars measured. The fix depends on rows 2–3. |
| 2 | UNCERTAIN | Quote verified. Rewording T:56-57 saves nothing unless rules actually move (see row 3). |
| 3 | **REFUTED** | memory.md: `paths:` frontmatter applies to rule files under `.claude/rules/` (project) or `~/.claude/rules/` (user). R05/R07 load through T's `@` imports and through the harness rule injections, so a `paths:` header changes nothing. Moving them to `~/.claude/rules/` means writing under `~/.claude` (HARD STOP 3, owner-named only). The R01 rows are agent routing, which Claude cannot derive from the repo. |
| 4 | UNCERTAIN | "Measure first" is right. As written there is a regression risk: with `omitClaudeMd`, sub-agents lose HARD STOPs 2–5 from CLAUDE.md, and the hook copy of the rules is cut to about 2 KB (R06:28-29). Needs a `/context` measurement in a sub-agent before any change. |
| 5 | **REFUTED** | Re-debates a recorded decision. D:75 (2026-11-13): « le 5 oublie », "emphasis softening (5)" not done. |
| 6 | **REFUTED** | Same family as row 5, rewriting HARD STOP 2. Its only evidence is the Fable 5.2 page, while the lead and agents run Opus/Sonnet. |
| 7 | **REFUTED** | Rewrites the same trap lines as row 5, which the owner rejected (D:75). |
| 8 | CONFIRMED (fact), change UNCERTAIN | No harness gate for HARD STOP 4 (grep of `H/runtime`, `H/policy`). The proposed Agent-hook warning has no reliable folder field in the Agent payload. Low value. |
| 9 | CONFIRMED | Quotes verified; K evidence: 207 spawns, duplicate gates. R03:20 "split by default" has no dated owner decision (it came from refactor `916567c5`), so no decision conflict. The env-var cap is an owner setting (C1). |
| 10 | **REFUTED** as written | A domain expert sent "straight" to code without explore+research hits the harness APEX gate. K's own hook table shows "APEX explore+research" blocks (iPhone 9, iPad 2). The rule cannot be relaxed alone. |
| 11 | **REFUTED** | Re-debates D:5 (2026-11-09: all Haiku agents → Sonnet low, measured) and D:75 item 6 (Haiku tested only for `commit-detector` / `cartographer`). |
| 12a (drop the executor's own challenger, R08:18) | CONFIRMED | Opus 5: « do not use subagents to verify or double-check your own work ». D:65 already says « one challenger » per gate, but today a gate gets two (executor plus lead step 10). Change S12. |
| 12b (eLicit only on request) | UNCERTAIN → owner | R02 says eLicit is never skipped. It is in-context self-review, not a sub-agent, and no measurement shows its cost. Not proposed. |
| 13, 20, 24, 25 | CONFIRMED | Aligned; no change. |
| 14 | CONFIRMED | Quote verified; one sentence in R08 (S13). |
| 15 | CONFIRMED | Change S14 makes T:31 shorter (net negative for T) and must be mirrored in R03:33, R08:26 and BT:63-64, or the four copies contradict each other. |
| 16 | UNCERTAIN | Fable-only quote. A prompt line saying "WIP commits need no approval" cannot remove the harness `GIT_ASK` prompt (H1 can). |
| 17 | CONFIRMED (no change) | Added fact: the lead received 2,179 `UserPromptSubmit` injections totalling 13.1 M characters (re-count). The owner records this re-injection as intentional (memory "per-prompt reinjection intentional", D:56 for Codex). Flagged once, nothing proposed. |
| 18 | CONFIRMED | `/doctor prompt-audit` exists on the memory page. Low cost (S15). |
| 19 | CONFIRMED + new evidence | 0 `sequentialthinking` calls across about 14,500 assistant records in the three sessions: R00:42 is dead text. It was added by commit `faa55e0f` "non-negotiable", with no entry in D. OWNER DECISION recommended (S16). |
| 21 | UNCERTAIN (moot) | Trimming S is pointless while S is never loaded (fact 0.2). |
| 22 | **REFUTED** in effect | permissions.md: « The hook output can deny the tool call, force a prompt »; allow rules do not cancel a hook `ask`. All 198 main-session asks (and the sub-agent ones) are harness hook asks. `~/.claude/settings.json` has no `permissions` block, and the session runs in bypass mode. An allowlist removes 0 of the measured prompts. |
| 23 | CONFIRMED (keeps HARD STOP 1); spend cap UNCERTAIN | `--max-budget-usd` / `maxBudgetUsd` apply to `-p`/SDK runs, not to the interactive lead. |

---

## 3. Conflicts and duplicates between the two reports

1. **Size vs additions.** A rows 1–3 want less always-loaded text. K adds about 2 KB to T. Resolved by fact 0.1: T is net-zero, and additions go to R03.
2. **K-F2 (parallel builds) vs K-F3 (serial gate).** KD:30 says the gate suite runs serial. Resolved in S2.
3. **K-F3 (more WIP preconditions) vs A row 12 / D:65 (fewer review layers).** Resolved: no new gate type; the project's own recorded cycle is quoted.
4. **K-F8 (silent turns) vs Claude Code `silent_turn_reminder` and A row 15.** Resolved in S9.
5. **A row 16 (approval-free WIP commits) vs harness `GIT_ASK`.** Only a harness change (H1) makes this true.
6. **Duplicates.** K-F11 duplicates D:65 and A rows 9–10. K-F8 duplicates A row 15. K-F6 rule duplicates D:21. K-F3 duplicates KD:12. K-F9 duplicates T:36.

## 4. High-cost issues both reports missed (measured)

- **M1. Harness asks stall the automatic commit agent.** 300 min (`git commit -F`, `GIT_ASK`) plus 286 min (scratchpad redirect via lowercase `$s` with a `{ }` group), both in `fuse-ai-pilot:commit` sub-agents. CA:71 tells the agent to stop on a hook asking for confirmation, but the ask holds the call until a human clicks, so the agent cannot report.
- **M2. Sub-agent prompts were not counted.** In the lead's `subagents/` folder alone: 51 "Confirm git operation", 174 "Bash file write" and 124 "Dangerous command" raw attachment lines. That is more than the 198 main-session total K reports. Inside sub-agents, the commit agents account for most git asks (`git commit` 12, `git add` 10, `git stash` 10, `git merge` 11 occurrences in asked commands).
- **M3. The scratchpad exemption only accepts one strict shape.** In the iPhone session, 35 of the asked redirect targets were `$S/…` and 7 were the literal scratchpad path. They still asked because the same command held `\`, `(`, `<(`, `{ }` or `#` (`OPAQUE_SYNTAX`, bash-write-scratchpad.ts:15). A one-line brief rule (S6) prevents this without touching the harness.
- **M4. Source/deployed drift** (fact 0.3).

---

## 5. FINAL: changes that survive, ranked by measured cost avoided

Line numbers are those of the files on disk today. "Owner decision" = touches a recorded decision, or the harness/settings, which the owner decides.

### (a) Prompt / template text

**S6. BT, insert after line 40 (TOOLS header), new bullet.** [F5 corrected; M1, M3]
```
- Prompt-free shell (harness gates): write files with the Write tool, never a shell redirect or heredoc. A redirect stays silent only to /dev/null or to the session scratchpad written literally or as $S, in a command containing none of \ ( # $( <( { }. Delete with mv <f> ~/.Trash/, never rm -r. git add/commit/push/merge/stash/checkout/restore always raise an owner prompt: only the commit agent runs them. A blocked or asked command is never retried in another shape to dodge the gate.
```
Also add the same bullet to CA as a new line after CA:39 (step 3, "Stage explicitly"), so the commit agent itself follows it.

**S1. R03, insert after line 9 ("Lead conduct"), new bullet.** [F1, F9]
```
- **Owner words vs lead readings.** Each owner decision goes to `docs/decisions.md` the same turn: date, his words verbatim in « », then the decision. A lead reading is written « Lead's reading: … », never as his words, and is never copied into OWNER RULES. A product or design gap he did not settle (copy, empty state, layout, colour, behaviour) is never filled by the lead: apply his reference (mockup, sibling app, platform default) or ask him one binary question. A standing process rule he states (commit cycle, parity rule) is recorded there too, never only in the lead's memory.
```
In S:38, replace the first sentence ("Record each new owner decision there, dated, one line …") with `Record each new owner decision there as rule 03 "Owner words vs lead readings" says (the project's CLAUDE.md imports it via @docs/decisions.md, so it survives compaction).`

**S3. R03:36 (item 14), append.** [F3, narrowed]
```
A WIP commit is dispatched only with a suite log at 0 failures (path in the commit brief) and after every step of the project's recorded commit cycle, quoted from `docs/decisions.md` in the brief; the lead reads `git show --stat` after it.
```

**S4. CA:39 (WIP step 3), append.** [F3]
```
Before committing, read `git diff --cached --stat`: a binary file the caller did not name (capture, PNG, build artefact) is unstaged and listed in the report.
```

**S7. R03, insert after S1, new bullet.** [F6 rule side]
```
- **Stop receipt on the lead.** The receipt gate counts sub-agent code writes in the lead's session. The lead never runs a test, build or linter to clear it and never quotes it to the owner: a verification agent is running → end the turn; none → launch one that produces the receipt. A lessons Stop reminder gets no text to the owner.
```

**S2. R03, insert after S7, new bullet; plus a parenthesis change in three places.** [F2 corrected]
```
- **Measured limits only.** Before stating a machine limit ("one build at a time", "not enough memory"), quote `sysctl -n hw.ncpu hw.memsize` and `uptime`. Builds run in parallel, each agent in its own scratch or derived-data path; the gate suite runs in the mode the project's `docs/decisions.md` records. A lock, slot or GO token between agents is set only after a measured collision on the same path, with a named owner and an expiry.
```
In T:20, S:64 and R03:24, replace `(build, simulator, server)` with `(simulator, dev server, database)`. In S:64 the current text is `(build, simulator, dev server, database)`: drop `build, `. T gets shorter by 7 characters.

**S5. R03, insert after S2, new bullet.** [F4 corrected]
```
- **Evidence before "cannot" / "waiting".** "I cannot", "no permission" or "waiting for your approval" reaches the owner only with the refusal text or the pending command read from the tool result or from that agent's transcript; an agent tries the capability first. Silence is never evidence.
```

**S9. R03, insert after S5, new bullet.** [F8 corrected]
```
- **Woken turns.** A turn woken by a notification speaks to the owner only with an outcome (measured result, defect found, decision needed). When the platform says the user has not heard from you, and when he asks "ça avance ?", answer in one line: last measured event with its time, next expected event.
```

**S8. R03, insert after S9, new bullet.** [F7]
```
- **Specialist sessions first.** Before spawning an agent for a role, list the live sessions for it and message the live one; spawn only when none exists.
```

**S10. R03:34 (item 12), append.** [F10]
```
UI proof = capture compared side by side with the owner's reference (mockup or sibling app) in the same state, theme and orientation, every difference listed; the build handed over contains each fix (`git branch --contains <sha>`).
```

**S11. R03:36 (item 14), append after S3.** [F11]
```
One full gate per merge-candidate SHA; a re-gate needs a changed SHA.
```

**S12. R08:18, replace** the clause `On a consequential change (several files, a behaviour change, a root cause, an irreversible action) you MUST run \`fuse-ai-pilot:challenger\` once on your own result before reporting done; a trivial 1-3 line change is proven by a real check (test/build/run) instead.` with:
```
Prove your change with a real check (test/build/run) before reporting; the lead runs the challenger once per gate (docs/decisions.md 2026-11-12).
```
In the same line, `You may run \`fuse-ai-pilot:sniper\`` stays. [A row 12a; backed by D:65]

**S14. T:31, replace with** (shorter, so net negative for T):
```
- Each agent reports to `main` at start (files taken), on a block (immediately) and at the end (done / proof / not verified / files touched) — always its final message; a milestone report only when another agent waits on it.
```
Mirror it in R03:33 (replace "at start, at each milestone, on a block (immediately) and at the end" with "at start, on a block (immediately) and at the end; a milestone only when another agent waits on it"), in R08:26 (same edit), and in BT:64 (replace `- Each milestone: what is done, proof so far.` with `- Milestone: only when another agent waits on it.`). [A row 15]

**S13. R08, append after line 21.** [A row 14]
```
- Keep working until everything the brief asks for is done; stop early only when you cannot go on without the lead or before a risky step. Extras (features, tests, refactors) are one line in the report, not built.
```

**S15. R06, "Memory Hygiene" section, append.** [A row 18]
```
Before shipping a rules or template change, run `/doctor prompt-audit` on the changed files.
```

**S16 — OWNER DECISION. R00:42 ("Think sequentially …"), replace with:** [A row 19; 0 calls in about 14,500 assistant records]
```
- **Think sequentially** — `mcp__sequential-thinking__sequentialthinking` is available for a hard decision (irreversible action, root cause, choosing between architectures); otherwise use the model's own reasoning and the agent's `effort` setting.
```

### (b) Harness hook code (all OWNER DECISION: harness repo; zero regression plus a real-conditions run before release, D:9, D:55)

**H1. `H/policy/patterns.ts:40-44` `GIT_ASK`.** Remove `/git add/` and `/git commit/` from the always-ask list, and ask for `git commit` only when the current branch is `main|master|develop|production`. Every other verb is unchanged, as are `GIT_BLOCKED` and HARD STOP 1. Proof: a 300-min stall on `git commit -F` in commit agent `agent-abb3603034ffecad7`, and 22 add/commit occurrences in asked sub-agent commands, against D:6 « ca doit etre auto ». Test: a real WIP commit by `fuse-ai-pilot:commit` on a feature branch (no prompt), plus a `git commit` on `main` (prompt still raised).

**H2. `H/policy/guards/bash-write-scratchpad.ts` / `-var.ts`.** Accept any shell variable bound unconditionally to the scratchpad (not only `S`), for example `$s`. Proof: the 286-min stall in `agent-a50890745b3204ccd`. S6 already avoids this shape at the prompt level; H2 is the deterministic backstop.

**H3. `H/runtime/lifecycle/task-completed.ts` (Stop branch, lines 95-101).** On a top-level Stop (payload without `agent_id`), drop files present only under `changes.agentFiles`; those are already gated at SubagentStop. Conflict to settle: D:75 (« le 4 oublie ») vs D:21 (narrow to "files another agent wrote").

### (c) Owner settings

**C1 — OWNER DECISION (writes `~/.claude/settings.json`, HARD STOP 3).** `env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS = "6"` makes R03:21's ceiling deterministic (default is 20; documented on env-vars.md and the Opus 5 page). The benefit is not measured for KrazMail (concurrency was not counted), so it is lowest priority.

**Not proposed:** a `permissions.allow` list (A row 22). It removes 0 of the measured prompts, because they come from harness hook asks, which allow rules do not override.

### Rejected outright (re-debate of recorded decisions)
A rows 5, 6, 7 (D:75 « le 5 oublie »), A row 11 (D:5, D:75 item 6), K-F3 generic tap-check gate per WIP (D:65), K-F2 "lock needs owner decision" (T:47, D:54), K-F4 "lead uses computer-use itself" (T:44, HARD STOP 0).

## 6. Not verified
- No replay of the gates on recorded payloads: H1/H2/H3 are read from source plus transcript timestamps. Each needs a real-conditions run before release (D:55).
- The 10,000-character per-prompt behaviour in T:3 is not in the docs fetched (A says the same). The budget argument relies on T's own stated rule, not on a measured truncation.
- The iPad and iPhone `subagents/` folders were not parsed; M2 counts cover the lead's sub-agents only.
- Raw sub-agent ask counts (M2) are attachment lines, not deduplicated by `toolUseID`.
