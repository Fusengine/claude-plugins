---
name: prompt-patterns
description: Reference library of 10 prompt-motion.com prompts (the owner-named style target, Claude-made motion reels published with their prompts) — each summarised in our own words with author handle and URL, then the recurring patterns (6-block prompt structure, 120 BPM and "something on every beat", state chains, one continuous object vs cut edits, camera rules, banned lists, build steps, gotchas) and where each one conflicts with this plugin's bans
when-to-use: Writing the brief (motion-method brief-lock), planning the state chain and density at Gate 0, or when a draft "lacks animation" and the team needs the reference grammar
keywords: prompt-motion, prompt patterns, reference, inputs, direction, structure, build, gotchas, start, bpm, bars, every beat, state chain, continuous object, cursor, springs, beat grid, banned list, showreel
priority: high
related: reference-board.md, rhythm.md, objects.md, gate-zero.md
---

# Prompt Patterns (prompt-motion.com)

## Overview

The owner approved our still look and named prompt-motion.com as the motion target. Every
reel there ships with the prompt that made it. Read 2026-10-11 through search results of
the pages below (not WebFetch — re-open before quoting). Summaries are ours; quoted
phrases are short. Borrow **grammar only**, never assets, copy or brand (S6).

---

## The 10 prompts

| # | Title · author · URL | Structure and techniques (summary) |
|---|----------------------|------------------------------------|
| 1 | Morphing UI states loop · @demonugc · prompt-motion.com/demonugc-4c5753 | One shape never cut: button → loader → check → island → player → slider → toggle → tabs → chart → ⌘K → toast → button. 120 BPM, 7 bars, "something happens on every beat". Cursor clicks and drags; springs as closed-form steps summed per retarget; dual-edge indicator; drag value from the cursor, spring-back on release; numpy beat grid, start on a downbeat; one frame per beat before the full render; loop with cursor speed matched |
| 2 | Shape morphing through UI states · @twoclipping · prompt-motion.com/twoclipping-5cba86 | Same prompt text as #1, re-posted — the pattern travels |
| 3 | Orange dot motion system · @ultimaxbt · prompt-motion.com/ultimaxbt-bbebf5 | One accent dot connects every scene: UI toggle → dot over an "i" → draws a spring graph → grows into a circle that fills the frame → square → pill → orbiting words → halftone field → end card → back. Letters animated individually; the graph drawn by the same spring that moves the dot; a shape that fills the screen scales past all four corners; four stills before the full build |
| 4 | Food craving launch film · @ultimaxbt · prompt-motion.com/ultimaxbt-2ddf1e | 2D, one continuous take, no fades/blurs/cuts: text rises from a mask line, buttons expand into pages, a colour floods from one object and shrinks into another. 130 BPM, 32 beats, a beat-numbered chain (ask → send → think → drop → chat → outro). One camera transform keyed by [time, zoom, x, y], log-space zoom; shared-element handoffs; bans holds longer than 1 s |
| 5 | UGC ad generator promo · @twoclipping · prompt-motion.com/twoclipping-6dd14e | 10 bars × 2 s at 120 BPM, one move per bar: hook word by word, a hook word morphs into the UI, a circle opens out of a button on the drop, big type, stats on push cuts, logo reveal. Masked type reveals, match cuts measured at runtime; SFX by measured peak, -14 LUFS; storyboard on the beat grid before code |
| 6 | Photo print app launch film · @twoclipping · prompt-motion.com/twoclipping-221cab | 120 BPM, 54 beats, one continuous take: wordmark squeezes into its own period, the dot becomes a pill, iris blades, grid unfolds like a map, a black shape floods and contracts into the next scene, one shape keeps morphing through order states. Closed-form summed springs; cursor clicks, drags, long-presses; one frame per beat, then a single-frame-pop scan; floods overscale past the corners in ~0.3 s |
| 7 | Bold kinetic type showreel · @shneural · prompt-motion.com/shneural-2abdfa | A one-line ask ("make a dynamic 15-second motion graphics video… showreel… go all out"); the result is the kinetic-type reference the owner pointed to |
| 8 | Kinetic shapes showreel · @Shinskinakamoto · prompt-motion.com/shinskinakamoto-20190b | The same one-line showreel ask, shapes-led result |
| 9 | The showreel prompt (site rewrite) · prompt-motion.com/templates/showreel | Rewrite of #7/#8: one named concept, every shot made out of the previous, ≤ 3 colours + black and white, range (kinetic type, shape morph, a 2D-to-3D moment, a UI moment, end title), 120 BPM, something on every beat, holds over half a second banned, one frame per beat checked, last frame = first |
| 10 | SaaS launch video · @aschapmann · prompt-motion.com/aschapmann-131210 | Remotion, 30 s, 4–5 scenes from the real landing page; word-by-word kinetic type, springs, elements building in on the beat, one soft SFX per element, animated logo reveal. Asks for "depth and glow" — banned here |

