---
name: reference-board
description: The G0 reference board — 6 real references (3 grammar traits × 2) for the tone the challenger locked blind, found with fuse-browser, captured at 1080×1920, tiled into .motion/refs/board.png with open/mid/end stills per reference and one borrow / one don't-borrow line each; shown to the owner with look.md and the 3 key frames at G0
when-to-use: After the challenger locked the tone from 3 text sketches, before look.md; when the owner names a film or an adjective
keywords: reference board, g0, board.png, refs.md, serp, shots batch, contact sheet, traits, borrow, don't blink, linear, stripe, prompt-motion, motion density
priority: high
related: gate-zero.md, templates/look.md
---

# Reference Board (G0)

## Overview

The model's default look is the average of everything. A board of real frames gives the
owner, the challenger and the critic something concrete to compare against. Taste source
order mirrors `fuse-design:design-web` references/design-inspiration.md: look at the thing
before reading about it, and take grammar from references, never their brand.

---

## Steps

The board comes **after** the challenger has locked the tone blind from 3 text sketches
([gate-zero.md](gate-zero.md) §Order). It serves the locked tone; it does not choose it.

| # | Step | Tool / output |
|---|------|---------------|
| 1 | Discover candidates for the locked tone | `browser_serp_batch { queries:[...] }` (one call) |
| 2 | Group into **3 grammar traits × 2 references** | 6 URLs in `refs.md` |
| 3 | Capture open / mid / end of each | `browser_shots_batch { urls:[...] }` at 1080×1920 → `.motion/refs/NN-{open,mid,end}.png` |
| 4 | Tile the contact sheet | `.motion/refs/board.png` (ffmpeg, below) |
| 5 | One borrow / one don't per reference | `refs.md` → look.md `borrowed` |
| 6 | look.md + 3 key frames, then the owner sees them with the board | G0 ([gate-zero.md](gate-zero.md)) |

Read `fuse-ai-pilot:fuse-browser-usage` before the first `mcp__fuse-browser__*` call.
Viewport parameter of `browser_shots_batch`: verify in the tool schema; else
`browser_screenshot { viewports:[{width:1080,height:1920}] }`. If `browser_serp_batch` is
not in the agent's tool list, ask the lead for discovery (research-expert) — do not guess
URLs. fuse-browser down → `motion-render` references/templates/capture-cdp.md with a
1080×1920 viewport.

For a video page, seek the player to ~0 %, ~50 %, ~95 % and screenshot the player frame.
A page that cannot be opened is dropped — never a reference from memory.

---

## 3 traits × 2

A trait is a **grammar** the locked tone needs, not a brand. For example, for a
percussive tone: A "single-word type on the beat", B "value: ink fields with one accent
field", C "few behaviours, hard cuts". Each trait gets 2 references, so it is seen twice
and not inferred from one film.

### Seeds (verified 2026-10-10, prompt-motion.com 2026-10-11 — re-open before use)

| Ref | URL | Trait | Borrow | Don't borrow |
|-----|-----|-----------|--------|--------------|
| Apple "Don't Blink" (2016) | https://motionographer.com/2016/09/14/4-ways-dont-blink-is-a-masterclass-of-type-and-rhythm/ | Percussive type | One word at a time, 5–7 frames each at 29.97 fps; animate meaning on select words; action on one XY plane | Their CG product shots, music, copy |
| Linear launch films | https://frame24.app/blog/how-linear-makes-launch-videos | Few behaviours | One idea per scene; one type treatment; 3 behaviours (reveal, cut, one camera move); hold the outcome 2× | Their dark palette and type stack (theirs, not the format's) |
| Stripe product videos | https://frame24.app/blog/how-stripe-makes-product-videos | UI drawn | Invisible process drawn as labelled blocks + one travelling element; real UI only as brief proof | Their brand gradient — banned here ([bans.md](bans.md)) |
| fuse-design `supercommon-recode` | `plugins/design-expert/skills/design-web/references/refs-design/supercommon-recode/index.html` | One display line | A single display line IS the composition; voids sized to what they announce | Its photographs and gradient band (banned here) |
| fuse-design `stripe-recode` | `.../refs-design/stripe-recode/index.html` | UI drawn | Product UI drawn in markup instead of captured | Colour count; its decorative effects (banned here) |
| prompt-motion.com (owner-named, 2026-10-11) | https://prompt-motion.com/tags/kinetic-type · https://prompt-motion.com/tags/shapes · e.g. https://prompt-motion.com/shneural-2abdfa | **Motion density** | Something purposeful moves at every moment; type animates at word and letter level; rules, underlines, counters and motion paths draw on; one element carries focus from scene to scene ([prompt-patterns.md](prompt-patterns.md)) | Their assets, copy and brands; particles, glows, glass, gradients and reflections some reels show (banned here) |

prompt-motion.com is the standing **motion-density** reference: whatever the locked tone,
one of the 3 traits is density (a gesture at every moment), and at least one of its 2
references comes from there. Capture its open/mid/end stills like any reference; the
grammar is in the motion, so also note the beat rate you count (beat changes per second).

Note: the Motionographer seed given as `dev.motionographer.com/...` resolves to the
canonical `motionographer.com` URL above. Corpus pages open by `file://`; read their
`design-system.md` only after looking.

---

## Compose board.png

3 stills per reference, one row per reference: 6 rows × 3 cols, 9:16 cells.

```bash
# .motion/refs/01-open.png 01-mid.png 01-end.png ... 06-end.png (18 files, sorted)
ls .motion/refs/0[1-6]-{open,mid,end}.png > /dev/null   # fail fast if one is missing
ffmpeg -y -pattern_type glob -framerate 1 -i '.motion/refs/0[1-6]-*.png' \
  -vf "scale=270:480:force_original_aspect_ratio=decrease,pad=270:480:(ow-iw)/2:(oh-ih)/2:color=black,tile=3x6:padding=8:margin=8:color=black" \
  -frames:v 1 .motion/refs/board.png
```

Glob order is alphabetical: `end` < `mid` < `open`. Name files `NN-1open`, `NN-2mid`,
`NN-3end` if the row must read left→right in time. `-pattern_type glob` and `tile`:
verify on the installed ffmpeg (`ffmpeg -h filter=tile`).

---

## refs.md

```markdown
# References — <film>   (captured <date>, viewport 1080×1920)

## Trait A — <grammar in 4 words>
### 01 — <title>
- url: <verified url>   stills: 01-open.png 01-mid.png 01-end.png (t= 0.4 / 7.8 / 14.6 s)
- borrow: one word per beat, 5–7 frames, hard cut on the downbeat
- don't borrow: their footage, their music, their wordmark
```

One borrow, one don't — observable (a count, a timing, a size, a position), never "feels
premium". `board.png` is a private working file: never in the film, never in public docs.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| 6 references for one trait | 3 traits × 2, so each trait is seen twice |
| Picking a reference for its effects | Borrow grammar only; effects are banned here |
| Board before the sketches | Sketches → challenger (blind) → board → look.md + key frames → owner, in that order |
| Describing a film from memory | Open it or drop it |

---

## Related

- [gate-zero.md](gate-zero.md) · [templates/look.md](templates/look.md)
- `motion-method` → reference-styles.md (named style, observable traits)
