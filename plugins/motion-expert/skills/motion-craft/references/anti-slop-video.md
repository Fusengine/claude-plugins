---
name: anti-slop-video
description: The single source of the motion ban list — every decorative effect is banned, with four bounded allowances (content-swap blur ≤ 0.1 s ≤ 8 px, master motion blur, springs ζ ≥ 0.85 with ≤ 3 % overshoot, purposeful 3D whose light shades only its own faces); each absolute ban mapped to its hard-fail ID; the flat fails (0.75 s gesture-free span, CTA still ≤ 1.2 s, under-animated < 1 onset/s); where richness comes from instead (value contrast, type and objects as large things, composition, rhythm and motion density); the self-check before the stills stage
when-to-use: Before rendering stills, when reviewing a scene, writing the brief's Banned line, or when the critic flags "looks generic AI", "flat", or look.md consistency
keywords: ai slop, banned, decorative effect, motion blur, crossfade, dissolve, drift, flat, centered, mid-tone, value contrast, type scale, composition, rhythm, emoji, lorem ipsum, look.md, hard-fail
priority: high
related: focus-hierarchy.md, color-type-video.md, timing-holds.md, continuous-take.md
---

# Anti-Slop (Video)

## Overview

A premium ad gets watched because it is **directed**, not decorated. Richness comes from four sources only: **value contrast** (ink against paper, one accent field), **type as a large object** (a word that fills the frame), **composition** (off-centre, edge-anchored, scale jumps), and **rhythm** (cuts on a tempo grid, a purposeful gesture in progress at every moment — letter- and word-level type, one recurring geometric actor, objects that assemble and transform, rules and counters that draw on). Density comes from many purposeful gestures, never from ambient effects. Every decorative effect is a shortcut around those four and reads as AI slop. The owner rejected a flat ad — white ground, small blue tiles, centered text, fades, slow camera drift — as "too simplistic"; every item of that ad is banned below.

This file is the **single source** of the ban list. Other files, the brief and the agent point here; they do not restate it. `motion-art-direction` → [bans.md](../../motion-art-direction/references/bans.md) only maps these bans to build-time grep checks (B-IDs): it may never add, drop or soften a ban. There is no exception: `.motion/look.md` (G0, `motion-art-direction`) cannot re-enable a banned effect.

Every absolute ban maps to a hard-fail ID. The IDs, their detection and their evidence are defined only in `motion-review` → [hard-fails.md](../../motion-review/references/hard-fails.md); the ID column below is a pointer, not a definition.

---

## Banned — Absolute

| Ban | Why it reads as slop | Instead | Hard-fail |
|-----|----------------------|---------|-----------|
| **Gradients** (linear, radial, conic, mesh, gradient text, vignette, gradient backgrounds) | Decoration standing in for value contrast | Flat ink / paper / accent fields. Sole exception: the light shading on the faces of a lit 3D object | D1 |
| **Decorative blur** (blurred backdrops, depth of field, frosted layers, blur-ins of headlines, blur masks) | Hides weak composition and soft timing | Hard edges, a cut, a clean eased move. Allowed: a content swap inside a morphing container, ≤ 0.1 s, radius ≤ 8 px; master motion blur from subframes + `tmix` ([continuous-take.md](continuous-take.md)) | D2 |
| **Glow / bloom** | Fake light, neon template look | Accent field | D3 |
| **Drop shadows**, including a 3D object's shadow cast on the ground | Fake depth on flat UI | Scale and overlap | D4 |
| **Grain / noise** | Texture as filler | Nothing — flat is clean when composed | D5 |
| **Glass** (translucent, frosted panels; glass or chrome 3D materials, environment reflections) | Template signature | Opaque fields, opaque materials | D6 |
| **Decorative 3D** (an object spinning or floating with no job) | Motion without meaning | 3D only where it reveals, transforms or transitions, flat-faced or lit by the expert's call, justified in look.md ([objects.md](../../motion-art-direction/references/objects.md)) | D7 |
| **Particles** (sparkles, dust, confetti) | Ambient motion steals focus | Nothing | D8 |
| **Bouncy easing** (overshoot > 3 % of travel, more than one oscillation, elastic) | Toy feel | Springs ζ ≥ 0.85, overshoot ≤ 3 %, one oscillation at most ([easing-springs.md](easing-springs.md)) | D9 |
| **Opacity-only reveal** | The default model reveal | Cut, hard-edged mask wipe, push, position or scale | M1 |
| **Crossfades / dissolves** (scene-to-scene, content-in, templates) | The eye loses the focus | Hard cut on the grid, mask wipe, push/swap, shape morph with no opacity blend ([continuous-take.md](continuous-take.md)) | M1 |
| **Drift during a hold** (slow camera push, slow scale push, "subtle continuous motion") | It is what the rejected ad did | The next beat on the grid ([timing-holds.md](timing-holds.md)) | M2 |
| **Zoom in, then straight back out** | Indecision | Cut to the next state | M3 |
| **Centered hero composition** | No composition decision | Flush-left / edge-anchored grid, at least one crop or bleed | F7 |
| **TYPE_SCALE < 4 on a hero frame** (uniform type size) | No hierarchy, no object | Largest / smallest ≥ 4 | F8 |
| **Neutral mid-tone fills** (OKLCH L 30-85, chroma < 0.03) over 5 % of a frame | Kills value contrast | Ink, paper, or the accent — nothing between | F9 |
| **No full-bleed field** — no dark or accent plane ≥ 50 % of the frame on at least 1 beat in 3 | A white frame with small blocks is flat | Flip the ground to ink or accent | F10 |
| **Blank or fading-in frame 0** | The scroll is lost on frame 1 | Frame 0 shows the opening statement at full value | F1 |
| **Same entrance on every beat** | No per-beat decision | Rotate 2-3 behaviours, never twice in a row | X1 |
| **Brand / logo before the pain** (ad) | The viewer has no reason yet | Brand at the solution or CTA beat | X2 |
| **Emoji** | Off-brand, platform-dependent | Real icons, or none | S3 |
| **Lorem ipsum / placeholder copy** | Unfinished; breaks the facts rule | `facts.md` copy or labeled example data | S2 |
| **Third-party look-alikes** | Copying a brand's signature | Borrow grammar from the named reference, never its assets | S6 |

