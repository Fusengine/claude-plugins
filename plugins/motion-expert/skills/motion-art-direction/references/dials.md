---
name: dials
description: The seven art-direction dials of a film — DESIGN_VARIANCE, VISUAL_DENSITY, MOTION_INTENSITY (from fuse-design) plus VALUE_CONTRAST, TYPE_SCALE, HOLD, MOTION_DENSITY (≥ 1 primary gesture/s, ≤ 0.75 s gesture-free, CTA still ≤ 1.2 s) — with numeric targets, what each value obliges, and the screen-holding floor transposed to beats
when-to-use: Writing the dials block of .motion/look.md (Gate 0), or when a still reads empty, grey, or uniform, or a draft reads under-animated
keywords: dials, design variance, visual density, motion intensity, motion density, gesture rate, gesture-free span, value contrast, oklch, type scale, hold, screen-holding floor, obligations
priority: critical
related: gate-zero.md, templates/look.md, composition.md, type-as-image.md, rhythm.md, contrast.md
---

# Dials

## Overview

A look without numbers drifts to the model's average: mid-grey, mid-size, centered, evenly
timed. The seven dials are **contractual inputs** — every one is written and argued in one
line in `.motion/look.md`, and every one is checkable on a still or a timing table.

The first 3 come from fuse-design. Their meaning, the 1–10 poles and the "no silent
5/5/5" rule live in `fuse-design:design-method` SKILL.md §Design Read + the 3 dials — read
it there, do not restate it. This file only transposes them from scroll to beats and adds
the 4 film dials.

---

## The 3 transposed dials

| Dial | On a page | On a film (what to count) |
|------|-----------|---------------------------|
| `DESIGN_VARIANCE` | Departure from the canonical skeleton | Asymmetry and bleed: how many hero frames are flush-left / off-axis, how many carry a cropped word |
| `VISUAL_DENSITY` | Matter per unit of scroll | Distinct objects on screen per beat (word-objects, type lines, UI fragments, full-bleed fields) |
| `MOTION_INTENSITY` | Static → cinematic | Cuts per second + share of beats where type itself moves (not just enters) |

### Obligations (a number is a promise)

| Value | Obliges, in look.md |
|-------|---------------------|
| `DESIGN_VARIANCE` ≥ 6 | ≥ 1 bleeding word in ~1 of 3 scenes; every hero frame flush-left on the grid; the signature device used ≥ 2× |
| `VISUAL_DENSITY` ≤ 3 | The **per-beat inventory** (below) — what fills each beat, named |
| `VISUAL_DENSITY` ≥ 7 | Two regimes: dense inside one block, ≥ 40 % empty around it |
| `MOTION_INTENSITY` ≥ 6 | The kinetic set (4–6 behaviours), the recurring actor, the curve set, the tempo |
| Any dial at 5 | One line saying why the middle is the answer, or move it |

A dial the film cannot hold is lowered in look.md, never shipped as a claim.

---

## The 4 film dials

Units everywhere: **px at the 1080 px-wide output frame** (scale by `W / 1080`), lightness
as **OKLCH L 0–100**. Critic floors in `motion-review` hard-fails.md are these same
numbers: a dial target is never above its floor.

| Dial | Measures | Target | Critic |
|------|----------|--------|--------|
| `VALUE_CONTRAST` | **Area-weighted**, on every state. Take the planes covering ≥ 20 % of the frame. With two or more, the L gap between the **two largest** must be ≥ 60. With one, it must be ink or accent, with the type on it ≥ 60 away. A lone paper/light plane with small objects fails (value 0). | ≥ 60 | F2 |
| `VALUE_CONTRAST` · full bleed | States with an ink or accent plane ≥ 50 % of the frame | ≥ ⌈N states / 3⌉ | F10 |
| `TYPE_SCALE` | Largest / smallest type px on a hero frame; one-size frame: that size ≥ 180 px | ≥ 4, ideal ~8 (400 / 52 = 7.7) | F8 |
| Display floor | Largest type on a hero frame | ≥ 180 px (display 180–220, word-object 300–420, min readable 44) | F3, L2 |
| `HOLD` | Read time: how long each word stays on screen | ≥ 0.25 s/word, min 0.4 s per state | L4 |
| `MOTION_DENSITY` | Primary gesture onsets per second over the body (t = 0 → final CTA still); the gesture-free span; the final still | ≥ 1 /s (a beat every 0.5-1 s; ~2 at 120 BPM half-beats); no span > 0.75 s without a gesture; final CTA still ≤ 1.2 s | F11, F6 |

**Hero frame** = the 3 key frames (frame 0, mid, CTA) plus the settled state of every
state that carries type, except a state that is only a real-screenshot crop.

