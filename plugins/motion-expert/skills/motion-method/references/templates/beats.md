---
name: beats
description: Complete `.motion/beats.md` beat-map template — one row per beat (0.5-1 s on the grid) with its primary gesture, gesture length, secondary details, words and 3D reason — a filled 12 s example at 2 beat changes per second, and a check script that derives DURATION and enforces the density contract (no span > 0.75 s without a gesture, final CTA still ≤ 1.2 s, ≥ 1 beat change per second), read time (≥ 0.25 s/word), rotation, frame 0, the tempo grid and 3D reasons, then emits beats.json with the gestures and one still per beat
keywords: beat map, beats, timeline, duration, gesture, primary, details, words, 3d, motion density, gesture-free span, cta still, rate, tempo grid, stills, template
---

# Beat Map Template

## Overview

Copy into `<project>/.motion/beats.md` at stage 2. The scene's DURATION and gesture plan
are generated from this table — never typed separately. Rules for each column:
[beat-map.md](../beat-map.md). A **beat** is one primary gesture on the grid; there is no
"hold" column any more: read time is a word count against the beat length, and the only
still is the final CTA, ≤ 1.2 s.

---

## File: .motion/beats.md

```markdown
# Beat Map — <film working title>

fps: <fps>
hold_per_word: <HOLD from look.md, ≥ 0.25>
grid_step: <seconds per beat, e.g. 0.5 for 120 BPM | none (no grid)>
brief: .motion/brief.md (status: locked)
music: <none | file, BPM measured, first downbeat at <s>, drop at <s>>

| # | t_in | t_out | beat | gesture | g_dur | details | words | 3d |
|---|------|-------|------|---------|-------|---------|-------|----|
| 1 | 0.0 | <s> | <opening statement> | <travel / slam / scale / split … — not a reveal> | <s> | <kind@offset+dur; … or -> | <n> | - |
| 2 | <s> | <s> | <...> | <a different gesture> | <s> | <...> | <n> | <- or why 3D, why this style> |
| N | <s> | <s> | <CTA> | <gesture> | <s> | <...> | <n> | - |

DURATION: <generated — last t_out>
FRAMES: <generated — DURATION × fps>
```

| Column | Rule |
|--------|------|
| `t_in`, `t_out` | Contiguous; each beat 0.25-1 s on the grid (subdivisions allowed); only the last (CTA) beat may be longer, for its final still |
| `gesture` | The ONE primary gesture, from the vocabulary in the script; never `fade`, `dissolve`, `opacity`, `blur`; never the same as the previous row; row 1 is not a reveal (frame 0 already shows the statement) |
| `g_dur` | How long the primary runs from `t_in` (≤ the beat) |
| `details` | Secondary gestures `kind@offset+dur`, `;`-separated (an underline, a rule, a counter) — smaller than the primary |
| `words` | New words on screen in this beat; `words × hold_per_word` ≤ the beat length |
| `3d` | `-`, or for a `flip`/`turn` gesture: why 3D here and why this style (flat CSS 3D or lit three.js) — copied to look.md |

---

## Example Filled (12 s, 30 fps, 120 BPM, fictional CLI, no music)

```markdown
# Beat Map — CLI launch film

fps: 30
hold_per_word: 0.25
grid_step: 0.5
brief: .motion/brief.md (status: locked)
music: none

| # | t_in | t_out | beat | gesture | g_dur | details | words | 3d |
|---|------|-------|------|---------|-------|---------|-------|----|
| 1 | 0.0 | 0.5 | The promise, set huge | travel | 0.5 | - | 2 | - |
| 2 | 0.5 | 1.0 | "in one command" | stagger | 0.5 | draw@0.25+0.25 | 2 | - |
| 3 | 1.0 | 1.5 | The command | type | 0.5 | - | 2 | - |
| 4 | 1.5 | 2.0 | Enter | click | 0.25 | count@0.25+0.25 | 0 | - |
| 5 | 2.0 | 2.5 | It scans | wipe | 0.5 | - | 1 | - |
| 6 | 2.5 | 3.0 | Files queue up | stack | 0.5 | count@0+0.5 | 0 | - |
| 7 | 3.0 | 3.5 | One real problem | slam | 0.5 | - | 2 | - |
| 8 | 3.5 | 4.0 | The problem word | split | 0.5 | draw@0.25+0.25 | 1 | - |
| 9 | 4.0 | 4.5 | Accent field | grow | 0.5 | - | 0 | - |
| 10 | 4.5 | 5.0 | Named | scale | 0.5 | - | 2 | - |
| 11 | 5.0 | 5.5 | Where | push | 0.5 | - | 2 | - |
| 12 | 5.5 | 6.0 | The fix | slam | 0.5 | - | 2 | - |
| 13 | 6.0 | 6.5 | In place | morph | 0.5 | draw@0.25+0.25 | 2 | - |
| 14 | 6.5 | 7.0 | Diff lines | stagger | 0.5 | - | 2 | - |
| 15 | 7.0 | 7.5 | Fixed count | count | 0.5 | - | 2 | - |
| 16 | 7.5 | 8.0 | The check | flip | 0.5 | - | 1 | reveal: the problem block turns to its check face; CSS 3D, flat faces |
| 17 | 8.0 | 8.5 | Same view | push | 0.5 | - | 2 | - |
| 18 | 8.5 | 9.0 | One command | slam | 0.5 | - | 2 | - |
| 19 | 9.0 | 9.5 | The actor returns | grow | 0.5 | - | 0 | - |
| 20 | 9.5 | 10.0 | Name | scale | 0.5 | - | 1 | - |
| 21 | 10.0 | 10.5 | Install line | stagger | 0.5 | draw@0.25+0.25 | 2 | - |
| 22 | 10.5 | 12.0 | CTA | swap | 0.5 | - | 3 | - |

DURATION: 12.0
FRAMES: 360
```

