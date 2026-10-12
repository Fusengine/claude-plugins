---
name: review-pack-script
description: "Complete review-pack builder (.motion/review-pack.sh) — ffprobe facts, contact sheet, fixed-time stills (0.0/0.5/1.5 s, mid, last), one still per cut segment, per-frame diff + spikes, peak strip, 390 px phone view, per-frame lightness spread, per-second motion energy, cuts + segments, gesture-free runs (F6: > 0.75 s, final CTA still > 1.2 s), gesture onsets per second (F11: < 1.5), area-weighted planes per still (value contrast, full-bleed share, mid-tone share, content centroid, bleed), opacity-blend windows (crossfade), drift runs, hard-fail candidates, genre + look copies, frame index"
keywords: review pack, ffprobe, contact sheet, stills, beat stills, tile, tblend, signalstats, scene, freezedetect, frame diff, spikes, strip, phone view, planes, oklch, value contrast, full bleed, mid-tone, centered, bleed, crossfade, dissolve, opacity blend, drift, cuts, segments, flags
---

# Review Pack Script Template

Filters checked on ffmpeg 9.0.2 (`ffmpeg -filters` + real runs): `tile`, `select` (`scene`),
`tblend`, `signalstats` (`YMIN/YMAX/YAVG`), `freezedetect`, `metadata=print:file=`, `scale`
(`flags=area|neighbor`), `format`. Raw frames go through `od` (POSIX) into `awk`.

**Tested** (2026-10-10, density checks 2026-10-11, ffmpeg 9.0.2, `shellcheck -S warning` clean) — see the end of this file.

## Who runs it

| Role | How |
|------|-----|
| `motion-expert` (builder) | Writes `.motion/review-pack.sh` and `.motion/review-pack-lib.sh` (same folder), then `bash .motion/review-pack.sh .motion/out/draft.mp4` before calling the critic, and again on the master |
| `motion-critic` | Never runs it. Its sandbox has no `tile`/`tblend`/`signalstats`/`freezedetect`/`lutyuv`/`geq`, no pipes, no quoted graphs — every number below MUST come from this script; the critic confirms on frames ([review-pack.md](../review-pack.md) §Critic-safe checks) |

## Outputs

| File | Content |
|------|---------|
| `ffprobe.json` | codec, pix_fmt, WxH, fps, counted frames, colour tags, duration, size |
| `contact.png` | 16 evenly spaced frames, 4x4 |
| `still-0.0/0.5/1.5/mid/last.png` | Full-size frames at those times (frame = round(t × fps)) |
| `beat-NN.png` | Full-size mid-segment still of each state between cuts (max 24) |
| `diff.txt`, `spikes.txt` | Per-frame mean \|frame n − frame n−1\| luma; jumps > 3x both neighbours and > 1 |
| `strip-01..12.png`, `strip.png` | 12 frames around the peak diff |
| `phone-390.png` | 4 moments at 390 px wide, stacked |
| `stats.txt`, `spread.txt` | Raw per-frame `signalstats` + `freezedetect`; `frame t ymin ymax spread_L` (luma proxy, info only) |
| `energy.txt` | `second energy_mean energy_max min_spread_L` |
| `cuts-raw.txt`, `cuts.txt`, `segments.txt` | Scene metadata; `cut t=… score=…`; `seg NN start-end dur= frames=` (last tagged `last`) |
| `freeze.txt` | Gesture-free runs ≥ 0.75 s; the run reaching the end tagged `final-hold` |
| `gestures.txt` | `onset frame N t= diff=` per gesture onset over the body, then `rate= onsets= body=` |
| `planes.txt` | Per still/beat: planes ≥ 20 %, OKLCH L + share of the two largest, `vc`, `field`, `mid`, `cx`, `bleed`, `centered` |
| `mix.txt` | Per frame window: `alpha resid changed` — is frame n a blend of frames n−S and n+S? |
| `drift.txt` | Runs ≥ `DRIFT_MIN_S` where every frame diff is non-zero but ≤ `DRIFT_HI` |
| `flags.txt` | `F1?` `F2?` `F6?` `F7?` `F9?` `F10?` `F11?` `M1?` `M2?` `X4?`, `missing:` — or `none` |
| `genre.txt`, `look.md`, `refs.md`, `board.png` | Genre line of the brief; copies of the locked look |
| `frames.txt` | Every image → source frame index → timestamp |

---

## File: `.motion/review-pack.sh`

