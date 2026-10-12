---
name: focus-hierarchy
description: One primary gesture at a time, with smaller subordinate details allowed to move with it — how to pick the primary, what may run as secondary (rules, underlines, counters, motion paths), what the rest of the frame does, and how focus hands off between beats
when-to-use: Filling the `gesture` and `details` columns of the beat map, building a beat's scene layers, or when a draft "feels busy" or "feels dead"
keywords: focus, primary gesture, secondary detail, subordinate, hierarchy, handoff, attention, busy, layers, camera, actor, rule, underline, counter
priority: high
related: timing-holds.md, color-type-video.md, anti-slop-video.md, continuous-take.md
---

# Focus Hierarchy

## Overview

A viewer's eye goes to motion first, then contrast, then size. If two equal things move, the
eye splits and neither reads. So a beat has **one primary gesture** — the move that carries
its meaning — and the eye follows it. But a frame where only that one thing ever moves goes
dead between beats; the owner's reference (prompt-motion.com) shows the fix: **smaller,
subordinate details move with the primary** — a rule drawing across, an underline under the
key word, a counter ticking, a motion path drawn as a line. They add density without
competing, because they are smaller, thinner and on the same beat.

Sources: video-shotcraft — "each shot carries exactly one dominant motion idea"
(github.com/Vincentwei1021/video-shotcraft); prompt-motion.com reels (kinetic type, shapes),
seen 2026-10-11 ([prompt-patterns.md](../../motion-art-direction/references/prompt-patterns.md)).

---

## Primary and Secondary

| Role | What | Rule |
|------|------|------|
| **Primary** | The beat's one meaningful move: a word slamming in, letters staggering, the actor wiping, an object assembling, a 3D turn | ONE at a time; never two primaries overlapping; never the same behaviour on consecutive beats |
| **Secondary** | Rules, underlines, counters, frame indices, motion paths, a cursor's press | Smaller and thinner than the primary, one colour, flat, hard-edged; starts and lands within one beat; never a loop running through a hold |
| **Still** | Everything else on screen | Settled, cut away or wiped away — never dimmed to a mid-tone, never faded |

A secondary detail never becomes the only motion of a beat for long: a span with no
primary gesture is the next beat's job, not a counter's. The beat map plans both columns;
`validateDensity` (`motion-render` timeline-seek) rejects two primaries at once.

---

## Attention Order

| Rank | Signal | Implication |
|------|--------|-------------|
| 1 | Motion — the primary | Whatever makes the biggest move owns the beat |
| 2 | Accent color | The accent marks the primary (or the result it lands on) |
| 3 | Contrast / size | Static hierarchy, and the secondary details (small, thin) |

If rank 1 and rank 2 point at different elements, the beat has two foci — fix the accent, not the motion.

---

## What the Rest of the Frame Does

| Layer | State during the beat |
|-------|-----------------------|
| Primary | Its one move, on its curve |
| Secondary details | Draw on, tick or travel — subordinate in size, on the beat grid |
| Previous focus | Settled and static, or already cut/wiped away |
| UI chrome | Static; no idle shimmer |
| Ground | Flat paper / ink / accent field — it changes only as a beat (a flip, the actor flooding it), never as ambient motion |
| Camera | Still, or the beat's primary when the camera IS the move — never a slow push during a hold (drift is banned) |

A camera move or a field flip is a primary: while it runs, nothing inside the frame takes
another primary gesture (details may still draw). When it lands, the next gesture starts
within 0.75 s ([timing-holds.md](timing-holds.md)).

---

## How the Primary Enters

| Rule | Why |
|------|-----|
| Frame 0 already shows the opening statement at full value | A blank or fading-in first frame loses the scroll |
| Opacity is never the only change | Use a cut, a hard-edged mask, a push, a scale jump, a split, a slam |
| Rotate behaviours; never the same on two consecutive beats | The same entrance on every beat is a hard-fail (X1) |
| Type moves at letter and word level | A whole line cutting in is the slowest kind of beat |

The kinetic set (letter stagger, slam, scale jump, split, mask, push, swap) is built in
`motion-art-direction` → [kinetic-type.md](../../motion-art-direction/references/templates/kinetic-type.md);
the recurring actor and objects in [objects.md](../../motion-art-direction/references/objects.md).

---

## Decision Guide

```
Beat needs two things to change?
├── One causes the other (click → panel opens) → sequence them: cause, then effect, each a primary
├── One is small and supports the other (underline under the slammed word) → primary + secondary
├── They are independent and equal → two beats
└── They are one object (card + its label) → one primary, one curve
```

---

## Focus Handoff Between Beats

| Pattern | Use |
|---------|-----|
| **The actor carries it** | The recurring block travels from the old focus to the new one, or wipes between them — a morph, never a fade |
| **Spatial continuity** | The next primary starts where the previous one ended |
| **Color handoff** | The accent moves from the old focus to the new one as the new one starts |
| **Morph** | The focus shape becomes the next scene ([continuous-take.md](continuous-take.md)) |
| **Hard cut on the grid** | On a landed state, never mid-motion |

Never a crossfade or dissolve between foci. Name the pattern with the term from
`fuse-design:design-motion`'s [animation-glossary.md](../../../../design-expert/skills/design-motion/references/animation-glossary.md).

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Ambient background motion competing with the beat | Remove it; details must be on the beat and subordinate |
| Two big moves at once (camera push while a card animates) | Pick one primary; demote the other to a small detail or the next beat |
| A beat where only a counter ticks for a second | A primary gesture is missing — add the next beat |
| Accent on a static label while a different element moves | Move the accent to the primary |
| Every element entering with its own big animation | One primary; the rest as small details or still |
| Every beat entering the same way (e.g. fade-up) | Rotate slam / stagger / scale jump / split / push; opacity never alone |

---

## Related References

- [timing-holds.md](timing-holds.md) — the 0.75 s gesture-free ceiling and read time
- [color-type-video.md](color-type-video.md) — the one-accent rule that marks focus
- [anti-slop-video.md](anti-slop-video.md) — the ban list (particles, ambient effects)