Check output: `DURATION=12 FRAMES=360 rate=2.00/s stills=22 final_still=1.00s`. Each still
sits near its gesture's landing (`t_in + 0.9 × g_dur`), one per beat.

---

## File: .motion/scripts/beats-check.mjs

Parses the table, checks continuity, the gesture vocabulary and rotation, read time, the
grid, 3D reasons and the density contract, then writes `.motion/beats.json`.

**Tested** 2026-10-11 (node 26): `node --check` passes; the example prints the line above
(exit 0); a copy with a repeated gesture, a `flip` without a reason and a 2.0 s final still
exits 1 with exactly those three errors.

```javascript
/**
 * Validate .motion/beats.md and emit .motion/beats.json (fuse-motion, stage 2).
 * Usage: node .motion/scripts/beats-check.mjs [.motion/beats.md] [out.json]
 * Exit 1 on any rule violation; prints DURATION, FRAMES, rate and the stills count.
 */
import { readFileSync, writeFileSync } from "node:fs";

const GAP_MAX = 0.75;        // no span longer than this without a gesture (critic F6)
const CTA_STILL_MAX = 1.2;   // the final CTA still (critic F6)
const RATE_MIN = 1.0;        // primary gestures per second over the body (critic F11)
const BEAT_MAX = 1.0;        // a beat changes every 0.5-1 s (0.25 s subdivisions allowed)
const MIN_PER_WORD = 0.25;   // HOLD dial floor, s/word
const GESTURES = new Set(["travel", "stagger", "slam", "scale", "split", "mask", "wipe", "push", "swap", "draw", "count",
	"grow", "morph", "assemble", "stack", "snap", "flip", "turn", "type", "click", "drag", "pan", "zoom", "accent"]);
const REVEALS = new Set(["stagger", "mask", "wipe"]);
const THREE_D = new Set(["flip", "turn"]);
const EPS = 1e-6;

const src = readFileSync(process.argv[2] ?? ".motion/beats.md", "utf8");
const header = (key) => new RegExp(`^${key}:\\s*(\\d+(?:\\.\\d+)?)`, "m").exec(src)?.[1];
const fps = Number(header("fps"));
if (!Number.isFinite(fps) || fps <= 0) throw new Error("fps: missing or invalid");
const perWord = Number(header("hold_per_word") ?? MIN_PER_WORD);
const gridStep = Number(header("grid_step") ?? NaN); // NaN = no grid (demo)

/** "draw@0.25+0.25; count@0+0.5" → [{kind, at, dur}] relative to the beat start. */
const parseDetails = (cell) => (cell && cell !== "-" ? cell.split(";").map((d) => {
	const m = /^\s*([a-z]+)@([\d.]+)\+([\d.]+)\s*$/.exec(d);
	if (!m) throw new Error(`details "${d}" — expected kind@offset+dur`);
	return { kind: m[1], at: Number(m[2]), dur: Number(m[3]) };
}) : []);

const rows = src.split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l))
	.map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
	.map(([n, tIn, tOut, beat, gesture, gDur, details, words, d3]) => ({
		n: Number(n), tIn: Number(tIn), tOut: Number(tOut), beat, gesture: (gesture ?? "").toLowerCase(),
		gDur: Number(gDur), details: parseDetails(details), words: Number(words), d3: (d3 ?? "-").trim(),
	}));

const errors = [];
if (rows.length === 0) errors.push("no beat rows found");
if (!(perWord >= MIN_PER_WORD)) errors.push(`hold_per_word ${perWord} < ${MIN_PER_WORD}`);
const sub = gridStep / 2;
const onGrid = (t) => Math.abs(t / sub - Math.round(t / sub)) < EPS;
const spans = [];
rows.forEach((r, i) => {
	const last = i === rows.length - 1;
	const len = r.tOut - r.tIn;
	if (i === 0 && Math.abs(r.tIn) > EPS) errors.push(`beat ${r.n}: first t_in must be 0`);
	if (i > 0 && Math.abs(r.tIn - rows[i - 1].tOut) > EPS) errors.push(`beat ${r.n}: gap/overlap with previous t_out`);
	if (len <= 0) errors.push(`beat ${r.n}: t_out must be > t_in`);
	if (!GESTURES.has(r.gesture)) errors.push(`beat ${r.n}: gesture "${r.gesture}" not in the vocabulary (no fade/dissolve/opacity/blur)`);
	if (i > 0 && r.gesture === rows[i - 1].gesture) errors.push(`beat ${r.n}: "${r.gesture}" twice in a row — rotate`);
	if (i === 0 && REVEALS.has(r.gesture)) errors.push(`beat ${r.n}: frame 0 must already show the statement — no reveal at t = 0`);
	if (!(r.gDur > 0) || r.gDur > len + EPS) errors.push(`beat ${r.n}: g_dur must be > 0 and ≤ the beat`);
	if (!last && len > BEAT_MAX + EPS) errors.push(`beat ${r.n}: ${len.toFixed(2)} s > ${BEAT_MAX} s — split it (a beat changes every 0.5-1 s)`);
	if (!Number.isInteger(r.words) || r.words < 0) errors.push(`beat ${r.n}: words must be a count`);
	else if (r.words * perWord > len + EPS) errors.push(`beat ${r.n}: ${r.words} words need ${(r.words * perWord).toFixed(2)} s > ${len.toFixed(2)} s — more beats`);
	if (THREE_D.has(r.gesture) && (r.d3 === "-" || r.d3.length < 8)) errors.push(`beat ${r.n}: 3D "${r.gesture}" needs its reason in the 3d column (why 3D, why this style)`);
	if (Number.isFinite(gridStep) && !(onGrid(r.tIn) && onGrid(r.tOut))) errors.push(`beat ${r.n}: t_in/t_out off the ${sub}s subdivision`);
	spans.push([r.tIn, r.tIn + r.gDur], ...r.details.map((d) => [r.tIn + d.at, r.tIn + d.at + d.dur]));
});

const DURATION = rows.at(-1)?.tOut ?? 0;
let covered = 0;
for (const [a, b] of spans.sort((x, y) => x[0] - y[0])) {
	if (a - covered > GAP_MAX + 1 / fps) errors.push(`no gesture ${covered.toFixed(2)}–${a.toFixed(2)} s (> ${GAP_MAX} s)`);
	covered = Math.max(covered, b);
}
if (DURATION - covered > CTA_STILL_MAX + 1 / fps) errors.push(`final CTA still ${(DURATION - covered).toFixed(2)} s > ${CTA_STILL_MAX} s — build the CTA over more beats`);
const rate = rows.length / covered;
if (rate < RATE_MIN) errors.push(`${rate.toFixed(2)} beat changes per s < ${RATE_MIN} — shorter beats, more gestures`);

if (errors.length) {
	console.error(errors.join("\n"));
	process.exit(1);
}
const FRAMES = Math.round(DURATION * fps);
const stillTimes = rows.map((r) => +(Math.round((r.tIn + r.gDur * 0.9) * fps) / fps).toFixed(3));
const gestures = rows.flatMap((r) => [{ kind: r.gesture, role: "primary", at: r.tIn, dur: r.gDur },
	...r.details.map((d) => ({ kind: d.kind, role: "secondary", at: r.tIn + d.at, dur: d.dur }))]);
writeFileSync(process.argv[3] ?? ".motion/beats.json", JSON.stringify({ fps, DURATION, FRAMES, rate, stillTimes, gestures, beats: rows }, null, 2));
console.log(`DURATION=${DURATION} FRAMES=${FRAMES} rate=${rate.toFixed(2)}/s stills=${stillTimes.length} final_still=${(DURATION - covered).toFixed(2)}s`);
```