```bash
#!/usr/bin/env bash
# Builds the review pack the critic reads INSTEAD of the source code.
# Usage:  bash .motion/review-pack.sh <video> [outDir]      (outDir default .motion/review)
# Output: see the Outputs table of review-pack-script.md. Numbers only PROPOSE hard-fails
#         (flags.txt); the critic confirms or rejects each on the frames.
# Needs:  ffmpeg + ffprobe + od + awk. Missing ffmpeg/ffprobe → exit 3 (critic verdict: UNCERTAIN).
# shellcheck disable=SC2034  # PLANE_MIN, CENTER_TOL, W, H are read by review-pack-lib.sh
set -euo pipefail

VIDEO="${1:?usage: review-pack.sh <video> [outDir]}"
OUT="${2:-.motion/review}"
MOTION_DIR="$(dirname "$OUT")"
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then echo "ffmpeg/ffprobe missing" >&2; exit 3; fi
[ -f "$VIDEO" ] || { echo "no such file: $VIDEO" >&2; exit 2; }
rm -rf "$OUT" && mkdir -p "$OUT"
Q=(-hide_banner -loglevel error -y)
FREEZE_NOISE=0.003   # freezedetect n: tolerates x264 noise on a true hold; a drift under it reads as a freeze (F6)
FREEZE_S=0.75        # F6: no gesture-free span longer than this, except the final CTA still
CTA_STILL=1.2        # F6: the final CTA still (run reaching the end) may last up to this
GEST_MIN=0.5         # F11: a gesture onset is a frame-diff peak >= this (YAVG, 320 px) ...
GEST_WIN=0.25        # F11: ... that is the largest diff within +-this many seconds
RATE_MIN=1.0         # F11: gesture onsets per second over the body (t=0 -> final CTA still)
SCENE=0.3            # scene-change threshold for cuts (soft transitions score lower — see M1)
HOOK_WINDOW=1.5      # seconds — ad hook window (X4)
MIN_SPREAD=40        # F1 helper only: a frame 0 whose luma spread is below this is a uniform fill
VALUE_MIN=60         # F2: area-weighted VALUE_CONTRAST floor, OKLCH L points (= look.md dial)
PLANE_MIN=0.20       # a plane counts for F2 when it covers >= 20 % of the frame
FIELD_MIN=0.50       # F10: ink (L < 30) or accent (C >= 0.08) plane share for a full-bleed state
MID_MAX=0.05         # F9: neutral mid-tone (L 30-85, C < 0.03) share of the frame
CENTER_TOL=0.05      # F7: content centroid within +-5 % of W of the centre, nothing bleeding a side edge
MIX_STEP=4           # M1: frame n tested as a blend of frames n-S and n+S
MIX_RESID=0.25       # M1: residual of the best blend below this = opacity blend
DRIFT_HI=0.30        # M2: per-frame diff (YAVG, 320 px) above 0 and at most this = sub-threshold motion
DRIFT_MIN_S=1.0      # M2: run length that makes it a drift, seconds

# 1. Facts first: the critic reads these before looking at a single frame.
ffprobe -v error -select_streams v:0 -count_frames \
	-show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames,color_space,color_range:format=duration,size \
	-of json "$VIDEO" >"$OUT/ffprobe.json"
FRAMES=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$VIDEO")
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$VIDEO")
RANGE=$(ffprobe -v error -select_streams v:0 -show_entries stream=color_range -of csv=p=0 "$VIDEO")
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$VIDEO")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$VIDEO")
ts() { awk -v n="$1" -v r="$FPS" 'BEGIN { split(r, a, "/"); printf "%.2f", n * a[2] / a[1] }'; }
fr() { awk -v t="$1" -v r="$FPS" 'BEGIN { split(r, a, "/"); printf "%d", t * a[1] / a[2] + 0.5 }'; }
DUR=$(ts "$FRAMES")
LAST=$(( FRAMES - 1 )); MID=$(( FRAMES / 2 ))
: >"$OUT/frames.txt"
still() { # still <name> <frame> [outfile]
	ffmpeg "${Q[@]}" -i "$VIDEO" -vf "select='eq(n\,$2)'" -frames:v 1 "${3:-$OUT/still-$1.png}"
	echo "$1 frame $2 t=$(ts "$2")s" >>"$OUT/frames.txt"
}
# planes() and mixes() live next to this script (split under the 200-line hook ceiling).
# shellcheck source=review-pack-lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/review-pack-lib.sh"

# 2. Contact sheet: 16 frames evenly spread over the whole film.
STEP=$(( FRAMES / 16 > 0 ? FRAMES / 16 : 1 ))
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "select='not(mod(n\,$STEP))',scale=480:-2:flags=lanczos,tile=4x4:padding=4:color=0x111111" \
	-frames:v 1 "$OUT/contact.png"
for i in $(seq 0 15); do echo "contact#$((i + 1)) frame $((i * STEP)) t=$(ts $((i * STEP)))s" >>"$OUT/frames.txt"; done

# 3. Fixed-time stills: 0.0 s (scroll-stop frame), 0.5 s, 1.5 s (hook window end), mid, last.
for spec in "0.0:$(fr 0)" "0.5:$(fr 0.5)" "1.5:$(fr 1.5)" "mid:$MID" "last:$LAST"; do
	n="${spec##*:}"; (( n > LAST )) && n=$LAST
	still "still-${spec%%:*}" "$n" "$OUT/still-${spec%%:*}.png"
done

# 4. Motion energy: mean luma of |frame n - frame n-1| (tblend difference -> signalstats YAVG).
#    tblend output frame k = source frames k and k+1; its pts_time is the later source frame's.
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "scale=320:-2:flags=area,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$OUT/diff.txt" \
	-f null -
PEAK=$(awk '/^frame:/ { split($1, a, ":"); n = a[2] } /YAVG/ { split($0, b, "="); if (b[2] + 0 > max) { max = b[2] + 0; p = n } } END { print p + 1 }' "$OUT/diff.txt")
awk -v r="$FPS" 'BEGIN { split(r, f, "/") }
	/^frame:/ { split($1, a, ":"); n = a[2] + 1 } /YAVG/ { split($0, b, "="); d[n] = b[2] + 0; last = n }
	END { for (i = 2; i < last; i++) if (d[i] > 1 && d[i] > 3 * d[i - 1] && d[i] > 3 * d[i + 1])
		printf "spike frame %d t=%.2fs diff=%.2f (prev %.2f, next %.2f)\n", i, i * f[2] / f[1], d[i], d[i - 1], d[i + 1] }' \
	"$OUT/diff.txt" >"$OUT/spikes.txt"
# Drift (M2): every frame diff non-zero but tiny for >= DRIFT_MIN_S — a slow camera/scale push during a hold.
awk -v r="$FPS" -v hi="$DRIFT_HI" -v ms="$DRIFT_MIN_S" 'BEGIN { split(r, f, "/"); fps = f[1] / f[2] }
	function close_run() { if (run && (b - a + 1) / fps >= ms) printf "drift %.2fs-%.2fs dur=%.2fs diff_max=%.3f\n", a / fps, b / fps, (b - a + 1) / fps, mx; run = 0 }
	/^frame:/ { split($1, x, ":"); n = x[2] + 1 }
	/YAVG/ { split($0, v, "="); d = v[2] + 0
		if (d > 0 && d <= hi) { if (!run) { run = 1; a = n; mx = 0 } b = n; if (d > mx) mx = d } else close_run() }
	END { close_run() }' "$OUT/diff.txt" >"$OUT/drift.txt"

# 5. 12-frame strip around the peak, as single frames and as one 6x2 sheet.
START=$(( PEAK - 6 < 0 ? 0 : PEAK - 6 ))
(( START + 12 > FRAMES )) && START=$(( FRAMES - 12 < 0 ? 0 : FRAMES - 12 ))
END=$(( START + 11 ))
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "select='between(n\,$START\,$END)',scale=640:-2:flags=lanczos" -frames:v 12 "$OUT/strip-%02d.png"
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "select='between(n\,$START\,$END)',scale=480:-2:flags=lanczos,tile=6x2:padding=4:color=0x111111" \
	-frames:v 1 "$OUT/strip.png"
for i in $(seq 0 11); do
	printf 'strip-%02d frame %d t=%ss%s\n' $((i + 1)) $((START + i)) "$(ts $((START + i)))" "$([ $((START + i)) -eq "$PEAK" ] && echo ' <- peak diff')" >>"$OUT/frames.txt"
done

# 6. Phone view: what a 390 px wide screen shows, 4 moments stacked vertically.
PSTEP=$(( FRAMES / 4 > 0 ? FRAMES / 4 : 1 ))
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "select='eq(mod(n\,$PSTEP)\,$(( PSTEP / 2 )))',scale=390:-2:flags=lanczos,tile=1x4:padding=6:color=0x111111" \
	-frames:v 1 "$OUT/phone-390.png"
for i in 0 1 2 3; do n=$(( i * PSTEP + PSTEP / 2 )); echo "phone#$((i + 1)) frame $n t=$(ts $n)s" >>"$OUT/frames.txt"; done

# 7. Per-frame luma extremes + freeze runs. flags=area averages pixels (no resampling overshoot).
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "scale=320:-2:flags=area,format=yuv420p,signalstats,freezedetect=n=$FREEZE_NOISE:d=$FREEZE_S,metadata=print:file=$OUT/stats.txt" \
	-f null -
# Luma proxy (info only; F2 uses planes.txt): Y' -> linear (^2.2) -> cube root, x100.
awk -v rg="$RANGE" '
	function L(y,  v) { v = (rg == "pc") ? y / 255 : (y - 16) / 219; if (v <= 0) return 0; if (v > 1) v = 1; return 100 * exp(log(v) * 2.2 / 3) }
	BEGIN { print "frame t ymin ymax spread_L" }
	/^frame:/ { split($1, a, ":"); n = a[2]; split($3, p, ":"); t = p[2] }
	/signalstats.YMIN=/ { split($0, v, "="); lo = v[2] }
	/signalstats.YMAX=/ { split($0, v, "="); printf "%d %.3f %d %d %.1f\n", n, t, lo, v[2], L(v[2]) - L(lo) }' \
	"$OUT/stats.txt" >"$OUT/spread.txt"
awk -v d="$DUR" '/freeze_start=/ { split($0, v, "="); st = v[2] } /freeze_duration=/ { split($0, v, "="); du = v[2] }
	/freeze_end=/ { split($0, v, "="); printf "freeze %.2fs-%.2fs dur=%.2fs%s\n", st, v[2], du, (v[2] >= d - 0.1 ? " final-hold" : ""); st = "" }
	END { if (st != "") printf "freeze %.2fs-%.2fs dur=%.2fs final-hold\n", st, d, d - st }' "$OUT/stats.txt" >"$OUT/freeze.txt"
# Gesture onsets (F11): diff peaks >= GEST_MIN that are the largest within +-GEST_WIN, counted
# over the body (t=0 -> start of the final-hold run, else the whole film). A cut is one onset.
awk -v r="$FPS" -v g="$GEST_MIN" -v win="$GEST_WIN" -v dur="$DUR" -v fz="$OUT/freeze.txt" '
	BEGIN { split(r, f, "/"); fps = f[1] / f[2]; W = int(win * fps + 0.5); body = dur }
	FILENAME == fz && /final-hold/ { split($2, a, "-"); sub("s$", "", a[1]); body = a[1] + 0 }
	FILENAME != fz && /^frame:/ { split($1, x, ":"); n = x[2] + 1 }
	FILENAME != fz && /YAVG/ { split($0, v, "="); d[n] = v[2] + 0; if (n > last) last = n }
	END { for (i = 1; i <= last; i++) { if (d[i] < g || i / fps >= body) continue; pk = 1
			for (j = i - W; j <= i + W && pk; j++) if (j != i && j >= 1 && j <= last && ((j < i && d[j] >= d[i]) || (j > i && d[j] > d[i]))) pk = 0
			if (pk) { k++; printf "onset frame %d t=%.2fs diff=%.2f\n", i, i / fps, d[i] } }
		printf "rate=%.2f onsets=%d body=%.2fs\n", (body > 0 ? k / body : 0), k, body }' "$OUT/freeze.txt" "$OUT/diff.txt" >"$OUT/gestures.txt"
awk 'FNR == 1 { file++ }
	file == 1 && /^frame:/ { split($3, p, ":"); s = int(p[2]) }
	file == 1 && /YAVG=/ { split($0, v, "="); e[s] += v[2]; c[s]++; if (v[2] + 0 > mx[s]) mx[s] = v[2] + 0; if (s > m) m = s }
	file == 2 && FNR > 1 { s = int($2); if (!(s in ms) || $5 < ms[s]) ms[s] = $5; if (s > m) m = s }
	END { print "second energy_mean energy_max min_spread_L"; for (i = 0; i <= m; i++)
		printf "%d %.3f %.3f %s\n", i, (c[i] ? e[i] / c[i] : 0), mx[i], ((i in ms) ? ms[i] : "-") }' \
	"$OUT/diff.txt" "$OUT/spread.txt" >"$OUT/energy.txt"

# 8. Cuts (scene changes) and the states between them -> tempo grid, length per state.
ffmpeg "${Q[@]}" -i "$VIDEO" -vf "scale=320:-2,select='gt(scene\,$SCENE)',metadata=print:file=$OUT/cuts-raw.txt" -f null -
awk '/^frame:/ { split($3, p, ":"); t = p[2] } /scene_score=/ { split($0, v, "="); printf "cut t=%.3fs score=%.2f\n", t, v[2] }' \
	"$OUT/cuts-raw.txt" >"$OUT/cuts.txt"
awk -v d="$DUR" -v r="$FPS" 'BEGIN { split(r, f, "/"); fps = f[1] / f[2]; b[0] = 0; k = 1 }
	{ sub("t=", "", $2); sub("s$", "", $2); b[k++] = $2 + 0 }
	END { b[k] = d; for (i = 0; i < k; i++) { du = b[i + 1] - b[i]
		printf "seg %02d %.3f-%.3fs dur=%.3fs frames=%d%s\n", i + 1, b[i], b[i + 1], du, du * fps + 0.5, (i == k - 1 ? " last" : "") } }' \
	"$OUT/cuts.txt" >"$OUT/segments.txt"
i=0
while read -r _ id range _; do
	i=$((i + 1)); (( i > 24 )) && break
	s="${range%%-*}"; e="${range#*-}"; e="${e%s}"
	n=$(fr "$(awk -v s="$s" -v e="$e" 'BEGIN { printf "%.3f", (s + e) / 2 }')"); (( n > LAST )) && n=$LAST
	still "beat-$id" "$n" "$OUT/beat-$id.png"
done <"$OUT/segments.txt"

# 9. Planes per still/beat (F2, F7, F9, F10) — planes() in review-pack-lib.sh.
: >"$OUT/planes.txt"
for f in "$OUT"/still-*.png "$OUT"/beat-*.png; do
	name="$(basename "$f" .png)"
	planes "$f" "$name" "$(awk -v k="$name" '$1 == k { sub("t=", "", $4); print $4; exit }' "$OUT/frames.txt")" >>"$OUT/planes.txt"
done

# 10. Opacity blends (M1): is frame n a mix a*A + (1-a)*B of frames n-S and n+S? A dissolve, a
#     crossfade or an opacity-only reveal is (residual ~ 0); a cut, a wipe, a push or a slide is not.
mixes >"$OUT/mix.txt"   # review-pack-lib.sh

# 11. Look + genre copies, so the sandboxed critic can read them from the pack.
for f in look.md refs/refs.md refs/board.png; do
	if [ -f "$MOTION_DIR/$f" ]; then cp "$MOTION_DIR/$f" "$OUT/$(basename "$f")"; fi
done
if [ -f "$MOTION_DIR/brief.md" ]; then grep -m1 -iE '^[[:space:]]*genre:' "$MOTION_DIR/brief.md" >"$OUT/genre.txt" || true; fi

# 12. Hard-fail candidates (numbers only; the critic confirms or rejects each on the frames).
{
	for f in look.md refs.md board.png genre.txt; do [ -s "$OUT/$f" ] || echo "missing: $f"; done
	awk -v t="$MIN_SPREAD" 'NR == 2 && $5 < t { print "F1? frame 0 spread_L=" $5 " (uniform open)" }' "$OUT/spread.txt"
	awk -v lo=0.15 -v hi=0.85 -v rx="$MIX_RESID" 'NR > 1 && $3 >= lo && $3 <= hi && $4 < rx && $2 <= 0.3 { printf "F1? frame 0 not at full value: opacity blend from t=%.2fs (mix.txt)\n", $2; exit }' "$OUT/mix.txt"
	awk -v v="$VALUE_MIN" '$8 != "vc=na" { x = $8; sub("vc=", "", x); if (x + 0 < v) printf "F2? %s %s %s %s %s %s %s\n", $1, $2, $3, $4, $5, $6, $8 }' "$OUT/planes.txt"
	awk -v r="$FPS" -v s="$FREEZE_S" -v c="$CTA_STILL" 'BEGIN { split(r, f, "/"); tol = f[2] / f[1] }
		{ x = $3; sub("dur=", "", x); sub("s$", "", x)
		  if ($NF != "final-hold" && x + 0 > s + tol) print "F6? gesture-free " $2 " (" $3 " > " s "s)"
		  if ($NF == "final-hold" && x + 0 > c + tol) print "F6? final CTA still " $2 " (" $3 " > " c "s)" }' "$OUT/freeze.txt"
	awk -v m="$RATE_MIN" '/^rate=/ { split($1, a, "="); if (a[2] + 0 < m) print "F11? under-animated " $0 " (< " m "/s)" }' "$OUT/gestures.txt"
	awk '($1 ~ /^beat-/ || $1 == "still-0.0" || $1 == "still-mid" || $1 == "still-last") && $NF == "centered=yes" { printf "F7? %s %s centered (%s %s)\n", $1, $2, $11, $12 }' "$OUT/planes.txt"
	awk -v m="$MID_MAX" '{ x = $10; sub("mid=", "", x); if (x + 0 > m) printf "F9? %s %s neutral mid-tone %s\n", $1, $2, $10 }' "$OUT/planes.txt"
	awk -v fm="$FIELD_MIN" '$1 ~ /^beat-/ { nb++; x = $9; sub("field=", "", x); if (x + 0 >= fm) nf++ }
		END { need = int((nb + 2) / 3); if (nb && nf < need) printf "F10? full-bleed states %d of %d (need %d)\n", nf, nb, need }' "$OUT/planes.txt"
	awk -v lo=0.15 -v hi=0.85 -v rx="$MIX_RESID" -v S="$MIX_STEP" '
		function out() { if (run) printf "M1? opacity blend %.2fs-%.2fs (%d windows, min resid %.3f)\n", a, b, k, mr; run = 0 }
		NR > 1 { hit = ($3 >= lo && $3 <= hi && $4 < rx) }
		NR > 1 && hit { if (run && $1 - lf > S) out(); if (!run) { run = 1; a = $2; k = 0; mr = 9 } b = $2; lf = $1; k++; if ($4 < mr) mr = $4 }
		END { out() }' "$OUT/mix.txt"
	sed 's/^/M2? /' "$OUT/drift.txt"
	awk -v w="$HOOK_WINDOW" '{ sub("t=", "", $2); sub("s$", "", $2); if ($2 + 0 <= w) hit = 1 } END { if (!hit) print "noCut" }' "$OUT/cuts.txt" |
		grep -q noCut && awk -v w="$HOOK_WINDOW" 'NR > 1 && $1 < w && $3 > m { m = $3 } END { if (m < 0.5) printf "X4? no cut and energy_max %.2f < 0.5 in 0-%.1fs\n", m, w }' "$OUT/energy.txt"
} >"$OUT/flags.txt"
[ -s "$OUT/flags.txt" ] || echo "none" >"$OUT/flags.txt"

echo "review pack → $OUT  (frames=$FRAMES fps=$FPS range=$RANGE peak=$PEAK t=$(ts "$PEAK")s)"
```

