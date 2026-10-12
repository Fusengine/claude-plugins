---
name: delivery-github
description: Shipping a film to a GitHub README or docs — what renders inline, size limits, GIF inline + mp4 link pattern, and which claims are community-reported
when-to-use: Choosing the delivery format for a README/docs surface, or when a committed video does not play on GitHub
keywords: github, readme, gif, mp4, video, user-attachments, size limit, delivery
priority: medium
related: encoding.md, audio.md, verification.md
---

# Delivery on GitHub

## Overview

GitHub renders images in Markdown, not committed video files. The safe default is:
**inline GIF, linked mp4.** Everything else depends on behaviour GitHub does not fully
document — treat it as reported until you have checked it on the live page.

---

## What Renders

| Asset | In README / docs Markdown | Status |
|-------|---------------------------|--------|
| GIF / PNG committed to the repo | Renders inline via `![alt](path)` | Reliable |
| mp4 committed to the repo | Does **not** play inline; it is a link | Reliable |
| Video uploaded by drag-and-drop (`user-attachments` URL) | May render as a `<video>` player | Community-reported, verify on the live page |
| `<video src="relative.mp4">` in README | Not rendered | Community-reported |

Upload via drag-and-drop is a manual browser step; an agent cannot produce a
`user-attachments` URL, so never promise it in an automated delivery.

---

## Size Limits (reported, verify)

| Asset | Limit |
|-------|-------|
| Images and GIFs | 10 MB |
| Videos | 10 MB on free plans, 100 MB on paid plans |

The brief's byte budgets should sit well under these (a README GIF that loads fast is
usually 2-6 MB). If a budget is over a limit, the limit wins; reduce with the order in
[encoding.md](encoding.md).

---

## The Pattern

```markdown
![Short description of what the film shows](docs/img/feature.gif)

[Watch in full quality (mp4)](docs/img/feature.mp4)
```

| Rule | Why |
|------|-----|
| Alt text = what happens, not "demo" | Screen readers and broken-image fallbacks |
| GIF has no audio | Deliver a silent cut; music only in the mp4 ([audio.md](audio.md)) |
| Loop seam on a settled frame | GIFs autoplay and loop; a jump at the seam reads as a bug |
| Commit only the delivered files | Frames, profiles and drafts stay in `.motion/work` (gitignored) |
| Paths from the brief | The brief names the docs path; never invent one |

---

## Other Surfaces

| Surface | Format | Note |
|---------|--------|------|
| Landing page | mp4 `<video autoplay muted loop playsinline>` + poster | Autoplay requires muted |
| Social (X, LinkedIn) | mp4, aspect from the brief (16:9 / 1:1 / 9:16) | Respect the 9:16 safe zone when vertical |
| Slides | mp4 | Keep the master |
| Chat / issue comment | GIF or drag-and-drop mp4 | Same reported caveats |

---

## Checklist

- [ ] GIF ≤ budget and ≤ 10 MB, mp4 ≤ budget
- [ ] README shows the GIF inline and links the mp4
- [ ] Alt text describes the action
- [ ] The rendered page was opened and the GIF actually animates
- [ ] Reported behaviours (user-attachments player, video limits) were checked or labelled "reported"
