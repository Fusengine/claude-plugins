---
name: rubric
description: The 9-criterion film rubric (hook, one-idea, motion-behaviours, tempo-grid, cta-hold, accent, legibility-phone, sound-off, look-consistency) with 1/5/10 anchors, genre rules (ad|demo), the PASS threshold, and optional audio checks — flatness (value contrast, display type, type scale, centering, full bleed) is NOT scored, it is hard-fail F2-F10
when-to-use: Scoring a draft or master — only AFTER the one-sentence message restatement is written and the hard-fails are checked
keywords: rubric, criteria, score, anchors, pass threshold, hook, tempo grid, cta, accent, phone, sound-off, look.md, genre, motion behaviours
priority: high
related: hard-fails.md, review-pack.md, symptom-cause.md, verdict-format.md
---

# Rubric

## Overview

Nine criteria, each scored 1-10 with at least one frame ref. **Flatness is not scored.**
Value contrast, display type, type scale, centered composition, mid-tone fills and full-bleed
fields are hard-fails F2-F10 ([hard-fails.md](hard-fails.md)). A frame either clears the
look.md dial or the film fails. No score can buy back a flat frame, and no score rewards
a surface effect (D1-D9). Targets come from the film's own `look.md` (`motion-art-direction`).
This file does not restate their values.

**Order:** restate the message from the frames first (no sentence → FAIL), then the
hard-fails, then this rubric.

---

## Threshold

| Verdict | Condition |
|---------|-----------|
| **PASS** | Zero hard-fails **and** every scored criterion ≥ 7 **and** mean ≥ 8.0 |
| **REVISE** | No hard-fail, message restated, a threshold missed |
| **FAIL** | Any hard-fail, or the message cannot be restated |
| **UNCERTAIN** | ffprobe/ffmpeg unavailable or the pack unreadable |

## Genre (`genre.txt` in the pack)

| Genre | Rule |
|-------|------|
| `ad` | All 9 scored; hard-fails F, M, D, L, X, S apply |
| `demo` | `hook` and `cta-hold` scored only when the film opens on a hook / ends on a card, else `n/a` (excluded from the mean); X2-X4 do not apply |
| Missing | Treat as `ad`, report `genre: assumed ad` |

---

## The Nine Criteria

| # | Criterion | Evidence | 1 | 5 | 10 |
|---|-----------|----------|---|---|----|
| 1 | **hook** — 0-1.5 s | still-0.0/0.5/1.5, cuts.txt, energy s0-1 | Nothing lands before 1.5 s | A cut or move lands by 1.5 s, but generic | Frame 0 already a full-value key frame; a cut or large type move lands before 0.5 s |
| 2 | **one-idea** — one idea per state | beat-NN, contact | States carry two or three ideas each | Most states single, one crowded | Every beat states one thing; the eye reads it in one glance |
| 3 | **motion-behaviours** — rotated, at letter/word level, one recurring actor | strip, contact, beat-NN | A new move per element, or type that only cuts in | Behaviours rotate but type moves only as whole lines; no recurring actor | Letter/word kinetics (stagger, slam, scale jump, split) rotated beat to beat; one geometric actor morphs between states; objects assemble/transform; 3D, if any, has a job |
| 4 | **tempo-grid** — cuts and gestures on a grid, dense | cuts.txt, segments.txt, gestures.txt | Cuts at random intervals, or long empty spans | On the grid, but beats change every 1-1.5 s | Every cut and primary gesture on the grid, a beat change every 0.5-1 s (rate ≥ 2/s), details drawing under the primary |
| 5 | **cta-hold** — the CTA lands last and reads | still-last, `freeze.txt` final-hold, segments.txt last | No CTA, or a final still > 1.2 s (that is F6) | CTA reads, but arrives by a plain cut with nothing built | The actor or object becomes the CTA, the last beats build it, the final still is 0.8-1.2 s and readable |
| 6 | **accent** — single accent, on the key word or as a field | beat-NN, look.md colour roles | Accent everywhere or absent | One accent, but on decoration | One accent colour, on the key word or as a full-bleed field, nowhere else |
| 7 | **legibility-phone** — 390 px, safe zone | phone-390, stills | Key text strains at 390 px | Headlines read, supporting text strains | Every word that matters reads at 390 px inside the safe zone |
| 8 | **sound-off** — works muted | contact, beat-NN | Meaning depends on absent audio | One key claim only implied | Every claim on screen; a muted viewer gets the whole story |
| 9 | **look-consistency** — borrowed traits applied, nothing off-system | look.md, refs.md, board.png vs contact | No look.md, or film ignores it | Palette respected, borrowed traits partly missing | Every borrowed trait in refs.md visible; palette, type, motion inside look.md in every cell; the 3 key frames recognisable |

Moved out of the rubric (round 2): scale-contrast → F8, crop-bleed → F7, value-contrast →
F2 + F10, type-system → F3 + F8. A film that clears those hard-fails has earned the floor.
The rubric then judges what the floor cannot: idea, rhythm, accent, legibility, consistency.

---

## Optional: Audio (only when the deliverable has sound)

Not scored; pass/fail lines. A failed audio check caps the verdict at REVISE.

| Check | Pass | How |
|-------|------|-----|
| Loudness | ≈ -14 LUFS integrated | `ffmpeg -i V -af ebur128=framelog=quiet:peak=true -f null -` (builder-side; not in the critic whitelist) |
| Key hit | Within 3 frames of the visual event | Event frame vs audio peak timestamp |

---

## Scoring Discipline

| Rule | Why |
|------|-----|
| One frame ref minimum per score | A score without evidence is opinion |
| Score what is on screen, not what was intended | The critic never sees the brief's message |
| Mean over scored criteria, one decimal; `n/a` excluded | PASS needs ≥ 8.0 |
| No half-points | Anchors are coarse on purpose |
| Below 7 → a symptom → cause row | [symptom-cause.md](symptom-cause.md) |
| Cite the look.md dial or refs.md trait measured against | criteria 6, 9 |
| Never re-score a flatness item | It is F2-F10 or nothing |

→ Output layout: [verdict-format.md](verdict-format.md)
