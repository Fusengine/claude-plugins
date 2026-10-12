---
name: continuous-take
description: The two film types — a cut-based edit on the tempo grid, and one continuous object that never cuts (the same element morphing size, radius and colour while its content swaps, driven by a cursor); scene-to-scene transitions without opacity blends, one fixed curve, camera on the same curve, the bounded content-swap blur, seamless loops with matched velocity, and the handoff/cursor/counter/will-change gotchas
when-to-use: Choosing the film type, planning scene-to-scene transitions, building morphs, a camera or a cursor-driven object, making a loop, or fixing pops and smears in a draft
keywords: continuous take, one object, never cut, morph, content swap, swapBlur, cursor, drag, glide, transition, mask wipe, push, swap, camera zoom, cut, tempo grid, loop, velocity, handoff, counter, will-change, pop
priority: high
related: focus-hierarchy.md, easing-springs.md, timing-holds.md, anti-slop-video.md
---

# Continuous Take

## Overview

Two film types share every rule of this plugin; pick one in the brief's `<direction>`.

| Type | What | Best for |
|------|------|----------|
| **Cut-based edit** | States on the tempo grid, hard cuts / wipes / pushes, a recurring actor carrying focus | Ads, type-led films |
| **One continuous object** | ONE element never cut: it morphs size, radius and colour from state to state while its content swaps; a drawn cursor drives every change with real clicks and drags; the camera zooms so each state fills the frame | UI-led films, loops |

Sources: field template (ultimaxbt, 2026-10-07); @twoclipping / @demonugc "UI states" prompts
on prompt-motion.com (button → loader → check → … → back to the button, 120 BPM, 7 bars),
seen 2026-10-11 ([prompt-patterns.md](../../motion-art-direction/references/prompt-patterns.md)).
Numbers are field-reported starting points.

Nothing blends two states by opacity: crossfades and dissolves are banned everywhere
([anti-slop-video.md](anti-slop-video.md)).

---

## One Continuous Object

| Rule | How |
|------|-----|
| One element, every state | A rounded rectangle whose `width`, `height`, `border-radius`, `background` retarget on each beat — `springSum` per property (`motion-render` timeline-seek) |
| Something on every beat | The object retargets, its content swaps, or the cursor acts — ≥ 1 per second ([timing-holds.md](timing-holds.md)) |
| Cursor-driven | A drawn cursor (real OS pointer asset) clicks and drags; while held the value follows the cursor, on release it springs back from wherever it was (`cursorDrag`, interaction-kit.md) |
| Squash / stretch | Indicator and knob edges on two springs (`dualEdge`) — the leading edge stretches ahead, no bounce |
| Content swap | Outgoing content exits, incoming enters, each with its own timing; an optional blur ≤ 0.1 s, ≤ 8 px only here (`swapBlur`) |
| Camera | Zooms so each state fills the frame, on the morph's curve, log-space for large scale changes |
| Loop | Last frame = first frame, cursor position and velocity included (`checkLoop`) |

---

## The Grammar (both types)

| Rule | Value |
|------|-------|
| **Each scene grows from the previous** | Morph a shape (or the actor) into the next scene. A cut-based edit may hard-cut — on the tempo grid only |
| **One primary gesture at a time** | Details may draw with it ([focus-hierarchy.md](focus-hierarchy.md)) |
| **Every morph glides on ONE fixed curve and duration** | Example: 0.8 s on `cubic-bezier(.45,0,.15,1)` for scene morphs; beats of 0.5 s use the springs |
| **Camera zoom rides the same curve** | Shape and camera arrive together |
| **Outgoing content leaves by geometry, never by opacity** | The growing shape covers it (mask), or it is swapped out on a frame boundary |

```javascript
// One curve for every morph AND the camera (example values from the field template)
const GLIDE = { duration: 0.8, bezier: [0.45, 0, 0.15, 1] };
const p = ease(GLIDE.bezier, clamp01((t - t0) / GLIDE.duration));   // morph progress
next.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)`;  // hard edge, opacity stays 1
prev.style.visibility = p >= 1 ? "hidden" : "visible";               // swapped out whole, no fade
```

---

## Allowed Transitions

| Transition | How | Opacity |
|------------|-----|---------|
| **Shape morph** | A shape in A changes geometry into the frame of B (the actor, the object) | Stays 1 |
| **Mask wipe** | B behind a straight, hard edge (`clip-path: inset()`) | Stays 1 |
| **Push / swap** | B pushes A out on the same curve, or replaces it in one frame | Stays 1 |
| **3D turn** | A face turns away, the next face lands — with a job, flat or lit faces ([objects.md](../../motion-art-direction/references/objects.md)) | Stays 1 |
| **Hard cut** | B replaces A on a grid line | — |

Rotate them; the same transition on every beat is banned.

---

## Camera

| Rule | Why |
|------|-----|
| Zoom follows the morph curve | No second competing motion |
| **Banned: zoom in, then straight back out** | Indecision (M3) |
| **Banned: a slow push or pan during a still** | Drift (M2) |
| Camera move = a primary gesture | Only details may move during it |
| Log-space zoom for large scale changes | Equal zoom ratios feel like equal speed |
| Perspective only for a 3D gesture with a job | Never ambient tilt |

---

## No Decorative Depth

The field templates layer soft shadows under every lifted shape. This plugin does not: drop
shadows, glow and decorative blur are banned. Separation comes from value and scale. Motion
blur exists only at master (`--subframes`, `motion-render` render-cli), never baked in.

---

## Gotchas (field templates)

| Gotcha | Symptom | Fix |
|--------|---------|-----|
| Handoff before the first drawing has landed | One-frame pop at the swap | Start the handoff once progress = 1 |
| Cursor detaches from what it drags | Pointer floats off a stretched element | Bind the cursor to the dragged element's computed anchor every frame |
| Counter or tooltip updating every frame | Smear of digits | Swap whole values at discrete times |
| Flood crossing half the screen in one frame | Pop | Grow it from its cause past the farthest corner over ~0.3-0.4 s |
| `will-change` on anything the camera scales | Blurry text, history-dependent frames | Never use `will-change` in a capture scene |
| Text swapping inside a morphing container | Old and new labels overlap mid-morph | Give outgoing and incoming text their own exit/enter timing (`swapBlur`) |

---

## Decision Guide

```
Getting from state A to state B?
├── The same object can become B → morph it (continuous object), camera on the curve
├── A shape in A can become B → morph it, or let the actor wipe
├── Nothing maps → a mask wipe or flood from the last focus, or a hard cut on the grid
└── Never: an opacity blend between A and B
```

---

## Related References

- [easing-springs.md](easing-springs.md) — curves, springs, springSum, dual edges
- [timing-holds.md](timing-holds.md) — 0.75 s gesture-free span, CTA still ≤ 1.2 s
- [anti-slop-video.md](anti-slop-video.md) — the ban list and its four bounded allowances