## File: `.motion/review-pack-lib.sh` (sourced by the script above)

```bash
#!/usr/bin/env bash
# Functions of .motion/review-pack.sh, split out to keep each file under the hook's
# 200-line ceiling. Sourced, never run: reads the caller's globals (Q, VIDEO, W, H, RANGE,
# FPS, PLANE_MIN, CENTER_TOL, MIX_STEP).
# shellcheck disable=SC2154  # globals are set by review-pack.sh before sourcing

# Planes per still/beat (F2, F7, F9, F10). Point-sampled (neighbor) so areas stay unbiased;
# every pixel -> exact OKLab from BT.709 Y'CbCr; colours clustered into planes (dL <= 6, dab <= 0.04).
planes() { # planes <png> <label> <t>
	local AW AH
	if (( W > H )); then AW=480; else AW=270; fi
	AH=$(( H * AW / W / 2 * 2 ))
	ffmpeg "${Q[@]}" -i "$1" -vf "scale=$AW:$AH:flags=neighbor,format=yuv444p" -f rawvideo - | od -An -v -tu1 |
	awk -v w="$AW" -v h="$AH" -v rg="$RANGE" -v img="$2" -v t="$3" -v pmin="$PLANE_MIN" -v tol="$CENTER_TOL" '
	function lin(c) { return c <= 0.04045 ? c / 12.92 : exp(2.4 * log((c + 0.055) / 1.055)) }
	function cb3(x) { return x <= 0 ? 0 : exp(log(x) / 3) }
	function cl(x) { return x < 0 ? 0 : (x > 1 ? 1 : x) }
	function ab(x) { return x < 0 ? -x : x }
	function lab(y, u, v,   k, Y, pb, pr, r, g, b, l, m, s) {
		k = y "," u "," v; if (k in LL) return k
		if (rg == "pc") { Y = y / 255; pb = (u - 128) / 255; pr = (v - 128) / 255 } else { Y = (y - 16) / 219; pb = (u - 128) / 224; pr = (v - 128) / 224 }
		r = lin(cl(Y + 1.5748 * pr)); g = lin(cl(Y - 0.1873 * pb - 0.4681 * pr)); b = lin(cl(Y + 1.8556 * pb))
		l = cb3(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
		m = cb3(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
		s = cb3(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
		LL[k] = 100 * (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s)
		AA[k] = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
		BB[k] = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
		return k
	}
	BEGIN { n = w * h }
	{ for (j = 1; j <= NF; j++) { pl = int(i / n); p = i % n; i++
		if (pl == 0) Yv[p] = $j; else if (pl == 1) Uv[p] = $j
		else { k = lab(Yv[p], Uv[p], $j); c = sqrt(AA[k] ^ 2 + BB[k] ^ 2)
			if (LL[k] >= 30 && LL[k] <= 85 && c < 0.03) mid++
			bk = int(LL[k] / 3) "," int((AA[k] + 0.5) / 0.02) "," int((BB[k] + 0.5) / 0.02)
			pix[p] = bk; cnt[bk]++; bL[bk] = LL[k]; bA[bk] = AA[k]; bB[bk] = BB[k] } } }
	END {
		while (np < 8) { best = ""; bc = 0
			for (b in cnt) if (!(b in own) && cnt[b] > bc) { bc = cnt[b]; best = b }
			if (best == "" || bc < 0.005 * n) break
			np++; sL[np] = bL[best]; sA[np] = bA[best]; sB[np] = bB[best]; sh[np] = 0
			for (b in cnt) if (!(b in own) && ab(bL[b] - sL[np]) <= 6 && sqrt((bA[b] - sA[np]) ^ 2 + (bB[b] - sB[np]) ^ 2) <= 0.04) { own[b] = np; sh[np] += cnt[b] / n } }
		t1 = t2 = 0; n20 = 0; field = 0
		for (q = 1; q <= np; q++) { if (sh[q] >= pmin) n20++
			dk[q] = (sL[q] < 30 || sqrt(sA[q] ^ 2 + sB[q] ^ 2) >= 0.08); if (dk[q] && sh[q] > field) field = sh[q]
			if (!t1 || sh[q] > sh[t1]) { t2 = t1; t1 = q } else if (!t2 || sh[q] > sh[t2]) t2 = q }
		if (n20 >= 2) vc = sprintf("%.1f", ab(sL[t1] - sL[t2]))
		else if (n20 == 1) vc = (dk[t1] && t2) ? sprintf("%.1f", ab(sL[t1] - sL[t2])) : "0.0"
		else vc = "na"
		for (p = 0; p < n; p++) if (own[pix[p]] != t1) { x = p % w; cs++; sx += x
			if (x == 0 || x == w - 1) edge[int(p / w)] = 1 }
		for (y in edge) bl++
		cx = cs ? sx / cs / (w - 1) : 0.5; bleed = (bl / h >= 0.02) ? "yes" : "no"
		cen = (cs / n >= 0.003 && ab(cx - 0.5) < tol && bleed == "no") ? "yes" : "no"
		printf "%s t=%s planes20=%d L1=%.1f s1=%.2f L2=%s s2=%s vc=%s field=%.2f mid=%.3f cx=%.3f bleed=%s centered=%s\n", img, t, n20,
			sL[t1], sh[t1], (t2 ? sprintf("%.1f", sL[t2]) : "-"), (t2 ? sprintf("%.2f", sh[t2]) : "-"), vc, field, mid / n, cx, bleed, cen }'
}

# Opacity blends (M1): is frame n a mix a*A + (1-a)*B of frames n-S and n+S? A dissolve, a
# crossfade or an opacity-only reveal is (residual ~ 0); a cut, a wipe, a push or a slide is not.
mixes() { # mixes > mix.txt
	local CW CH
	if (( W > H )); then CW=96; else CW=54; fi
	CH=$(( H * CW / W / 2 * 2 ))
	ffmpeg "${Q[@]}" -i "$VIDEO" -vf "scale=$CW:$CH:flags=area,format=gray" -f rawvideo - | od -An -v -tu1 |
	awk -v n=$(( CW * CH )) -v S="$MIX_STEP" -v r="$FPS" '
		function ab(x) { return x < 0 ? -x : x }
		function test(fr,   a, m, b, p, D, R, dd, rd, c, mx, al, e) {
			a = (fr - 2 * S) % K; m = (fr - S) % K; b = fr % K; dd = rd = c = mx = 0
			for (p = 0; p < n; p++) { D = buf[b, p] - buf[a, p]; if (ab(D) > 4) { R = buf[m, p] - buf[a, p]; dd += D * D; rd += R * D; c++ }; if (ab(D) > mx) mx = ab(D) }
			if (c < 0.002 * n || mx < 16) return   # a drift moves blocks by <= 8 levels over 2S frames; a fade by >= 18
			al = rd / dd; e = 0
			for (p = 0; p < n; p++) { D = buf[b, p] - buf[a, p]; if (ab(D) > 4) { R = buf[m, p] - buf[a, p]; e += (R - al * D) ^ 2 } }
			printf "%d %.3f %.2f %.3f %.3f %d\n", fr - S, (fr - S) / fps, al, sqrt(e / dd), c / n, mx }
		BEGIN { split(r, f, "/"); fps = f[1] / f[2]; K = 2 * S + 1; print "frame t alpha resid changed maxdiff" }
		{ for (j = 1; j <= NF; j++) { fr = int(i / n); p = i % n; buf[fr % K, p] = $j; i++; if (p == n - 1 && fr >= 2 * S) test(fr) } }'
}
```

