---
name: ad-genre
description: Genre "ad" vs "demo" — hook (0-3 s, the prospect's pain in their words, brand never before the pain) → pain → solution → single CTA (last 3-4 s, built over its last beats, still ≤ 1.2 s); 2-6 words per hero beat, landing word by word; cuts and gestures on a tempo grid, a beat change every 0.5-1 s; sound-off comprehension; platform durations
when-to-use: 'The brief says `genre: ad`, or the request is a paid/social spot (Reels, TikTok, LinkedIn, launch ad) rather than a README demo'
keywords: ad, genre, hook, pain, solution, CTA, tempo grid, BPM, kinetic type, sound-off, Reels, TikTok, LinkedIn, safe zone
priority: high
requires: brief-lock.md
related: beat-map.md, reference-styles.md, stage-gates.md
---

# Ad Genre

## Overview

A **demo** is watched by someone who chose to look (README, landing page). An **ad** interrupts a feed: the viewer has not chosen it and leaves within seconds. Set `genre: ad | demo` in the brief; everything below applies only to `ad`. The owner confirms an ad's message — the agent never self-locks it — and G0 (`motion-art-direction`) is approved before any scene code.

A premium ad is watched because of value contrast, type as a large object, composition and rhythm — never decoration (`motion-craft` → anti-slop-video).

---

## Structure: Hook → Pain → Solution → CTA

| Part | Time (15 s ad) | Content | Source |
|------|----------------|---------|--------|
| **Hook** | 0-3 s | The prospect's pain **in their words** (a phrase lifted from a review, ticket, comment), set huge | novoads (first 3 s; "the problem in their words"), klaivo |
| **Pain** | ~3-7 s | Make it their problem: the daily cost, specific, one idea per beat | klaivo (hook · pain · solution · CTA) |
| **Solution** | ~7-10 s | The product doing the job — real UI, brand appears here at the earliest | klaivo |
| **CTA** | last 3-4 s | ONE action, on screen longest: built over its last beats (the actor becomes it, the name slams, the URL staggers), then a still ≤ 1.2 s, inside the safe zone | framenotion (CTA on screen longer than other lines); klaivo reports 3-5 s; density rule: owner, 2026-10-11 |

**Brand never before the pain.** Meta and Google advise showing the brand early; what fails is a logo card that says nothing about the viewer's problem (novoads). This plugin resolves it one way: pain first, brand from the solution beat on.

Scale the times to the duration; the order never changes, and the CTA is the longest
state but never a still longer than 1.2 s.

---

## Copy on Screen

| Rule | Value | Source |
|------|-------|--------|
| Words per hero beat | **2-6** | novoads ("most strong overlays use two to six words"); framenotion (3-6-word chunks) |
| Ideas per beat | ONE | klaivo, framenotion |
| Hold per word | ≥ the HOLD dial in `look.md` (floor 0.25 s/word) | framenotion tests 0.3-0.5 s/word |
| Hero word | One per beat, set as a large object; accent on it or as the field | `motion-craft` → color-type-video |
| Sound-off | Mute the draft: text + picture carry the whole message | novoads ("write the muted version first"), framenotion |
| Message / CTA | ONE each | klaivo |

---

## Rhythm: The Tempo Grid

| Rule | Value |
|------|-------|
| Cuts and gestures land on a tempo grid | e.g. 120 BPM → a beat every 0.5 s, subdivisions 0.25 s |
| Density | A beat change every 0.5-1 s (≥ 1 per second); no span > 0.75 s without a gesture; final CTA still ≤ 1.2 s |
| States per film | ~8-14 per 15 s; ~16-26 per 30 s (each state carries 2-3 gestures) |
| Beats tighten toward the end | then the CTA is built and stops dead |
| Variation | No two consecutive beats share a behaviour or a type size |

Reference for type-and-rhythm craft: Apple "Don't Blink" — one- and two-syllable words, one at a time, each on screen 5-7 frames at 29.97 fps, cut to a percussion track (Motionographer). Its per-word timing is below this plugin's HOLD floor; borrow the grammar (one word at a time, type as image, cut on the beat), not the speed.

State counts and the grid are this plugin's synthesis from the sources' beat timings, not a published platform number. Detailed grid rules: `motion-craft` → timing-holds.

---

## Durations (vendor-sourced, medium confidence)

| Surface | Target | Source |
|---------|--------|--------|
| Instagram Reels, cold audience | 15 s | revenuejack (Instagram 5-15 s) |
| LinkedIn | 10-30 s | revenuejack |
| TikTok paid | 21-34 s | TikTok-reported range relayed by vendor blogs; revenuejack lists 5-30 s |

Re-check the platform's current guide before locking; record the value and source in the brief.

---

## Safe Zone (9:16)

Meta Reels ads safe zone: https://www.facebook.com/business/help/980593475366490 — keep the hook and CTA inside it. Percentages: `motion-craft` → color-type-video.

---

## Ad Self-Check (before stills)

```
├── Frame 0 = logo, blank ground, or fading in?  → open on the pain line at full value
├── Brand visible before the pain?               → move it to solution / CTA
├── Hero beat > 6 words, or hero centered?       → split, re-compose flush-left / bleed
├── Any span > 0.75 s with no gesture, or a drift? → add the next gesture (word, actor, detail)
├── Fewer than 1 beat change per second?      → shorter beats, letter/word kinetics
├── Same behaviour twice in a row, or a fade?    → rotate slam / stagger / split / push
├── Cut or gesture off the tempo grid?           → snap to the grid
├── CTA not built, or its still > 1.2 s?          → build it over the last beats, still ≤ 1.2 s
├── Muted draft unreadable?                      → more on-screen text, fewer ideas
├── More than one message or CTA?                → cut to one
└── Claim/number not in facts.md?                → remove it
```

Hard-fails and their detection: `motion-review` → hard-fails.md. Bans: `motion-craft` → anti-slop-video.md.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Demo pacing reused for an ad | New beat map on the tempo grid |
| Logo intro "for brand recall" | Brand from the solution beat |
| Marketing copy as the hook | The prospect's own words |
| Feature list | ONE message; other features = other ads |
| Agent self-locks the ad brief | Owner confirms message, then G0 |

---

## Sources

- https://novoads.ai/en/blog/how-to-make-ad-hooks
- https://klaivo.co/blog/video-ad-structure
- https://framenotion.com/blog/how-to-use-kinetic-typography-in-ads
- https://dev.motionographer.com/2016/09/14/4-ways-dont-blink-is-a-masterclass-of-type-and-rhythm/
- https://www.revenuejack.com/blog/tiktok-vs-instagram-vs-linkedin-video-ads
- https://www.facebook.com/business/help/980593475366490

## Related References

- [brief-lock.md](brief-lock.md) — `genre` field, owner confirmation for ads
- [beat-map.md](beat-map.md) — the tempo grid in the timings
- [reference-styles.md](reference-styles.md) — naming an ad reference
