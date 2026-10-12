---
name: cut-rhythm
description: Complete tempo-map template, the FIRST block of the scene (.motion/scene/rhythm.js, replaces motion-render's beats.js) — states declared in beats at a BPM, each with its primary gestures and secondary details, cut and gesture times derived on the frame grid, a load-time validator (read floor ≥ 0.25 s/word, act changes on inversion/accent cuts, 3D only with a recorded reason, frame 0 never a reveal, CTA built over ≥ 2 gestures, states tightening, state count per length, brand never before the pain, full-bleed ink/accent on ⌈N/3⌉ states) plus lib.js validateDensity (no gesture-free span > 0.75 s, final CTA still ≤ 1.2 s, one primary at a time, rotation, ≥ 1 primary gesture/s), ground(t) for inversion/accent cuts and showState() for hard cuts by visibility; feeds BEATS, DURATION, GESTURES and STILLS (one per beat)
keywords: tempo, bpm, beat, subdivision, cut, hard cut, frame grid, gesture, primary, secondary, motion density, gesture-free span, 0.75 s, cta still, 1.2 s, states, cta, inversion cut, accent frame, full bleed, match cut, 3d, validator, rhythm.js, seek
---

# Cut Rhythm Template

Scene step order (contract): **rhythm.js (this) → grid.js (composition-grid) → kinetic.js
(kinetic-type) → timeline.js**, each its own classic script after `lib.js` (`motion-render`
[timeline-seek.md](../../../motion-render/references/templates/timeline-seek.md) — mechanics:
`prog`, `lerp`, `bezier`, `inOut`, `expoOut`, springs, `stagger`, `validateDensity`, `$`).
Classic scripts share their top-level names, and each file stays within the hook ceiling
`FUSE_SOLID_MAX_LINES`.

This file **replaces** timeline-seek's `beats.js`, which defines `FPS`, `onFrame`, `BEATS`,
`DURATION`, `GESTURES` and `STILLS`; nothing is declared twice. States and gestures are
declared **in beats**, so neither a cut nor a gesture can be off the tempo grid. Times are
snapped to frames from absolute time, so rounding never accumulates. The validators throw
at load: a bad rhythm never reaches a still.

| Check | Rule ([../rhythm.md](../rhythm.md)) | Critic |
|-------|------------------|--------|
| Gesture-free span | No span > 0.75 s without a primary or secondary gesture (`validateDensity`) | F6 |
| Final CTA still | ≤ 1.2 s after the last gesture lands | F6 |
| Rate | ≥ 1 primary gesture per second over the body | F11 |
| One primary at a time, rotated | Primaries never overlap; never the same kind twice in a row | X1 |
| Read floor | State length ≥ max(0.4 s, 0.25 s × words); one-word bursts ≥ 0.2 s in runs of ≥ 3 | L4 |
| CTA | Last state, built over ≥ 2 primary gestures | rubric |
| Tightening | Mean state length of the last third (CTA excluded) ≤ the first two thirds | rubric |
| Count | 15 s → 8–14 states, 30 s → 16–26 (linear in between) | rubric |
| Brand | No `brand: true` state before the first `pain` state | X2 |
| Act change | The first state of a new act is an `inversion` or `accent` cut | rubric |
| 3D | Every `flip`/`turn` gesture has a `d3` reason (copied to look.md) | D7 |
| Frame 0 | The first state's first gesture is not a reveal (`stagger`/`mask`/`wipe` at 0) | F1 |
| Full bleed | States whose field is ink or accent ≥ ⌈N / 3⌉ | F10 |

**Tested** 2026-10-11 (node, with timeline-seek's `lib.js`): `node --check` passes; the
example below loads with DURATION 15, 12 states, 28 primary gestures, rate 2.0 per s, last
gesture landing at 14.0 s (final still 1.0 s), 28 stills. Not yet rendered as a whole
film: run the stills twice (sha256) before G1.

---

## File: `.motion/scene/rhythm.js`

```javascript
/**
 * Tempo map → states + gesture plan (fuse-motion art direction). Classic script loaded
 * after lib.js; replaces motion-render's beats.js (same names: FPS, onFrame, BEATS,
 * DURATION, GESTURES, STILLS). Throws at load on any rhythm or density rule it breaks.
 */
const BPM = 120;
const FPS = 30;
const BEAT = 60 / BPM; // 0.5 s at 120 BPM
/**
 * One entry per state (what is on screen between two cuts), lengths in beats.
 * act: hook | pain | turn | proof | breath | cta · cut: hard | inversion | accent | match
 * words: words on screen (read floor) · brand: product name or logo visible
 * field (optional): "ink" | "paper" | "accent" when the ≥ 50 % plane differs from ground()
 * g: primary gestures [kind, start beat in the state, length in beats]; consecutive kinds differ
 * d: secondary details, same shape · d3: { kind: why } for every 3D gesture (look.md reason)
 */
const STATES = [
	{ id: "hook-1", act: "hook", beats: 3, words: 3, cut: "hard", g: [["travel", 0, 1], ["stagger", 1, 1], ["draw", 2, 1]] },
	{ id: "hook-2", act: "hook", beats: 2, words: 2, cut: "hard", g: [["slam", 0, 1], ["split", 1, 1]] },
	{ id: "pain-1", act: "pain", beats: 2, words: 4, cut: "inversion", g: [["scale", 0, 1], ["draw", 1, 1]] },
	{ id: "pain-2", act: "pain", beats: 2, words: 3, cut: "hard", g: [["stagger", 0, 1], ["push", 1, 1]] },
	{ id: "pain-3", act: "pain", beats: 2, words: 2, cut: "hard", g: [["slam", 0, 1], ["split", 1, 1]] },
	{ id: "turn", act: "turn", beats: 1, words: 1, cut: "accent", brand: true, g: [["grow", 0, 1]] },
	{ id: "proof-1", act: "proof", beats: 2, words: 3, cut: "inversion", brand: true, g: [["count", 0, 1], ["draw", 1, 1]], d: [["count", 1, 1]] },
	{ id: "proof-2", act: "proof", beats: 2, words: 2, cut: "match", brand: true, g: [["scale", 0, 1], ["stagger", 1, 1]] },
	{ id: "proof-3", act: "proof", beats: 2, words: 2, cut: "hard", brand: true, g: [["slam", 0, 1], ["push", 1, 1]] },
	{ id: "proof-4", act: "proof", beats: 2, words: 1, cut: "hard", brand: true, g: [["flip", 0, 1], ["stagger", 1, 1]], d3: { flip: "reveal: the server block turns to its check face" } },
	{ id: "breath", act: "breath", beats: 2, words: 1, cut: "inversion", g: [["split", 0, 1], ["draw", 1, 1]] },
	{ id: "cta", act: "cta", beats: 8, words: 3, cut: "inversion", brand: true,
		g: [["grow", 0, 1], ["slam", 1, 1], ["stagger", 2, 1], ["draw", 3, 1], ["flip", 4, 1], ["swap", 5, 1]], d3: { flip: "transform: the hexagon mark turns face-on as the CTA" } },
];

const onFrame = (sec) => Math.round(sec * FPS) / FPS;
/** Cut table: absolute times from cumulative beats, snapped to the frame grid. */
const CUTS = (() => {
	let b = 0;
	return STATES.map((s) => {
		const start = b;
		b += s.beats;
		return { ...s, startBeat: start, from: onFrame(start * BEAT), to: onFrame(b * BEAT) };
	});
})();
const BEATS = CUTS.map(({ id, from, to }) => ({ id, from, to }));
const DURATION = BEATS[BEATS.length - 1].to;
/** Every gesture in absolute seconds, on the grid (validateDensity in lib.js reads these). */
const GESTURES = CUTS.flatMap((c) => [
	...c.g.map(([kind, at, len]) => ({ state: c.id, kind, role: "primary", at: onFrame((c.startBeat + at) * BEAT), dur: len * BEAT, d3: !!c.d3?.[kind] })),
	...(c.d ?? []).map(([kind, at, len]) => ({ state: c.id, kind, role: "secondary", at: onFrame((c.startBeat + at) * BEAT), dur: len * BEAT })),
]);
/** G1 stills: one per primary gesture (one frame per beat), near its landing. */
const STILLS = GESTURES.filter((g) => g.role === "primary").map((g) => onFrame(g.at + g.dur * 0.9));

/**
 * Ground of the frame at `t`: flips ink↔paper at every inversion cut, accent on accent
 * states. Pure function of `t`. Frame 0 is the first state's ground at full value.
 *
 * @param {number} t - Film time (s), already wrapped
 * @returns {{name:string, bg:string, fg:string}} role name + CSS custom properties
 */
function ground(t) {
	let ink = true;
	for (const c of CUTS) {
		if (c.from > t) break;
		if (c.cut === "inversion") ink = !ink;
		if (t < c.to && c.cut === "accent") return { name: "accent", bg: "var(--accent)", fg: "var(--ink)" };
	}
	return ink
		? { name: "ink", bg: "var(--ink)", fg: "var(--paper)" }
		: { name: "paper", bg: "var(--paper)", fg: "var(--ink)" };
}

/**
 * Throws on the first rhythm rule the cut table breaks. Density (0.75 s span, CTA still
 * ≤ 1.2 s, one primary at a time, rotation, ≥ 1 /s) is lib.js validateDensity.
 *
 * @param {Array} cuts - CUTS @param {number} duration - DURATION in seconds
 */
function validateRhythm(cuts, duration) {
	const fail = (msg) => { throw new Error(`rhythm: ${msg}`); };
	const len = (c) => c.to - c.from;
	const last = cuts.length - 1;
	cuts.forEach((c, i) => {
		const burst = c.words === 1 && len(c) >= 0.2 &&
			cuts.slice(Math.max(0, i - 2), i + 3).filter((d) => d.words === 1).length >= 3;
		const floor = Math.max(0.4, 0.25 * c.words);
		if (!burst && len(c) < floor - 1 / FPS) fail(`${c.id} shows ${c.words} words for ${len(c).toFixed(2)} s < ${floor} s`);
		if (i > 0 && c.act !== cuts[i - 1].act && !["inversion", "accent"].includes(c.cut))
			fail(`${c.id} opens act "${c.act}" with a ${c.cut} cut — use inversion or accent`);
		for (const [kind] of c.g) if (/^(flip|turn|spin)$/.test(kind) && !c.d3?.[kind]) fail(`${c.id}: 3D "${kind}" without a look.md reason (d3)`);
		if (i === 0 && c.g.some(([k, at]) => at === 0 && /^(stagger|mask|wipe)$/.test(k))) fail("frame 0 must show the statement — no reveal at t = 0");
	});
	const cta = cuts[last];
	if (cta.act !== "cta") fail("last state must be the CTA");
	if (cta.g.length < 2) fail("the CTA is built over ≥ 2 primary gestures, then a still ≤ 1.2 s");
	const body = cuts.slice(0, -1), cut3 = Math.floor((body.length * 2) / 3);
	const mean = (a) => a.reduce((s, c) => s + len(c), 0) / a.length;
	if (mean(body.slice(cut3)) > mean(body.slice(0, cut3)) + 1 / FPS) fail("states do not tighten toward the end");
	const lo = 8 + ((duration - 15) * 8) / 15, hi = 14 + ((duration - 15) * 12) / 15;
	if (duration >= 15 && duration <= 30 && (cuts.length < Math.floor(lo) || cuts.length > Math.ceil(hi)))
		fail(`${cuts.length} states in ${duration} s — expected ${Math.floor(lo)}–${Math.ceil(hi)}`);
	const firstPain = cuts.findIndex((c) => c.act === "pain");
	const firstBrand = cuts.findIndex((c) => c.brand);
	if (firstBrand !== -1 && (firstPain === -1 || firstBrand < firstPain)) fail("brand appears before the pain");
	const bleed = cuts.filter((c) => ["ink", "accent"].includes(c.field || ground(c.from).name)).length;
	const need = Math.ceil(cuts.length / 3);
	if (bleed < need) fail(`${bleed} ink/accent full-bleed states < ${need} (one in three)`);
}
validateRhythm(CUTS, DURATION);
validateDensity(GESTURES, DURATION, FPS);

/**
 * Hard cut by visibility: the element exists only inside its state [from, to).
 * Never an opacity ramp — crossfades and dissolves are banned (critic M1).
 *
 * @param {HTMLElement} el - Element belonging to one state
 * @param {number} t - Film time (s)
 * @param {string} id - State id from STATES
 */
function showState(el, t, id) {
	const c = CUTS.find((s) => s.id === id);
	if (!c) throw new Error(`unknown state ${id}`);
	el.style.visibility = t >= c.from && t < c.to ? "visible" : "hidden";
}
// In seek(t) (timeline.js):
//   const g = ground(time);
//   $("stage").style.setProperty("--bg", g.bg); $("stage").style.setProperty("--fg", g.fg);
//   showState($("s-hook-1"), time, "hook-1");   // visible at t = 0, full value
```

---

## Reading the example

120 BPM, 30 beats = 15.0 s, 12 states, 28 primary gestures.
- **Density:** a primary gesture starts on every beat from 0.0 to 13.5 s; the last lands at
  14.0 s; the final CTA still is 14.0–15.0 s (1.0 s ≤ 1.2). Rate = 28 / 14.0 = 2.0 per s.
- **Rotation:** travel → stagger → draw → slam → split → scale → draw → stagger → push → …;
  no kind repeats on consecutive beats, across state boundaries too.
- **Kinetic type:** stagger, slam, scale jump, split, push, swap ([kinetic-type.md](kinetic-type.md)).
- **Actor:** travel (hook), grow (the turn's accent flood), grow again (it becomes the CTA band).
- **3D:** two flips, each with a job written in `d3` and in look.md (a reveal, the mark).
- **Brand:** first at the turn (5.5 s), after the pain.
- **Full bleed:** hook ×2 + turn + proof ×4 + CTA = 8 ink/accent states ≥ ⌈12/3⌉ = 4.
- **Frame 0:** hook-1 ("still" + "your deploys", 3 words) on ink at full value; its first
  gesture is the actor travelling under the word, not a reveal.

Grounds: hook ink → pain paper (inversion, 2.5 s) → turn accent (5.5 s) → proof ink
(inversion, 6.0 s) → breath paper (10.0 s) → CTA ink (11.0 s). Match cut at 7.0 s. The pain
and breath states are paper, so each carries an ink plane ≥ 20 % (look.md state table).

## Adapting

| Change | How |
|--------|-----|
| Music track | Set `BPM` to the measured tempo (`motion-render` audio.md) and trim the track so its first downbeat is t = 0 |
| A read longer than a state allows | Split it into more states / more gestures; never hold it still or drift |
| One-word burst | 3+ consecutive `words: 1` states of 0.5 beat at 120 BPM (0.25 s) |
| Letter staggers on subdivisions | A gesture of length 0.5 beat at a half-beat start (`["stagger", 1.5, 0.5]`) |
| Non-integer frame beats (e.g. 112 BPM) | Nothing to do — snapping is from absolute time |
| 6 s bumper | Count check is skipped outside 15–30 s; density, CTA, act and bleed rules stay |
| Paper state with an ink plane ≥ 50 % | Set `field: "ink"` on that state |
| A 3D gesture | Name it `flip`/`turn` and give it a `d3` reason; the same reason goes in look.md |
| The validator throws on density | Add the missing gesture (a word, the actor, a detail) — never raise the 0.75 / 1.2 / 1.5 numbers |