---

## Usage in the Scene

The capture opens the scene from `file://`, where Chrome blocks module scripts, so the
scene cannot `import` `beats.json`. For an ad, `motion-art-direction`
[cut-rhythm.md](../../../motion-art-direction/references/templates/cut-rhythm.md)'s
`rhythm.js` is the scene's beat map; otherwise copy the generated values into
`motion-render`'s `beats.js` (timeline-seek) after every successful check:

```javascript
// .motion/scene/beats.js — values copied from .motion/beats.json, never typed by hand
const BEATS = [{ id: "statement", from: 0, to: 1.5 }, /* … one entry per state (shot) */];
const DURATION = BEATS[BEATS.length - 1].to; // = beats.json DURATION
const GESTURES = [/* = beats.json gestures */];
const STILLS = [/* = beats.json stillTimes */];
validateDensity(GESTURES, DURATION, FPS);   // lib.js — same numbers, checked again at load
```

---

## Notes

- The scene re-checks the same contract at load (`validateDensity`); the critic checks the
  rendered frames (`freeze.txt`, `gestures.txt`, opacity blends, drift) on the draft.
- `grid_step` is checked when set; t_in/t_out may sit on half-steps (subdivisions).
- Re-run the check after every beat edit; a changed beat map invalidates approved stills.
- Render-side use of `stillTimes` belongs to `motion-render`.
