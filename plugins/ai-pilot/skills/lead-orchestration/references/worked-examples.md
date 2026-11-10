---
name: worked-examples
description: Five bad-vs-good lead behaviours taken from audited Claude and Codex sessions (Oct-Nov 2026)
when-to-use: When unsure how a lead-orchestration step looks in practice
keywords: follow-up, hand-back, visual verification, executor, release, WIP commit
priority: medium
related: brief-template.md
---

# Worked Examples

Drawn from session audits (Claude lead sessions and Codex sessions, 3-12 Oct 2026). Each one maps to steps of the procedure.

---

## 1. Executor left alone, then releases on its own (steps 6, 8, 9, 11)

**Bad.** The lead launched an external executor for four small fixes, promised a duration it did not hold, and did not follow it. The owner asked "where is it? 27 min ... 39 min ... 47 min". Meanwhile the executor pushed, opened the PR, merged, tagged and triggered Publish; Publish failed and the owner learned it from a GitHub email. Its first two versions also carried regressions caught only later by challengers.

**Good.**
- Brief NON-GOALS: write code only, no commit/push/PR/merge/tag/publish. REPORT: to `main` at start, at each fix done, on a block, at the end. Tests first.
- Lead announces the budget (agents and names), never a duration.
- At each report the lead checks the disk and test logs; posts "fix 2/4 done, tests green, fix 3 in progress" before being asked.
- Silent executor -> `SendMessage` with the next step to the same executor, not a new spawn.
- Each fix verified -> commit agent WIP commit on the working branch.
- All fixes done -> sniper, challenger on the diff -> commit agent full mode: push, PR, CI, merge, tag, release, Publish watched to success.

---

## 2. A manual step handed back to the owner (step 8)

**Bad.** Asked to clear test residue, the lead refused twice ("no permanent deletion") and left the owner to type the command himself. Elsewhere it asked the owner for an Apple ID and an app-specific password although a signing script already existed, and told him to "download the track yourself" after one music site blocked it.

**Good.**
- Residue -> the owner's request is the validation; an agent moves the files to Trash (`mv <files> ~/.Trash/`, reversible) and proves it with `ls`. Residue the owner did not name is proposed first.
- Signing -> an agent finds and runs the owner's existing script; ask nothing.
- Blocked site -> an agent uses another scriptable CC0 / free-licence source and records the licence.
- Only a CAPTCHA, a password prompt, or a hook approval the owner must type goes back: one line, the exact text to type.

---

## 3. "Done" without opening the output (steps 9 + 10)

**Bad.** Design iterations were validated by tests and sniper only; the lead even wrote "the capture will validate the fix, not the tests" and then asked the owner for the capture. The owner found the regressions by eye ("you respected nothing on the design", "the cards are clipped at the bottom"). On the Codex side, isolated tests were green while the real page was empty with 504 errors, and code shipped against a table the real database did not have.

**Good.**
- Brief TOOLS names the capture tool; PROOF asks for the capture path.
- The agent produces the screenshot / frames against the real target; the lead opens them and cites what is visible ("cards end 12 px above the fold, no clipping") with the image path.
- Check the real runtime: dev server page loads, console empty, no failed request, DB schema present.
- Tick each part of the request by name; unproven part = "not verified".
- Then sniper (code) and challenger (the claim) -- and only then report "done".

---

## 4. A hook reply received as the report (step 8)

**Bad.** A sub-agent finished its work, then a stop hook demanded "run sniper on 6 code files". The agent answered the hook, and that answer became its final message -- the only thing the lead receives. The real report was lost, twice, and the lead had to reconstruct it.

**Good.**
- Brief REPORT carries the standing sentence: the final message is the report itself; answer the hook, then re-emit the report.
- The agent complies with the hook (or states in one line why it cannot, e.g. the files are throwaway scratch scripts), then re-emits the full report as its last message; a long report also goes to the `docs/` path listed in WRITE, path given.
- A final message without the REPORT fields -> the lead resumes the same agent with `SendMessage` ("send your full report") and checks the disk meanwhile; no new spawn.

---

## 5. "The message reached me cut" (step 8)

**Bad.** Notes from a linked session reached the lead truncated ("first 400 of N characters"); three times the lead told the owner "the message arrived cut" instead of reading it.

**Good.**
- The lead reads the full message first: the session transcript tool (e.g. `mcp__ccd_session_mgmt__list_events`) or `SendMessage` asking the session to resend.
- The owner gets only the content and what it changes, never a transport problem the lead could solve itself.
