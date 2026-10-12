---
name: timing-holds
description: Motion density and read time in a film — a purposeful gesture is in progress at every moment (no span over 0.75 s without one, final CTA still ≤ 1.2 s, beats changing every 0.5-1 s on the tempo grid, ≥ 1.5 gesture onsets per second), while every word stays on screen ≥ 0.25 s; long copy becomes more beats, never a held frame; no drift
when-to-use: Setting the timing and gesture columns of the beat map, splitting a long read, snapping beats to a tempo grid, or when the critic flags "too fast to read", "dead frame", "under-animated" or drift
keywords: motion density, gesture, gesture-free span, 0.75 s, cta still, 1.2 s, beat change, 1 per second, read time, hold, split read, tempo grid, BPM, subdivision, final hold, CTA, drift
priority: high
related: focus-hierarchy.md, easing-springs.md, continuous-take.md
---

# Timing & Density

## Overview

Two failures sit on either side of a good beat. Too short: a word leaves before it is read.
Too long: the frame goes dead and the film reads as a slideshow. The owner's verdict on the
approved still look — "c'est bien mais ça manque d'animation" — sets the rule:

> **CONTINUOUS PURPOSEFUL MOTION.** At every moment at least one gesture is in progress.
> No span longer than **0.75 s** without one. The only near-still moment is the final CTA
> still, **≤ 1.2 s**. Beats change every **0.5-1 s** on the tempo grid (120 BPM → 0.5 s
> beats, 0.25 s subdivisions), ≥ **1.5** gesture onsets per second on average. Every word
> still stays on screen ≥ **0.25 s**: long copy is split into more beats, never held still.

There is **no drift**: no "subtle continuous motion", no slow camera or scale push to keep a
frame alive (critic M2). Density comes from many purposeful gestures — letters, words, the
recurring actor, objects, rules and counters drawing on — never from ambient effects.

---

## The Numbers (one set, everywhere)

| Rule | Value | Critic |
|------|-------|--------|
| Gesture-free span, mid-film | ≤ 0.75 s | F6 |
| Final CTA still | ≤ 1.2 s (the only near-still moment) | F6 |
| Beat change (primary gesture onset) | every 0.5-1 s, on the grid; 0.25 s subdivisions for letter bursts | rubric tempo-grid |
| Average rate over the body | ≥ 1 primary gesture onsets per second | F11 |
| Read time | ≥ 0.25 s per word on screen, min 0.4 s per state | L4 |

A **gesture** is a primary move or a secondary detail in progress ([focus-hierarchy.md](focus-hierarchy.md)).
The span is measured from the moment the last gesture lands to the start of the next one.

---

## Read Time vs Still Time

Read time and still time are now different things. A word can be on screen for 1.5 s and
readable the whole time while its underline draws, the actor passes under it and a counter
ticks beside it. What is capped is the time **nothing** moves.

```
on-screen time of a word ≥ 0.25 s (HOLD dial, motion-art-direction dials.md); state ≥ 0.4 s
gesture-free span ≤ 0.75 s, except the final CTA still ≤ 1.2 s
```

| Read needs | Do |
|------------|----|
| ≤ 4 words (≤ 1 s at 0.25 s/word) | One beat; a detail draws while it is read |
| 5-12 words | Split into beats of 2-4 words, each landing on a grid line with its own behaviour |
| A UI state that needs study | Crop to the region that carries the point; the next region is the next beat; a cursor or counter keeps a gesture in progress |

Example: a 12-word line at 0.25 s/word needs 3 s → six beats of 2 words at 0.5 s, behaviours
rotated (slam → stagger → split → scale jump …), never one 3 s card.

---

## Tempo Grid

| Rule | Value |
|------|-------|
| Grid | e.g. 120 BPM → a line every 0.5 s, subdivisions at 0.25 s; with music, the BPM is measured from the song (`motion-render` audio.md) |
| Cuts and primary gestures | Start on a grid line ±1 frame |
| Rate | ≥ 1 onset/s averaged → a beat every 0.5-1 s |
| Shape | Beats tighten toward the end, then the CTA is **built** over its last beats (the actor becomes the CTA) and stops dead for ≤ 1.2 s |
| Sound-off | The grid is a visual rhythm; it must read muted |

Cut timing per state and the gesture plan: `motion-art-direction` →
[cut-rhythm.md](../../motion-art-direction/references/templates/cut-rhythm.md).

---

## Field-Reported Pacing

| Moment | Reported value | Source |
|--------|----------------|--------|
| Frozen frames | none longer than 1 s | field template (ultimaxbt, 2026-10-07); this plugin's span is 0.75 s |
| Holds | "longer than half a second" banned | prompt-motion.com showreel template, 2026-10-11 |
| Every beat | "something happens on every beat" at 120 BPM | prompt-motion.com UI-morph prompts, 2026-10-11 |

Reported preferences, not measured norms. "Hold longer" means more read time across more
beats — never a longer frozen frame, never a drift.

---

## UI Durations Do Not Apply

`fuse-design:design-motion` sets UI motion at 100-500 ms. Those answer "how fast should an
interface respond?", not "how long must a word be readable?". Use its curve shapes; never
its duration tiers as read time.

---

## Decision Guide

```
Critic flags timing?
├── "Too fast to read"        → raise that word's on-screen time to ≥ 0.25 s/word, add a beat
├── "Dead frame" (F6)         → a span > 0.75 s: start the next gesture sooner (word, actor, rule)
├── "Under-animated" (F11)    → < 1 onset/s: shorter beats, letter/word kinetics, the actor
├── "CTA flashes by"          → build it over the last 2-3 beats, then a 0.8-1.2 s still
├── "Drift during a hold"     → remove it; give the span a purposeful gesture (hard-fail M2)
└── Gesture OK, unreadable    → type too small at phone width (color-type-video.md)
```

---

## Final Still and Loops

| Rule | Why |
|------|-----|
| Only the final CTA still may pass 0.75 s, up to 1.2 s | It is the end card; nothing follows |
| Loop: last frame = first frame, position and velocity matched | "Loop jump" (`motion-review`); `checkLoop` in `motion-render` interaction-kit.md |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| 1.5 s state with one entrance and nothing after | Add a secondary detail and the next primary at 0.5-0.75 s |
| 6.5 s CTA hold | Build the CTA over its last beats; still ≤ 1.2 s |
| Slow camera or scale push to "keep it alive" | Banned drift — a purposeful gesture instead |
| 10-word line in one beat | Split into 2-4-word beats |
| Ambient loop (spinning shape, pulsing dot) to fill spans | Ambient motion is slop; fill spans with purposeful gestures |

---

## Related References

- [focus-hierarchy.md](focus-hierarchy.md) — one primary at a time, subordinate details
- [easing-springs.md](easing-springs.md) — the motion part of the beat
- [continuous-take.md](continuous-take.md) — one continuous object, loops, transitions
