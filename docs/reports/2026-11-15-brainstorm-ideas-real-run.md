# Brainstorming agent, ideas mode: real run on fuse-harness (2026-11-15)

## Method

- Definition under test: the edited `plugins/ai-pilot/agents/brainstorming.md` body plus the edited `plugins/ai-pilot/skills/brainstorming/SKILL.md` body, loaded through `claude -p --agent brainstorming-upgraded --agents ./agents.json` (Claude Code 2.1.325) in a throwaway scratchpad directory. Nothing was written under `~/.claude`. The `skills:` field was left out so the installed, older `brainstorming` skill could not shadow the edited text; the edited skill body was appended to the prompt instead.
- Project: `/Users/brunoazoulay/Labo/docker-lab/dev.local/Dev-ai/claude-code/fuse-harness`, passed with `--add-dir`, declared read-only in the prompt because it has uncommitted work by others. The ideas doc was redirected to the scratchpad. Only that path differs from the agent's default `<project>/docs/plans/`.
- Prompt: "Ideas mode. Project: <path> (READ-ONLY …). No explore/research findings are provided: launch the helpers yourself. Write your ideas doc to <scratchpad>/docs/plans/2026-11-15-fuse-harness-ideas.md … End with the 3 Suggestion lines."
- Known artifact: the definition was snapshotted before the challenger's fixes, so the run's prompt still had two stray closing-tag lines at the end, and the "one binary question to the lead" wording came later. Neither affects ideas mode.

## Measured proof (from the stream-json transcript)

| Check | Result |
|-------|--------|
| Run status | `success`, 34 turns, 300.7 s, USD 5.54 (Opus 5.5 + Sonnet 5.5 helpers) |
| Launched explore + research | Yes. Top-level `Agent` calls: `fuse-ai-pilot:explore-codebase` ("Map fuse-harness architecture and gaps") and `fuse-ai-pilot:research-expert` ("Research hook APIs and comparable tools"), run in parallel |
| Challenger on the top 3 | Yes. `fuse-ai-pilot:challenger` ("Challenge top 3 harness ideas"): idea 2 was REFUTED, then fixed |
| Other agent types | None. Exactly 3 `Agent` calls in total |
| Asked the owner anything | No. Zero `AskUserQuestion` calls (the 2 string hits are documentation text in a hook payload). Zero `SendMessage` calls. The result says "Hypothèses retenues (aucune question posée)" |
| Coherence inputs | `docs/decisions.md`, `MEMORY/LESSON.md`, `git log --oneline -30` read; ideas cite decisions 52, 77, 121, 128 and lessons 2026-10-12, 2026-10-14 |
| Grounding | Each of the 3 cites file:line proof that it is missing, plus fetched doc URLs |
| Built nothing / project untouched | `git status --short` in fuse-harness is identical before and after (the same 7 pre-existing entries; `logs_2.sqlite` and `t2.sh` date from 2026-11-11) |

## The 3 suggestions produced

1. Suggestion: `harness doctor` reports the sha256 of `dist/cli/bin.mjs` and scans each host install read-only (Claude marketplace, `${CODEX_HOME:-~/.codex}`, `${KIMI_CODE_HOME:-~/.kimi-code}`, `~/.cursor/.fusengine-global`), flagging any host on a different build → gain: "released ≠ installed" is answered in one command instead of hand-computed shas — cost: S — evidence: `origin/main:src/cli/doctor.ts:38,49-51,72-76`, `src/config/home-dir.ts:19`, https://bun.sh/docs/runtime/hashing
2. Suggestion: a CI job runs the existing `test/bash-write-monotone/differential.ts` on merge-base vs HEAD and fails on any verdict change not listed in a committed `approved-changes.json` → gain: the owner's per-branch zero-regression proof (decision 52) becomes automatic on every PR — cost: M — evidence: `origin/main:test/bash-write-monotone/differential.ts:107,129-145,170-192`, `.github/workflows/ci.yml:10-28`, https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
3. Suggestion: add `macos-latest` to the CI matrix and pin both Publish jobs to CI's bun, after making single-sample timing tests min-of-N → gain: the macOS-only allow paths run in CI, and Publish stops testing on `latest` — cost: M — evidence: `origin/main:.github/workflows/ci.yml:12,17`, `publish.yml:23,56`, `test/bash-write-lexer-v15.test.ts:148`, https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations

Not independently re-verified here: the file:line citations themselves (the run's own challenger checked them). This report proves the agent's behaviour, not that each idea is correct.

## Ideas doc produced (lightly condensed; same ideas, evidence and verdicts)

# fuse-harness - Ideas (2026-11-15)

Technique: SCAMPER on the main flow (guard change -> differential proof -> install -> release) + reverse brainstorming ("how does the next regression ship unnoticed?").
Inputs read: `docs/decisions.md` (working tree, 206 lines; lines 53+ are uncommitted), `MEMORY/LESSON.md`, `git log --oneline -30`, explore-codebase report, research-expert report, one challenger pass.
Reference tree: `origin/main` 5d5c963 (v0.1.119). The checked-out branch (aa1d13c) is older, so evidence is cited as `origin/main:<path>:<line>`.

### Top 3

1. Suggestion: `harness doctor` reports the build identity (sha256 of `dist/cli/bin.mjs`) and runs a read-only scan of every host install (Claude marketplace, Codex, Kimi, Cursor), flagging any host whose build differs. → gain: "released ≠ installed" becomes a one-command answer. Today `package.json` lies after a dist swap (it read 0.1.115 while the dist was 0.1.117+ask→block), and agents re-derive shas by hand in decisions 53, 61, 67, 101, 135 and 140. Lesson 2026-10-30 15:12 records a misdiagnosis caused by Codex running 0.1.110. -- cost: S -- risk: wrong install paths would give a false "ok". Use the real load paths, and resolve `CODEX_HOME` (which `harnessHome()` ignores).
   Evidence: missing at `origin/main:src/cli/doctor.ts:38,49-51,72-76` (reads `package.json` only; `git grep "bin\.mjs|node_modules/@fusengine/harness" origin/main -- src` finds nothing). Real load paths per `docs/real-condition-test-plan-2026-11-11.md:17-22` and decision 140. `CODEX_HOME` gap at `origin/main:src/config/home-dir.ts:19`; existing resolution to reuse at `src/policy/design/corpus-resolve.ts:39`. Reuse `sha256File` from `src/policy/motion/hash.ts:20`. API: https://bun.sh/docs/runtime/hashing
2. Suggestion: a CI verdict-differential gate that reuses the existing `test/bash-write-monotone/differential.ts`. On each PR it runs `run` on the merge-base and on HEAD (`MONO_STRIDE=40`, the 790-row set, with `bun install` in both checkouts), then `diff` with the historical tag-based attributions disabled. Any changed verdict, in either direction, fails the job unless it is listed in a committed `test/bash-write-monotone/approved-changes.json`. A crashed hook process counts as an error, not as allow. The job summary states that coverage is bash-write only. → gain: the owner's per-branch proof (decision 52) runs on every PR instead of by hand (decisions 61, 88, 98, 121, 125, 130, 136). -- cost: M -- risk: an agent holding the owner's gh credentials can edit the approval file itself, so it gives review visibility, not access control. CI time is estimated at 5-10 min (not measured).
   Evidence: not wired at `origin/main:.github/workflows/ci.yml:10-28`. `diff` never fails at `origin/main:test/bash-write-monotone/differential.ts:170-192`, although `:9` says UNATTRIBUTED "blocks the branch". Tag-based auto-attribution hides tightenings at `:129-145`. Empty stdout is read as allow at `:107`. No git/rm/remote rows at `test/helpers/monotone-atoms.ts:21-37`. API: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
3. Suggestion: add `macos-latest` to the CI matrix, and pin both Publish jobs to the bun version CI tests, after first making every single-sample wall-clock test min-of-N. → gain: the allow branches for macOS-only paths (`/private/tmp`, `/var/folders`; decisions 15 and 20) run in CI, and Publish stops testing with a different bun than CI (lesson 2026-09-06 22:47; Publish flakes in decisions 38-42). -- cost: M -- risk: a 3-CPU M1 runner doubles the exposure to timing flakes, so without the min-of-N precondition (lesson 2026-10-14 13:13) the matrix is a net loss.
   Evidence: missing at `origin/main:.github/workflows/ci.yml:12` (ubuntu only) and `:17` (bun 1.4.0), against `publish.yml:23,56` (`bun-version: latest`). Single-sample perf test at `test/bash-write-lexer-v15.test.ts:148`. APIs: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations, https://docs.github.com/en/actions/reference/runners/github-hosted-runners, https://raw.githubusercontent.com/oven-sh/setup-bun/main/README.md

### Also considered (dropped)
- `harness verdict` explain CLI: mostly covered by piping a payload into `harness hook <id>`, and overlaps idea 2.
- Guard-decision journal + `harness stats`: a new subsystem, against the owner's anti-over-engineering stance (decisions 121, 128).
- SessionStart "versions behind" warning: folded into idea 1 as a follow-up.
- Replacing the hand-rolled lexer with sh-syntax / tree-sitter-bash: repeats lesson 2026-10-12 10:45.
- fast-check property tests: random monotone runs already exist (decision 65).
- Total per-prompt injection budget: contradicts lesson 2026-10-12 18:29.
- Motion forgery guard false block: already queued (decision 77).

### Challenger outcome (inside the run)
- Idea 1: CONFIRMED, with install paths corrected.
- Idea 2: REFUTED as first designed (it failed only on loosened rows), then fixed as above.
- Idea 3: facts CONFIRMED; net gain UNCERTAIN until the timing tests are robust, so that precondition is now part of the suggestion.

### Assumptions (made instead of asking)
- The Publish bun pin is the version CI already proves green (1.4.0). Moving both to 1.4.4 is a separate owner choice.
- The idea 2 approval file is a review-visibility mechanism, not enforcement.
- Idea 2 covers bash-write only.
