---
name: real-screenshots
description: Capturing real product screenshots for a film — batch capture, fixed DPR and viewport, state setup, and why redrawn UI is a hard-fail
when-to-use: Stage 3 of the pipeline, or whenever a beat shows the product's UI
keywords: screenshot, capture, browser_shots_batch, DPR, deviceScaleFactor, viewport, real UI, invented UI
priority: high
related: data-masking.md, provenance.md
---

# Real Screenshots

## Overview

A product film is a claim about the product. Showing a screen the product does not have — or a tidier version than the real one — is "invented UI", a hard-fail in `motion-review` ("invented feature → no screenshots/facts" in its symptom table). Real captures also look more convincing than redraws, which is why both reference pipelines insist on them.

Sources: video-shotcraft ("real page captures… real screenshots for real product UI (no hand-drawn substitutes)", github.com/Vincentwei1021/video-shotcraft); howseen-ai/claude-motion-design ("mobile = screenshots + 'invent no feature'").

---

## Capture Settings (fixed per film)

| Setting | Rule | Why |
|---------|------|-----|
| **DPR** | One value for the whole film (e.g. 2) | Mixed DPR = mismatched sharpness between beats |
| **Viewport** | One CSS size per surface | Consistent layout and type scale |
| **Theme** | Light OR dark, matching the brief's canvas | One look; no mid-film theme flip |
| **Scrollbars / cursors** | Hidden unless the cursor performs the beat's gesture (a click, a drag) | Noise |
| **Color profile** | sRGB | Matches the render pipeline (`--force-color-profile=srgb`) |

Recording the exact settings in `assets.json` is what makes a re-capture identical ([provenance.md](provenance.md)).

---

## Tool Routing

| Need | Tool | Note |
|------|------|------|
| N screens at once | `browser_shots_batch { urls:[...] }` | Batch, never a per-URL loop (`fuse-ai-pilot:fuse-browser-usage` rule 3) |
| Responsive / dark variants | `browser_screenshot { viewports:[...], colorScheme }` | One call |
| DPR must be pinned and the batch tool exposes no DPR option | CDP `Emulation.setDeviceMetricsOverride { width, height, deviceScaleFactor }` | The repo's own pattern: `docs/demo/statusline-mod/motion-capture.js` |
| Terminal / CLI output | Record the real command (VHS, see `motion-render`) | Never type fake output |

Check the fuse-browser tool schema for a DPR/scale parameter before relying on it; if none is listed, use the CDP path.

---

## State Setup Before Capture

```
Screen needs specific content?
├── Product supports seed/demo data → seed neutral example data, capture
├── Needs a logged-in state → use a dedicated demo account, never a real customer's
└── Contains real data you cannot replace in-app → mask in the page before capture (data-masking.md)
```

---

## Making Captures Legible

| Problem at phone width | Allowed fix | Not allowed |
|------------------------|-------------|-------------|
| Text too small | Crop/zoom into the region | Redraw larger text |
| Too much on screen | Crop to the focus element; dim the rest | Delete UI elements |
| Need to highlight | Accent outline/overlay drawn ON TOP, clearly an annotation | Recolor the product UI |

Zooming a bitmap past its captured resolution blurs it — capture at a DPR high enough for the deepest zoom in the beat map.

---

## Decision Guide

```
Beat shows product UI?
├── Screen exists → capture it
├── Screen exists but in a different state → set up the state, capture
├── Screen does not exist yet (upcoming feature) → do not show it; ask the owner
└── Conceptual diagram, not UI → allowed if clearly a diagram, never styled as the product
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| HTML mock "inspired by" the product | Capture the real screen |
| Captures at DPR 1 and 2 mixed | Re-capture all at one DPR |
| Zooming 3× into a DPR-1 capture | Re-capture at higher DPR |
| Real account with real customer rows | Demo account + example data |

---

## Related References

- [data-masking.md](data-masking.md) — what to do when real data is on screen
- [provenance.md](provenance.md) — recording capture settings and hashes
- [pointer-and-brands.md](pointer-and-brands.md) — the real OS pointer, and no third-party brand look-alikes
