---
name: review-pack
description: What the critic reads instead of the source — ffprobe facts first, fixed-time stills, one still per cut segment, contact sheet, peak-diff strip, 390 px phone view, motion energy, cuts + segments, gesture-free runs (0.75 s) and gesture onsets per second (1.5), area-weighted planes per still (value contrast, full bleed, mid-tone, centroid, bleed), opacity-blend windows, drift runs, hard-fail candidates, genre + look copies — why each exists, and the critic-safe checks the sandboxed critic can run itself
when-to-use: Before any critic pass on a draft or master, when a pack item is missing, or when confirming a flags.txt candidate on frames
keywords: review pack, ffprobe, stills, beat stills, contact sheet, strip, phone view, planes, oklch, value contrast, full bleed, mid-tone, centered, bleed, mix, crossfade, drift, psnr, mosaic, freezedetect, cuts, segments, genre, look.md, sandbox
priority: high
related: hard-fails.md, rubric.md, verdict-format.md, templates/review-pack-script.md
---

# Review Pack

## Overview

The critic judges what a viewer sees, so it reads **frames and numbers**, never the brief's
message, the scene code or the builder's notes. The builder's script turns one video into
images and text files that make every hard-fail checkable, each mapped to a timestamp. The
only non-frame inputs are the brief's **genre line** and the **locked look** (`look.md`, `refs.md`,
`board.png`). They are copied into the pack because the critic's Read is sandboxed.

---

## Contents and Purpose

| Item | What it shows | Serves |
|------|---------------|--------|
| `ffprobe.json` | codec, pix_fmt, WxH, fps, frames, colour tags, duration, size | S4, S5, px scale — read **first** |
| `still-0.0/0.5/1.5.png` | Exact frames of the scroll-stop window | F1, X2, X4, hook |
| `still-mid.png`, `still-last.png` | Middle state, end card (hero frames) | F3, F7, F8, X3, cta-hold |
| `beat-NN.png` | One full-size still per state between cuts (max 24) | F2-F5, F7-F10, L2, L4, X1 |
| `contact.png` (4x4) | Whole film at a glance | message, X1, M3, look-consistency |
| `strip-01..12.png`, `strip.png` | 12 frames around the peak diff | D2, D9, M1, motion-behaviours |
| `phone-390.png` | 4 moments at 390 px wide | L2, legibility-phone |
| `planes.txt` | Per still/beat: planes ≥ 20 %, L + share of the two largest, `vc`, `field`, `mid`, `cx`, `bleed`, `centered` | F2, F4, F7, F9, F10 |
| `mix.txt` | Per frame: is it a blend of frames n−4 and n+4 (`alpha`, `resid`, `maxdiff`) | M1, F1 |
| `diff.txt`, `drift.txt`, `spikes.txt` | Per-frame motion energy; sub-threshold motion runs; single-frame jumps | M2, F6, pops |
| `spread.txt`, `energy.txt` | Per-frame luma spread (info); per-second energy | X4, value-contrast score |
| `cuts.txt`, `segments.txt` | Cut timestamps; each state's start/end/duration, last tagged | tempo-grid, L4, cta-hold |
| `freeze.txt` | Gesture-free runs ≥ 0.75 s, the one reaching the end tagged `final-hold` (≤ 1.2 s allowed) | F6 |
| `gestures.txt` | Gesture onsets (diff peaks ≥ 0.5, largest within ±0.25 s) over the body, then `rate= onsets= body=` | F11 |
| `flags.txt` | `F1?` `F2?` `F6?` `F7?` `F9?` `F10?` `F11?` `M1?` `M2?` `X4?`, `missing:` | triage |
| `genre.txt`, `look.md`, `refs.md`, `board.png` | Genre line; locked look | genre rules, L1, look-consistency |
| `frames.txt` | image → frame index → timestamp | frame refs |

### Planes (F2, F4, F7, F9, F10)

Each still is point-sampled (`flags=neighbor`, so area shares stay unbiased) and every pixel
is converted from BT.709 Y'CbCr to **exact OKLab**. Colours within ΔL ≤ 6 and Δab ≤ 0.04 merge
into one plane. `vc` follows the dial: with two planes ≥ 20 %, it is the L gap of the two largest. With one,
it is the gap to the next plane if that one plane is ink (L < 30) or accent (C ≥ 0.08), else 0.
`field` = the largest ink/accent plane share. `mid` = share with L 30-85 and C < 0.03. `cx` = the
horizontal centroid of everything that is not the dominant plane. `bleed` = non-dominant
content touches a side edge on ≥ 2 % of rows. Encoding (4:2:0, limited range) shifts L by ~2,
so the critic judges `vc` 55-65 against the look.md OKLCH values.

### Opacity blends and drift (M1, M2)

`mix.txt` tests whether frame n equals a·frame(n−4) + (1−a)·frame(n+4) at 54 px wide. A dissolve,
a crossfade or an opacity reveal fits (residual ≈ 0). A cut, a wipe, a push or a large move does not.
`drift.txt` lists runs ≥ 1 s where every frame diff is > 0 and ≤ 0.30: a camera push. A true hold
gives an exact 0. `freezedetect=n=0.003:d=0.75` still tags a drift under its tolerance as a freeze (F6).

