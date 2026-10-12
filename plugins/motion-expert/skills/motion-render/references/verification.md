---
name: verification
description: Verifying the delivered FILE after a master render — ffprobe facts, exact frame count, byte budgets, SSIM against the approved stills, frame-diff spike scan, color tags — and what counts as proof
when-to-use: After every master render, before any "done" claim, and whenever a file is re-encoded or reduced
keywords: verification, ffprobe, frames, budget, ssim, stills, spikes, color tags, proof
priority: high
related: stages-budgets.md, encoding.md, determinism.md, templates/render-cli.md
---

# Verification

## Overview

A render that "finished" proves nothing. The proof is measured on the **delivered file**
(not on the frames, not on the scene): what a player will decode. The render CLI runs
these checks after `--stage master` and exits 1 with the list of problems; the review
pack in `motion-review` repeats the ffprobe facts for the critic.

---

## The Checks

| # | Check | Command / source | Pass |
|---|-------|------------------|------|
| 1 | Codec | `ffprobe … stream=codec_name` | `h264` |
| 2 | Pixel format | `stream=pix_fmt` | `yuv420p` |
| 3 | Size | `stream=width,height` | Brief's WxH (even numbers) |
| 4 | Frame rate | `stream=r_frame_rate` | Brief's fps (e.g. `30/1`) |
| 5 | Frame count | `-count_frames … nb_read_frames` | **Exactly** `round(DURATION x FPS)` |
| 6 | Duration | `format=duration` | `DURATION` (± one frame) |
| 7 | Byte budget | file size | ≤ brief budget per surface |
| 8 | Look unchanged since G1 | SSIM of the unblurred sample at each still time (subframe 0) vs `still-i.png` | ≥ 0.95 (template threshold) |
| 9 | Color tags | `stream=color_space,color_primaries,color_transfer,color_range` | `bt709` x3, `tv` |
| 10 | No single-frame jumps | review pack `spikes.txt` | Only the cuts the beat map declares |

Checks 1-8 run inside the render CLI; 9 and 10 are one command each (below).

---

## Commands

```bash
# 1-6: facts of the file
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames:format=duration \
  -of json .motion/out/master.mp4

# 9: color tags
ffprobe -v error -select_streams v:0 \
  -show_entries stream=color_space,color_primaries,color_transfer,color_range \
  -of compact .motion/out/master.mp4

# 10: spikes (and the whole review pack)
bash .motion/review-pack.sh .motion/out/master.mp4 && cat .motion/review/spikes.txt
```

---

## Why Each Check Exists

| Check | Failure it catches |
|-------|--------------------|
| Frame count | Dropped/duplicated frames, wrong fps on input, a `--jobs` chunk missing or overlapping |
| pix_fmt | A file that plays locally and fails in browsers |
| SSIM vs stills | A scene edited after G1 without re-approval; wrong time mapping; color pipeline drift |
| Spikes | Layout jumps (a line wrapping, a font swap), a missed frame, a handoff pop |
| Color tags | Washed-out or shifted colors on some players |
| Budget | GitHub limits, slow pages |

The SSIM threshold is a template default (an H.264 master of a held frame measured
≈ 0.998 against its PNG still); a lower score on a **held** frame means the content
changed — investigate, do not lower the threshold.

---

## Spike Scan

The review pack computes, for every frame, the mean luma difference with the previous one
(`tblend=all_mode=difference` + `signalstats`), and flags frames whose difference is more
than 3x **both** neighbours. Smooth motion produces a ramp; a jump produces a lone spike.

Measured on a real 21 s demo: one spike at 14.50 s — a status line wrapping onto a second
row during a window resize (a layout jump, invisible in stills). Hard cuts are spikes by
nature: tick them off against the beat map, fix the rest in the scene.

---

## What Is Not Proof

| Not proof | Why |
|-----------|-----|
| "ffmpeg exited 0" | It happily writes a wrong-length or wrong-format file |
| A recent mtime | Shows a file was touched, not that the defect is gone |
| Checking frames instead of the file | The encoder can still drop, retime or recolor |
| One watched playback | Misses single-frame jumps and frame-count errors |

---

## Reporting

Report: file paths, ffprobe facts, frame count vs expected, sizes vs budgets, SSIM per
still, spikes (with timestamps, cut or bug), color tags, renders per stage + wall time.
Then hand the "done" claim to the challenger; scripts go to sniper.

→ See [render-cli.md](templates/render-cli.md) (checks 1-8 in code)
