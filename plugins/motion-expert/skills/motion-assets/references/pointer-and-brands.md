---
name: pointer-and-brands
description: The real OS pointer as an asset, its hotspot and attachment, and why third-party brand look-alikes (signature colors, logos) are a trademark risk to replace with the owner's brand or neutral placeholders
when-to-use: A beat shows a cursor; the scene or brief borrows a color, logo, or UI from another company; reviewing an example template before reusing it
keywords: cursor, pointer, hotspot, real OS pointer, trademark, brand look-alike, logo, signature color, placeholder
priority: high
related: real-screenshots.md, provenance.md
---

# Pointer & Third-Party Brands

## Overview

Two small things make a product film look fake or put it at risk. A drawn arrow cursor reads as a mock-up within one frame; the real OS pointer reads as a real session. And a scene that borrows another company's signature color, logo, or app chrome to "look like" a famous product is a trademark problem, not a style choice.

Source: field template (ultimaxbt, 2026-10-07) — "the real macOS pointer"; the same wording appears in @twoclipping's public template (2026-09-28), whose own example uses a well-known music app's signature green as its accent — exactly the look-alike risk below.

---

## The Real OS Pointer

| Rule | Why |
|------|-----|
| Use the OS's own pointer image, not a drawn arrow | A redrawn pointer is invented UI in miniature |
| Match the product's platform (macOS pointer for a Mac app) | Mixed platform cues read as fake |
| Keep its hotspot: the click point is the tip, not the image center | Clicks must land where the pointer says |
| Scale it with the camera zoom | A fixed-size pointer floats above a zoomed scene |
| Keep it attached to what it drags, even while that stretches | `motion-craft` → continuous-take gotchas |
| Record it in `assets.json` (`kind: pointer`, source, hotspot) | Provenance like any asset |

Where to get it:

| Source | Note |
|--------|------|
| A real capture with the cursor included (e.g. macOS `screencapture -C`) | Cut the pointer out of a real screenshot |
| macOS ships several system cursors as `cursor.pdf` + `info.plist` (hotspot) under `HIServices.framework/.../Resources/cursors/` | Observed on this machine: hand, i-beam, resize, zoom and others; the plain arrow was not in that folder — verify on yours |

---

## Third-Party Brand Look-Alikes

| Looks like | Risk | Use instead |
|------------|------|-------------|
| A famous app's signature color as the accent | Implies affiliation; trade-dress risk | The owner's brand accent, or a neutral one |
| Other companies' logos in the frame | Trademark use without permission | Owner's logo, or neutral placeholder marks |
| Recognizable third-party app chrome (player, store, chat) recreated | Invented UI + trade dress | The owner's real product, or a neutral generic UI clearly not branded |
| Album covers, photos, fonts without a license | Copyright | Licensed or own assets, recorded in `assets.json` `license` |

Third-party products that genuinely appear in the owner's product (an integration screen showing a partner logo) are real UI — capture them as they are, do not restyle them, and note the integration in `facts.md`.

---

## Decision Guide

```
Element in the scene comes from another company?
├── It is part of the owner's real product UI (integration) → capture as-is, cite in facts.md
├── It is there "for the look" (color, logo, chrome) → replace with owner's brand or neutral placeholder
└── It is a licensed asset (font, photo, track) → keep, record license in assets.json
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Drawn SVG arrow as the cursor | Real OS pointer asset |
| Pointer centered on the click target instead of its tip | Respect the hotspot |
| Reusing a viral template's accent hex as-is | Swap to the owner's brand accent |
| "Default logo" from a template left in the end card | Owner's logo, or the product name in the brief's font |

---

## Related References

- [real-screenshots.md](real-screenshots.md) — real UI only
- [provenance.md](provenance.md) — `kind: pointer` and `license` fields