### Motion density (F6, F11)

`freeze.txt` reuses the frame-diff runs: any run > 0.75 s that does not reach the end is
`F6?`; the `final-hold` run may last up to 1.2 s. `gestures.txt` counts onsets on the same
`diff.txt`: a frame whose diff is ≥ 0.5 and the largest within ±0.25 s. A cut is one peak;
an expo-out arrival is one peak at its start; a counter ticking under a hold stays below
0.5 and does not count. `rate` = onsets ÷ body (t = 0 → start of the final still); under
1.5 is `F11?`. A tiny secondary detail (a 12 px rule) may be under `freezedetect`'s noise
tolerance and read as frozen: confirm F6 on the strip before failing.

---

## Who Builds It

| Actor | Action |
|-------|--------|
| Builder (`motion-expert`) | Runs `bash .motion/review-pack.sh <video>` on the **draft** for every motion/design criterion; on the master only for delivery checks (ffprobe, size vs budget, blur artefacts — a stepped ghost echo is a delivery fail, [hard-fails.md](hard-fails.md) D2 note). Never judge motion on a master pack |
| Critic (`motion-critic`) | Reads the pack; runs only the critic-safe checks below; a missing numeric item → **UNCERTAIN** naming it |

### Critic sandbox (harness `motion` scope, read in `critic-filters.ts`)

Bash verbs `ffprobe`, `ffmpeg`, `ls`, `stat` only, with no pipes. Writes go only inside the review dir.
No `-report`/`-vstats`, no `tee`/`segment`/`hls`/`dash` muxers. No quotes or backslashes in a graph.
Filter whitelist: `scale`, `scale2ref`, `fps`, `select`, `thumbnail`, `crop`, `pad`, `format`,
`setsar`, `setdar`, `setpts`, `trim`, `null`, `split`, `hstack`, `vstack`, `overlay`, `transpose`,
`hflip`, `vflip`, `color`, `metadata`, `psnr`, `ssim` (+ audio/test sources). **Not** allowed:
`signalstats`, `tblend`, `freezedetect`, `lutyuv`, `geq`, `tile`. That is why every number is
built by the script, and why the critic confirms with the visual and `psnr` checks below.
**Known defect (2026-10-12):** the sandbox blocks the critic's Read of its own pack text files (`frames.txt`,
`spikes.txt`, `freeze.txt`) and `review-draft/`. Name it in the verdict as a harness defect (→ UNCERTAIN on
the items it hides); never silently skip the hold/freeze checks.

## Critic-Safe Checks (all tested on ffmpeg 9.0.2)

`V` = video, `R` = `.motion/review`, `T` = seconds.

```bash
# facts
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames:format=duration,size -of json V
# one still at an exact time / at phone width
ffmpeg -y -ss T -i V -frames:v 1 R/still-T.png
ffmpeg -y -ss T -i V -vf scale=390:-2 -frames:v 1 R/phone-T.png
# F2 / F4 / F9 / F10 — mosaic: 27x48 blocks, each 1/1296 of the frame; count plane blocks
ffmpeg -y -ss T -i V -vf scale=27:48:flags=area,scale=540:960:flags=neighbor -frames:v 1 R/mosaic-T.png
# F7 — halves: left half, and right half mirrored; a centered layout gives two near-identical images
ffmpeg -y -ss T -i V -vf crop=iw/2:ih:0:0,scale=270:-2 -frames:v 1 R/left-T.png
ffmpeg -y -ss T -i V -vf crop=iw/2:ih:iw/2:0,hflip,scale=270:-2 -frames:v 1 R/right-T.png
# F6 / M2 — two stills 0.5 s apart inside a freeze run: PSNR inf = frozen; finite (e.g. 28 dB) = something moves (drift, or a detail)
ffmpeg -ss T -i V -ss T2 -i V -frames:v 1 -lavfi psnr -f null -
# F3 / F8 / L2 — type-size band H px tall at row Y; H = 180 or 44, scaled by W/1080
ffmpeg -y -ss T -i V -vf crop=iw:H:0:Y -frames:v 1 R/band-T.png
```

Type-size test: font size ≈ ascender-to-descender height (cap height ≈ 0.7 × size). Compare
cap heights inside the 180 px and the 44 px band. TYPE_SCALE = largest ÷ smallest estimate.
Report estimates, not measured px. M1 on frames: a strip frame that shows both states
at partial value (ghost double image) or an element at half value with no travel.

---

## Frame References

| Form | Example |
|------|---------|
| Timestamp / still | `t=10.23s`, `still-1.5` |
| Beat / strip | `beat-03` (→ `frames.txt`), `strip-07` |
| Contact / phone cell | `contact#9`, `phone#2` |
| Run / cut / spike / line | `freeze 0.00-3.20s`, `seg 02`, `spike@14.50s`, `planes.txt beat-02` |

## Checklist

- [ ] ffprobe read before any image; `genre.txt` read
- [ ] Every `flags.txt` candidate confirmed or rejected on frames
- [ ] look.md / refs.md / board.png read before scoring
- [ ] Every pack item present (missing numeric item → UNCERTAIN)

→ See [review-pack-script.md](templates/review-pack-script.md)
