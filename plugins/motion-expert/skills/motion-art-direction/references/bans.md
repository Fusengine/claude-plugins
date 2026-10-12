---
name: bans
description: Build-time mapping of the canonical fuse-motion ban list (motion-craft anti-slop-video.md) to B1-B23, grep checks and the critic hard-fail that catches each on frames — gradients, decorative blur (swapBlur and master motion blur bounded), glow, shadow, grain, glass/chrome, decorative 3D, particles, bouncy easing (> 3 %), opacity-only reveals, crossfades, drift, zoom in-out, centered hero, TYPE_SCALE < 4, mid-tones, no full-bleed field, blank frame 0, same entrance, brand first, emoji, placeholder copy, look-alikes — plus the 2-level AI-slop test
when-to-use: Before writing look.md's banned list, before any scene code, at every still, and whenever an "it looks flat" reflex suggests adding an effect
keywords: bans, absolute bans, ai slop, effects, easing, centered, uniform, opacity fade, crossfade, webgl, three.js, logo first, mid-tone, slop test, grep
priority: critical
related: gate-zero.md, contrast.md, type-as-image.md, composition.md
---

# Absolute Bans — build-time checks

## Overview

The canonical ban list is `motion-craft` → anti-slop-video.md. This file only maps its
bans to build-time checks (B-IDs) and to the critic hard-fail that catches each one on the
frames. It never adds, drops or softens a ban. If the two ever differ, anti-slop-video.md
wins and this file is fixed.

Bans are **unconditional**: no "art-directed" exception, no "just for the intro", no
look.md override. Rewrite the element with contrast, scale, crop or rhythm, never with a
softer version of the same effect. `fuse-design:design-method` §Absolute bans also applies
to any UI drawn in a film.

---

## The list (match and refuse)

`grep` = lintable by the sweep below. `review` = the sweep lists candidates and a human
confirms each. `—` = not grep-lintable, so the critic ID decides on the frames.

Rows follow the canonical table in the same order. The critic ID is the one the canonical
row names.

