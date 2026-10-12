---
name: exit-contract
description: Stop / Retry / Rollback / Ask / Escalate mapped to motion pipeline events, plus how the render budget is tracked and reported
when-to-use: At every stage end, gate, critic verdict, failed render, or verification mismatch — whenever the loop must end on one explicit issue
keywords: exit contract, stop, retry, rollback, ask, escalate, budget, renders, wall time, critic verdict
priority: high
related: stage-gates.md, brief-lock.md
---

# Exit Contract

## Overview

Every turn of the motion loop ends on exactly one explicit issue — never a silent drift into "one more render". The five issues come from the project's agent rules; this file maps them to the events a film actually produces.

---

## The Five Issues

| Issue | Meaning in a motion film |
|-------|--------------------------|
| **Stop** | Goal verified with proof (ffprobe output, frame diff, critic PASS) — or a gate reached (G1/G2) |
| **Retry** | A NEW hypothesis for a failed criterion — never the same fix twice |
| **Rollback** | A fix broke something already approved → return to the last approved artifact before stacking another fix |
| **Ask** | A taste or brief question the files cannot answer → ONE question to the owner |
| **Escalate** | Past the fix-round cap, a hard-fail on truth/safety, or a tool the pipeline needs is missing |

---

## Event → Issue Map

| Event | Issue | Report must include |
|-------|-------|---------------------|
| Brief field missing (taste) | Ask | The one question + 2-3 options |
| Brief field missing (fact) | Ask, or drop the claim | What was dropped from the screen |
| Stills + contact sheet rendered | **Stop (G1)** | `contact.png` path + sha256, the `MOTION-APPROVE stills <code>` the owner must type |
| `.motion/project.json` missing before the first draft | **Stop** | The recommended content for the owner to create (see [stage-gates.md](stage-gates.md)) — never written by the agent |
| Master render cap reached | Escalate | The deny message, master count, `FUSE_MOTION_MAX_MASTER_RENDERS` value |
| Owner refuses stills | Retry | What changes in the brief/beats/scene and why |
| Draft rendered, critic PASS | **Stop (G2)** | Draft path + sha256, critic verdict block |
| Critic REVISE, fix round 1 or 2 | Retry | Criterion, timestamped frame ref, the new hypothesis |
| Critic REVISE after 2 fix rounds | Escalate | All verdicts, what was tried, root-cause note |
| Critic FAIL (message not recoverable) | Ask | The message the critic restated vs. the brief's |
| Critic hard-fail: sensitive data / invented UI | Escalate | Frame refs; masking/provenance gap (see `motion-assets`) |
| Critic UNCERTAIN (ffmpeg missing) | Escalate | Missing tool, install hint — never self-judge instead |
| A fix regresses an approved still | Rollback | Restored artifact + its approved sha256 |
| Master: ffprobe or frame count mismatch | Retry (max 2, then Escalate) | Expected vs. measured (codec, pix_fmt, WxH, fps, duration, frames) |
| Master over byte budget | Retry (max 2, then Escalate) | Size vs. budget, which lever (fps, width, duration) changes |
| Master verified | Stop | ffprobe block, size vs. budget, frame-diff result vs. approved stills |
| Hook denies an action | Stop | The deny message verbatim — never bypass |

Round caps: the critic's ≤2 fix rounds (pipeline stage 6) and ≤2 master retries per cause (ffprobe mismatch, byte budget). Past a cap the only exit is Escalate — never an uncapped loop.

---

## Budget — Tracked and Reported, Not Capped

| Counter | Reported at |
|---------|-------------|
| Renders per stage (stills / draft / master) | Every Stop, Escalate, and final report |
| Wall time per stage and total | Same |
| Fix rounds used (critic) | Every critic event |

There is **no render cap** in this skill. The harness prints `Motion budget: renders stills N · draft N · master N — wall …` after each render, and enforces an optional master cap (`FUSE_MOTION_MAX_MASTER_RENDERS` in `~/.claude/.env`, 0 / unset = no cap; see [stage-gates.md](stage-gates.md)); reaching it ("Master render cap reached") is an Escalate. Do not invent a limit on renders, frames, or iterations.

A rising render count on micro-fixes is a symptom ("cost explodes → max effort on micro-fixes", `motion-review` symptom table): report it and ask whether the fix is worth another master.

---

## Report Block

```
issue: stop | retry | rollback | ask | escalate
stage: brief | beats | assets | scene | stills | draft | master | validate
gate: G1 | G2 | none  (enforced; approval: pending | approved by hook)
artifact: <path> sha256=<hash>
evidence: <ffprobe / critic verdict / frame refs>
budget: stills=<n> draft=<n> master=<n> wall=<mm:ss>
next: <the one action, or the one question>
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Rendered, looks good" as a Stop | Stop needs measured proof |
| Same easing tweak re-tried after REVISE | New hypothesis or Escalate |
| Fixing on top of a regression | Rollback first |
| Asking three questions in one Ask | One question |
| Silent re-render after hook deny | Stop and report the deny |

---

## Related References

- [stage-gates.md](stage-gates.md) — the gates that produce the two mandatory Stops
- [brief-lock.md](brief-lock.md) — where most Ask events originate
