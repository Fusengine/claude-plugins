# Challenger product lens — real runs and claims-verdict regression replay (2026-11-15)

## 1. Change under test

- `plugins/ai-pilot/agents/challenger.md`: new Step 5 "Product lens", a `PRODUCT LENS` block appended to the mandatory output, two Forbidden lines, one clause in the frontmatter description.
- `plugins/ai-pilot/skills/challenge/SKILL.md`: the same lens in compact form (protocol row 5, section, output block, two Forbidden lines, description clause).
- `plugins/ai-pilot/skills/lead-orchestration/SKILL.md` step 10: one clause saying the challenger's lens runs on feature changes.

Steps 0-4, the VERDICT line, the 2-round bound and every pre-existing Forbidden line are unchanged (diff: additions only, plus the two description clauses).

## 2. Method

The installed `fuse-ai-pilot:challenger` cannot load the worktree definition, so every run used `claude -p --agent challenger` (Claude Code 2.1.325, `claude-opus-5-5`, effort medium, `--permission-mode bypassPermissions`, `Edit,NotebookEdit` disallowed) from a throwaway dir holding a project-level copy of the edited agent and skill (`<scratch>/plens/run/.claude/`). The init event shows the agent's restricted tool set (15 tools, no Edit), so the definition was applied. Nothing under `~/.claude` was written.

Each target was an isolated git repo fetched at the exact commit (ancestors only, so no later commit or A/B report could leak into the intake):

| Run | Repo state | Intake |
|-----|-----------|--------|
| real run | `633da482` checked out | done/correct claim for the suggestions rule |
| negative control | `d87d2d87` (`fix(hooks)`) checked out | done/correct claim from the commit message |
| replay (a) | base `5d5c963` + the round-4 uncommitted diff | the original guards-challenger4 prompt, verbatim except paths and the report channel |
| replay (b) | `609b5547^` + the dedup as an uncommitted diff (6 files, +19/-21, same as the original) | the original dedup-challenger prompt, verbatim except paths and the report channel |

Replay (a) code: commit `1688826` already contains the round-4 fixes, and the round-4 state was never committed. It was rebuilt by extracting `1688826` and reverse-applying, newest first, the 8 successful Edit calls made on the guards worktree after round 4 started (01:58:11Z), taken from the session's sub-agent transcripts (failed Edit calls skipped). Fidelity check: the round-4 probe script (`chal4/synth4.ts`) on the rebuilt tree reproduces exactly the round-4 false blocks (Greek question + sentence, `?!`, `?🙂`, Armenian, Ethiopic, Thai question, Thai report), while the same script on `1688826` shows them fixed. The transcript given was the byte-exact first 51,378 lines of the real session transcript, the length round 4 replayed.

## 3. Real run — `633da482` (feature: suggestions rule)

Claims verdict: **CONFIRMED** (with non-blocking objections). Product lens, verbatim:

```
PRODUCT LENS: RUN — behaviour change by design: both rules now require every agent and the lead to actively bring suggestions in a fixed format (08:17, template:53). Before, the template said "anything else found is a one-line proposal …, never extra scope".
  1. Coherence: ISSUE — template:53 repeats the grounding detail of 08:17 (exists / APIs real / research-expert + explore-codebase / decisions.md). This goes against template:56 ("only the owning rule holds its detail") and against the previous commit 609b5547 ("one owning file per rule; template keeps one line + pointer"). The two copies already differ (no fallback in the template).
     Suggestion: cut template:53 to "Bring ideas: one line each, `Suggestion: <idea> → gain: <benefit>`, grounded and never built without the owner's go (rule 08 "Executing the Brief")" → gain: one owning rule, no drift between lead and sub-agents, and about 150 characters freed under the 10,000 limit.
  2. Usability: ISSUE — lead reply path: before, 0 extra steps (a one-line proposal). After, 2 agent launches per suggestion (research-expert + explore-codebase), even when a sub-agent already grounded it. Harder.
     Suggestion: let the lead reuse the grounding a sub-agent states in its report, and require the agents only when nobody has grounded the suggestion yet → gain: no repeated research, in line with decisions.md:65.
  3. Consistency: ISSUE — "propose each" (template:53) conflicts with "≤10 lines" in the same bullet, and "while analysing" conflicts with 03-agent-teams.md:7 ("never to do the analysis itself"). The format itself is consistent between 08:17 and template:53.
     Suggestion: say "while reviewing agents' findings, propose the top suggestions within the ≤10-line reply" → gain: the bullet stops contradicting itself and the lead's no-analysis rule.
```

The first draft run (v1 wording) also produced RUN with three file:line points on the same commit, plus one extra: the report chain (`brief-template.md:66`, step 11) has no field for suggestions, so they can be dropped before reaching the owner.

## 4. Negative control — `d87d2d87` (`fix(hooks)`: matchers missed NotebookEdit / renamed Agent tool)

