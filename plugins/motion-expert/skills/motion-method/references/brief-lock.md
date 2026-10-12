---
name: brief-lock
description: Stage 1 of the motion pipeline — the six-block brief shared by the prompt-motion.com prompts (inputs, direction, structure with BPM + "something on every beat" + the ordered state chain, build, gotchas, start = G0) mapped to our gates, defaults for skipped inputs, stills one per beat, and how to fill gaps without guessing
when-to-use: Before any scene code, or when resuming a film whose `.motion/brief.md` is missing or incomplete
keywords: brief, inputs, defaults, direction, structure, build, gotchas, start, audience, message, reference style, budget, banned list
priority: high
related: reference-styles.md, beat-map.md, stage-gates.md
---

# Brief Lock

## Overview

A motion film fails most often before the first frame: no single message, a vague style word, or an on-screen claim nobody can source. The brief at `.motion/brief.md` is the contract every later stage is checked against — the critic restates the message from frames alone and compares it to the brief.

The six-block shape below is the one every prompt on prompt-motion.com (the owner's style target) shares — `<inputs>`, `<direction>`, `<structure>`, `<build>`, `<gotchas>`, `<start>` — as do the field template (ultimaxbt, 2026-10-07) and @twoclipping's public templates ([prompt-patterns.md](../../motion-art-direction/references/prompt-patterns.md)). The sourced facts file comes from howseen-ai/claude-motion-design ("brand folder + sourced facts.md").

---

## The Six Blocks, Mapped to Our Gates

| Block | Contains | Gate / stage |
|-------|----------|--------------|
| **`<inputs>`** | What to ask the owner — each with an explicit **default if skipped** (message, genre, product visuals, a royalty-free track ~120 BPM or none, accent, brand mark) | Stage 1 (this file) |
| **`<direction>`** | Format WxH, fps, duration, loop?, film type (**cut-based edit** or **one continuous object**), the look summary (ink / paper / one accent, font, the actor, objects, 3D intent), ONE transition curve, **Banned** = pointer to `motion-craft` → anti-slop-video | Feeds G0 (`look.md` wins on conflict) |
| **`<structure>`** | BPM, bars or beats counted, **"something happens on every beat"** (≤ 0.75 s gesture-free, CTA still ≤ 1.2 s), and the **ordered state chain** written with arrows (`hook word → slam → split → actor floods → … → CTA`); the key action lands on the drop | Becomes the beat map (stage 2) |
| **`<build>`** | Numbered technical steps: classic-script scene with pure `seek(t)`, closed-form springs summed per retarget, beat grid measured from the song, stills one per beat, master subframes | Points to `motion-render`; no restating |
| **`<gotchas>`** | Known failure modes for this film (text swapping inside a morphing container, no `will-change` on scaled layers, floods past the corners, loop velocity) | Prevents pops/smears (`motion-craft` → continuous-take) |
| **`<start>`** | "Ask the inputs → show the state list on the beat grid → STOP" — no code before it | **= G0**: the state list and look.md are what the owner approves before any scene code |

Plus the plugin's own fields, kept in `<inputs>` / `<direction>`: **`genre: ad | demo`**, audience, ONE-sentence message, named reference style, surfaces + byte budgets, sensitive-data list, facts file.

The `<direction>` look line is a summary; the locked visual system lives in `.motion/look.md` (G0, `motion-art-direction`) and wins on conflict.

---

## Genre

| Genre | Viewer | Consequence |
|-------|--------|-------------|
| `demo` (default for README/landing) | Chose to watch | Pipeline as written |
| `ad` (paid/social spot) | Scrolling, will skip | Apply [ad-genre.md](ad-genre.md): hook (0-3 s, the pain in their words) → pain → solution → ONE CTA, tempo grid; owner confirms the message |

---

## Inputs and Defaults

| Input | Typical default if skipped |
|-------|----------------------------|
| Genre | `demo` for README/landing surfaces; `ad` for any paid or social-feed surface |
| Message (ONE sentence) | None — ask; it cannot be defaulted |
| Reference style | None — ask with 2-3 named options ([reference-styles.md](reference-styles.md)) |
| Product visuals | Real screenshots captured by `motion-assets` |
| Music | `ad` and any surface where sound plays: the agent **sources the track itself** — 3 royalty-free candidates matching the tone, license page checked, offered as ONE pick question (`motion-render` audio.md "Sourcing"); never ask the owner to find one. Silent cut on a 120 BPM grid only when the owner says "no music" or every surface is muted-only (README GIF). Never a track without a license; its beat grid is measured |
| Logo / wordmark | Product name set in the brief's font |
| Accent | The product's own primary color from its tokens |

Write each default into the brief as "default — owner skipped" so the critic and owner can see it was not a choice.

---

## The One-Question Rule

```
Field missing or vague?
├── Can it be read from the repo (tokens, README, screens)? → read it, cite the source
├── Has a declared default in <inputs>? → use it, mark "default — owner skipped"
├── Is it a taste decision without default (message, style)? → ask ONE question, wait
└── Is it a fact for the screen? → facts.md with its source, or it does not appear
```

Offer 2-3 concrete options rather than an open question.

---

## Stills Count

**One still per beat** (one frame near each primary gesture's landing), as the
prompt-motion builds render "one frame per beat before the full render". A 15 s film at
2 beats per second gives ~28 stills on one contact sheet. Name the 3 key frames (open,
mid, CTA) in `<start>` — they are the G0 ones; the per-beat stills are G1.

---

## Facts Discipline

| Allowed on screen | Not allowed |
|-------------------|-------------|
| A number copied from `facts.md` with its source | A plausible-looking metric |
| A UI state captured from the real product | A UI state drawn to "show the idea" |
| Placeholder data labeled "Example data" | Real customer data, real spend amounts |

---

## Lock Criteria

Locked when every section is filled (or defaulted and marked) and the owner has answered or not objected to the summary. For `genre: ad`, silence is not enough: the owner explicitly confirms the message — the agent never self-locks an ad brief. Write `status: locked` and the date. Then beats, then G0 in this exact order: brief → 3 text sketches (tone candidates) → challenger locks the tone blind → reference board → `look.md` + 3 key frames → owner sees the key frames → scene code. Never self-approved; no `.motion/scene/*` file before `look.md` and the key frames exist (a prose rule — the harness does not enforce G0 yet). A later change to message, style, duration, or transition curve re-opens the brief and invalidates the beat map.

→ See [brief.md](templates/brief.md) for the complete file

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Show everything the product does" | ONE message; other features become another film |
| Style "clean, modern, premium" | A named reference the owner can open |
| Input skipped, value invented silently | Use the declared default and mark it |
| A different curve per transition | ONE transition curve + duration in `<direction>` |
| `<structure>` lists scenes but no beats | BPM, beat count, the state chain with arrows, a gesture on every beat |
| Asking five questions at once | Ask the highest-leverage one |
| Ad brief locked by the agent, scene started | Owner confirms message, then G0 |

---

## Related References

- [ad-genre.md](ad-genre.md) — rules for `genre: ad`
- [reference-styles.md](reference-styles.md) — naming the style field
- [beat-map.md](beat-map.md) — what `<structure>` becomes
- [stage-gates.md](stage-gates.md) — the stop `<start>` encodes
