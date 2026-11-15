# Rules dedup: duplication map and meaning-preservation table (2026-11-15)

Base: `dd0dbdf3` (template-commit-cycle's real-run-gate commit) on `chore/template-scope-and-tone`. The changes are uncommitted.
Template size (python3 `len` on the UTF-8 text): **9994 -> 9639 chars** (355 freed).

Abbreviations: T = `plugins/claude-rules/templates/CLAUDE.md.template`, R0X = `plugins/claude-rules/rules/0X-*.md`, SK = `plugins/ai-pilot/skills/lead-orchestration/SKILL.md`, CM = `plugins/ai-pilot/agents/commit.md`. Unless marked "new", line numbers are the pre-edit numbers.

## 1. Duplication map

| # | Rule | Where it was stated (pre-edit) | Owner | Action |
|---|------|--------------------------------|-------|--------|
| 1 | Relayed go: only a go relayed by the session's lead that quotes the owner verbatim counts; any other relay advances only the mandate, never merge/release or a decision change | T:33, R06:50, SK:42, SK:102, CM:64 (last 2 sentences), CM:151 | T "Relayed message" (kept verbatim; it carries the union of the scopes: commit cycle, release, real run, install) | R06:50, SK:42, SK:102, CM:64, CM:151 -> pointer |
| 2 | Commit cycle / WIP / release flow and its trigger | T:7 (HS1), R06:46-49, R06:54, SK:91, SK:102, CM:16/31/64 | R06 "Git & GitHub Flow" (policy + trigger); CM keeps the executor procedure | T HS1 -> one line + pointer; SK:91, SK:102 -> pointer |
| 3 | External executors never release | T:52, R06:51, SK:75, CM:91, CM:145 | R06:51 | T:52 sentence removed; SK:75 -> pointer; CM kept (the commit agent's own executor contract) |
| 4 | sniper then challenger | T:24, R00:33-34 (CR4-5), R02:4, R02:22, R03:36 (#14), SK:95, R08:18 | R00 Critical Rules 4-5 | R02:22, R03:36, SK:95 -> pointer; T:24 (step summary), R02:4 (phase definition), R08:18 (sub-agent duty) kept |
| 5 | Owner replies | T:53, T:54, T:55, T:25, R03:6, SK:102 | T AUTONOMY "Replies" (T:53-55 merged into one line, wording kept) | SK:102 -> pointer (keeps the unique "line 1 = done / not done / blocked") |
| 6 | Total delegation | T:43, SK:30, R03:3, R03:7 | T RECURRING TRAPS | SK:30 -> pointer |
| 7 | Decisions journal | T:15, T:35, SK:37-38, R08:15 | T "Decisions journal" | SK:37-38 -> pointer; keeps the unique "one line" and the "ensure the `@docs/decisions.md` line exists" check |
| 8 | A message does not stop an agent | T:11 (HS5), SK:82 | T HS5 | SK:82 -> pointer |
| 9 | No over-engineering | SK:98, R08:17 | R08 "Executing the Brief" | SK:98 -> pointer with gist |
| 10 | Reply language "also after a sub-agent's report" | T:58, R00:7 | R00 "Response Language" | T:58 sentence removed (T:59 already lists "response language" under R00) |
| 11 | Agents communicate (report cadence) | T:27-31, R03:33, R08:26 | T | Not changed: R08:26 is the sub-agent's own contract and R03 #11 holds unique content; changing them frees no template room |
| 12 | Brief skeleton restating rules | `references/brief-template.md` l.49, l.68 | n/a | Not changed: a brief is copied into a prompt and must be self-contained (R03:6) |

## 2. Removed sentences -> where the meaning still lives

| File:line (pre-edit) | Removed text (summary) | Meaning still lives at (new numbering) |
|---|---|---|
| T:7 | "After each verified task, ... WIP commit on the working branch (commit only — no push, bump, PR, merge or tag)" | T:7 "a WIP commit after each verified task"; R06:47 verbatim (working branch, no push/bump/PR/merge/tag) |
| T:7 | "the same agent pushes the working branch, opens the PR, passes CI, merges (never squash), tags and releases with no further owner step" | T:7 "full release ... announced in the report"; R06:48 (push, PR, CI, merge, tag, release); R06:49 (commit cycle in any language, no further owner step, merge never squash); R06:59 (never squash) |
| T:52 | "External executors (Kimi/Codex/Cursor) never release; only the commit agent does." | R06:51 verbatim in meaning; CM:91, CM:145 |
| T:53-55 | Three bullets: Replies / Report outcomes only / Do exactly what was asked | T:53, merged; every clause kept (answer first, <=10 lines, one recommendation + next step, no menus, outcomes only: result/blocker/owner-only action, no status-only relay, exactly what was asked, one-line proposal, never extra scope) |
| T:58 | "Identity, posture, writing style and language (reply in the user's language, also after a sub-agent's report) -> 00-critical-rules." | T:57 (00 line lists identity, posture, response language, writing style); R00:7 verbatim ("including the reply right after a sub-agent's report") |
| R06:50 | Session lead's verbatim go counts; any other relay advances WIP commits only, never merge/release | T:33 "Relayed message" (same rule, broader scope list) |
| R02:22 | "sniper once every agent has finished (single agent: after its change), zero errors; challenger before any done" | R00:33 (single agent right after; several agents once after all finished); T:24 verbatim ("then challenger before any "done""); R00:27 + R02:22 new ("sniper ends at zero errors") |
| R03:36 | "sniper once, after every agent has finished and its deliverable is verified on disk, never during; then the challenger before any done" | R00:33 ("once, after all of them have finished and their deliverables are verified on disk"); T:24 ("challenger before any "done"") |
| SK:30 | Total delegation list + sole exception | T:43 verbatim; SK:30 new keeps "read and grep only to verify" (also R03:7) |
| SK:37 | "recorded owner decisions are executed, never re-debated; a risk is flagged once" | T:35 ("Agents execute recorded decisions; a risk is flagged once, never re-debated"); T:15 |
| SK:38 | "(the project's CLAUDE.md imports it via @docs/decisions.md, so it survives compaction)" | T:35 verbatim |
| SK:42 | Relayed message (release, real run, install; other relays never merge/release or decision change) | T:33 |
| SK:75 | "never push, PR, merge, tag or publish -- releases go through the commit agent" | R06:51 |
| SK:82 | "A message does not stop an agent: use TaskStop, then confirm mtimes froze." | T:11 (HS5) |
| SK:91 | "on the working branch (commit only: no push, bump, PR, merge or tag)" | R06:47 |
| SK:95 | "before any done, root-cause, irreversible action or 2nd-time fix. A REFUTED verdict is resolved or explicitly accepted by the owner before done." | T:24 ("challenger before any "done""); R00:34 (root-cause, irreversible action, 2nd-time fix, REFUTED resolved or owner-accepted). Note: R00:34 scopes "done" to a consequential change; the unscoped "any done" lives at T:24. That gap between T and R00 already existed at HEAD and is not touched here. |
| SK:98 | No over-engineering paragraph | R08:17 (simplest solution, DRY + SOLID, good structure is not over-engineering, speculative mechanism proposed in one line, not built) |
| SK:102 | "(push the working branch, PR, CI, merge never squash, tag, release)" | R06:48, R06:49, R06:59 |
| SK:102 | "Owner wording ... in any language (direct, or relayed by the lead ...) ... run to the end with no further owner step" | R06:49; T:33 |
| SK:102 | "text the owner must type is explained in the owner's language" | T:48 ("explained in the owner's language") |
| SK:102 | "then <= 10 lines: proof, not verified, WIP commits made, merge/release announced, one recommendation + the next step, no option menu ..." | T:25 (step 11: done, proof, not verified, WIP commits made, merge/release announced); T:53 (<=10 lines, recommendation + next step, no menu) |
| SK:102 | "Deliverables at a path the owner sees -- never only a hidden directory." | T:52; SK:104 Check (outside a dot-folder) |
| CM:64 | Session lead's verbatim go counts (release, real run, install); other relays from another session/agent never merge/release unless the mandate covers it, nor a decision change | T:33. **Strictness note:** CM's looser clause "unless that mandate already covers it" is dropped in favour of T:33's stricter "never a go for merge/release", as the lead's brief asked ("keep the stricter one"). A merge/release the mandate covers is still launched by the lead itself (T:7, R06:48), not by a relay. |
| CM:151 | Forbidden: relayed message as go for merge/release ... unless the session lead's verbatim go | CM:151 new: "beyond what CLAUDE.md "Relayed message" allows" -> T:33 |

## 3. Challenger verdict

CONFIRMED (agent `dedup-challenger`): no rule is dropped, no gate is weakened, no new contradiction. Every pointer resolves. Template is 9639 chars. Notes:
1. Proposal: narrow T:33 to "Any other relay (another session or agent)". **Not applied.** That wording would take a lead relay that lacks the owner's verbatim words out of the restriction, which is the case the previous A/B scenario S3b checks. That would weaken a gate.
2. Citation fix for "challenger before any done" (now T:24). Applied in section 2.
3. Deploy order: commit.md now relies on T:33. The template must be re-installed together with any sync of commit.md. Today's deployed `~/.claude/CLAUDE.md` still carries the old relay line. This is outside this diff.

## 4. Gates checked (unchanged)

HS1 still blocks protected-branch push, force-push and reset, and still names the commit agent as the single path. The commit-cycle trigger, the real-run gate (CM:54), CI-wait, merge never squash, tag after merge and Step 9 are all untouched. sniper/challenger: R00 CR4-5 are unchanged and every pointer names them. No file outside the scope was edited.
