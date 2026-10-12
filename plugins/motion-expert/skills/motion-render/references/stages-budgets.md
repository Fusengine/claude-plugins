---
name: stages-budgets
description: The three render stages (stills, draft, master), why --stage defaults to stills, what each stage writes and costs, the budget log, and parallel chunks for long films
when-to-use: Before running the render CLI, when choosing a stage, or when a render is slow or a budget question comes up
keywords: stage, stills, draft, master, gate, budget, jobs, chunks, cost, render count
priority: high
related: verification.md, encoding.md, templates/render-cli.md
---

# Stages and Budgets

## Overview

Rendering is split into three stages of rising cost, separated by the two owner gates
specified in `motion-method` (`references/stage-gates.md` — the authoritative spec; this
file only describes what the render CLI does at each stage).

---

## The Three Stages

| Stage | Command | Writes | Cost | Then |
|-------|---------|--------|------|------|
| `stills` | `bun .motion/render.js` (or `--stage stills`) | `.motion/stills/still-{1..N}.png` (N = one per beat) + `contact.png` | seconds | **STOP — gate G1** (owner approves the look) |
| `draft` | `bun .motion/render.js --stage draft` | `.motion/out/draft.mp4` (540p, crf 23) | every frame at scale 1 | `motion-critic` (≤2 fix rounds) → **STOP — gate G2** |
| `master` | `bun .motion/render.js --stage master` | `.motion/out/master.mp4` + `master.gif` | every frame at full scale, `--subframes` 4 by default (≥ 12 if any move > ~2 % W/frame, [encoding.md](encoding.md)) blended by `tmix` | verify the FILES ([verification.md](verification.md)) |

Each stage prints the artifact sha256 the gate keys its approval on.

---

## Why `--stage` Defaults to `stills`

Omitting the flag runs the cheapest stage, never a more expensive one. A forgotten or
mistyped flag can therefore **not skip a gate**: the worst outcome of
`bun .motion/render.js` is a fresh contact sheet (which also voids any previous G1
approval, because its hash changes). An unknown value (`--stage final`) exits with code 2
instead of guessing.

| Invocation | Result |
|------------|--------|
| `bun .motion/render.js` | stills |
| `bun .motion/render.js --stage=draft` | draft |
| `bun .motion/render.js --stage master --jobs 4` | master, 4 parallel Chrome instances |
| `bun .motion/render.js --stage final` | exit 2, nothing rendered |

The harness `motion` scope **enforces** the gates: it matches the render entry (declared
`render` in `.motion/project.json`, or conventional `render.sh`) with `--stage`. No
`--stage` = stills; `--stage stills` is always allowed; `--stage draft` / `--stage master`
are denied until the owner approves; a non-literal stage (`--stage "$S"`) counts as
master. The agent still stops at G1 and G2 — see `stage-gates.md` for the deny/approve flow.

---

## Budget Log

Every run appends to `.motion/budget.json`:

| Field | Meaning |
|-------|---------|
| `renders[]` | `{stage, at, seconds, outputs: {path: bytes}, sha256}` per run — `sha256` is the gate artifact (stills: `contact.png`, draft: `draft.mp4`); master entries have none (hash the delivered file with `shasum -a 256` when reporting) |
| `count` | Renders per stage so far |

The harness keeps its own count and prints it after each render:
`Motion budget: renders stills N · draft N · master N — wall …`. Optional master cap:
`FUSE_MOTION_MAX_MASTER_RENDERS` in `~/.claude/.env` (0 / unset = no cap); reaching it
denies with "Master render cap reached" → Escalate. Report the counts and wall time in the
delivery notes either way — a third master render is a signal to stop and re-check the
brief, not to keep spending.

---

## Cost Levers (in order)

| Lever | Effect | Use when |
|-------|--------|----------|
| Stay on stills | Seconds per iteration | Layout, type, color still moving |
| Draft at 540p, scale 1 | ~1/3 the pixels of master | Timing and motion review |
| `--jobs N` | N Chrome instances on disjoint frame ranges | Film > ~25 s |
| Fix in the scene, not by re-rendering | One master | A critic finding is a code fix + draft, not a master |

---

## Parallel Chunks

Long films (> ~25 s) render in parallel chunks: the CLI splits `[0, total)` into N
ranges, each captured by its own Chrome profile (`.motion/work/chrome-i`). Frames keep
their **global** index (`frame_00042.png`), so the chunks form one sequence and ffmpeg
reads them as one input — no concat step. This only works because `seek(t)` is pure
([determinism.md](determinism.md)).

---

## Files and Git

| Path | Commit? |
|------|---------|
| `.motion/scene/`, `render.js`, `capture.js`, `encode.js`, `brief.md`, `beats.md` | Yes (source) |
| `.motion/work/` (frames, Chrome profiles) | No — gitignore |
| `.motion/stills/`, `.motion/out/`, `.motion/review/` | Only the delivered master/GIF, copied to the docs path the brief names |

## Delivery Folder — what the owner watches

`.motion/` is a hidden working folder: Finder and most viewers do not show it, so a film left
only in `.motion/out/` is a film the owner cannot see (owner: "il faut VS Code pour le voir").
The pipeline keeps rendering into `.motion/out/` (the harness tracks those paths), **and**
every film the owner must watch is copied, right after it is verified, to a visible folder:

| Artefact | Copy to (visible) |
|----------|-------------------|
| Draft with sound (G2 review) | `<project>/videos/<slug>-draft.mp4` |
| Silent draft | `<project>/videos/<slug>-draft-silent.mp4` |
| Master (+ music version, GIF) | `<project>/videos/<slug>.mp4`, `<slug>-music.mp4`, `<slug>.gif` — or the docs path the brief names |
| Contact sheet (G1) | `<project>/videos/<slug>-contact.png` |

`<project>` = the folder that contains `.motion/`; `<slug>` = the brief's film name in
kebab-case. Overwrite on each new render, check the copy's sha256 equals the source, and
**report the visible path first** — the `.motion/` path second.

---

## Alternatives

Remotion is a capable React-based renderer, but it is not used here: its license is free
only for small teams (≤3 employees, per its license page — verify before relying on it).
Mention it as an alternative; never add it as a dependency of a film.

→ See [render-cli.md](templates/render-cli.md)