## Test record

2026-10-10, ffmpeg 9.0.2, macOS `od`/`awk`, `shellcheck -S warning` clean. Synthetic 1080x1920
30 fps clips built with lavfi (`color`, `overlay`, `fade=alpha=1`, `xfade`, and `perspective`
`eval=frame` for a smooth sub-pixel camera push). Type is drawn as solid bars, because this
ffmpeg build has no `drawtext`. Each 6-8 s clip took 5-8 s to process.

| Clip | Candidates raised (`flags.txt`) |
|------|----------------------------------|
| Rejected-ad replica (blank open, fade-ups, centered small blue tiles on `#fbfcfe`, push 1.000→1.035) | `F1?` ×2 (uniform open; blend from 0.23 s), `F2?` on every still (`vc=0.0`, lone paper plane L 98.6 at 93-100 %), `F6?` 2.63-4.23 s and 5.93-7.87 s, `F7?` (cx 0.500, no bleed), `F10?` 0 of 1, `M1?` ×4 (min resid 0.004-0.071), `M2?` 1.83-4.20 s and 5.03-7.97 s (diff ≤ 0.079) |
| Same ad after the 4-line patch | `F1?`, `F6?` and the 34 px bar are gone. `F2?`, `F7?`, `F10?`, `M1?` and `M2?` remain. |
| Good film (ink / paper / accent full fields, bleeding bars, hard cuts, 2 s CTA hold) | `F2?` only on `beat-03`: `#0000b6` field (L 36.8) + paper bar (L 94.8) gives `vc=58.0`. True OKLCH gives 60.2, so 4:2:0 + limited range lost ~2 L. Borderline: the critic decides from look.md values. |
| Same good film with an orange `#ff4a1c` accent | `F2?` on the accent beat (`vc=26.8`) and on the CTA (accent pill on ink, 50.7). This is a correct catch: paper type on L 67 orange cannot reach 60. |
| `xfade` dissolve / wipe / push between ink and paper states | Dissolve: `M1?` 1.43-1.97 s (resid 0.001), plus `F9?` on the mid-dissolve frame (43 % mid-grey). Wipe: none. Push: none. |

