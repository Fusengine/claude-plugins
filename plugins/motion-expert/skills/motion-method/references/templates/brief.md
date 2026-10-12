---
name: brief
description: Complete `.motion/brief.md` template in the six blocks every prompt-motion.com prompt shares (inputs, direction, structure with BPM + beats + "something happens on every beat" + the ordered state chain, build as numbered steps, gotchas, start = G0), a filled example, and the companion `.motion/facts.md`
keywords: brief, template, inputs, defaults, direction, structure, bpm, bars, every beat, state chain, build, gotchas, start, g0, banned, facts, prompt-motion
---

# Brief Template

## Overview

Copy into `<project>/.motion/brief.md` at stage 1. Block shape = the prompt-motion.com
prompts ([prompt-patterns.md](../../../motion-art-direction/references/prompt-patterns.md)) and
the field template (ultimaxbt, 2026-10-07). Every block must be filled — or defaulted and
marked "default — owner skipped" — before the beat map starts. `<start>` is G0: the owner
sees the state list on the beat grid (and look.md + key frames) before any code. Rules:
[brief-lock.md](../brief-lock.md).

---

## File: .motion/brief.md

```markdown
---
status: draft            # draft | locked
locked_at:               # YYYY-MM-DD when status becomes locked
genre: demo              # demo | ad — ad applies ad-genre.md; owner confirms the message
g0: pending              # pending | approved YYYY-MM-DD (owner approved the state list + look.md + key frames)
---

# Motion Brief — <film working title>

<inputs>
Ask the owner, ONE question at a time. If skipped, use the default and mark it.
| Input | Owner answer | Default if skipped |
|-------|--------------|--------------------|
| Audience | <...> | <named group from README> |
| Message (ONE sentence) | <...> | none — must ask |
| Pain, in the prospect's words (ad only) | <...> | none — must ask; quote a review, ticket or comment |
| Reference style (named + link) | <...> | prompt-motion.com density + 1 named reference (offer 2-3) |
| Product visuals | <...> | real screenshots via motion-assets, or flat objects standing for the product |
| Music (licensed, ~120 BPM, with a drop) | <...> | agent sources 3 royalty-free candidates (audio.md "Sourcing"), owner picks one; silent only if the owner says so or every surface is muted-only |
| Logo / brand mark | <...> | product name in the brief's font; the mark as an object if it has a simple shape |
| Surfaces + byte budgets | <...> | README GIF only, <MB> cap |
| Sensitive-data categories | <...> | names, ids, emails, amounts → mask |
Facts file: .motion/facts.md (only source for on-screen claims)
Banned literals: ~/.fuse-harness/motion/banned.txt (user-level, never in git)
</inputs>

<direction>
Format: <W>x<H>, <fps> fps, <s> s, loop: <yes/no>
Film type: <cut-based edit | one continuous object (one element, never cut, morphing size/radius/colour, cursor-driven)>
Frame 0: the opening statement "<2-6 words>" already on screen at full value
Look: summary only — the locked system is .motion/look.md (G0): ink <oklch>, paper <oklch>, ONE accent <oklch>; type as a large object, flush-left, a bleed; the recurring actor <block/plane, colour>; objects <what stands for the product>; 3D <none | where + flat or lit + why>; dials VALUE_CONTRAST ≥ 60 / TYPE_SCALE ≥ 4 / HOLD ≥ 0.25 s per word / MOTION_DENSITY ≥ 1 per s
Kinetic: type at letter/word level — <4-6 of: letter stagger | slam | scale jump | split | mask | push | swap>, never twice in a row
Transition: hard cuts / actor wipes on the grid, or ONE morph curve <s> s on cubic-bezier(<a>,<b>,<c>,<d>); camera on the same curve; no opacity blend
Reference style: "<name>" — <link> — borrow [<trait>, <trait>, <trait>], do not borrow [assets, music, logo, exact layouts]
Banned: the list in motion-craft → references/anti-slop-video.md (gradients, decorative blur, glow, shadows, grain, glass/chrome, ambient 3D, particles, crossfades, opacity-only reveals, drift, bouncy easing), no exception
</direction>

<structure>
<BPM> BPM (measured from the track if any), <N> beats = <s> s, something happens on every beat:
no span > 0.75 s without a gesture, the final CTA still ≤ 1.2 s, ≥ 1 beat change per second.
State chain: <opening statement> → <slam> → <split> → <actor floods> → … → <CTA> (→ back to the opening, if loop)
Key action on the drop at <s>.
</structure>

<build>
1. Classic scripts in .motion/scene/: lib.js → beats.js|rhythm.js → grid.js → kinetic.js → timeline.js (motion-render timeline-seek), each < 200 lines; every style from seek(t), no timers/CSS transitions/state between frames.
2. Springs are closed-form steps (ζ ≥ 0.85, ≤ 3 % overshoot); a value with many targets is springSum, one step per change.
3. Indicator/knob edges on two springs (dualEdge); drags computed from the cursor while held, spring-back on release (interaction-kit).
4. Beat grid measured from the song, start on a downbeat; every SFX placed by its measured peak; -14 LUFS (audio.md).
5. Stills: one frame per beat (G1) before any draft; fix anything off the grid, cramped or unreadable.
6. Draft without motion blur → critic → G2; master with --subframes 4 (≥ 12 if any move > ~2 % W/frame → motion-render encoding.md).
</build>

<gotchas>
- Text swapping inside a morphing container gets its own exit/enter timing (swapBlur), or it overlaps.
- No will-change on anything the camera scales.
- A flood scales past all four corners in ~0.3-0.4 s, or half the frame changes in one frame.
- A handoff starts only once the previous drawing has landed; counters swap whole values.
- Loop: last frame = first frame, cursor position and velocity included.
</gotchas>

<start>
Ask the inputs, then show the state list on the beat grid — STOP (G0 begins): brief → 3 text sketches → challenger locks the tone blind → reference board → look.md (state table with gestures per beat) + 3 key frames → owner approves in their own message. Only then scene code; then one still per beat (G1). No code before G0.
</start>

## Answers log
- <YYYY-MM-DD> <question> → <owner answer | default — owner skipped>
```