**Mid-tone** (contrast check, not a dial): a neutral fill (L 30–85, chroma < 0.03) over
5 % of the frame fails (F9).

### Calibration — the rejected ad

The fusengine.ch vertical ad (540×960 CSS px stage, captured at ×2; areas from its CSS and tile geometry):
- Ground `#fbfcfe` is L 99.1.
- The 4 tiles are 200×124 each, **19.1 %** together, and lerp from `#0000b6` (L 35.1) to `#ffffff`.
- The CTA pill is 6.0 %; the logo is about 10 %.
- The old "lightest − darkest" metric scored 99.1 − 21.4 (`#151923` text) = **77.7, a pass**.

Area-weighted, no still has a second plane ≥ 20 %, and the lone plane is paper.
VALUE_CONTRAST fails on every state, and full bleed is **0 of 6** (2 needed). The hook
type is 76 / 168 px at 1080, so TYPE_SCALE is 2.2 and the largest type is below 180.
That is three dials failed by the frame the owner rejected.

Why these 4: the owner rejected depth-by-effect, then approved the still look and asked
for more animation ("ça manque d'animation", prompt-motion.com as the reference). What
carries richness without effects is **value** (a frame that is 85 % ink and 15 % paper
reads strong at any size), **scale** (one word 8× its label is an image), **time** (words
on the beat) and **density** (a purposeful gesture always in progress). A grey frame, a
uniform type size, an even metronome and a still frame each fail one dial.

`HOLD` is a read floor; `MOTION_DENSITY` caps the still time. They do not conflict: a word
stays readable while its underline draws, the actor passes and a counter ticks. Long copy
is split into more beats, never held still or kept alive by a drift. Apple "Don't Blink"
puts most words on screen 5–7 frames at 29.97 fps (~0.2 s), one word at a time
(Motionographer, verified). Below ~0.2 s/word, reading breaks.

`MOTION_DENSITY` obliges, in look.md: the gesture plan per beat (primary + details), the
recurring actor, and the kinetic set — the state table of [templates/look.md](templates/look.md).

---

## Screen-holding floor — per beat, at Gate 0

Transposed from `fuse-design:design-method` §The screen-holding floor. 3 facts together
leave a beat with nothing to look at:

- `VISUAL_DENSITY` ≤ 3, **and**
- `DESIGN_VARIANCE` ≥ 6, **and**
- no product asset for that beat (no real screenshot, no data, no drawn UI).

Then every beat in the inventory must name at least one of:

| Fills a beat | Counts when |
|--------------|-------------|
| Word-object | One word ≥ 300 px, bleeding or flush to a margin |
| Display line | 2–6 words at 180–220 px |
| Full-bleed field | Accent or ink field covering ≥ 50 % of the frame, type on it |
| Drawn UI fragment | Real product state redrawn in markup (fuse-design `stripe-recode` precedent) |
| Real screenshot | From `motion-assets`, cropped to one region |
| Animated object | A flat geometric object or a 3D object standing for the product ([objects.md](objects.md)) |

A beat whose inventory line is only "text" or "logo" fails the floor. Fix it in one of
3 ways, and say which: raise density, manufacture matter (drawn UI, a word-object), or
lower variance.

### Inventory format (goes in look.md `states`, with each state's gestures)

```
beat 1 hook   0.0–1.5  word-object "STOP" 400 px bleeding left · label 52 px · ink field 100 % · actor block travels, letters stagger
beat 2 pain   1.5–4.0  5 beats of 0.5 s, 2–4 words 200 px · paper 55 % / ink band 45 % (gap 83) · underline draws
beat 3 turn   4.0–4.5  accent full-bleed (the actor floods) · 1 word 220 px slams in
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Dials copied from a reference film | Read the reference's values on the board, then argue yours |
| `VALUE_CONTRAST` as lightest − darkest | Small dark objects on a white ground score 77 and still read flat: weigh by area |
| Paper ground + ink type only | Lone paper plane = fail; add an ink/accent band ≥ 20 % or flip the ground |
| `TYPE_SCALE` 2 ("big title, normal body") | Make one word an object; drop the body copy to the label size |
| Beats uniform across the film | Tighten toward the end, then build the CTA ([rhythm.md](rhythm.md)) |
| `MOTION_DENSITY` met by ambient loops | A pulsing dot or spinning shape is slop; count primary gestures only |

---

## Related

- [gate-zero.md](gate-zero.md) — where the dials are locked
- [templates/look.md](templates/look.md) — the dials block
- `fuse-design:design-method` SKILL.md — dial poles, obligations, screen-holding floor (source)
