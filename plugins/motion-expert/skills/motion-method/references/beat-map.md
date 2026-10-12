---
name: beat-map
description: Stage 2 of the motion pipeline — one row per beat (0.5-1 s on the tempo grid) with its primary gesture, its secondary details, its words and its 3D reason; the density contract (no span > 0.75 s without a gesture, final CTA still ≤ 1.2 s, ≥ 1 beat change per second), read time ≥ 0.25 s per word, aligning to the measured song, one still per beat, and DURATION derived from the sum
when-to-use: After the brief is locked and before any scene code; whenever duration, pacing, music, gestures or beat order change
keywords: beat map, timeline, t_in, t_out, gesture, primary, details, words, 3d, motion density, gesture-free span, cta still, rate, duration, drop, BPM, stills
priority: high
requires: brief-lock.md
related: stage-gates.md, reference-styles.md
---

# Beat Map

## Overview

The beat map is the film's timeline written before any code: one row per **beat** — one
primary gesture on the tempo grid — with its start and end, its secondary details, how
many new words it shows, and why it is 3D if it is. The scene reads DURATION and the
gesture plan from this table; the stills stage takes one frame per beat; the critic checks
pacing against it.

The order "beat map → stills approved → full render" follows howseen-ai/claude-motion-design
and the prompt-motion.com prompts ("show me the state list on the beat grid before you
write any code", "render one frame per beat before the full render").

---

## Columns

| Column | Meaning | Rule |
|--------|---------|------|
| `t_in` / `t_out` | Beat start / end (s) | Contiguous; 0.25-1 s on the grid; only the last (CTA) beat runs longer, for its final still |
| `beat` | What the viewer learns | One clause, traceable to the brief's state chain |
| `gesture` | The ONE primary gesture | From the vocabulary (`travel`, `stagger`, `slam`, `scale`, `split`, `push`, `wipe`, `grow`, `morph`, `assemble`, `flip`, `click`, `drag`, …); never twice in a row; never a fade |
| `g_dur` | How long the primary runs | ≤ the beat |
| `details` | Secondary gestures (`draw@0.25+0.25`) | Smaller than the primary: rules, underlines, counters, motion paths |
| `words` | New on-screen words | `words × HOLD` ≤ the beat (HOLD ≥ 0.25 s/word); long copy → more beats |
| `3d` | Why 3D, why this style | Required for `flip`/`turn`; copied to look.md ([objects.md](../../motion-art-direction/references/objects.md)) |

## The Density Contract

| Rule | Value | Critic |
|------|-------|--------|
| Gesture-free span | ≤ 0.75 s (primary or detail in progress) | F6 |
| Final CTA still | ≤ 1.2 s | F6 |
| Beat changes | every 0.5-1 s; ≥ 1 per second over the body | F11 |

There is no drift and no ambient loop: the next purposeful gesture fills the span
(`motion-craft` → timing-holds.md). The check script enforces all three numbers.

---

## Deriving DURATION

```
DURATION = Σ (t_out - t_in) over all beats = last t_out
FRAMES   = DURATION × FPS        (the master's frame count is checked against this)
```

The scene imports DURATION and the gestures from the beat map (or the JSON generated from
it); never type them twice. If the sum differs from the brief's duration, change the beats
or re-open the brief — never stretch the last still past 1.2 s.

---

## Music Alignment (when the brief has a track)

| Rule | Source |
|------|--------|
| Beat boundaries sit on the song's beats, measured, starting on a downbeat | prompt-motion.com prompts; `motion-render` audio.md |
| The key action lands on the drop | field template (ultimaxbt, 2026-10-07) |
| Every SFX placed by its measured peak | same |
| Verify sync after render; field-reported tolerance ≤ 3 frames | video-shotcraft (field-reported) |

Without music (owner said "no music", or muted-only surfaces), every film still cuts on a silent 120 BPM grid. An `ad` with sound gets its track sourced by the agent before the beat map is final (`motion-render` audio.md "Sourcing").

---

## Stills

**One still per beat**, near each primary gesture's landing (`t_in + 0.9 × g_dur`), on one
contact sheet (the G1 artifact). Fix anything off the grid, cramped or unreadable before
the draft. The three key frames of G0 (open, mid, CTA) are among them.

---

## Ad Tempo Grid (`genre: ad`)

| Rule | Value |
|------|-------|
| Order | hook (0-3 s, the pain in the prospect's words, landing word by word) → pain → solution → CTA ([ad-genre.md](ad-genre.md)) |
| Grid | Every `t_in` / `t_out` on a beat or half-beat (120 BPM → 0.5 / 0.25 s) |
| Beats | Tighten toward the end |
| CTA | ONE CTA, built over its last 2-4 beats (the actor becomes it), then a still ≤ 1.2 s, inside the safe zone |
| Brand | Never before the pain beat |

---

## Decision Guide

```
Beats do not fit the duration?
├── Too many beats → cut a feature beat (the message survives, the feature list does not)
├── A line cannot be read in its beat → split it over more beats, never a held frame
├── A span > 0.75 s with nothing moving → add the next gesture or a detail (never a drift)
└── Duration fixed by the surface or the song → reorder, merge, or split into two films
```

→ See [beats.md](templates/beats.md) for the complete file and its check script

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Two big gestures in one beat | One primary; demote the other to a detail or the next beat |
| 1.5 s beat with one entrance | Two beats of 0.75 s, or a detail drawing in the second half |
| A 6 s CTA hold | Build the CTA over its last beats; still ≤ 1.2 s |
| Same gesture on consecutive rows | Rotate |
| Beat 1 enters by a fade or a reveal | Beat 1 is on screen at full value at frame 0; its gesture acts on it |
| DURATION constant edited in the scene | Regenerate from the beat map |
| Key action a few frames off the drop | Move the beat boundary to the measured drop |

---

## Related References

- [brief-lock.md](brief-lock.md) — `<structure>` (BPM, state chain) and `<start>` feed this map
- [stage-gates.md](stage-gates.md) — the per-beat stills are the G1 artifact