"Decorative" = anything not in the four sources above. If unsure whether an effect is decorative, it is.

---

## Flat Fails

| Fail | Check | Fix | Hard-fail |
|------|-------|-----|-----------|
| **Frame 0 = logo, blank ground, or fading in** | Look at frame 0 | Open on the pain line, set large, at full value | F1 |
| **Single centered static block > 10 words** | Count words in any unmoving centered block | 2-6 words per beat, off-centre | F5 |
| **Gesture-free > 0.75 s** mid-film, or a final CTA still > 1.2 s | Frame diff: freeze runs | The next gesture on the grid (word, actor, rule, counter) — never a drift | F6 |
| **Under-animated** — fewer than 1.5 gesture onsets per second over the body | `gestures.txt` rate | More beats: letter/word kinetics, the recurring actor, drawn details ([timing-holds.md](timing-holds.md)) | F11 |

---

## Generic-Look Signals (suspicious)

| Signal | Usually means | Fix |
|--------|---------------|-----|
| Every beat looks the same size | No type scale | One word per beat set as an object |
| Grey on grey | Mid-tones crept in | Back to ink / paper / accent |
| White ground on every beat | No full-bleed field | Flip at least 1 beat in 3 to ink or accent |
| Abstract shapes that stand for nothing | No object vocabulary; or screenshots missing in a demo | Objects that stand for the product ([objects.md](../../motion-art-direction/references/objects.md)); `motion-assets` capture for a demo |
| Cuts off the grid | Rhythm decided by feel | Snap to the tempo grid ([timing-holds.md](timing-holds.md)) |
| Board looked sharp, scene looks soft | `look.md` not applied | Re-check every still against the G0 key frames |

---

## Self-Check Before Stills

```
For each still and frame 0:
├── Any banned effect visible (decorative blur, gradient, shadow…)? → remove (no look.md exception)
├── Frame 0 blank, a logo, or fading in?                      → open on the statement at full value
├── Any opacity blend between states?                          → cut, mask wipe, push, or morph
├── A mid-tone fill or more than one accent?                   → ink / paper / one accent
├── No dark/accent plane ≥ 50 % in this group of 3 beats?      → flip a ground
├── Type scale < 4 or hero centered?                           → resize, re-compose flush-left / bleed
├── Same entrance as the previous beat?                        → rotate
├── A span > 0.75 s with no gesture, or < 1 onset/s?        → add beats, not effects
├── 3D with no job, or a cast shadow / chrome / glass / DOF?    → give it a job or cut it
├── Placeholder text or emoji?                                 → facts.md copy, real icons
└── Matches the G0 key frames side by side?                    → if not, the scene left look.md
```

---

## Truth Is Part of Craft

| Failure | Review consequence |
|---------|--------------------|
| Invented UI | Hard-fail |
| Sensitive data visible | Hard-fail |
| Claim not in `facts.md` | truth-safety drops; usually REVISE |

Owned by `motion-assets`, enforced by `motion-review`.

---

## Related References

- [color-type-video.md](color-type-video.md) — ink / paper / one accent, area-weighted contrast, type scale
- [focus-hierarchy.md](focus-hierarchy.md) — one primary gesture, subordinate details, entrance rotation
- [timing-holds.md](timing-holds.md) — tempo grid, 0.75 s gesture-free ceiling, CTA still ≤ 1.2 s, splitting long reads