- **v1 wording: FAILED.** The lens ran ("the hook scope widens; not the restoration of a documented behaviour"). Cause: "a bug fix that restores the intended behaviour" left coverage gaps ambiguous.
- **Fix applied:** SKIP now names the case explicitly — "an existing feature now does what it was already meant to do, including on cases it missed (a missed input, a renamed tool, a matcher or coverage gap, a wrong value)"; RUN requires a change "by design".
- **v2 wording: PASSED.** Verbatim (the run answered in the owner's language per the user CLAUDE.md):

```
PRODUCT LENS: SKIPPED** — c'est un bug fix. Des matchers existants ratent des cas : NotebookEdit n'était pas couvert, et le nom d'outil `Task` est devenu `Agent`. Le diff ne change que des chaînes `matcher` et ajoute deux lignes à `docs/decisions.md`. Aucune nouvelle capacité n'est ajoutée.
```
- v2 re-run on `633da482` still RUN (section 3), so the tightening did not switch the feature case off.
- Stability (final wording, 3 independent runs per case; repeats `fix2`, `fix3`, `feat2`, `feat3`): d87d2d87 → SKIPPED 3/3; 633da482 → RUN 3/3, each with the 3 points and file:line evidence. The duplicated rule between `08:17` and `template:53` was the Coherence ISSUE in 2 of 3 feature runs (the third cited an overlap with `plugins/ai-pilot/skills/exploration/references/response-format.md:44-46`); the missing suggestions field in `brief-template.md:66` came up in `feat2` and in the v1 run.
- Extra control: replay (b) (a dedup) also returned `PRODUCT LENS: SKIPPED — déduplication de texte de règles, sans changement de comportement`.

Claims verdict on d87d2d87: v1 UNCERTAIN (found that the harness still ignores NotebookEdit beyond the matcher), v2 CONFIRMED scoped to the matcher layer, noting the commit itself says it stays inert in the harness. With the lens skipped in v2, this spread is run-to-run variance of the unchanged claims procedure, not a lens effect.

## 5. Claims-verdict regression replay (owner: « mais il sera toujours bon challenger ? »)

| Replay | Historical verdict | Updated challenger | Result |
|--------|-------------------|--------------------|--------|
| (a) lead-guards round 4 | A CONFIRMED, B REFUTED, C CONFIRMED, D CONFIRMED | A CONFIRMED, **B REFUTED**, C CONFIRMED, D CONFIRMED | same verdicts |
| (b) rules dedup "no rule lost" on `609b5547` | CONFIRMED, regression not flagged | CONFIRMED, **regression mechanism named** as an untested hypothesis | same verdict, different findings (the one that mattered now raised) |

(a) details. A: exactly the 10 listed relays block, 0 owner-started blocks, L50853 now passes, 0 blocks with `stop_hook_active`. B REFUTED on false blocks of real questions: Armenian `՞` and Ethiopic `፧` (both also found in round 4), Thai question without `?` (round 4 too), plus a case round 4 did not find — formal Japanese `マージを今実行してもよろしいでしょうか。`; it also measured the `long-body` margin (L50853 at 243 prose chars vs threshold 230) and corrected the "16..229-char" claim. Round 4 also found `?!`, `?🙂`, Greek question + sentence, a Burmese question without `?` and a 112-char Thai report, which this run did not re-test: same verdict, partly different coverage. C: 147 pass, `tsc` 0, diff limited to `dispatch.ts`/`handle-pre.ts`, plus a check of the 2 extra full-suite failures against a clean base checkout (flaky timeouts). D: `stop_hook_active` cited from the hooks docs. The lens ran as an extra section (new feature: two lead guards) and its Usability ISSUE repeats the B finding.

(b) details. Verdict CONFIRMED like the original. Its untested hypothesis 3 reads: the release details (PR, CI, never squash) "are no longer re-sent on every prompt: they moved from the template to `06:44-59`, loaded in full at launch but truncated to about 2 KB in the per-prompt hook copy. The rule still exists, it is only less visible." That is the mechanism the later A/B measured (S5 strict pass OLD 5/8 vs NEW 1/8 after the HARD STOP 1 sentence moved out of the template; restored in `5e97d4c8`). The original dedup-challenger mapped the same sentence to `06:47-49` and raised nothing on salience. Neither run went as far as REFUTED; the owner-visible improvement is that the risk is now on the page. The historical run raised two notes this replay did not (a wrong citation in the author's map, R00:34 vs T:24; the deploy order between commit.md and the installed CLAUDE.md), so the findings differ rather than strictly grow.

Not changed by the lens in any run: the VERDICT line is first, Steps 0-4 ran in full (hypotheses, counter-examples, sources), and the lens block came after the Recommendation.

## 6. Raw outputs

Stream-json logs (scratch, not durable): `/private/tmp/claude-501/-Users-brunoazoulay-Labo-docker-lab-dev-local-Dev-ai-claude-code-claude-plugins/2723977a-20cc-47b1-bf76-10a7db930be8/scratchpad/plens/out/` — `feat.jsonl`, `feat2.jsonl`, `feat3.jsonl`, `fix.jsonl`, `fix2.jsonl`, `fix3.jsonl` (final wording), `feat-v1.jsonl`, `fix-v1.jsonl`, `replay-a.jsonl`, `replay-b.jsonl`; independent challenger pass on this report: CONFIRMED on all three claims, its two wording corrections applied in section 5; prompts in `../prompts/` (`orig-*.txt` = historical intakes, `replay-*.txt` = replayed intakes). Replays (a) and (b) ran on the v1 lens wording; the v1→v2 change touches only the SKIP/RUN classification sentence, not the claims procedure.
