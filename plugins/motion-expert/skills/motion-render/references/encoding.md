---
name: encoding
description: ffmpeg encoding for films — H.264 mp4 (yuv420p, BT.709 tagged, faststart, crf), two-pass-quality GIF (palettegen/paletteuse), master motion blur from subframes averaged by tmix (draft and stills sharp), one blended frame per output frame, and the byte-budget reduction order
when-to-use: Encoding a draft or master, fixing color shift/banding/GIF shimmer, or bringing a file under its byte budget
keywords: ffmpeg, h264, libx264, yuv420p, bt709, crf, faststart, gif, palettegen, paletteuse, bayer, budget
priority: high
related: delivery-github.md, verification.md, stages-budgets.md, templates/render-cli.md
---

# Encoding

## Overview

Frames are lossless sRGB PNGs; the encoders turn them into what each surface can play.
Every option below is either used by the reference pipeline and checked against
`ffmpeg -h filter=<name>` on ffmpeg 9.0.2, or marked "reported, verify".

---

## MP4 (H.264)

| Option | Value | Why |
|--------|-------|-----|
| `-c:v libx264` | — | Plays everywhere a `<video>` plays |
| `-pix_fmt yuv420p` | required | 4:4:4 / RGB H.264 does not play in most browsers and players |
| `scale=…:flags=lanczos:out_color_matrix=bt709:out_range=tv` | — | RGB→YUV with the HD matrix, limited range |
| `setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv` | — | Tags all four; untagged HD is often decoded as BT.601 → color shift |
| `-crf` | 16-22 (master 18, draft 23) | Quality target; lower = bigger |
| `-preset` | `slow` master, `veryfast` draft | Compression effort |
| `-tune animation` | — | Flat UI areas, sharp edges |
| `-movflags +faststart` | required | Index at the head: playback starts before download ends |
| `-r <fps>` | film fps | Pins the output rate to the capture rate (`-framerate <fps>` in) |

Measured on ffmpeg 9.0.2: the output flags `-color_primaries` / `-color_trc` alone left
primaries/trc "unknown" with libx264; `setparams` on the frames tagged all four. Check
with `ffprobe -show_entries stream=color_space,color_primaries,color_transfer,color_range`.

---

## GIF (one graph, two-pass quality)

```
fps=15,scale=960:-1:flags=lanczos,split[a][b];
[a]palettegen=max_colors=96:stats_mode=diff[p];
[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle
```

| Part | Why |
|------|-----|
| `fps=15` | GIF size grows with frames; 15 fps reads smooth for UI |
| `scale=W:-1:flags=lanczos` | Sharp downscale; lanczos keeps text edges |
| `palettegen stats_mode=diff` | Palette favors what moves, not the static background |
| `max_colors` 64-128 | Fewer colors = smaller, more banding |
| `paletteuse dither=bayer:bayer_scale=5` | Ordered dither: stable across frames (no shimmer) — community convention, not an ffmpeg doc recommendation |
| `diff_mode=rectangle` | Re-encodes only the changed rectangle |
| `-loop 0` | Loops forever |

Option names verified with `ffmpeg -h filter=palettegen` / `filter=paletteuse` (9.0.2).

---

## Motion Blur (master only): subframes + `tmix`

The master is captured with `--subframes S` (4 by default; 1 = none)
samples per film frame, all inside `[k, k+1)`. `blendSubframes` in
[render-cli.md](templates/render-cli.md) averages each group, then the encoders read one
PNG per output frame, so the file still has exactly `DURATION x FPS` frames:

**Choose S from the measured per-frame displacement**, never by default: if any element moves
> ~2 % of W in one frame (slams, flips, fast pushes), use S ≥ 12, never 4 — too few samples
leave 3-6 stepped translucent copies, not a smear. Stepped copies on a master frame = wrong S: re-render.
Above ~10 % of W per frame no S smears it (S = 12 left 10+ copies on a ~20 % W/frame cube exit):
ship the master unblurred (`--subframes 1`) or slow the move in the scene — never ship stepped copies.

```
ffmpeg -framerate <fps×S> -start_number 0 -i frame_%06d.png \
  -vf "tmix=frames=S,select='eq(mod(n\,S)\,S-1)'" -fps_mode passthrough \
  -start_number 0 blend/frame_%06d.png
```

| Rule | Why |
|------|-----|
| `select` keeps the last frame of each group | `tmix` at that frame averages exactly samples `kS … kS+S−1` of film frame k |
| Cuts on frame boundaries | The group never spans a cut ([determinism.md](determinism.md)) |
| Draft and stills: S = 1 | The critic and the G1 stills judge sharp frames (`motion-review` D2 b) |
| Never `minterpolate` | Invented in-between frames, not motion blur |

Tested 2026-10-11 (ffmpeg 9.0.2): 120 samples of a box moving 400 px/s at S = 4 → 30
frames, each smeared over the right 4-sample window; the H.264 file counts 30 frames.
`-fps_mode` replaces `-vsync` in ffmpeg 9.

---

## Byte-Budget Reduction Order

Budgets come from the brief (per surface). When a file is over budget, reduce in this
order and re-measure after each step:

| Step | GIF | MP4 | Floor |
|------|-----|-----|-------|
| 1. fps | 15 → 12 → 10 | keep 30 | Never below 10 fps for UI motion |
| 2. width | 960 → 800 → 720 | 1600 → 1280 | Text still readable at phone width (360-390 px) |
| 3. colors / crf | `max_colors` 96 → 64 | crf +2 | Banding visible → stop |
| 4. duration | cut holds that exceed the reading time, then beats | same | Message intact; holds ≥ 1 s on readable states |

Never silently drop below the brief's legibility floor: if the floor and the budget
conflict, report it and ask.

---

## Common Encode Symptoms

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Colors shift vs browser | Untagged or BT.601 conversion | `out_color_matrix=bt709` + `setparams` tags |
| GIF text shimmer | Error-diffusion dither, odd scale | `dither=bayer`, lanczos, even widths |
| Banding or blotches on large flat fields | Too few colors / high crf | More `max_colors`, lower crf |
| Won't play in Safari/Firefox | Not yuv420p | `-pix_fmt yuv420p` |
| Slow start on the web | moov atom at the end | `-movflags +faststart` |

→ See [render-cli.md](templates/render-cli.md) for the complete encoder code
