---
name: audio
description: Music and sound for films — licensed royalty-free tracks around 120 BPM, the beat grid measured from the actual song (ffmpeg kick-band RMS + awk), start on a downbeat, key action on the drop, pre-drop low-pass, SFX placed by measured peak, loudness at -14 LUFS, muxing, and silent cuts for muted surfaces
when-to-use: The brief asks for sound, or a film will be posted where audio plays (social, landing with sound, slides)
keywords: audio, music, sfx, bpm, drop, lowpass, loudnorm, lufs, ebur128, aac, mux, license
priority: medium
related: encoding.md, delivery-github.md, verification.md
---

# Audio

## Overview

Most product films are watched muted (autoplay requires it), so sound is an enhancement,
never a carrier of the message. Source: field template (ultimaxbt, 2026-10-07) — the
values below are field-reported; the ffmpeg commands were run on ffmpeg 9.0.2 with
synthetic inputs (sine + noise), not on a real track.

---

## Music

| Rule | Why |
|------|-----|
| Royalty-free track, license noted in `.motion/assets.json` | Provenance like any asset; no license → no track |
| Check the license page itself (e.g. Mixkit states free commercial use — verify) | Licenses change; the page at download time is the proof |
| A track around 120 BPM | 0.5 s beats and 0.25 s subdivisions: the density grid of `motion-craft` timing-holds |
| Beat grid **measured** from the song (below), never assumed | A track labelled 120 BPM still starts its first kick wherever it starts |
| Start on a downbeat | Trim the track so its first downbeat is film t = 0 (`-ss <first>`); every cut sits on a beat, every UI hit on a beat or half-beat |
| Key action on the drop | The single most important motion lands on the strongest musical moment |
| Pre-drop low-pass, open on the drop | Muffled build → full spectrum on the hit: the drop feels bigger with no volume change |

## Sourcing (the agent finds the track — never the owner)

An `ad`, or any film for a surface where sound plays, gets music by default. The owner is
never asked to find a track; they are asked to **pick** one.