---

## Recurring patterns

| Pattern | Seen in | How this plugin takes it |
|---------|---------|--------------------------|
| 6 blocks: inputs → direction (look + banned) → structure (BPM, bars, state chain) → build (numbered steps) → gotchas → start (ask, then show the plan before code) | 1, 3, 4, 5, 6 (and the Katana prompts on promptmotion.art) | `motion-method` brief template uses the same blocks; `<start>` = Gate 0 |
| 120 BPM (130 once), bars or beats counted, "something happens on every beat" | 1, 4, 5, 6, 9 | `MOTION_DENSITY`: beat every 0.5–1 s, ≤ 0.75 s gesture-free ([rhythm.md](rhythm.md)) |
| An ordered state chain written with arrows | 1, 3, 4, 6 | The state table in look.md and beats.md |
| One continuous object vs a cut edit | 1, 3, 4, 6 vs 5, 10 | Two film types (`motion-craft` continuous-take.md) |
| A recurring element that becomes the next scene (dot, black shape, flood) | 3, 4, 6 | The recurring actor ([objects.md](objects.md)) |
| Cursor-driven clicks and drags | 1, 4, 6 | `cursorDrag` (`motion-render` interaction-kit.md) |
| Springs as closed-form steps, summed per retarget; dual edges | 1, 3, 6 | `springSum`, `dualEdge` |
| Camera: one transform, zoom so each state fills the frame, log-space, no zoom in-out | 1, 4, 6 | composition-grid camera, continuous-take camera rules |
| Beat grid measured from the song, start on a downbeat, SFX by measured peak, -14 LUFS | 1, 4, 5, 6 | `motion-render` audio.md |
| One frame per beat before the full render; pop scan | 1, 3, 6, 9 | Stills = one per beat (G1); `spikes.txt` |
| Last frame = first frame, cursor speed included | 1, 3, 6, 9 | `checkLoop` |
| Banned lists: particles, glows, lens flares, camera shake, RGB split, crossfades, bouncy easing, dead time | all | Already in anti-slop-video.md |

## Conflicts with our bans (recorded, resolved by the owner)

| Their technique | Seen in | Our rule (owner decision, 2026-10-11) |
|-----------------|---------|---------------------------------------|
| Short blur on a content swap | 1, 2 | Allowed only inside a morphing container, ≤ 0.1 s, ≤ 8 px (`swapBlur`) |
| Motion blur from subframes + `tmix` | 1, 5, 6, 9 | Allowed at master only (4 subframes, ≥ 12 if any move > ~2 % W/frame → `motion-render` encoding.md) |
| "A tiny overshoot at most" | 1, 2, 3 | Springs ζ ≥ 0.85, ≤ 3 %, one swing |
| Liquid glass, goo (blur + threshold), floor reflections, glow, depth | 5, 6, 10 | Still banned (glass, decorative blur, reflections, glow) |
| 3D carousel / flips | 5, 6 (bans 3D flips), 9 (a 2D-to-3D moment) | 3D by judgment with a job and a look.md reason ([objects.md](objects.md)) |