| # | Banned (canonical row) | Build-time check | Lint | Critic ID |
|---|------------------------|------------------|------|-----------|
| B1 | Gradients, incl. vignette and gradient backgrounds (the light on a lit 3D object's own faces is the one exception) | `gradient(` | grep | D1 |
| B2 | Decorative blur (backdrop, depth of field, blur-in of a headline); allowed only via `swapBlur` (≤ 0.1 s, ≤ 8 px, content swap in a morphing container) and master `--subframes` | `blur(` outside `swapBlur`, `backdrop-filter`; `minterpolate`; `tmix` outside `encode.js` `blendSubframes` | grep | D2 |
| B3 | Glow / bloom | `drop-shadow(`, `text-shadow`, `UnrealBloomPass`, `bloom` | grep | D3 |
| B4 | Drop shadows, incl. a 3D shadow cast on the ground | `shadow` (CSS), `castShadow`, `receiveShadow`, `shadowMap.enabled = true` | grep | D4 |
| B5 | Grain / noise | `feTurbulence`, `noise`, `FilmPass` | grep | D5 |
| B6 | Glass, chrome, environment reflections | `backdrop-filter`, `MeshPhysicalMaterial`, `transmission`, `envMap`, `scene.environment`, `metalness`; translucent panels → the B10 opacity list | grep | D6 |
| B7 | Decorative 3D (spinning or floating with no job), depth of field, non-deterministic 3D | Every 3D beat has a `3d` cell + a reason in beats.md and look.md (`objects.md`); `BokehPass`, `DepthOfField`; three only from the local pinned IIFE (`src=` on a CDN host fails); lit 3D → stills twice, same sha256 | review | D7 |
| B8 | Particles | `particle`, `Points(` (a loop drawing many dots may not use the word) | review | D8 |
| B9 | Bouncy easing (overshoot > 3 %, > 1 oscillation, elastic) | `safeBezier` throws when the curve passes [−0.03, 1.03]; `spring()` throws below ζ 0.85; `elastic`, `bounce` | grep | D9 |
| B10 | Opacity-only reveal | every `opacity` write in scene JS: the same function also sets `clipPath` or `transform`, else banned | review | M1 |
| B11 | Crossfades / dissolves | two layers with opposite opacity ramps (`opacity` paired with `1 -`) | review | M1 |
| B12 | Drift during a hold | `MOVES` guards (composition-grid): every move starts on a cut, lasts ≤ 2 beats | — | M2 |
| B13 | Zoom in, then straight back out | `MOVES`: no zoom-in followed by its inverse | — | M3 |
| B14 | Centered hero composition | `text-align: center`, `place-content: center`, `justify-content: center`, `place-items: center`, canvas `textAlign = "center"`; `auditFrame().centered` | grep | F7 |
| B15 | TYPE_SCALE < 4 on a hero frame | `auditFrame().typeScale` | — | F8 |
| B16 | Neutral mid-tone fills > 5 % | every fill is `var(--ink)`, `var(--paper)` or `var(--accent)`; `auditFrame().planes` | review | F9 |
| B17 | No full-bleed field on ≥ 1 beat in 3 | `auditFrame().fullBleed` per state, count ≥ ⌈N/3⌉ | — | F10 |
| B18 | Blank or fading-in frame 0 | `maskReveal`/`pushReplace` throw if they start at frame 0; still at `t=0` | — | F1 |
| B19 | Same entrance on every beat | the kinetic set rotates 2–3 behaviours (look.md `kinetic`) | — | X1 |
| B20 | Brand / logo before the pain | `validateRhythm` (cut-rhythm) | — | X2 |
| B21 | Emoji | read the on-screen copy (no portable grep on macOS) | — | S3 |
| B22 | Lorem ipsum / placeholder copy | `lorem`, `ipsum`, `placeholder` | grep | S2 |
| B23 | Third-party look-alikes | refs.md borrow / don't lines | — | S6 |

The critic's hard-fail IDs are defined only in `motion-review` references/hard-fails.md.
This file cites them and never restates their definitions. Dial targets and critic floors
are the same numbers in the same units ([dials.md](dials.md)).

### Deterministic sweep (run on `.motion/` before G1)

```bash
S=.motion/scene
grep -rniE --exclude-dir=vendor "gradient\(|backdrop-filter|shadow|feTurbulence|noise|bloom|FilmPass|BokehPass|DepthOfField|MeshPhysicalMaterial|transmission|envMap|scene\.environment|metalness|elastic|bounce|lorem|ipsum|placeholder" "$S" \
  && echo "BANNED construct found (B1-B9, B22) — rewrite before stills" || echo "effects: clean"
grep -rnE --exclude-dir=vendor "blur\(" "$S" | grep -v "swapBlur" \
  && echo "B2 blur outside swapBlur — remove" || echo "blur: clean"
grep -rnE "<script[^>]+src=[\"']https?:" "$S" \
  && echo "B7 three/vendor script from a network host — bundle it locally" || echo "vendor: clean"
grep -rniE "text-align: *center|place-content: *center|justify-content: *center|place-items: *center|textAlign *= *['\"]center" "$S" \
  && echo "B14 centered — rewrite flush-left" || echo "centering: clean"
grep -nE "minterpolate|tblend" .motion/render.js .motion/encode.js 2>/dev/null \
  && echo "B2 frame interpolation at encode — remove (motion blur is tmix in blendSubframes only)" || echo "encode: clean"
grep -rnoE --exclude-dir=vendor "(cubic-)?bezier\([^)]*\)" "$S"   # B9: every curve goes through safeBezier (throws past 3 %)
grep -rnE --exclude-dir=vendor "opacity" "$S"                     # B10/B11 review: each hit also sets clipPath/transform, no 1 - p pair
grep -rniE --exclude-dir=vendor "particle|Points\(" "$S"          # B8 review
grep -rniE --exclude-dir=vendor "perspective|rotate3d|rotate[XYZ]\(|translateZ|preserve-3d|THREE\." "$S"   # B7 review: each 3D beat has a job + a look.md reason
```

The first six commands fail on any hit. The last four only list candidates; a person
reads each one. `vendor/` holds the pinned three IIFE, whose own source mentions banned
features it never runs in this scene.

---

## AI-slop test — 2 levels, transposed

Mirrors `fuse-design:design-method` §The AI-slop test. If someone could watch 3 seconds
and say "AI made that", it failed.

**First order — category reflex.** Could the look be guessed from the category alone?

| Reflex | Tell |
|--------|------|
| "Dev tool launch" | Near-black ground, one acid accent, centered mono headline, glowing UI (banned) |
| "SaaS explainer" | White ground, small blue tiles, centered sentence, fades, slow camera drift (the rejected ad) |
| "Premium" | Slow fade on a dark ground with a soft light sweep (banned) |
| "Energetic" | Every word bounces in (banned), confetti (banned) |

**Second order — category + anti-reference.** The reflex was avoided, but the family is
still guessable ("a dev tool that isn't dark, so Swiss black and white type"). Rework the
tone or the signature device until neither answer is obvious. The challenger judges this
at G0; it is not grep-lintable.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "It's flat, add texture" | Fix flat with contrast, scale, crop or rhythm, never with an effect |
| Accepting a ban because look.md lists it | look.md cannot override the canonical list |
| Soft mask edge "to look nicer" | Use a hard edge; a feathered mask is blur by another name (B2) |
| "Add 3D, it looks premium" | 3D needs a job (reveal, transform, transition) and a look.md reason ([objects.md](objects.md)) |
| A fade "because the cut felt abrupt" | Make a hard cut on the grid, or a mask wipe or push (B10, B11) |

---

## Related

- `motion-craft` → anti-slop-video.md (canonical list)
- `motion-review` → hard-fails.md (critic IDs)
- [gate-zero.md](gate-zero.md) — `banned` field
- `fuse-design:design-method` SKILL.md §Absolute bans, §The AI-slop test (source)