1. **Search** royalty-free libraries with a license page per track (e.g. Mixkit, Pixabay Music — use `browser_serp_batch` / `browser_fetch`), with the look's tone as the query (e.g. "minimal electronic 120 bpm punchy").
2. **Filter**: ≥ the film's duration, a clear drop or accent, no vocals over on-screen text, ~110-130 BPM.
3. **Verify the license page itself** for each candidate: commercial use in ads allowed, attribution required or not, no Content ID claim. Quote the clause and the date read. No clause found → drop the candidate.
4. **Offer 3 candidates** as ONE question (Ask): title, artist, page URL, duration, stated BPM, the license clause quoted, why it fits the look. Downloading a file needs the owner's go, so the pick IS that go.
5. **After the pick**: download into `.motion/assets/audio/`, record `file`, `url`, `license_url`, `license_clause`, `read_at`, `sha256` in `assets.json`, measure the beat grid (below), re-time `beats.md` on it. A re-timed beat map means new stills and a new G1.
6. **Download automatically — never hand it to the owner.** A plain HTTP fetch of the track page may get a 403; open the page in a real browser session instead (fuse-browser `browser_navigate`, or the lead's browser) and read the audio file URL the page itself embeds for its player. Pixabay (verified 2026-10-11): the page HTML holds `https://cdn.pixabay.com/download/audio/<yyyy>/<mm>/<dd>/audio_<id>.mp3?filename=<slug>.mp3`; `curl -sL -e https://pixabay.com/ -o .motion/assets/audio/<slug>.mp3 '<that URL>'` → 200, `audio/mpeg`. Check `file` + `ffprobe` duration, then step 5. Only a CAPTCHA or a login wall stops this — never solve or bypass one; then ask the lead to fetch it, and prefer direct-download libraries when shortlisting.

Silent cut only when the owner says "no music", or every surface is muted-only (README GIF). A missing track is never a reason to ship silent without saying so.

## Beat Pulse (picture hits the kick)

With a track, the picture **pulses on the measured kicks** — the viewer must see the beat,
not only hear it. The owner's words: "il manque des effets de pulse avec la vidéo".

| Rule | Value |
|------|-------|
| Where | Every measured kick (or every 2nd on a dense track) inside a hold, on the element that holds the eye: the actor, the display word, the active object |
| Shape | A **scale punch** 2-4 % (or a 1-3 % position nudge on the beat axis), attack ≤ 2 frames on the kick, settle with a spring ζ ≥ 0.85 in ≤ 0.2 s |
| Accent hits | On the drop and on accented kicks: a cut, a field flip (ink ↔ accent ↔ paper), a 3D face turn, a type slam — never the same accent twice in a row |
| Source | Kick times from the beat-grid measurement above (`O[]`), written into `beats.md`; the scene reads them, never a hard-coded BPM guess |
| Banned | Opacity/brightness pulses, glow or bloom pulses, blur pulses, a continuous wobble (D2/D3/M2); a punch > 4 % or with > 1 oscillation (D9) |

A pulse counts as a gesture onset (F11) and breaks a gesture-free span (F6). It is not M3:
M3 is a camera zoom held in then pulled back; a ≤ 4 % punch settling in ≤ 0.2 s on a
measured kick is a beat hit.

## Sound Effects

| Rule | Why |
|------|-----|
| One SFX per event, never a bed of clicks | Each sound marks one visual event; overlapping clicks smear into noise and the viewer can no longer tie a sound to its event |
| Position by the **measured peak**, not the file start | Most SFX have silence/attack before the hit; aligning the start makes it late |
| Peak lands on the frame of the visual event | Audible desync starts at a few frames |

---

## Measure the Beat Grid (ffmpeg + awk)

Kick-band RMS every 10 ms, onsets where it crosses (max − 12 dB) upward at least 0.2 s
apart, beat = median onset interval. Tested 2026-10-11 on a synthetic 120 BPM kick track
with its first kick at 0.13 s over noise: `onsets=20 beat=0.500s bpm=120.0 first=0.130s`.

```bash
ffmpeg -hide_banner -nostats -loglevel error -i music.wav \
  -af "lowpass=f=150,asetnsamples=n=480,astats=metadata=1:reset=1:measure_overall=RMS_level:measure_perchannel=none,ametadata=print:file=rms.txt" \
  -f null -
awk '/pts_time/ { split($3, a, ":"); t = a[2] } /RMS_level/ { split($0, b, "="); v = b[2]; if (v == "-inf") v = -120; n++; T[n] = t; V[n] = v + 0; if (n == 1 || v + 0 > mx) mx = v + 0 }
  END { th = mx - 12; for (i = 2; i <= n; i++) if (V[i] >= th && V[i-1] < th && (k == 0 || T[i] - O[k] > 0.2)) O[++k] = T[i]
    for (i = 2; i <= k; i++) D[i-1] = O[i] - O[i-1]; m = k - 1
    for (i = 1; i <= m; i++) for (j = i + 1; j <= m; j++) if (D[j] < D[i]) { x = D[i]; D[i] = D[j]; D[j] = x }
    beat = D[int((m + 1) / 2)]; printf "onsets=%d beat=%.3fs bpm=%.1f first=%.3fs\n", k, beat, 60 / beat, O[1] }' rms.txt
```

Write `bpm` and `first` into `beats.md` (`music:` line) and `look.md` tempo; set `BPM` in
the scene from the measured value. On a real track, listen at `first`: if it is an
up-beat, move to the next bar line. Then place every SFX by its own measured peak (below).

## Commands (verified option names, ffmpeg 9.0.2)

```bash
# 1. Measure where the SFX peaks (10 ms windows at 48 kHz), in seconds from file start
ffmpeg -hide_banner -nostats -loglevel error -i sfx.wav \
  -af "asetnsamples=n=480,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level:file=peaks.txt" \
  -f null -
PEAK=$(awk '/pts_time/ { split($3, a, ":"); t = a[2] } /Peak_level/ { split($0, b, "="); v = b[2] + 0;
  if (!seen || v > m) { m = v; p = t; seen = 1 } } END { print p }' peaks.txt)

# 2. Delay so the peak hits the event at EVENT seconds
DELAY=$(awk -v d="$EVENT" -v p="$PEAK" 'BEGIN { printf "%d", (d - p) * 1000 }')

# 3. Low-pass the music until the drop, add the SFX, normalize to -14 LUFS
ffmpeg -y -i music.wav -i sfx.wav -filter_complex \
  "[0:a]lowpass=f=800:enable='lt(t,$DROP)'[m];[1:a]adelay=delays=$DELAY:all=1[s];[m][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map "[a]" -ar 48000 mix.wav

# 4. Measure the result: integrated loudness ≈ -14 LUFS, true peak ≤ -1 dBFS
ffmpeg -hide_banner -nostats -i mix.wav -af ebur128=framelog=quiet:peak=true -f null - 2>&1 | grep -E " I:| LRA:| Peak:"

# 5. Mux without re-encoding the video
ffmpeg -y -i .motion/out/master.mp4 -i mix.wav -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart .motion/out/master-music.mp4
```

| Step | Note |
|------|------|
| `lowpass … enable=` | `lowpass` supports timeline editing (`T` flag in `ffmpeg -filters`): a hard switch at the drop. For a sweep, automate `f` instead — verify on your build |
| `loudnorm` | Single pass used here; the two-pass mode (`print_format=json`, then `measured_*`) is more accurate — measured on synthetic input: -13.7 LUFS, true peak -1.4 dBFS |
| `-14 LUFS` | Field-reported streaming target; check the destination platform |
| `-c:v copy` | The verified master stays bit-identical |

---

## Deliverables

| Surface | Deliver |
|---------|---------|
| Autoplays muted (landing hero, social feed) | Silent master **and** music version |
| GitHub README | GIF (no audio track exists in GIF) + silent or music mp4 link |
| Slides / talk | Music version |

The film must read fully with the sound off. If the message needs the sound, the beat
map is wrong, not the mix.

---

## Checks (when the deliverable has sound)

| Check | Pass |
|-------|------|
| Integrated loudness (`ebur128`) | ≈ -14 LUFS |
| True peak (`ebur128=peak=true`) | ≤ -1 dBFS |
| Key hit vs beat | Within 3 frames of the beat / visual event |
| License | Recorded with the track URL and date |
| Silent version | Exists when the surface autoplays muted |
