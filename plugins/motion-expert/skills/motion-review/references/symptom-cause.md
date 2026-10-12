---
name: symptom-cause
description: Symptom → likely cause → fix direction table for film defects — render/encode, motion/pacing (freeze, drift, crossfade, opacity reveal, zoom yo-yo, overshoot, same entrance, off-grid cuts), flat composition (lone paper plane, small type, low type scale, centered, mid-tone fill, no full-bleed field), decorative effects, ad slop, truth/safety — keyed to the hard-fail IDs
when-to-use: Every criterion scored below 7 and every hard-fail — name the symptom with a frame ref, then its cause and fix direction from this table
keywords: symptom, cause, fix, stutter, shimmer, freeze, under-animated, gesture rate, drift, crossfade, dissolve, opacity, zoom, overshoot, entrance, tempo grid, value contrast, planes, type scale, centered, bleed, mid-tone, full bleed, gradient, blur, shadow, hook, cta, logo, invented ui, look-alike
priority: high
related: hard-fails.md, rubric.md, verdict-format.md
---

# Symptom → Cause

## Overview

The critic names causes, never code. Each row maps what is visible in the pack to the
most likely cause and the fix direction for the builder (`motion-render`, `motion-craft`,
`motion-method`, `motion-assets`, `motion-art-direction`). If two causes fit, list the first
and say so.

---

## Render and Encode

| Symptom (visible in pack) | Likely cause | Fix direction | Owner |
|---------------------------|--------------|---------------|-------|
| Stutter / uneven motion in the strip | Wall clock or CSS animation instead of `seek(t)` | Drive everything from `t` | motion-render |
| GIF text shimmer | Error-diffusion palette or odd scale | Bayer dither, lanczos, stable palette | motion-render |
| Blank or fallback-font first frame | Fonts/images not ready before capture | Await fonts + image decode before capture | motion-render |
| Colours shifted vs the product | Untagged or BT.601 conversion | BT.709 matrix + tags | motion-render |
| File oversized (S4) | fps / width / duration too high | Reduction order: fps → width → crf → duration | motion-render |
| Single-frame jump (`spikes.txt`, not a cut) | Reflow, font swap, missed frame | Fix that frame's layout | motion-render |

## Motion and Pacing

| Symptom | Likely cause | Fix direction | Owner |
|---------|--------------|---------------|-------|
| A span > 0.75 s with no gesture, or a final still > 1.2 s (F6) | A read held still instead of split; the CTA left standing | The next gesture on the grid: a word/letter move, the actor, a rule or counter drawing; split long copy into more beats; never fill a hold with drift | motion-method |
| Under-animated: < 1.5 gesture onsets/s (F11) | Beats of 1-1.5 s; type only cut in whole; no recurring actor | Beats every 0.5-1 s; letter/word kinetics; one actor that travels, wipes, splits and becomes the CTA; objects that assemble | motion-art-direction |
| Whole frame creeps during a hold (M2) | Camera/scale push used as "life" | Remove it; the next beat lands on the grid instead | motion-craft |
| Ghosted double image / element at half value (M1) | Crossfade, dissolve or opacity-only reveal | Hard cut on the grid, hard-edged mask wipe, push/swap, or a shape morph with no opacity blend | motion-craft |
| Zoom in then straight back out (M3) | Indecision between two framings | Cut to the next state | motion-craft |
| Element passes its rest position by > 3 % or swings twice (D9) | Spring ζ < 0.85, elastic/back easing | A preset with ζ ≥ 0.85 (overshoot ≤ 0.6 %), or an expo-out curve | motion-craft |
| Blurred backdrop, headline blurring in, or blur in the draft (D2) | Blur used as decoration | Only `swapBlur` on a content swap (≤ 0.1 s, ≤ 8 px); motion blur only at master via subframes | motion-render |
| 3D object spinning with no job, chrome/glass look, shadow on the ground (D7) | 3D as decoration | Give the turn a job (reveal, transform, transition) and a look.md reason; flat or lit faces only, no ground shadow | motion-art-direction |
| Same entrance on every beat (X1) | One default transition reused | Rotate 2-3 behaviours, each with a job | motion-craft |
| State too short to read (L4) | Hold sized by feel | Hold ≥ max(0.4 s, words × `HOLD`) | motion-method |
| Cuts at random intervals (tempo-grid) | No base unit | Every segment a multiple of one unit | motion-method |
| CTA arrives flat, by a plain cut | No build | Let the actor or the object become the CTA over the last beats, then a 0.8-1.2 s still | motion-method |
| Pop at a handoff | Outgoing move had not landed | Settle before the next move begins | motion-render |