---

## File: .motion/facts.md

```markdown
# Facts — every on-screen claim must appear here with its source

| Claim (exact on-screen wording) | Source | Checked |
|---------------------------------|--------|---------|
| "<claim>" | <file:line, URL, or owner message date> | YYYY-MM-DD |
```

---

## Example Filled (neutral, fictional product)

```markdown
---
status: locked
locked_at: 2026-10-11
genre: demo
g0: approved 2026-10-11
---

# Motion Brief — CLI launch film

<inputs>
| Input | Owner answer | Default if skipped |
|-------|--------------|--------------------|
| Audience | Backend developers evaluating a code-quality CLI | — |
| Message (ONE sentence) | One command finds the problem and shows the fix in the same view. | — |
| Reference style | prompt-motion.com density + terminal-demo grammar | — |
| Product visuals | — | real screenshots via motion-assets (default — owner skipped) |
| Music | — | silent cut on a 120 BPM grid (default — every surface is a README GIF, which has no audio) |
| Logo / brand mark | — | product name in Geist (default — owner skipped) |
| Surfaces + byte budgets | README GIF 8 MB, landing mp4 4 MB | — |
| Sensitive-data categories | customer names, amounts | — |
Facts file: .motion/facts.md
</inputs>

<direction>
Format: 1080x1080, 30 fps, 12 s, loop: no
Film type: cut-based edit
Frame 0: "Lint in one command" already on screen at full value, flush-left, 200 px
Look: per .motion/look.md — ink oklch(0.16 0.01 260), paper oklch(0.97 0.01 90), ONE accent oklch(0.62 0.19 255); the actor is an accent bar that becomes the diff highlight; objects: three flat blocks = the scan queue; 3D: none, because the payoff is a diff, not an object
Kinetic: slam | letter stagger | split | scale jump | push, never twice in a row
Transition: hard cuts and actor wipes on the 120 BPM grid
Reference style: "prompt-motion density" — https://prompt-motion.com/tags/kinetic-type — borrow [a gesture on every beat, letter-level type, one element carrying focus]
Banned: (as in the template)
</direction>

<structure>
120 BPM, 24 beats = 12 s, something happens on every beat (≤ 0.75 s gesture-free, final still 1.0 s).
State chain: "Lint in one command" → command letters stagger → actor bar scans → blocks stack → the problem word slams → it splits on the plane → actor floods accent → diff pushes in → counter springs 0 → 12 fixes → wordmark scale-jumps → install line staggers → still
</structure>

<build>
Per template, steps 1-6.
</build>

<gotchas>
Per template.
</gotchas>

<start>
Inputs answered; the state list on the beat grid shown and approved with look.md (G0, 2026-10-11); one still per beat next (G1).
</start>
```

---

## Notes

- Byte budgets are file sizes, not money — never put spend figures in any `.motion/` file.
- If the repo is public, the brief holds sensitive-data categories only; literal values live in the user-level banned list.
- Changing Message, Reference style, Duration, BPM or Film type after lock sets `status: draft` and invalidates `beats.md`.
- The example's look values are neutral placeholders; never reproduce a third-party brand's signature color or logo (see `motion-assets` → real-screenshots).
