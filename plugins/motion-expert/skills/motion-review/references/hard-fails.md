---
name: hard-fails
description: Single source of the hard-fail IDs that make a film FAIL whatever the scores — Flat F1-F11 (value contrast, display type, centered, type scale, mid-tone, full bleed, gesture-free span > 0.75 s, under-animated < 1 onset/s), Motion M1-M3 (opacity blend, drift, zoom yo-yo), Decorative effect D1-D9 (with the bounded swap blur, master motion blur, ≤ 3 % overshoot and purposeful 3D — flat or lit — allowances), Legibility L1-L4, Slop X1-X4, Safety/delivery S1-S6 — with thresholds, the pack item that detects each, and a worked example on the rejected flat ad
when-to-use: Every critic pass, BEFORE scoring; any match forces the FAIL verdict
keywords: hard fail, flat, value contrast, area-weighted, planes, display type, type scale, centered, mid-tone, full bleed, freeze, under-animated, gesture rate, motion density, crossfade, dissolve, opacity reveal, drift, zoom, gradient, blur, glow, shadow, grain, glass, 3D, particles, overshoot, contrast, safe zone, hook, cta, look-alike, placeholder
priority: high
related: rubric.md, review-pack.md, symptom-cause.md, verdict-format.md
---

# Hard-Fails

## Overview

One hard-fail → **FAIL**, whatever the scores. Checked **first**, listed **first** in the
verdict, each with a frame ref or a pack-file line. `flags.txt` proposes candidates; the
critic confirms or rejects each on the frames — a number alone never decides, and a film the
flags missed can still fail. **This file is the only place IDs are defined**; the agent, the
rubric, `motion-craft` and `motion-art-direction` link here.

**Units.** Sizes are px at the **1080 px-wide output frame** (scale by `W / 1080`). L and C
are **OKLCH** (L 0-100). Floors equal the `look.md` dial targets
(`motion-art-direction` dials.md) — never below them. **Hero frame** = frame 0, mid, CTA, plus
the settled state of every beat that carries type (`still-0.0`, `still-mid`, `still-last`,
`beat-NN`), except a beat that is only a real-screenshot crop.

---

## Flat (F) — all genres

| # | Hard-fail | Threshold | Detect (pack → critic confirm) |
|---|-----------|-----------|--------------------------------|
| F1 | Frame 0 is blank, a logo card, or not at full value yet | Opening statement not fully on screen at t=0 | `still-0.0` vs `still-0.5`; `flags.txt` `F1?` (uniform open, or a `mix.txt` blend centred by 0.3 s) |
| F2 | VALUE_CONTRAST below the dial, area-weighted | Planes ≥ 20 % of the frame: L gap of the two largest < **60**; one plane only: it is paper/light (value 0), or it is ink/accent with type on it < 60 away | `planes.txt` `vc=`, `F2?`; critic: mosaic of the still ([review-pack.md](review-pack.md)) |
| F3 | Display type missing on a hero frame | Largest type < **180 px** | Band test at 180 px on the hero still |
| F4 | A beat with neither a full-bleed field nor a display-type object | No ink/accent plane ≥ 50 % and no type ≥ 180 px | `beat-NN`, `planes.txt` `field=` |
| F5 | A centered static text block > 10 words | Words of any block held unmoved and centered | `beat-NN` + word count |
| F6 | Gesture-free span > **0.75 s** mid-film, or a final CTA still > **1.2 s** | A run > 0.75 s with no gesture in progress (no cut, no primary move, no secondary rule/underline/counter drawing); only the run reaching the end may last up to 1.2 s. A drift does not count as a gesture | `freeze.txt` (non-`final-hold` run, or `final-hold` > 1.2 s), `drift.txt`; critic: `psnr` of two stills 0.5 s apart |
| F7 | Centered hero composition | Content centroid within **±5 % of W** of the centre and nothing bleeding off a side edge — or no crop/bleed on any hero frame of the film | `planes.txt` `cx=` `bleed=`, `F7?`; critic: halves test |
| F8 | TYPE_SCALE below the dial on a hero frame | Largest / smallest type < **4** (one-size frame: that size < 180 px) | Band tests at the two sizes |
| F9 | Neutral mid-tone fill | Pixels with L 30-85 and C < 0.03 cover > **5 %** of a frame | `planes.txt` `mid=`, `F9?`; critic: mosaic |
| F10 | Too few full-bleed states | States with an ink (L < 30) or accent (C ≥ 0.08) plane ≥ **50 %** of the frame < ⌈N_states / 3⌉ | `planes.txt` `field=` per `beat-NN`, `F10?`; critic: mosaic |
| F11 | Under-animated | Fewer than **1** gesture onset per second, averaged over the body (t = 0 → start of the final CTA still). An onset is a motion-energy peak ≥ 0.5 (YAVG frame diff, 320 px) that is the largest within ±0.25 s; a cut is one onset | `gestures.txt` `rate=`, `F11?`; critic: count beat changes on `contact` + `beat-NN` + `strip` against `segments.txt` |

