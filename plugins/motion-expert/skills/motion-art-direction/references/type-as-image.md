---
name: type-as-image
description: Typography as the image of the film — 2–4 words per 0.5–1 s beat (≤ 6 over the 9:16 hook), type animated at letter and word level (stagger, slam, scale jump 3–4×, split along a plane, mask, push, swap), 4–6 behaviours rotated, never the same on consecutive beats, meaning animated on 1–2 words max, one family + one display word, ≤ 2 weights, snappy expo-out easing, overshoot ≤ 3 %
when-to-use: Writing look.md type/kinetic fields, writing on-screen copy per beat, or when the critic flags uniform type, a slide, or "every word does a trick"
keywords: kinetic type, typography, word-object, letter stagger, word stagger, slam, scale jump, split, mask reveal, push, replace, weight swap, size swap, keyword accent, easing, overshoot, words per beat
priority: high
related: composition.md, rhythm.md, templates/kinetic-type.md
---

# Type as Image

## Overview

When there is no product image, type is the image — but only if it is set like one:
few words, huge, cropped, changing on the beat. A sentence at body size in the middle of
the frame is a slide. The rule set below is checkable on stills and on the cut table.

---

## Words per beat

| Beat | Words on screen | Why |
|------|-----------------|-----|
| Beat (0.5–1 s) | 2–4 | Reads in one fixation at 180–420 px, 0.25 s per word |
| 9:16 hook (first 1.5 s) | ≤ 6, over 2–3 beats | Scroll-stop; the hook lands word by word on the beats |
| One-word beats | 1 | "Don't Blink" grammar: one word, ~0.2–0.25 s, many beats |
| Label | ≤ 4 | Support only, 44–56 px |

More copy → more beats, never smaller type and never a held frame. Every word stays on
screen ≥ 0.25 s ([dials.md](dials.md) `HOLD`); a word may stay longer while other
gestures run around it — what is capped is the gesture-free span (0.75 s, `MOTION_DENSITY`).

---

## Kinetic set — type animates at letter and word level

| Behaviour | What happens | Hard rule |
|-----------|--------------|-----------|
| **Letter / word stagger** | Letters (or words) reveal one after another behind hard-edged masks | 0 px mask edge; 20–60 ms per letter, 80–120 ms per word; reading direction |
| **Slam** | A word slams in at full size on a cut, then is pushed out by the next | Arrives in ≤ 3 frames; the next word's push is its exit |
| **Scale jump** | On a cut, the word lands at 3–4× and settles to set size | Heavy spring (ζ 0.87), overshoot ≤ 3 %; from the baseline-left corner |
| **Split** | A word splits along a plane boundary; its halves slide apart | The cut line is the boundary of an ink/paper/accent plane; halves move on one curve |
| **Mask reveal, hard edge** | The word enters through a clip that moves across it | Straight edge, reading direction |
| **Push / replace** | The next word pushes the current one out of the same line box | Both move together, same curve, one line height or word width |
| **Weight / size swap** | Same word jumps weight or size on the beat | A step, or ≤ 4 frames |
| **Keyword accent switch** | One word switches ink→accent on the beat | One word, never a line |

Pick 4–6 for the film and rotate: **never the same behaviour on consecutive beats**
(critic X1). Repetition across the film reads as direction; a new behaviour per word reads
as a template library.

### Animate meaning — 1–2 words max

"Don't Blink" animates the signified on select words (Motionographer, verified): the word
does what it means. Allow it on 1–2 words of the whole film (e.g. "split" cut in two by
the mask, "faster" pushed out in 2 frames). More than 2 and it becomes a gimmick.

---

## Type system

| Rule | Value |
|------|-------|
| Families | One text family + one serif/display face used for word-objects only |
| Weights | ≤ 2 per family |
| Case | One case convention for the film |
| Tracking | Display: tight (−0.02 to −0.04 em, verify on the face); labels: default |
| Fonts | Shipped locally (`motion-render` index-skeleton) |
| Ramp | [composition.md](composition.md) §Scale contrast |

Font choice: avoid the reflex list in `fuse-design:design-system`
references/forbidden-fonts.md.

---

## Easing — snappy expo-out arrivals, a tiny overshoot at most

| Use | Curve | Note |
|-----|-------|------|
| Type entrances, slams | `cubic-bezier(.16,1,.3,1)` | Expo-out shape |
| Scale jump | `springHeavy` 120/19 | ζ 0.87, peak +0.42 % |
| Push / camera | `cubic-bezier(.6,0,.2,1)` | Film in-out (`motion-craft` easing-springs.md) |
| Swaps | Step on the frame boundary | No curve |

Springs at ζ ≥ 0.85 (presets in `motion-craft` easing-springs.md). A curve passing its
target by more than 3 %, a second swing, any bounce/elastic = banned. Squash/stretch is a
scale change that never passes its target by more than 3 %. `safeBezier` and `spring()`
assert it at load.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Sentence fades in, centered | Split into 2–6 word beats; mask reveal, flush-left |
| Opacity fade as the only reveal | Mask, push or swap (bans.md B10, critic M1) |
| Hook word reveals from t = 0 | Frame 0 already shows the opening statement at full value; the first kinetic event is ≥ 1 frame later (critic F1) |
| Every word in accent | One word per beat |
| 3 families "for variety" | One family + one display word |
| Interpolated weight morph over 1 s | Swap on the beat |
| Whole lines cutting in, word after word | Letter stagger, slam, scale jump, split — type moves inside the beat |

---

## Related

- [templates/kinetic-type.md](templates/kinetic-type.md) — code for the behaviours above
- [objects.md](objects.md) — the recurring actor and objects that move with the type
- [rhythm.md](rhythm.md) — when they fire
- `motion-craft` → color-type-video.md (phone legibility), easing-springs.md
