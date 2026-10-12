---
name: hard-fails-example
description: Worked hard-fail example on the real rejected flat ad (white ground, small blue tiles, centered type, fade-ups, drop shadow, slow camera drift) — every ID that fires, then the same film after a 4-line cosmetic patch, which still FAILS on the flatness IDs
when-to-use: Calibrating a critic pass; showing a builder why a cosmetic patch does not lift a flat film out of FAIL
keywords: example, rejected ad, flat, patch, value contrast, centered, type scale, full bleed, crossfade, drift, shadow
priority: medium
related: hard-fails.md, review-pack.md, templates/review-pack-script.md
---

# Hard-Fails — Worked Example

## Overview

The owner rejected the film this example uses as "trop simplet". The facts below come from its
scene source, read once to build this calibration case; a real critic never sees source. The
measured numbers come from a synthetic replica run through
[review-pack-script.md](templates/review-pack-script.md) §Test record. All sizes are px at
1080 wide (the stage is 540 CSS px, so ×2).

## The Film

| Fact | Value |
|------|-------|
| Ground | `#fbfcfe`, OKLCH L 99.1, full frame, all film |
| States | hook 0-4.2 · tiles 4.2-7.4 · linked 7.4-10.6 · swiss 10.6-14.4 · brand 14.4-16.2 · cta 16.2-19.6 s (N = 6) |
| Frame 0 | Blank: every element is at opacity 0 and the tiles have zero width |
| Hook type | `l1` 76 px (fades in from 0.2 s, rises 36 px) · `l2` 168 px (fades in 1.0-1.8 s) |
| Other type | cap3 62 / 132 · eyebrow 34 + cap4 140 · tile labels 54 · CTA 62 · URL 54 |
| Tiles | 4 × 400×248 px, 19.1 % of the frame in total, blue `#0000b6` turning white as they split, with a `box-shadow` blur of 48 px |
| Layout | `text-align: center` throughout; tiles mirrored about the centre; nothing touches an edge |
| Camera | `#cam` scale 1.000 → 1.035, eased over the whole 19.6 s |
| Entrances | Every element: opacity + a 20-80 px rise; tiles → logo cross-fade 10.6-11.4 s |

## As Rendered — FAIL

| ID | Fires because | Pack evidence (replica) |
|----|---------------|-------------------------|
| F1 | Frame 0 is blank paper; `l1` still fading at 0.5 s | `F1?` uniform open + blend from 0.23 s |
| F2 | Every state: one plane ≥ 20 %, and it is paper (tiles 19.1 %) → value 0. The old "lightest − darkest" gave 99.1 − 21.4 = 77.7, a pass | `F2?` `vc=0.0`, `L1=98.6 s1=0.93-1.00` |
| F3 | Largest type in the whole film is 168 px < 180 | band test at 180 px on still-1.5 |
| F4 | No state has an ink/accent plane ≥ 50 % or type ≥ 180 px | `field=0.00-0.04` |
| F6 | Holds of 1.9 s (2.3-4.2), 2.4 s, 2.1 s and 2.6 s where only the drift moves | `F6?` runs + `M2?` |
| F7 | Centered on every hero frame, no bleed | `F7?` `cx=0.500 bleed=no` |
| F8 | hook 168/76 = 2.2 · linked 132/62 = 2.1 · tiles and CTA are one size, < 180 | band tests |
| F10 | 0 of 6 states full-bleed; 2 needed | `F10?` |
| F11 | Six states in ~15 s with one fade-up each and a drift between: well under 1.5 gesture onsets per second | `gestures.txt` rate (replica predates the counter; the F6 runs alone imply it) |
| M1 | Fade-ups whose travel is < 54 px (5 % of W): `l1`, cap3, cap4, URL, tile labels; tiles → logo cross-fade | `M1?` resid 0.004-0.071 |
| M2 | Camera push during every hold | `M2?` diff 0.017-0.08; `psnr` still 2.8 vs 3.8 = 28 dB |
| D4 | Blurred drop shadow under the tiles from 4.2 s | strip, beat stills |
| L2 | Eyebrow 34 px < 44 | band test at 44 px |
| X1 | One entrance (fade-up) on every beat | contact, strip |

Probable as well: **X4**. Nothing happens in 0-1.5 s except a 76 px line fading up, with no cut.
That is the critic's judgement on still-0.0/0.5/1.5. F9 does not fire: no fill is neutral
(muted `#465c7c` has C 0.059; line `#e3e7ef` has L 92.7). Fade frames only add transient greys (2.3 % at still-0.5).

## After a 4-Line Patch — Still FAIL

The patch: show `l1` at t=0, drop the shadow, set the eyebrow to 22 CSS px (44 px), and
shorten every hold to ≤ 1.5 s (the 2026-10-10 ceiling; today's is 0.75 s, so F6 and F11 would
still fire on that patch).

| ID | After the patch |
|----|-----------------|
| F1, D4, L2 | **Gone** |
| F6, F11 | Gone under the old 1.5 s ceiling; under today's 0.75 s span and 1 onset/s they fire |
| F2 | Fires. Still one paper plane per state, `vc=0.0` |
| F3 | Fires. The largest type is still 168 px |
| F4 | Fires. No field, no display type |
| F7 | Fires. Still centered (`cx=0.500`, no bleed) |
| F8 | Fires, and now also on swiss: 140/44 = 3.2. With the 34 px eyebrow it was 4.1, so the legibility fix moved that frame below the scale floor |
| F10 | Fires. Still 0 of 6 |
| M1, M2, X1 | Fire. The fades and the camera push are untouched |

Six flatness IDs remain (F2, F3, F4, F7, F8, F10): the patch fixes the surface, not the film. A pass needs
the composition rebuilt: ink/accent fields on ≥ 2 of 6 states, a 300-420 px word-object
bleeding off an edge, a flush-left grid, hard cuts or mask wipes instead of fades, no camera push,
and a gesture in progress at every moment (beats every 0.5-1 s, one recurring actor).
