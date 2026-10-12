---
name: seek-contract
description: The scene contract every film page exposes — window.seek(t), DURATION, FPS, STILLS, ready — plus the ?t= and ?capture modes, adapters for GSAP and WAAPI, and the single-canvas camera variant
when-to-use: Before writing or reviewing any scene (HTML or canvas) that the capture will drive, or when porting an existing GSAP/WAAPI animation into the pipeline
keywords: seek, timeline, duration, fps, stills, capture, gsap, waapi, canvas, camera
priority: high
related: determinism.md, stages-budgets.md, templates/timeline-seek.md, templates/index-skeleton.md
---

# Seek Contract

## Overview

The capture never "plays" a film. It asks the page for frame `n`, by calling
`seek(n / FPS)`, waits for paint, and screenshots. A film is therefore a **pure function
of time**: the page must paint the same pixels for the same `t`, whatever was drawn before
and in whatever order frames are requested (parallel chunks seek out of order).

---

## The Five Globals

| Global | Type | Read by | Rule |
|--------|------|---------|------|
| `window.seek(t)` | `(seconds) => void` | capture, preview | Draws frame `t` from `t` alone; wraps `t` into `[0, DURATION)` |
| `window.DURATION` | seconds | capture | End of the last beat in `.motion/beats.md` — never a guess |
| `window.FPS` | number | capture | 30 by default; 60 only when the brief asks |
| `window.STILLS` | seconds[] (one per beat) | `--stage stills` | One readable moment per beat (near each primary gesture's landing), for gate G1 |
| `window.ready` | Promise | capture | Resolves after fonts + images decode and stray animations are paused |

The capture refuses a page whose `seek` is not a function, and waits on `ready`
(falling back to `document.fonts.ready`) before the first frame.

---

## Query Modes

| URL | Behaviour | Used for |
|-----|-----------|----------|
| `index.html?t=4.5` | Paints frame 4.5 s and holds it | Reviewing one frame by hand, browser screenshots |
| `index.html?capture` | Paints `t=0`, then waits to be driven | The CDP capture (always) |
| `index.html` | Self-plays in a loop from `performance.now()` | Preview only — never captured |
| reduced motion | Holds one still | Preview courtesy; the capture ignores it |

The preview loop is the only place the wall clock is allowed. It calls the same `seek`.

---

## Porting an Existing Animation

| Source | Adapter inside `seek(t)` | Why |
|--------|--------------------------|-----|
| GSAP timeline | `tl.pause(); tl.totalTime(t + 0.001, true); tl.totalTime(t, true);` | The nudge forces callbacks and `from` tweens to resolve at exactly `t` |
| WAAPI / CSS-in-JS `element.animate` | `a.pause(); a.currentTime = t * 1000;` for every animation | Time is set, never advanced |
| CSS `@keyframes` / `transition` | Rewrite as WAAPI or as math in `seek` | CSS runs on the compositor clock and cannot be seeked reliably |
| Lottie / video element | `goToAndStop(t * 1000)` / `video.currentTime = t` + await `seeked` | Same principle; verify each frame lands |

Rule of thumb: if a value on screen is not computed from `t` inside `seek`, it will drift.

---

## Two Scene Styles

| Style | Choose when | Template |
|-------|-------------|----------|
| DOM + `timeline.js` | UI recreations, type, real screenshots as `<img>` | [timeline-seek.md](templates/timeline-seek.md) |
| Single 2D `<canvas>` | Camera moves across one world, hard-edge floods, many objects | [timeline-seek.md](templates/timeline-seek.md) (canvas section) |
| WebGL `<canvas>` layer (three r186, local) | A lit 3D object the expert judged the beat needs | [webgl-scene.md](templates/webgl-scene.md) |

All expose the same five globals, so the render CLI does not care which one it drives.
CSS 3D (flat faces) works in the DOM scene; a lit WebGL beat needs the twice-rendered
sha256 proof ([determinism.md](determinism.md) §3D paths). Layout, type and the cut table come
from `motion-art-direction` templates first (composition-grid, kinetic-type, cut-rhythm);
these templates only carry the clock.

---

## Transitions

| Allowed | How in `seek(t)` |
|---------|------------------|
| Hard cut | `visibility` flips on a frame boundary `t = k / FPS` |
| Mask wipe | `clip-path: inset()` / canvas `clip()` with a 0 px edge |
| Push / swap | Both shots translate together, same curve, hard edge between them |
| Scale jump on a cut | New shot lands at 3× and settles on a ζ ≥ 0.85 spring (≤ 3 % overshoot) |
| Flood | Hard-edged shape grown from the causing point, ground swapped once it covers the frame |

Banned (canonical list: `motion-craft` references/anti-slop-video.md): crossfades and
dissolves, opacity-only reveals, the same entrance on every state, a blank first frame.
Frame 0 shows the opening statement at full value.

---

## Camera and World (canvas style)

Field template (ultimaxbt, 2026-10-07) — field-reported practice, not a spec:

| Idea | How | Why |
|------|-----|-----|
| One world | Scenes laid **side by side** at world coordinates | A pan really travels between "pages" instead of a blend |
| Camera = position + zoom | `translate(frame mid-point) · scale(z) · translate(-cam)` | One transform for everything |
| Log-space zoom | `z = exp(lerp(ln z0, ln z1, e))` | A linear zoom lerp rushes the end (1x→4x ≠ 4x→16x perceptually) |
| Flood | Hard-edged circle grown from the **causing point** to the **farthest corner** in ~0.4 s, then the ground color is swapped underneath — two flat fills, no blend | Reads as caused by the action; no seam when the circle leaves |
| No state | Everything recomputed from `t`; no timers, no accumulators | Parallel chunks and out-of-order seeks stay exact |

---

## Handoff Between Scenes

A scene handing off to the next must have **fully landed** before the next starts
drawing over it: let the outgoing spring settle (or clamp it) before the incoming beat.
A visible pop at the handoff is the classic symptom (see `motion-review` symptom table).

---

## Checklist

- [ ] `seek(t)` reads no `Date`, `performance`, unseeded randomness or previous frame state
- [ ] `DURATION` equals the end of the last beat in `.motion/beats.md`
- [ ] `STILLS` holds one time per beat, each on a readable frame
- [ ] `validateDensity(GESTURES, DURATION, FPS)` runs at load and passes
- [ ] `ready` covers fonts, images and pausing stray animations
- [ ] `?t=` renders the same pixels as the captured frame at that time
- [ ] `seek(0)` shows the opening statement fully; no entrance is opacity-only

→ See [timeline-seek.md](templates/timeline-seek.md) and [index-skeleton.md](templates/index-skeleton.md)
