---
name: color-type-video
description: Color and typography for film — ink / paper / one accent in OKLCH, area-weighted value contrast ≥60 L, a full-bleed dark or accent plane on at least one beat in three, no neutral mid-tone fills, body contrast ≥7:1, type as a large object (TYPE_SCALE ≥4, never centered), phone-width legibility, 9:16 safe zone, encode-side color pitfalls
when-to-use: Choosing palette roles, accent use, type sizes or layout for a surface; when the critic flags legibility-phone, low contrast, a mid-tone fill, a centered hero, or a color shift
keywords: ink, paper, accent, oklch, contrast, value contrast, area-weighted, full-bleed, mid-tone, type scale, centered, bleed, phone width, legibility, safe zone, 9:16, yuv420p
priority: high
related: focus-hierarchy.md, anti-slop-video.md
---

# Color & Type for Video

## Overview

Most ads are watched on a phone, muted, mid-scroll. What holds the eye there is value contrast, big type and a deliberate composition — not effects. A white frame with small blue tiles and centered text is the failure this file exists to prevent.

The dials (VALUE_CONTRAST, TYPE_SCALE, HOLD) and their values are locked per film in `.motion/look.md` by `motion-art-direction` ([dials.md](../../motion-art-direction/references/dials.md)); this file gives the craft rules they implement. All px values are at the **1080-wide output frame**.

---

## Three Roles: Ink, Paper, One Accent

| Role | Rule | Why |
|------|------|-----|
| **Ink** | Near-black (or near-white on a dark film) — all body type | Maximum value contrast |
| **Paper** | The opposite end of the value range — the ground | Contrast is the richness |
| **Accent** | ONE hue, used as a **full-bleed field** (the whole ground flips to it) or on the one focus word | A field flip is a beat; a sprinkled accent is noise |
| **No neutral mid-tones** | No fill with OKLCH L 30-85 and chroma < 0.03 (grey panels, tints, greyed text) | Mid-tones flatten the frame; >5 % of a frame is a hard-fail ([anti-slop-video.md](anti-slop-video.md)) |

Status colors (red/green) only when they ARE the message — otherwise they act as a second accent. If the product UI in a screenshot shows other colors, crop tighter rather than recoloring — recoloring invents UI.

---

## Value Contrast Is Area-Weighted

| Rule | Value |
|------|-------|
| Define every role in OKLCH | `oklch(L C H)`; value contrast is read on L (0-100) |
| Which planes count | The **two largest-area planes** of the frame, each covering ≥20 % of it |
| Gap between them | ≥ VALUE_CONTRAST dial in `look.md` (target ≥60 L points) |
| A frame with one plane only | Passes only if that plane is ink or accent |
| Full-bleed field | At least **one beat in three** (≥ ceil(N/3) of N states) shows an ink or accent plane covering ≥50 % of the frame |
| Body text contrast (WCAG ratio) | **≥ 7:1** against its ground |
| Text on the accent field | ink or paper, whichever clears 7:1 — check it |

Small dark tiles on a white ground do not count: the largest plane is white and the second is too small to be a plane. A frame that is 85 % ink and 15 % paper type reads strong at any size.

```css
:root {
  --ink:    oklch(0.16 0.01 260);
  --paper:  oklch(0.97 0.01 90);
  --accent: oklch(0.68 0.21 35);   /* one hue, full-bleed field */
}
```

Values above are placeholders; the film's values live in `look.md`.

---

## Type as a Large Object

| Rule | Why |
|------|-----|
| One hero word or line per beat, set huge — it is the image | Type is the subject, not a caption |
| 2-4 words per beat (up to 6 over the 1.5 s hook, across 2-3 beats) | Readable at 0.25 s/word, muted, while beats change every 0.5-1 s |
| Largest / smallest type on a hero frame ≥ TYPE_SCALE (≥4, e.g. 400 px word-object / 52 px label) | Uniform size is banned |
| Sizes: display type on hero frames ≥180 px, word-object 300-420 px, no readable text <44 px | Same floors as the dials and the critic |
| Hero frames are never centered: flush-left or edge-anchored on the grid | Centered composition is a hard-fail |
| At least one crop or bleed (a word running off the frame edge) per film, ~1 scene in 3 | The frame is composed, not filled |
| Render text as code/SVG, never upscaled bitmaps | Blurry text = "pixel model" problem (`motion-review`) |

Grid, bleed placement and the per-frame audit (TYPE_SCALE, bleed, centered text): `motion-art-direction` → [composition-grid.md](../../motion-art-direction/references/templates/composition-grid.md).

---

## Type at Phone Width

The critic judges legibility on a 390 px-wide view (`motion-review` review pack):

```
on_phone_px = scene_px × (phone_width / frame_width)
e.g. 1080-wide frame shown at 390 px → factor ≈ 0.36 → 52 px label ≈ 19 px on phone
```

Check every text layer at 360 and 390 px wide. Screenshot UI text too small → crop into the region; never redraw the UI.

---

## 9:16 Safe Zone (when the surface is vertical)

| Margin | Keep clear of text/logos | Source |
|--------|--------------------------|--------|
| Top | 14% | Meta Reels ads guide, as reproduced by safe-zone checkers — re-check the platform's current guide |
| Bottom | 35% (40% with a disclaimer) | same |
| Each side | 6% | same |

Express the zone as percentages. A bleeding word may cross the side margin by design; readable text may not. Other platforms publish their own overlays; verify before assuming Meta's values apply.

---

## Encode-Side Color

| Symptom | Cause | Owner |
|---------|-------|-------|
| Colors shift vs. the browser | sRGB vs. yuv420p / BT.709 handling | `motion-render` (encode flags) |
| Saturated accent field blocks / smears | Chroma subsampling, low bitrate | `motion-render` |
| GIF text shimmer | Palette / scale filter | `motion-render` |

Verify the accent field and body contrast on the draft encode, not only in the browser.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| White ground with small colored tiles | Flip a whole beat to an ink or accent field (≥50 % of the frame) |
| Grey card on white ground | Ink, paper, or accent — nothing between |
| Headline centered on the frame | Flush-left on the grid, or bleed it off an edge |
| Title 2× the body ("big title, normal body") | One word as an object; labels at the small end; ratio ≥4 |
| Accent on decoration and on focus | One role: the field flip or the focus word |
| Judging legibility on the master | Judge on 390 px |
| Headline in the bottom third of a 9:16 film | Move it inside the safe area |

---

## Related References

- [focus-hierarchy.md](focus-hierarchy.md) — what the accent marks
- [anti-slop-video.md](anti-slop-video.md) — the ban list
