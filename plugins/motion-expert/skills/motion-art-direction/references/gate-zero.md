---
name: gate-zero
description: Gate 0 for a film — the fields .motion/look.md must hold before any scene code (register, one tone pushed to an extreme and locked blind by challenger after 3 text sketches, signature device, 7 dials incl. MOTION_DENSITY, OKLCH colour roles, px type ramp, grid, kinetic set, the recurring actor, objects and justified 3D, the state table with gestures per beat, 3 key frames, borrowed list, banned list) and the owner approval
when-to-use: After the beat map is locked and before any scene file is written; whenever look.md is missing a field
keywords: gate 0, g0, look.md, tone, exploration, challenger, sketches, signature device, colour roles, oklch, type ramp, grid, key frames, approval
priority: critical
related: dials.md, reference-board.md, templates/look.md, bans.md
---

# Gate 0 — Look Lock

## Overview

Mirrors `fuse-design:design-method` SKILL.md §Gate 0. It is a **present/absent check**:
every field below exists in `.motion/look.md`, in writing, AND the owner approved it in
their own message. One field missing ⇒ no scene file (`.motion/scene/*`) is written.

G0 is an owner step, **not enforced by the harness yet**: the `motion` scope gates G1/G2
only, so nothing denies a scene file written before G0. The rule holds by prose and by
this agent stopping. Record `{stage: G0, sha256(look.md), date}` when approved.

---

## Order (single order, identical in every fuse-motion file)

Brief and beat map (`motion-method`) come first. Then:

| # | Step | Output |
|---|------|--------|
| 1 | 3 text sketches (tone candidates) | Prose only, no code, no references yet |
| 2 | Challenger locks the tone blind | One sketch + its tone, quote kept for look.md |
| 3 | Reference board for the locked tone | `.motion/refs/board.png` + `refs.md` ([reference-board.md](reference-board.md)) |
| 4 | look.md + 3 key frames | Every field of [templates/look.md](templates/look.md); key frames in words with px and grid positions |
| 5 | Owner sees the key frames, STOP | Paths of look.md + board shown; owner approves in their own message |
| 6 | Scene code | Only now may a file under `.motion/scene/` exist |

**Hard rule:** no `.motion/scene/*` file is written before look.md and the 3 key frames
exist **and** the owner has seen the key frames and approved. Sketches come before the
board on purpose: the tone is chosen blind, and the board then serves that tone instead
of anchoring it. If the owner rejects at step 5, reopen at step 1. There is no owner pick
between steps 2 and 4.

---

## Exploration — 3 sketches, locked blind

Mechanics are `fuse-design:design-method` references/moves/generate.md §Exploration Gate
(fan-out, blindness, fit-and-reach question, salvage step, depth-5 fallback). Do not
restate them; transpose only the axes.

Each sketch is **text-only** (no HTML, no frames) and states:

| Axis | What the sketch writes |
|------|------------------------|
| Tone | ONE extreme, not an adjective a competitor shares ("percussive, one word per beat, no breath until the CTA" — not "bold and modern") |
| Signature device | One move the film does ≥ 2× and nobody else in its category does (e.g. the product name as a 400 px word-object that the camera pans across; every beat change is an ink↔paper inversion) |
| Colour roles family | ink / paper / accent direction, not final values |
| Kinetic set | The letter/word behaviours from [type-as-image.md](type-as-image.md) and the actor's jobs ([objects.md](objects.md)) |
| Density | How the film keeps a gesture in progress at every moment (≥ 1 beat change per second) |
| Frame 0 | What the first frame shows at full value (no blank, no fade-in), in one sentence |

The 3 sketches must differ on tone **and** signature device; two sketches on the same
device are one direction twice — re-fan one.

Challenger: `fuse-ai-pilot:challenger`, fed only the 3 sketches + brief, never your
preference. Question (transposed from generate.md): for each direction, what must the
brief supply for it to hold (a pain sayable in ≤ 6 words, a product name short enough to
be an object, a number worth a full frame)? Which survives, and which keeps deciding
frames past the hook? Quote its reason in look.md. Fallback when `Agent` is unavailable:
direct single pick, marked `direction not explored / single-fiat`.

---

## Fields (all mandatory)

| Field | Rule | Detail |
|-------|------|--------|
| `register` | brand \| product | brand = ad, the film is the product; product = demo, the UI carries it |
| `tone` | One extreme + challenger quote | Not an adjective list |
| `signature` | One device, used ≥ 2× | Named beats where it appears |
| `dials` | 7 values, one argued line each (incl. `MOTION_DENSITY`) | [dials.md](dials.md) |
| `colour` | ink / paper / accent, OKLCH L C H | Accent is a plane (≥ 20 %) or one keyword, never a small rectangle; no mid-tone fills; full bleed on ⌈N/3⌉ states ([contrast.md](contrast.md)) |
| `type` | Ramp in px at the 1080-wide frame | display 180–220, word-object 300–420 (may bleed), min 44; one family + display word; ≤ 2 weights |
| `grid` | 6 cols, 72 px margins, safe zone | [composition.md](composition.md) |
| `kinetic` | 4–6 letter/word behaviours, rotated, never twice in a row | [type-as-image.md](type-as-image.md) |
| `actor` | The one recurring geometric actor: colour, geometry, ≥ 3 jobs, the last = CTA | [objects.md](objects.md) |
| `objects` | What each object stands for; every 3D beat with its job and style reason (flat CSS 3D or lit three.js) | [objects.md](objects.md) §3D by judgment |
| `tempo` | BPM (measured if music), beat length, subdivisions | [rhythm.md](rhythm.md) |
| `states` | The state table: one row per state with planes, words, and **its gestures per beat** (primary + details); density proven (≤ 0.75 s gesture-free, CTA still ≤ 1.2 s, ≥ 1 /s) | [templates/look.md](templates/look.md) |
| `keyframes` | Frame 0, mid, CTA in words | Position, size, colour of every object |
| `borrowed` | Per reference: one borrow / one don't | From `refs.md` |
| `banned` | B1–B23 + film-specific ones | [bans.md](bans.md) |
| `approval` | Owner message + date + sha256 | Empty = no scene code |

### Key frames in words — what "described" means

```
frame 0 (t=0.00): ink field 100 %. "STILL" paper, 400 px, weight 800, x=-60 (bleeds left),
  baseline at row 7. Label "your deploys" 52 px, col 1, row 9. Nothing else.
```

Position on the grid, size in px, colour role, what bleeds. "A bold title on a dark
background" is not a key frame.

---

## Register

| Register | Means for the film |
|----------|--------------------|
| brand (ad) | Type and composition carry the image; product UI optional, always real or redrawn from real |
| product (demo) | Real screenshots carry the image (`motion-assets`); this skill still locks colour roles, type ramp, grid, rhythm |

Copy tone for on-screen words: `fuse-design:ux-copy` and `design-method`
references/register/copy.md.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Tone = "clean, modern, premium" | Push to one extreme a competitor would refuse |
| Sketches written after the board | Sketches first, challenger blind, board after |
| Accent as a 120 px chip | Accent is a field: full-bleed frames or a whole band |
| Scene file started "while waiting" | G0 means stop |
| State table lists words but no gestures | Every state names its primary gestures per beat and its details |
| look.md fields filled with "TBD" | TBD = missing = gate closed |

---

## Related

- `fuse-design:design-method` SKILL.md §Gate 0, references/moves/generate.md §Exploration Gate
- `motion-method` → stage-gates.md (G1/G2 after G0)
