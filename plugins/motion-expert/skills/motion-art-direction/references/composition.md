---
name: composition
description: Film composition without effects — 6-column flush-left grid at 1080×1920, scale contrast (key word ≥ 4× secondary), one cropped/bleeding word in ~1 of 3 scenes, ≥ 40 % empty, and a 2D camera (scale/pan on one canvas) where every move is motivated
when-to-use: Filling look.md grid/keyframes, laying out a hero frame, or when a still reads centered, even, or crowded
keywords: composition, grid, 6 columns, margins, safe zone, flush left, asymmetry, bleed, crop, scale contrast, negative space, 2d camera, pan, zoom
priority: high
related: dials.md, type-as-image.md, templates/composition-grid.md
---

# Composition

## Overview

The rejected ad centered a static sentence over evenly spaced rectangles: every object
the same weight, every margin equal. A composition reads as directed when one thing is
much bigger than the rest, the frame is unbalanced on purpose, and empty space is a shape.
None of that needs an effect.

---

## Grid (1080×1920, 9:16)

| Token | Value | Why |
|-------|-------|-----|
| Columns | 6 | Enough to place asymmetrically (2+4, 1+5), few enough to read |
| Margins | 72 px left/right | ~6.7 % of width; type never touches the edge unless it bleeds on purpose |
| Gutter | 24 px | → column width (1080 − 144 − 5×24) / 6 = 136 px |
| Rows | 12 × 160 px baseline rows | Baselines snap to row lines |
| Safe zone | Top ~14 %, bottom ~35 %, sides ~6 % kept free of critical text on Reels-type placements | Platform UI overlays — **verify** current percentages on Meta's 9:16 guidance before placing text |

Bleeding word-objects are exempt from margins and safe zone (they are image, not copy) —
but the **readable** part of the word stays inside the safe zone.

---

## Rules with checks

| # | Rule | Check on a still |
|---|------|------------------|
| 1 | Key word ≥ 4× secondary type | px of largest / px of label ≥ 4 (`TYPE_SCALE`) |
| 2 | ≥ 1 cropped / bleeding word per hero frame, in ~1 of 3 scenes | A glyph is cut by the frame edge; count scenes with one |
| 3 | Flush-left on the grid, asymmetric | Text left edges sit on col 1 or col 3 line; nothing centered |
| 4 | ≥ 40 % of the frame empty | Area with no glyph and no UI ≥ 40 % (a full-bleed field counts as empty ground) |
| 5 | One focal object per frame | Squint: one shape dominates |
| 6 | Objects align to grid lines | x and baselines on col/row lines ± 2 px |

No hero frame is centered, CTA included: flush-left or edge-anchored, with at least one
crop or bleed in the film (bans.md B14, critic F7).

---

## Scale contrast

| Role | px at 1080×1920 | Weight |
|------|-----------------|--------|
| Word-object | 300–420 (may bleed) | display weight, the one serif/display word |
| Display line | 180–220 | display weight |
| Support line | 72–96 | text weight |
| Label | 44–56 (44 minimum) | text weight |

Pick 3 roles per frame max. Two adjacent roles closer than 2× read as "a bit bigger", not as
hierarchy.

---

## 2D camera — one canvas, motivated moves

Everything lives on ONE world (`#world`, e.g. 2160×3840) and the camera is a translate +
scale on it. Scenes sit side by side on the world, so a pan genuinely travels between
them — the same technique as the single-canvas variant in `motion-render`
references/templates/timeline-seek.md (log-space zoom).

| Move | Motivation (one of) | Ban |
|------|---------------------|-----|
| Pan | Travel from the pain to the turn; read along a long word-object | Pan with nothing at the destination |
| Zoom in | Enter a word (a counter, a letter that becomes the next frame) | Zoom-in-then-out as filler |
| Zoom out | Reveal that the word was part of a bigger line | Ken-Burns drift on a still |
| Hold | Reading | Any camera or scale motion during a hold = drift (bans.md B12, critic M2) |

Every move has a `why` in the beat table, starts on a cut and lasts ≤ 2 beats — a
slower move is drift, not direction. Camera moves use the film's in-out curve (no
overshoot on a camera); zoom is lerped in log space so 1×→4× feels even.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Everything centered "for vertical" | Flush-left col 1; let one word bleed right |
| Bleed on every scene | ~1 of 3; constant cropping stops reading as intent |
| Empty space split evenly | Put the void on one side; the object hugs the other |
| Camera drifts to "keep it alive" | Rhythm keeps it alive ([rhythm.md](rhythm.md)); the camera moves for a reason |

---

## Related

- [templates/composition-grid.md](templates/composition-grid.md) — grid, bleed, camera code
- [type-as-image.md](type-as-image.md) — what goes on the grid
- `fuse-design:design-method` references/macrostructure-bank.md — first-screen treatments (taste source only)