## Motion (M) — all genres

| # | Hard-fail | Threshold | Detect |
|---|-----------|-----------|--------|
| M1 | Opacity blend: crossfade, dissolve, or opacity-only reveal (a fade-up whose travel is < 5 % of W is opacity-led) | Any window where frame n = a·frame(n−4) + (1−a)·frame(n+4), 0.15 ≤ a ≤ 0.85, residual < 0.25 | `mix.txt`, `M1?` runs; critic: `strip`, ghosted double image or half-value element |
| M2 | Drift during a hold — slow camera/scale push, "subtle continuous motion" | ≥ **1.0 s** where every frame diff is > 0 and ≤ **0.30** (YAVG, 320 px) | `drift.txt`, `M2?`; critic: `psnr` of two stills 1 s apart is finite (identical = `inf`) |
| M3 | Zoom in, then straight back out | Scale rises then returns to its start — except a beat pulse: ≤ 4 % punch on a measured kick, settled in ≤ 0.2 s (`motion-render` audio.md "Beat Pulse") | `contact`, `strip`, kick times in `beats.md` |

## Decorative Effect (D) — all genres, no exception

Any one, anywhere, even one frame, even if `look.md` lists it: **FAIL**.

| # | Banned | What it looks like in the pack |
|---|--------|--------------------------------|
| D1 | Gradient | Ground or shape whose value or hue ramps (linear, radial, conic, mesh), a gradient background. **Exception:** the light shading the faces of a lit 3D object, on that surface only |
| D2 | Blur outside its two allowances | Soft edges on settled type/shapes, a blurred backdrop, depth of field, glass, a blur-in of a headline, any blur in the draft except a content swap. **Allowed:** (a) content swapping inside a morphing container, ≤ 0.1 s (≤ 6 frames at 60 fps), radius ≤ 8 px; (b) master-only motion blur from subframes + `tmix` (S from per-frame displacement, `motion-render` encoding.md) — a smear, never stepped copies |
| D3 | Glow / bloom | Halo around type or shapes, light bleeding past an edge |
| D4 | Shadow | Drop, inner or long shadow; a soft dark edge under an object; a 3D object's shadow cast on the ground |
| D5 | Grain / noise | Speckle on flat areas (a hold whose `diff.txt` never reaches 0 is a hint) |
| D6 | Glass / chrome | Frosted panel, translucency over content, specular sheen, chrome or glass 3D material, environment reflections |
| D7 | Decorative 3D, a banned 3D material/effect, or non-deterministic 3D | (a) Ambient 3D: an object spinning or floating with no reveal / transform / transition job; (b) a cast shadow on the ground, glow/bloom, environment reflections, chrome or glass material, depth of field, grain, a gradient background, particles; (c) lit 3D whose twice-rendered stills differ (sha256). **Allowed, no quota:** 3D where the beat needs it — flat-shaded faces (CSS 3D) or lit three.js whose light shades only the object's own faces (the one gradient exception); justified in `look.md` and the beat table. Never a quota fail |
| D8 | Particles | Dots, sparks, confetti, floating shapes with no meaning |
| D9 | Overshoot beyond the tiny allowance | Strip frames passing the rest position by > **3 %** of the travel, more than one visible oscillation, or elastic/bouncy easing. **Allowed:** a spring with ζ ≥ 0.85 (≤ 3 %, one oscillation at most) |

A solid field, a hard crop, flat type, a hard cut, a clean eased move, a flat-faced 3D turn
and the two bounded blurs of D2 are **not** effects.

## Legibility (L) — all genres