## Flat Composition

| Symptom | Likely cause | Fix direction | Owner |
|---------|--------------|---------------|-------|
| Blank, logo or fading-in frame 0 (F1) | Film starts on an empty canvas or an intro | Frame 0 = key frame 0 of look.md at full value | motion-method |
| Lone paper plane with small objects, `vc=0` (F2) | Objects placed on a ground instead of planes composing the frame | Build each state from planes ≥ 20 %: ink/paper split, or an ink/accent field with type ≥ 60 L away | motion-art-direction |
| Largest type < 180 px (F3) | Type sized as UI copy | Display line 180-220 px or a word-object 300-420 px | motion-craft |
| Beat with no field and no display type (F4) | Beat built from small elements only | Give the beat one large object: field or display type | motion-craft |
| Centered static block > 10 words (F5) | Copy dropped as a slide | 2-6 words per beat, off-centre | motion-craft |
| Centered hero, nothing bleeds (F7) | No composition decision | Flush-left / edge-anchored grid; crop or bleed a word or field | motion-art-direction |
| TYPE_SCALE < 4 (F8) | Two near sizes ("big title, normal body") | One word as an object; drop the rest to label size | motion-craft |
| Neutral mid-tone fill > 5 % (F9) | Grey card, divider or muted panel | Every fill is ink, paper or the accent | motion-art-direction |
| No full-bleed field on 1 beat in 3 (F10) | Paper ground kept all film | Flip the ground to ink or accent on ≥ ⌈N/3⌉ states | motion-art-direction |
| Accent everywhere or on decoration | Accent used as a theme colour | One accent: key word or full-bleed field | motion-art-direction |
| Off-system element (look-consistency) | Not in look.md / refs.md | Bring it into the look or remove it | motion-art-direction |

## Decorative Effects (D1-D9)

| Symptom | Likely cause | Fix direction | Owner |
|---------|--------------|---------------|-------|
| Gradient background, decorative blur, glow, shadow, grain, glass/chrome, ambient 3D, particles | Effect used to add "richness" | Remove; replace with a solid value field, larger type, a harder crop, or one more purposeful gesture | motion-craft |
| The effect is specified in look.md | Look itself off-policy | Back to G0: rewrite look.md without it | motion-art-direction |

## Ad Slop and Truth

| Symptom | Likely cause | Fix direction | Owner |
|---------|--------------|---------------|-------|
| No hook in 0-1.5 s (X4) | Slow build-up or intro card | First event before 0.5 s: a cut or a large type move | motion-method |
| Logo before the pain (X2) | Brand-first structure | Pain first; logo in the last beat | motion-method |
| Several CTAs / none at the end (X3) | CTA not planned as a beat | One verb-led CTA, last beat | motion-method |
| Contrast < 4.5:1 or text off safe zone (L1, L3) | Pair not checked; desktop layout | Re-pick the pair in look.md; keep text inside the safe zone | motion-art-direction / motion-craft |
| Invented feature, screen or placeholder copy (S2) | No real screenshots / facts | Real masked screenshots + facts only | motion-assets |
| Sensitive data visible (S1) | Unmasked capture | Solid-block mask at capture, "Example data" label | motion-assets |
| Another brand's look (S6) | Reference copied, not borrowed | Borrow grammar per refs.md, never assets or trade dress | motion-art-direction |
| Same defect after a fix round | Fix targeted the symptom | New hypothesis from this table before round 2 | motion-expert |

---

## Writing the Line

```
- lone paper plane @ beat-02 (t=3.10s, planes.txt vc=0.0) -> objects on a ground -> ink/paper split or accent field
```

One line per symptom, frame ref first. Never propose code.

→ Layout: [verdict-format.md](verdict-format.md)
