---
name: contrast
description: Value contrast as the film's depth — ink / paper / accent colour roles in OKLCH, area-weighted lightness gap ≥ 60 between the two largest planes (each ≥ 20 %), a full-bleed ink/accent plane ≥ 50 % on ≥ 1 state in 3, no mid-tone fills, accent as a plane or one keyword, body text ≥ 7:1, inversion cuts on beat changes
when-to-use: Writing look.md colour roles, checking a still that reads grey or busy, or planning inversion and accent frames
keywords: contrast, value, oklch, lightness, ink, paper, accent, full bleed, mid-tone, wcag, 7:1, inversion
priority: high
related: dials.md, rhythm.md, templates/look.md
---

# Contrast

## Overview

The rejected ad was white with 4 blue rectangles: a light ground, mid-value shapes, and
the accent spent on small objects. Strength comes from the opposite: two values far apart,
and the accent used as a whole field at the moment it matters.

---

## Colour roles (OKLCH)

| Role | L range | C | Used as |
|------|---------|---|---------|
| `ink` | 10–20 | ≤ 0.03 | Ground or type |
| `paper` | 93–99 | ≤ 0.03 | Ground or type |
| `accent` | ≥ 74 (ink type on it) **or** ≤ 34 (paper type on it) | high, from the brand | Full-bleed field, or one keyword |

Exactly 3 roles. Neutral planes live at the poles; **no mid-tone fill** (L 30–85 on a
neutral, or a tint between ink and paper). Accent L is chosen so the type on it keeps a
gap ≥ 60.

Example (verify each value in an OKLCH tool before locking):

```
ink    oklch(14% 0.01 260)
paper  oklch(97% 0.01 90)
accent oklch(78% 0.17 65)   # ink type on accent: gap 64
```

---

## Checks

| # | Rule | Check |
|---|------|-------|
| 1 | `VALUE_CONTRAST` area-weighted ≥ 60 on every state | Planes ≥ 20 % of the frame: L gap between the two largest ≥ 60; a lone plane must be ink or accent ([dials.md](dials.md)) — critic F2 |
| 2 | Full bleed on ≥ 1 state in 3 | Count states with ink or accent ≥ 50 % of the frame ≥ ⌈N/3⌉ — critic F10 |
| 3 | Body / label text ≥ 7:1 | WCAG ratio of text vs its ground (critic floor L1 is 4.5:1; 7:1 is the look target) |
| 4 | Accent is a plane or one keyword | Accent is a full-bleed field or a band ≥ 20 % of the frame, or a single keyword — nothing between, never a small rectangle |
| 5 | No mid-tone fills | Every fill is ink, paper or accent; neutral L 30–85 over 5 % = critic F9 |
| 6 | Inversion cut on every act change | ink↔paper swap on the cut ([rhythm.md](rhythm.md)) |

Why area-weighted: "lightest minus darkest" lets a white frame with small dark tiles
score 77 and still read flat. Weighting by area measures what the eye sees first, the two
big fields. Run `auditFrame().planes` (templates/composition-grid.md) on every still.

`ffmpeg signalstats` on a still gives YAVG/YMIN/YMAX in luma, not OKLCH L. Use it as a
smoke test only: a frame with YAVG > ~200 of 255 is mostly light, so check its planes.

---

## Ground strategy

| Ground | When |
|--------|------|
| Ink-dominant (≥ 70 % of states) | Percussive, night, "serious" tones |
| Paper-dominant | Editorial, calm-but-sharp tones |
| Alternating by act | Inversion as the signature device |

Pick one strategy in look.md. A paper ground is allowed, but never alone: every paper
state carries an ink or accent plane ≥ 20 % (a band, a split), and ⌈N/3⌉ states are ink-
or accent-dominant (≥ 50 %). What failed was a paper ground with small shapes, not light
itself.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Grey secondary text | Secondary is smaller, never lighter: same ink, smaller size |
| Accent on 5 small objects | One full-bleed accent frame instead |
| White ground, small blue tiles (the rejected ad) | Planes < 20 % do not count: flip the ground or make the tile a band |
| Brand light blue as accent with paper type | Gap < 60 — darken to L ≤ 34 or set ink type |
| A fourth "support" colour | 3 roles; hierarchy comes from size and position |

---

## Related

- [dials.md](dials.md) `VALUE_CONTRAST` · [templates/look.md](templates/look.md)
- `fuse-design:design-system` — OKLCH token conventions (source; do not restate)
- `motion-craft` → color-type-video.md (video colour pitfalls)