| # | Hard-fail | Detect from |
|---|-----------|-------------|
| L1 | Text contrast < 4.5:1 | look.md pairs (WCAG ratio); off-system text on stills |
| L2 | Any readable text < **44 px** | Band test at 44 px; `phone-390.png` |
| L3 | Readable text outside the platform safe zone ([Meta][meta]): 9:16 keep ~14 % top, ~35 % bottom, ~6 % sides clear | Full-size stills |
| L4 | A state held < 0.25 s per word (min 0.4 s) | `segments.txt` ÷ words on `beat-NN` |

[meta]: https://www.facebook.com/business/help/980593475366490

## Slop (X)

| # | Hard-fail | Genre | Detect from |
|---|-----------|-------|-------------|
| X1 | The same entrance on every beat (fewer than 2 behaviours rotating) | all | contact, strip, `beat-NN` |
| X2 | Brand or logo shown before the pain/problem | ad | stills 0.0-1.5, contact order |
| X3 | More than one CTA, or no CTA in the last beat | ad | `still-last`, last `beat-NN` |
| X4 | No hook event in 0-1.5 s | ad | `still-0.0/0.5/1.5`, `cuts.txt`, `energy.txt`; `X4?` |

`genre: demo` → X2-X4 do not apply. Genre from `genre.txt`; missing → `ad`.

## Safety and Delivery (S) — all genres

| # | Hard-fail | Detect from |
|---|-----------|-------------|
| S1 | Sensitive data visible — client names, real spend, emails, tokens, internal URLs | stills, contact, strip, phone (describe, never transcribe) |
| S2 | Invented UI or placeholder copy — screens/features the product lacks, lorem ipsum, "Your text here" | frames vs real screenshots; missing "Example data" label |
| S3 | Emoji on screen (monochrome ✓ ⏱︎ are not emoji) | frames |
| S4 | Over byte budget | `ffprobe.json` `format.size` |
| S5 | Wrong pix_fmt (not `yuv420p` for H.264) | `ffprobe.json` |
| S6 | Third-party look-alike — another brand's logo, signature layout or trade dress | frames vs refs.md borrow/don't lines |

A masked value is a solid block; a blur mask is D2.

---

## Detection Notes

| Case | Treat as |
|------|----------|
| Old metric "lightest − darkest" passes (white + #151923 text = 77.7) | Irrelevant: F2 weighs areas; small dark objects on paper score 0 |
| `F2?` on a frame inside a cut or a 1-2 frame transition | Judge the settled `beat-NN`, not the transition frame |
| `vc=na` (no plane ≥ 20 %, busy screenshot crop) | Not a hero frame; judge visually |
| `F6?` where only a cursor blinks or a drift moves | Still F6; a drift is also M2 |
| A secondary detail (counter, rule) is the only motion for > 0.75 s | Breaks the F6 run, not F11: the primary gesture is missing |
| `F11?` on a one-object continuous take (no cuts) | Count onsets on `strip` and `contact`: each retarget of the object is one; confirm before failing |
| Motion blur on a master frame | Allowed (D2 b); judge D2 on the draft, which has none |
| Stepped ghost echo on a master frame (an element in 2+ distinct translucent copies during a fast move) | Delivery **FAIL**, reported as D2 @ master frame: too few subframes — re-render with S ≥ 12 (`motion-render` encoding.md) |
| `M1?` on an element that also travels ≥ 5 % of W | Reject on the strip — that is a move, not an opacity reveal |
| look.md lists a D1-D9 effect or a centered layout | Still FAIL; the finding names look.md as the cause |
| Final hold | Only the run tagged `final-hold` may pass 0.75 s, and only up to 1.2 s (never exempt from M2) |

Worked example (the rejected ad, before and after a patch): [hard-fails-example.md](hard-fails-example.md).

## Reporting

```
Hard-fails:
  - F1 blank ground @ still-0.0 (t=0.00s): uniform paper, no type; l1 still fading in at still-0.5
  - F2 lone paper plane @ beat-01 (planes.txt vc=0.0, L1=99 s1=0.86)
  - M2 drift 2.30-4.20s (drift.txt; psnr still-2.5 vs still-3.5 finite)
```

No hard-fail → `Hard-fails: none`. → Layout: [verdict-format.md](verdict-format.md)
