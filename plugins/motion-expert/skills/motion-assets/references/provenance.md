---
name: provenance
description: Recording where every film asset came from in `.motion/assets.json` — source, capture settings, masks, label, sha256 — and checking it before review
when-to-use: After every capture or asset edit, before stills, and when the critic checks truth-safety
keywords: provenance, assets.json, sha256, source, capture settings, masks, audit, truth-safety
priority: high
requires: real-screenshots.md, data-masking.md
related: data-masking.md
---

# Provenance

## Overview

"These are real screenshots, masked" is a claim; `.motion/assets.json` is its evidence. Each asset the scene loads has one entry saying where it came from, how it was captured, what was masked, and the sha256 of the exact file. The critic and the challenger check the film against this file, not against the builder's memory.

---

## Entry Fields

| Field | Content | Why |
|-------|---------|-----|
| `id` | Stable name used by the scene | Scene ↔ entry mapping |
| `file` | Path under `.motion/assets/` | What to hash |
| `kind` | `screenshot` / `recording` / `pointer` / `logo` / `font` / `diagram` | Different rules per kind |
| `hotspot` | `pointer` only: `[x, y]` click point in the image | Clicks land where the tip is ([pointer-and-brands.md](pointer-and-brands.md)) |
| `source` | URL, route, or command that produced it | Re-capturable |
| `capturedAt` | ISO date | Staleness check |
| `capture` | `{ tool, viewport, dpr, colorScheme }` | Identical re-capture |
| `masks` | List of masked categories + method | Truth-safety evidence |
| `exampleDataLabel` | `true` if replaced values are shown | Label rule |
| `license` | For third-party logos/fonts/photos/tracks | Rights; brand look-alikes are not licensed assets |
| `sha256` | Hash of `file` | Detects silent edits |

---

## When to Write / Update

| Event | Action |
|-------|--------|
| New capture | Add entry, hash the file |
| Asset cropped, re-masked, re-exported | Update `masks`/`capture`, re-hash |
| Asset removed from the scene | Remove the entry |
| Before stills (stage 5) | Run the check script; fix every error |

A changed asset changes the stills, which changes the contact-sheet hash and voids a G1 approval (`motion-method` → stage-gates).

---

## Decision Guide

```
Scene loads a file not in assets.json?
├── It is a product visual → capture properly, add entry
├── It is a diagram/illustration → kind: diagram, source: "drawn for this film"
└── Cannot say where it came from → remove it
```

---

## What the Check Verifies

| Check | Failure means |
|-------|---------------|
| Every entry's file exists | Stale entry |
| sha256 matches | Asset edited after recording |
| `screenshot` entries have `capture.dpr` equal across the film | Mixed sharpness |
| `masks` non-empty OR `masks: []` with `reviewed: true` | Masking never considered |
| No banned literal in any string field | Sensitive value leaked into the repo |
| Every asset file under `.motion/assets/` has an entry | Unlisted (treated as invented) |

→ See [assets-json.md](templates/assets-json.md) for the file and the check script

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Entry written once, asset edited many times | Re-hash on every edit |
| `source: "screenshot"` | Real URL/route/command |
| Logo from a search result, no license | Official brand kit, record license |
| Provenance kept only in chat | It lives in `.motion/assets.json` |

---

## Related References

- [data-masking.md](data-masking.md) — what goes in `masks`
- [real-screenshots.md](real-screenshots.md) — what goes in `capture`