Split (2026-10-11): `planes()` and `mixes()` moved to `review-pack-lib.sh` so each file stays
under the hook's 200-line ceiling (198 + 78 lines); both `shellcheck -S warning` clean; on
both test clips `planes.txt`, `mix.txt`, `flags.txt`, `gestures.txt`, `freeze.txt` are
byte-identical to the single-file run.

Density (2026-10-11, same toolchain, `shellcheck -S warning` clean): a 6 s 1080x1920 clip with
an accent block moving on every half-beat until 5.0 s, then still → `freeze 5.00-6.00s final-hold`,
`rate=2.00 onsets=10 body=5.00s`, no `F6?`/`F11?`. An 8 s clip moving every 1.5 s with a 2 s end
still → four `F6?` gesture-free runs of 1.23 s, `F6? final CTA still 2.00s`, and
`F11? rate=0.67`.

Calibration: during a drift, every frame diff was 0.017-0.03 (never 0), and a 2·S window changed
blocks by ≤ 8 levels. During a real fade, the same window changed blocks by ≥ 18 levels. That
gap is why M1 needs `maxdiff ≥ 16`. Critic-side check: the `psnr` of two stills 1 s apart was
28.2 dB inside the drift and `inf` inside a true hold.

## Adapting

| Change | How |
|--------|-----|
| Very long film | Contact `tile=6x6` + `FRAMES / 36`; raise the 24-beat cap |
| Soft transitions missed as cuts | Lower `SCENE`; an opacity blend is M1 anyway (`mix.txt`) |
| Freeze sensitivity | `FREEZE_NOISE` 0.003 (one value, here only); a drift under it reads as a freeze (F6), over it as `drift.txt` (M2) |
| Onset sensitivity | `GEST_MIN` 0.5 and `GEST_WIN` 0.25 s; a primary gesture on a 300 px block scored ≥ 1; a 12 px rule drawing scores less and is not counted (it is secondary) |
| Master with motion blur | Run the pack on the draft (sharp frames); blurred master frames smear `mix.txt` and `diff.txt` peaks |
| Full-range source | `RANGE` comes from ffprobe; `unknown` is treated as limited (16-235) — verify for screen captures |
| `X4?` energy floor | `0.5` mean-diff units at 320 px; a small UI move scores ~0.2 — verify on the hook stills |
| Planes on a real screenshot crop | `planes20=0` → `vc=na`: the critic judges the beat (screenshot crops are not hero frames) |
| Spike sensitivity | `3 *` ratio and `> 1` floor in step 4 |
| Several peaks to inspect | Re-run step 5 with another `START` from `spikes.txt` |
