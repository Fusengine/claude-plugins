---
name: data-masking
description: Masking sensitive data in film assets — replace in the page before capture, label "Example data", and why blur/pixelation is not masking
when-to-use: Any capture where a value from the brief's sensitive-data list (names, ids, emails, amounts) could appear
keywords: masking, sensitive data, example data, PII, client names, amounts, blur, pixelation, banned list
priority: high
requires: real-screenshots.md
related: provenance.md
---

# Data Masking

## Overview

A film is shared, embedded, re-posted, and frame-stepped by strangers. One readable customer name or account figure in one frame is a leak — and a hard-fail in `motion-review` ("sensitive data visible (client names, real spend)"). Masking must be a replacement of the value, applied before the pixels exist, and visible to the viewer as example data.

The "data-safety" check as part of an independent final review follows video-shotcraft (github.com/Vincentwei1021/video-shotcraft, final-review checklist).

---

## What Counts as Sensitive

| Category | Examples of shape (never real values) |
|----------|----------------------------------------|
| People / organizations | Customer names, client project names, avatars |
| Identifiers | Account ids, emails, phone numbers, API keys, URLs with tokens |
| Money | Spend, revenue, invoices, prices tied to a real account |
| Internal | Private repo names, internal hostnames, ticket titles |

Source of truth: the brief's sensitive-data list (categories) + the user-level banned list `~/.fuse-harness/video-motion/banned.txt` (literal values, never in git). The harness `motion` scope denies any write under the motion source dir (`sourceDir` in `.motion/project.json`) whose content matches that list or a currency amount (`12 €`, `1 299,50 EUR`, `$1,299.00`, `£ 40`); the hit is reported redacted (`motion-method` → stage-gates).

---

## Methods, Ranked

| Rank | Method | Verdict |
|------|--------|---------|
| 1 | Seed the product with neutral example data | Best — nothing to mask |
| 2 | Replace text in the DOM before capture | Good — real layout, fake values |
| 3 | Solid cover drawn in the scene over a region | Acceptable for non-text (avatars, charts) |
| — | Blur or pixelate | **Not masking** — blurred/pixelated text can be partially reconstructed, and it still looks like hidden real data |

---

## DOM Replacement (minimal pattern)

```javascript
// Run in the page before the screenshot; values come from a local, uncommitted map.
for (const el of document.querySelectorAll("[data-sensitive], .customer-name, .amount")) {
  el.textContent = el.dataset.example ?? "Example data";
}
```

Replacement values must keep the shape (similar length, same format) so the layout does not reflow into something the product never shows.

→ See [assets-json.md](templates/assets-json.md) for recording which masks were applied

---

## The "Example data" Label

| Rule | Why |
|------|-----|
| Visible on any frame that shows replaced values | Honesty: the viewer knows the numbers are not real |
| Small, consistent position, not the accent color | Must not steal focus |
| Kept through the hold | A label that flashes by does not count |

---

## Example Values (safe shapes)

| Use | Safe example | Never |
|-----|-------------|-------|
| Company | "Northwind Labs", "Example Co" | A real customer or client project |
| Person | "Alex Doe" | A real user |
| Amount | "1,234" with no currency, or a clearly round demo figure labeled "Example data" | Any real spend or revenue |
| Email | "alex@example.com" (reserved domain) | Real addresses |

`example.com` is reserved for documentation (RFC 2606), so it can never belong to someone.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Gaussian blur over a customer list | Replace values in the DOM, re-capture |
| Masked in the scene, raw capture committed | Keep raw captures out of git (`.motion/assets/raw/` ignored) |
| Literal banned values written into `brief.md` | Categories in the brief; values in the user-level banned list |
| Example amounts that look like real spend | Neutral figures + "Example data" label |

---

## Related References

- [real-screenshots.md](real-screenshots.md) — capture after masking
- [provenance.md](provenance.md) — record the masks applied per asset
