---
name: rhythm
description: Cut and gesture rhythm of a film — cuts and primary gestures on a tempo grid (120 BPM = 0.5 s beats, 0.25 s subdivisions, ±1 frame), a beat change every 0.5–1 s (≥ 1 per second), no span over 0.75 s without a gesture, beats tightening toward the end, the CTA built by the actor and held still ≤ 1.2 s, inversion cuts on act changes, match cuts on a glyph or baseline
when-to-use: Writing look.md tempo and the state table, timing beats, or when the critic flags "metronome", "too fast to read", "dead frame", "under-animated" or a CTA that flashes by
keywords: rhythm, tempo, bpm, beat, subdivision, cut, hard cut, grid, frame, gesture, motion density, gesture-free span, states, cta, cta still, inversion cut, match cut, baseline, glyph
priority: high
related: dials.md, contrast.md, objects.md, templates/cut-rhythm.md
---

# Rhythm

## Overview

Without depth effects, time does the work: a cut or a slam on the beat is the film's
punctuation, a word landing is its emphasis. The owner approved the still look and asked
for more animation: so **something purposeful moves at every moment**, the beat changes
every 0.5–1 s, and only the final CTA stops — dead, for ≤ 1.2 s. An even metronome of
still cards reads as a slideshow; a dense rhythm that tightens and then stops on the CTA
reads as directed.

---

## Tempo grid

| Item | Rule |
|------|------|
| Tempo | Pick a BPM; beat = 60 / BPM (120 BPM → 0.5 s; 100 → 0.6 s); subdivisions = beat / 2 |
| Cuts and primary gestures | Start on `n × beat` or a subdivision, snapped to the nearest frame |
| Tolerance | ±1 frame (33 ms at 30 fps) — off-grid by more = rejected by the validator |
| Sound | With music, the BPM and the first downbeat are **measured** from the song (`motion-render` audio.md); without, the grid still applies. With music, holds **pulse on the kicks** (2-4 % scale punch, accent hits on the drop — audio.md "Beat Pulse") |

Hard cuts only between states. No crossfade, no dissolve, no opacity ramp
(bans.md B10–B11, critic M1). A state appears and leaves by `visibility` on the cut, or
the actor wipes it.

---

## Density (`MOTION_DENSITY`, [dials.md](dials.md))

| Rule | Value | Critic |
|------|-------|--------|
| Beat change (primary gesture onset) | Every 0.5–1 s | rubric tempo-grid |
| Rate over the body | ≥ 1 per second (~2 on half-beats) | F11 |
| Gesture-free span | ≤ 0.75 s, except the final CTA still | F6 |
| Final CTA still | ≤ 1.2 s | F6 |
| Read time | ≥ 0.25 s per word on screen, min 0.4 s per state | L4 |

A **state** is what is on screen between two cuts; a state of 1–1.5 s carries 2–3 primary
gestures (a slam, then a split, then the actor passing). Behaviours rotate: never the same
primary on consecutive beats ([type-as-image.md](type-as-image.md), [objects.md](objects.md)).

| Length | Primary gestures | States (cuts) |
|--------|------------------|---------------|
| 6 s bumper | ≥ 8 (body ≥ 4.8 s) | 4–6 |
| 15 s | ≥ 21 (body ≥ 13.8 s) | ~8–14 |
| 30 s | ≥ 44 (body ≥ 28.8 s) | ~16–26 |

---

## Holds and the CTA

| Rule | Value |
|------|-------|
| One-word bursts | 0.2–0.27 s each (6–8 frames at 30 fps) in a run of ≥ 3 — "Don't Blink" grammar |
| Shape over the film | Beats tighten toward the end (acceleration into the CTA) |
| CTA | The actor or object **becomes** the CTA over the last 2–4 beats (grows to a band, the name slams in, the URL staggers, a rule draws), then a still of 0.8–1.2 s |
| Before the CTA | 1–2 beats on a near-empty frame (one word on an ink or accent field) — still with a gesture in progress |
| Measure | Mean beat of the last third of the body ≤ mean of the first two thirds |

"Hold the outcome twice as long as feels right" (Linear teardown, frame24) now means: give
the payoff more beats, not a longer still.

---

## Cut types

| Cut | When | Rule |
|-----|------|------|
| Hard cut | Every state change | On the grid; the incoming word slams or scale-jumps on it |
| Inversion cut | Act changes (pain → turn, turn → proof) | ink↔paper swap of the whole frame, type position kept ([contrast.md](contrast.md)) |
| Accent cut | The turn or the payoff | The actor floods to a full-bleed accent frame |
| Match cut | Between scenes | A glyph or a baseline stays at the same x/y across the cut |

At least 1 match cut per 15 s; inversion cuts on every act change.

---

## Shape of a 15 s ad (example, 120 BPM, 30 beats)

```
0.0–2.5   hook    word-object "still"; actor travels, label letters stagger, rule draws, "broke" slams, a word splits
2.5–5.5   pain    3 states (inversion at 2.5): scale jump, draw, stagger, push, slam, split
5.5–6.0   turn    the actor floods to accent (brand from here)
6.0–10.0  proof   4 states (inversion at 6.0): counter springs + retargets, "0" match cut at 7.0, a 3D reveal at 9.0
10.0–11.0 breath  1 word on an ink/paper split, halves slide apart at the plane
11.0–14.0 CTA     the actor grows into the band, name slams, URL staggers, rule draws, the mark turns, weight swap
14.0–15.0         final still 1.0 s (≤ 1.2)
```

28 primary gestures over a 14.0 s body = 2.0 per second.

Brand appears only from the turn onward. Same table as the validated example in
[templates/cut-rhythm.md](templates/cut-rhythm.md).

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Every state 1.5 s with one entrance | 2–3 primaries per state, a detail drawing between them |
| CTA 6 s of standing still | Build it over the last beats; still ≤ 1.2 s |
| Cuts at "whatever looked right" | Snap to the grid; the validator enforces ±1 frame |
| Ambient loop to "keep it moving" | A purposeful gesture: a word, the actor, a rule |
| Logo opens the film | Pain first; brand after the turn ([bans.md](bans.md)) |

---

## Related

- [templates/cut-rhythm.md](templates/cut-rhythm.md) — tempo map → states + gesture plan + validator
- `motion-method` → beat-map.md (the beat map this table refines)
- `motion-craft` → timing-holds.md (read time and density)
