---
name: determinism
description: Why a captured film drifts and how to make every frame reproducible — time-driven scenes, seeded PRNG, fonts/images ready, double rAF, Chromium flags (proven vs field-reported, incl. --disable-gpu-compositing for CSS 3D and SwiftShader for WebGL), the CSS 3D / SVG / three.js paths, master subframes inside each frame with cuts on frame boundaries
when-to-use: Writing the scene or the capture, or debugging stutter/flicker/blank frames
keywords: determinism, prng, seeded, fonts, raf, chromium, flags, frame boundary, cuts
priority: high
related: seek-contract.md, verification.md, templates/capture-cdp.md, templates/timeline-seek.md
---

# Determinism

## Overview

A frame-by-frame capture is only as good as its reproducibility: the same `t` must
produce the same pixels on every run, every machine, every chunk. The proof used by this
skill: render the stills twice and compare the contact sheet sha256 — it must not change.

---

## Sources of Drift

| Source | Symptom | Fix |
|--------|---------|-----|
| CSS `animation` / `transition` | Stutter, values ahead of `t` | Kill them: `* { animation: none !important; transition: none !important }`, drive from `seek` |
| `Date.now()`, `performance.now()` in drawing | Frames depend on capture speed | Only `t` enters `seek`; wall clock only in the preview loop |
| Unseeded randomness | Different film every run | Seeded PRNG (mulberry32), values drawn **once at load** |
| Fonts not loaded | Blank or fallback-font first frames | Await `document.fonts.ready`; prefer local/system fonts |
| Images not decoded | Missing screenshots on early frames | `await img.decode()` for every image in `window.ready` |
| Paint not committed | Frame shows the previous state | After `seek`, wait **two** `requestAnimationFrame` before the screenshot |
| Stray WAAPI animations | Elements moving on their own | `document.getAnimations().forEach(a => a.pause())` in `ready` |
| State between frames | Out-of-order chunks differ | No accumulators, no "previous value" — recompute from `t` |
| CSS `will-change` (promoted layers) | Master frames differ by 1-LSB pixels between runs and `--jobs` chunks (measured at scale 1.25; stills/draft unaffected) | No `will-change` in a capture scene; then 2 runs + `--jobs 4` gave identical master sha256 (Chrome 154) |

---

## Chromium Flags

| Flag | Status | Purpose |
|------|--------|---------|
| `--headless=new` | Proven (reference pipeline) | Modern headless, same renderer as desktop |
| `--hide-scrollbars` | Proven | No scrollbar in frames |
| `--force-color-profile=srgb` | Proven | Pixels in sRGB regardless of the display profile |
| `--remote-debugging-port=0` + `--user-data-dir` | Proven | Random free port, read from `DevToolsActivePort` |
| `--deterministic-mode` | Reported, verify on your Chromium | Virtual time / deterministic compositing |
| `--run-all-compositor-stages-before-draw` | Reported, verify | Finish compositing before a frame is produced |
| `--disable-threaded-animation` | Reported, verify | Keep animations off the compositor thread |
| `--disable-checker-imaging` | Reported, verify | Decode images before paint |
| `--font-render-hinting=none` | Reported, verify | Stable glyph rasterization across machines |
| `--disable-gpu-compositing` | Proven (2026-10-11, Chrome 154) — base flag | CSS 3D (`preserve-3d`) frames differed by 1 LSB between runs without it; identical with it |
| `--use-angle=swiftshader --enable-unsafe-swiftshader` | Proven for WebGL (2026-10-11, Chrome 154, three r186) | Software GL: a lit three.js scene shot twice gave identical sha256 at 4 times. Pass via `MOTION_CHROME_FLAGS` for a WebGL scene |

"Reported" flags come from field write-ups, not Chromium docs; pass them through
`MOTION_CHROME_FLAGS` and keep them only if the twice-rendered stills hash is stable
**and** the frames look right. Never add a flag to the proven list without that test.

## 3D paths

| Path | When | Determinism |
|------|------|-------------|
| CSS 3D (`perspective`, `rotateX/Y/Z`, `translateZ`, `preserve-3d`) on flat faces | Flat-shaded objects, extruded type, card turns | Base flags (incl. `--disable-gpu-compositing`); stills twice → same sha256 |
| SVG projected geometry | Simple prisms drawn as polygons from `t` | Same as any DOM scene |
| three.js / WebGL, lit or unlit | The expert judges a lit object serves the beat | Local pinned three (never a CDN at render time), `preserveDrawingBuffer: true`, `setPixelRatio(1)`, no antialias, no shadow map, no tone mapping, `gl.finish()` after each render, SwiftShader flags; **stills twice → identical sha256 or fall back to CSS 3D** ([webgl-scene.md](templates/webgl-scene.md)) |

Seed every random value in a 3D scene too, and build the scene once at load: `seek(t)`
only sets transforms and renders.

---

## Seeded PRNG

| Rule | Why |
|------|-----|
| One seed constant per film | A re-render reproduces the exact same "random" layout |
| Draw all values at load into arrays | `seek` stays a pure read |
| Never call the PRNG inside `seek` | Call order would depend on which frames were requested |

---

## Samples per Frame (motion blur at master only)

Stills and draft capture one sample per film frame at `t = k / FPS`. The master captures
`--subframes S` samples (default 4, ≥ 12 if any move > ~2 % W/frame — [encoding.md](encoding.md)) at `t = (k + s/S) / FPS`, all inside
`[k, k+1)`, and `tmix` averages each group into one frame: `DURATION x FPS` frames either
way. Samples are deterministic like any frame, so the blended frame is too. The draft the
critic judges has no motion blur (`motion-review` D2 b).

| Rule | Reason |
|------|--------|
| Put every hard cut exactly on a frame boundary `t = k / FPS` | Subframes of frame k all fall at or after the cut, frame k−1's all before: the blur never mixes two shots. A cut off the boundary would smear across it |
| Swap text values on frame boundaries | A displayed value that depends on sub-frame `t` rounding can differ between runs at a boundary; show complete values keyed to the frame index |
| Use `--jobs` past ~25 s | Capture time scales with frame count; chunks keep a global frame index, so the order never changes |

---

## Verification

| Check | How |
|-------|-----|
| Reproducible | `bun .motion/render.js` twice → same contact sha256 |
| Order-independent | Shoot the same times forward then reversed → byte-identical PNGs |
| No single-frame jumps | Frame-diff spike scan (`motion-review` review pack, `spikes.txt`) |

→ See [capture-cdp.md](templates/capture-cdp.md) and [timeline-seek.md](templates/timeline-seek.md)
