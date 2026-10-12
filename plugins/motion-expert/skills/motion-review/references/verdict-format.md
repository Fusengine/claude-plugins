---
name: verdict-format
description: The fixed verdict block for a film review — verdict word, hard-fails FIRST (F, M, D, L, X, S), rejected flag candidates, restatement, ffprobe line, 9 scores with frame refs, a Frame/Symptom/Cause/Fix findings table, one explicit verdict word
when-to-use: Writing the final output of any critic pass on a draft or master
keywords: verdict, format, pass, revise, fail, uncertain, hard-fails, findings table, frame refs, genre
priority: high
related: rubric.md, hard-fails.md, symptom-cause.md, review-pack.md
---

# Verdict Format

## Overview

Same table discipline as `fuse-design`'s UI motion verdict —
`plugins/design-expert/skills/design-review/references/motion-verdict.md` (one findings
table, never a prose list; an empty table is stated, not omitted; one explicit decision
word) — adapted to film: rows cite **frame timestamps** instead of `file:line`, decision
words are PASS / REVISE / FAIL / UNCERTAIN. Do not copy that file's UI duration rules.

---

## The Block (fixed order)

```
VERDICT: PASS | REVISE | FAIL | UNCERTAIN
genre: ad | demo | assumed ad

Hard-fails (checked first, hard-fails.md):
  - <F1-F11 | M1-M3 | D1-D9 | L1-L4 | X1-X4 | S1-S6> <name> @ <frame ref>: <what is seen>
  (or: none)
flags.txt candidates rejected: <F?@ref → why not a fail> | none

Restated message (from frames, before rubric): "<one sentence>"

ffprobe: codec=<> pix_fmt=<> WxH=<> fps=<> duration=<s> frames=<n> size_mb=<n>

Scores (1-10, frame refs; rubric.md — flatness is F2-F10, never scored):
  hook:              <n | n/a>  [still-0.0 still-0.5 still-1.5]
  one-idea:          <n>  [beat-NN ...]
  motion-behaviours: <n>  [strip-NN ...]
  tempo-grid:        <n>  [segments.txt, gestures.txt rate ...]
  cta-hold:          <n | n/a>  [still-last, freeze.txt final-hold]
  accent:            <n>  [beat-NN; colour role]
  legibility-phone:  <n>  [phone#N ...]
  sound-off:         <n>  [contact#N ...]
  look-consistency:  <n>  [look.md / refs.md trait → contact#N]
  mean: <n.n>  (over scored criteria)

Findings:
| Frame | Symptom | Cause | Fix direction |
| --- | --- | --- | --- |
| t=00.00s (still-0.0, F1) | blank paper ground, line fading in by still-0.5 | film opens on an empty canvas | frame 0 = key frame 0 of look.md at full value |
| beat-01 (planes.txt vc=0.0, F2) | lone paper plane, small blue blocks | objects on a ground, no planes | ink/paper split or an accent field with type ≥ 60 L away |

Spikes: <spike@t=..s → declared cut | defect> | none
Audio (only if the file has sound): loudness=<LUFS> key-hit=<±frames> | n/a

intake_leak: yes | no
```

A FAIL on a hard-fail still carries the scores (the builder sees everything at once); an
UNCERTAIN carries none.

---

## Rules

| Rule | Why |
|------|-----|
| `VERDICT` first, one word | The reader acts on line 1 |
| Hard-fails before anything else | A flat or decorated film is decided before any score |
| Every `flags.txt` candidate confirmed or explicitly rejected | Numbers propose, frames decide |
| Restatement before scores | Proves the message was read from frames |
| Every score carries ≥ 1 frame ref | Evidence, not taste |
| Criteria 6 and 9 (accent, look-consistency) cite the look.md colour role or refs.md trait; F2/F3/F8/F10 lines cite the dial | Measured against the locked look |
| Findings is a **table**, one row per symptom; empty → `No findings` | Scannable, diffable between rounds |
| Cause from [symptom-cause.md](symptom-cause.md); fix direction, never code | Shared vocabulary; the critic does not fix |
| Sensitive data described, never transcribed | The verdict must not leak what it reports |

---

## Decision Rules

| Verdict | When | Next |
|---------|------|------|
| **PASS** | No hard-fail, all scored ≥ 7, mean ≥ 8.0 | Owner gate (G2 for a draft) or "done" claim → challenger |
| **REVISE** | No hard-fail, restated, threshold missed | Builder fixes the named rows; max 2 fix rounds per draft |
| **FAIL** | Any hard-fail, or message not restatable | Builder fixes the cause; S1 triggers an asset audit; F, M and D fails go back to look.md / art direction |
| **UNCERTAIN** | ffprobe/ffmpeg missing, pack unreadable | Name the missing item; no scores |

One pass only: the critic never revisits its own verdict. A new draft gets a new pass.

## Round-to-Round Comparison

The builder (not the critic) lines up the previous Findings table against the new one: a
row present in both is a failed fix — a new hypothesis is required before another round.

→ Thresholds: [rubric.md](rubric.md) · Hard-fails: [hard-fails.md](hard-fails.md)
