---
name: reference-styles
description: How to turn a vague style word into a named, viewable, checkable reference style for the brief
when-to-use: Filling the brief's reference-style field, or when the owner says "premium", "modern", "clean", "Apple-like"
keywords: reference style, named style, launch video, style traits, adjectives, taste
priority: high
related: brief-lock.md, beat-map.md
---

# Reference Styles

## Overview

"Premium" cannot be reviewed; "Linear launch" can — the owner and the critic can both open it and compare. A reference style is a named film (or a family of films) plus the few observable traits we borrow from it. Without one, the model falls back to its average, which is the generic "AI motion" look.

Named reference style before any code is a rule taken from howseen-ai/claude-motion-design ("a director's brief (named reference style, timed states, layer list…) before any code").

---

## What a Reference Style Entry Contains

| Part | Example shape | Purpose |
|------|---------------|---------|
| **Name** | "Linear launch" | What the owner says |
| **Link** | URL the owner can open | Removes guesswork — verify it exists before writing it |
| **3-5 borrowed traits** | "dark canvas, single accent, UI-first, long holds" | What the critic checks |
| **Explicitly NOT borrowed** | "their music, their logo, their exact layouts" | Prevents copying |

Traits must be **observable in a frame or a timing** — color count, background tone, what moves, how long things hold, cut vs. continuous camera. "Feels confident" is not a trait.

---

## Decision Guide

```
Owner gave an adjective only?
├── Yes → offer 2-3 named references that match it, ask ONE question
│         (research-expert verifies each exists and what it actually shows)
└── No, owner named a film/brand →
    ├── Can we open it? → watch it, extract 3-5 observable traits, confirm with owner
    └── Cannot open it → say so, ask for a link; never describe it from memory
```

---

## Style Families (trait vocabulary, not brands)

Use these to phrase traits once a real reference is chosen.

| Family | Observable traits |
|--------|-------------------|
| **UI-first product launch** | Real product screens cropped large; one primary gesture at a time with a cursor or counter as detail; the payoff read split across several beats (≤ 0.75 s gesture-free) |
| **Dense kinetic reel (prompt-motion.com)** | Something purposeful on every beat at 120 BPM; letter/word kinetics; one element carrying focus; objects that transform ([prompt-patterns.md](../../motion-art-direction/references/prompt-patterns.md)) |
| **Continuous-take launch** | One take, each scene morphing from the last; one transition curve; camera on the same curve |
| **Typographic manifesto** | Large type carries the message; few or no screenshots; word-level reveals |
| **Changelog / ship-week** | Short cards per feature; consistent card grammar; fast but held reads |
| **Terminal / CLI demo** | Monospace, real command output, typing cadence, cursor as the focus |
| **Data story** | One chart or number per beat; build-up then hold; units always visible |
| **Kinetic-type ad** (`genre: ad`) | Frame 1 = the pain in the prospect's words, set huge; 2-6 words per hero beat; cuts on a tempo grid; ink / paper / one accent field; ONE CTA ([ad-genre.md](ad-genre.md)) |
| **Product-hero ad** (`genre: ad`) | Real UI cropped large against flat paper or an accent field; cut-ins on the payoff on the grid; brand never before the pain |

A reference style names the grammar; the concrete palette, type scale and dials are locked in `.motion/look.md` and shown on the G0 board (`motion-art-direction`). No reference can bring back a banned effect (`motion-craft` → anti-slop-video).

---

## Recording It in the Brief

```markdown
reference_style:
  name: "<named reference>"
  link: "<url verified on <date>>"
  borrow: ["ink on paper", "single accent field", "UI-first", "payoff split into 2-6-word beats on the grid"]
  do_not_borrow: ["music", "logo", "exact layouts"]
```

→ See [brief.md](templates/brief.md) for the full brief

---

## Best Practices

### DO
- Verify every reference link before writing it in the brief.
- Keep traits countable (number of colors, hold length, what moves).
- Let the critic's "look.md consistency" criterion use the borrowed traits as its checklist.

### DON'T
- Describe a reference from memory — open it or ask for a link.
- Borrow assets (music, logos, footage) from the reference — borrow grammar only.
- Stack two references ("Linear meets Apple") — pick one; mixed grammar reads as generic.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Make it look like an Apple ad" with no link | Ask which film; extract traits from that film |
| Traits like "elegant", "sleek" | Rewrite as observable traits |
| Reference chosen after scene code started | Re-open the brief; the scene was built against the model's average |

---

## Related References

- [brief-lock.md](brief-lock.md) — the field this fills
- [beat-map.md](beat-map.md) — traits like hold length land in the beat timings
