---
name: vhs-tape
description: Complete VHS terminal film — .motion/terminal.tape (Require, hidden setup, Wait+Screen, CursorBlink false, LoopOffset, gif + mp4) and the scripted demo it drives (.motion/terminal-demo.sh)
keywords: vhs, tape, terminal, demo script, wait, loopoffset, cursorblink, gif, mp4
---

# VHS Tape Template

Generalized from the proven `docs/demo/hook-sniper.tape` + `docs/demo/demo.sh`: hidden
setup with a clean prompt and a shim function, a scripted demo that owns its pacing, then
a readable hold. Added: `Require`, `Wait+Screen` instead of a guessed `Sleep`,
`CursorBlink false`, `LoopOffset`, and both outputs.

**Tested** (vhs 0.12.1, ttyd 1.7.7, ffmpeg 9.0.2): `vhs validate` exit 0; `vhs` wrote
`terminal.gif` + `terminal.mp4` (8.5 s); last frame shows the final "checks passed" line.

## Usage

```bash
vhs validate .motion/terminal.tape   # parse only
vhs .motion/terminal.tape            # from the project root
```

---

## File: `.motion/terminal.tape`

```tape
# VHS tape — terminal film driven by a scripted demo (no live network/LLM call).
# Regenerate:  vhs .motion/terminal.tape        (run from the project root)
# Output:      .motion/out/terminal.gif + .motion/out/terminal.mp4
# Needs:       vhs (tested 0.12.1), ttyd, ffmpeg.

Output .motion/out/terminal.gif
Output .motion/out/terminal.mp4

# Fail fast when a dependency of the shot is missing.
Require bash

Set Shell bash
Set FontSize 20
Set Width 1080
Set Height 640
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 55ms
Set PlaybackSpeed 1.0
Set CursorBlink false
# Start the GIF loop mid-film so the seam lands on a settled frame, not on a blank prompt.
Set LoopOffset 5%

# ── setup (hidden): clean prompt + a shim that runs the scripted demo ──────────────
Hide
Type `export PS1="\[\e[38;5;176m\]$ \[\e[0m\]"`
Enter
Type `tool() { bash .motion/terminal-demo.sh "$@"; }`
Enter
Type "clear"
Enter
Show

# ── the shot ─────────────────────────────────────────────────────────────────────
Sleep 800ms
Type `tool "run the checks"`
Sleep 600ms
Enter

# Wait on what the demo prints last instead of guessing its length with Sleep.
Wait+Screen@20s /checks passed/
# Readable hold on the final state (>= 1 s, longer when there is more to read).
Sleep 2s
```

Rename the shim `tool` to the product's real command name so the viewer sees what they
will type.

---

## File: `.motion/terminal-demo.sh`

```bash
#!/usr/bin/env bash
# Scripted terminal demo for .motion/terminal.tape: a faithful reconstruction of the real
# flow (no live network or LLM call). Pacing lives here, in sleeps, so VHS records a
# readable rhythm. Every value printed is example data from .motion/facts.md.
set -u

DIM=$'\e[38;5;245m'; GRN=$'\e[38;5;114m'; BLU=$'\e[38;5;110m'; BOLD=$'\e[1m'; RST=$'\e[0m'

p() { printf '%b\n' "$1"; }
pause() { sleep "${1:-0.6}"; }

pause 0.5
p "${DIM}› task:${RST} ${1:-run the checks}"
pause 1.0
p "${BLU}› lint${RST}   ${DIM}src/ …${RST}"
pause 0.9
p "${BLU}› types${RST}  ${DIM}src/ …${RST}"
pause 0.9
p "${BLU}› tests${RST}  ${DIM}42 files${RST}"
pause 1.2
p ""
# The tape waits on this exact text (Wait+Screen /checks passed/).
p "${GRN}${BOLD}✔ checks passed${RST}   ${DIM}lint${RST} 0 · ${DIM}types${RST} 0 · ${DIM}tests${RST} 42/42"
pause 1.6
```

## Adapting

| Change | How |
|--------|-----|
| Real command instead of a script | Replace the shim with the real binary when its output is fast, deterministic and free of sensitive data |
| Pacing | Edit the `pause` values; one readable line ≈ 0.9-1.2 s |
| Final hold | `Sleep` after `Wait` — scale with the amount of text on screen |
| Theme | `vhs themes` lists names; match the product's terminal look |
| Vertical | `Set Width 720` / `Set Height 1280`, bigger `FontSize` for phones |
| Budgets | GIF over budget → smaller `Width`/`FontSize`, shorter holds, then the reduction order in encoding.md |
