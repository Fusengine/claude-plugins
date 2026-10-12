---
name: easing-springs
description: Curves and springs for film motion — no linear, a tiny overshoot at most (ζ ≥ 0.85, ≤ 3 % of travel, one oscillation), the three spring presets, retargeting springs as a sum, dual-edge springs for squash/stretch, field-reported video curves, and pointers to fuse-design's token layer
when-to-use: Choosing the curve or spring for a beat's gesture, a value that retargets many times, a stretching indicator, or when the critic flags "cheap bounce" or "mechanical" motion
keywords: easing, cubic-bezier, spring, stiffness, damping, damping ratio, overshoot, springSum, retarget, dual-edge, squash, stretch, expo-out, linear
priority: high
related: timing-holds.md, focus-hierarchy.md, continuous-take.md
---

# Easing & Springs

## Overview

Film motion should read as mass coming to rest: fast departure, a snappy expo-out arrival, at most a tiny settle past the target. Linear motion looks mechanical; bounce and elastic (overshoot > 3 %, several oscillations) look like a toy and are banned ([anti-slop-video.md](anti-slop-video.md)). The UI token layer already exists in `fuse-design` — this file points to it and adds only what differs for film.

---

## Pointed-To Tokens (never copied)

| File | What it gives |
|------|---------------|
| [motion-tokens.md](../../../../design-expert/skills/design-motion/references/motion-tokens.md) | Named curves (`--ease-out`, `--ease-in-out`, `--ease-drawer`) and UI spring configs |
| [animation-glossary.md](../../../../design-expert/skills/design-motion/references/animation-glossary.md) | The word for each effect, for beats and handoff |

Read them there; do not paste their values into motion files. If a token changes in `fuse-design`, the film follows.

**Durations from design-motion do not apply to film holds.** Its 100-500 ms tiers (and the Emil Kowalski rule "ease-out for enter/exit, UI under 300 ms") are UI-only. Film holds are set in [timing-holds.md](timing-holds.md).

---

## Field-Reported Video Curves

| Curve | Feel | Source (field-reported) |
|-------|------|-------------------------|
| `cubic-bezier(.6,0,.2,1)` | Strong in-out, for A→B moves | howseen-ai/claude-motion-design `SKILL.md`, LinkedIn-loop prompt pattern |
| `cubic-bezier(.2,.8,.2,1)` | Fast-out, long settle, for entrances | same |
| `cubic-bezier(.45,0,.15,1)` over 0.8 s | Smooth glide for every scene morph + camera zoom | field template (ultimaxbt, 2026-10-07) — see [continuous-take.md](continuous-take.md) |

All three keep every y control point within [0, 1]. A bezier may pass its target by at most 3 % (`safeBezier` in kinetic-type.md samples the curve and throws past [−0.03, 1.03]). A continuous-take film picks ONE transition curve + duration for all its morphs.

---

## Rules

| Rule | Why |
|------|-----|
| **No linear motion** | Reads as mechanical; allowed only for constant-rate indicators (progress fill, typing cadence) |
| **No `ease-in` on entrances** | Delays the moment the viewer is watching |
| **A tiny overshoot at most** | ≤ 3 % of the travel, one visible oscillation at most; bounce / elastic stay banned (critic D9) |
| **Springs: damping ratio ζ ≥ 0.85** | At ζ 0.85 the peak passes the target by 0.6 %, the second swing is invisible; `spring()` throws below |
| **Squash / stretch = a scale change that never passes its target by more than 3 %** | Dual-edge springs (below) give it without a bounce |
| **Curves move geometry, not opacity** | Position, scale, mask edge; opacity alone is never the reveal ([anti-slop-video.md](anti-slop-video.md)) |
| **Motion blur only at master** | Subframes + `tmix` (`motion-render` render-cli); never baked into the scene, never in the draft |

---

## Spring Presets (mass = 1)

| Preset | stiffness / damping | ζ = c / (2·√(k·m)) | Use |
|--------|---------------------|--------------------|-----|
| UI | 320 / 31 | ≈ 0.87 | Buttons, toggles, knobs, small chips |
| Containers | 170 / 23 | ≈ 0.88 | Panels, cards, the morphing object |
| Heavy type | 120 / 19 | ≈ 0.87 | Large headlines, wordmarks, 3D objects |

Overshoot of an underdamped step = exp(−ζπ / √(1 − ζ²)): 0.43 % (UI), 0.28 % (containers), 0.42 % (heavy type), all under 3 %; computed and sampled numerically in `motion-render` timeline-seek.md. Any custom spring states its ζ in the beat map.

### Retargeting springs as a sum

A value that changes target many times (a knob scrubbed, an object resized on every beat) is the **sum of one closed-form step per change**: `v(t) = v0 + Σ (target_i − target_{i−1}) · step(t − t_i)`. Each step starts from rest, so the sum stays a pure function of `t` and needs no state between frames. `springSum(t, v0, steps, step)` lives in `motion-render` timeline-seek.md.

### Dual-edge springs (squash / stretch)

The two edges of an indicator, a knob or a block ride **different** springs: the leading edge on the UI preset, the trailing edge on the container preset. While moving, the leading edge runs ahead and the shape stretches; on landing both edges settle and the shape returns to its size. Neither edge passes its target by more than 3 %, so there is no bounce. Code: `motion-render` interaction-kit.md.

Springs in a film are evaluated in closed form from `t` (deterministic seek), never stepped by a physics loop — see `motion-render` for determinism.

---

## Decision Guide

```
What is moving?
├── Entering / leaving the frame → fast-out curve (.2,.8,.2,1) or a spring preset
├── Moving A → B on screen      → in-out curve (.6,0,.2,1)
├── A real UI element of the product → the product's own tokens (motion-tokens.md)
└── Constant-rate indicator     → linear (the only allowed case)
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Spring with damping 10, stiffness 100 (ζ = 0.5, 16 % overshoot) | Raise damping until ζ ≥ 0.85 |
| `cubic-bezier` with y far above 1 for "punch" | Punch comes from a cut on the grid or a scale jump from 3–4×; the curve passes the target by ≤ 3 % |
| A retargeted value jumping when its target changes | `springSum`: one step per change, summed |
| 250 ms move + 250 ms hold | Motion may be short; read time may not (words × HOLD, floor 0.4 s, see timing-holds) |
| A curve applied to opacity alone | A curve drives position, scale or a hard-edged mask; an opacity-only reveal is banned |
| A slow ease running through a hold | That is drift (banned); the curve ends when the gesture lands |
| A different curve on each scene morph | One transition curve for the film ([continuous-take.md](continuous-take.md)) |
| Copying `--ease-out` into a motion stylesheet | Import/link the fuse-design token |

---

## Related References

- [timing-holds.md](timing-holds.md) — the hold that follows the motion
- [focus-hierarchy.md](focus-hierarchy.md) — the primary gesture and its subordinate details
