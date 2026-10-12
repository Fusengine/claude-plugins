---
name: vhs-terminal
description: Terminal films with VHS — scripted demo + tape, Require/Hide/Show/Wait, CursorBlink, LoopOffset, gif+mp4 outputs, and when to choose VHS over the HTML pipeline
when-to-use: The film shows a terminal / CLI session, or a README needs a terminal GIF
keywords: vhs, tape, terminal, cli, ttyd, gif, wait, loopoffset, cursorblink
priority: medium
related: encoding.md, delivery-github.md, templates/vhs-tape.md
---

# Terminal Films with VHS

## Overview

VHS (charmbracelet, tested 0.12.1) records a real terminal driven by a `.tape` script and
writes GIF/mp4 directly. It needs `ttyd` and `ffmpeg` on PATH. Use it when the subject
**is** a terminal; use the HTML pipeline when the terminal is one element of a larger
composition (a window inside a product shot, a resize, a camera move).

---

## VHS or HTML?

| Need | Choose |
|------|--------|
| A command and its real output, typed live | VHS |
| Exact pacing with a scripted output | VHS + a scripted demo script |
| Terminal inside a UI scene, resize, zoom, mixing with app UI | HTML (`seek`) |
| Camera, springs | HTML |
| Frame-exact reproducibility across machines | HTML (VHS timing depends on the shell) |

---

## Tape Rules

| Rule | Command | Why |
|------|---------|-----|
| Fail fast | `Require <program>` first | A missing binary fails before recording, not mid-film |
| Hidden setup | `Hide` … `Show` | Prompt, aliases, `clear` never appear |
| Wait, don't guess | `Wait+Screen@20s /regex/` over long `Sleep` | Ends on what the program printed, not on a guessed delay |
| Still cursor | `Set CursorBlink false` | A blinking cursor makes holds flicker and loops jump |
| Clean loop seam | `Set LoopOffset 5%` | The GIF starts slightly in, so the seam lands on a settled frame |
| Both outputs | `Output x.gif` + `Output x.mp4` | GIF inline, mp4 linked ([delivery-github.md](delivery-github.md)) |
| Readable holds | `Sleep 2s` on the final state | ≥ 1 s per readable state, longer with more text |
| Validate | `vhs validate file.tape` | Parses without running |

---

## Scripted Demo Script

When the real command is slow, non-deterministic, calls a network or an LLM, or prints
sensitive data, the tape calls a **scripted demo** that reproduces the real output with
its own pacing (`sleep` between lines). Rules:

| Rule | Why |
|------|-----|
| Faithful reconstruction of a real run | Never invent features or output the product does not have |
| Values from `.motion/facts.md`, labelled example data | No real customer names, no real spend |
| Pacing in the script, not in the tape | The tape just waits on the last line |
| ANSI colors from the product's real palette | Consistent with the product |
| A hidden shim (`tool() { bash demo.sh "$@"; }`) | The viewer sees the real command name |

---

## Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Film ends before output | `Sleep` shorter than the program | `Wait+Screen /last line/` |
| Prompt clutter | PS1 with paths/git status | Set a minimal PS1 in the hidden setup |
| Relative paths break | Output/script paths resolve from the cwd | Run `vhs` from the project root (VHS 0.12.1 creates missing output dirs) |
| Jump at the GIF loop | Last and first frame differ | `LoopOffset`, end on the same layout as the start, or hold |
| Theme mismatch | Default theme | `Set Theme` matching the product |

→ See [vhs-tape.md](templates/vhs-tape.md) for a complete tape + scripted demo
