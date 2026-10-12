---
name: timeline-seek
description: 'Complete scene clocks, split into classic scripts under the hook line ceiling — scene/lib.js (seeded PRNG, the two default beziers, closed-form springs ζ ≥ 0.85 with ≤ 3 % overshoot, springSum for retargeting, stagger, validateDensity for the 0.75 s / 1.2 s / 1 per s contract), scene/beats.js (beat map + gesture plan, replaced by cut-rhythm for an ad) and scene/timeline.js (three rotating non-opacity entrances, a recurring accent actor, word stagger, a counter retargeted by springSum, a flat-shaded CSS 3D cube); plus a dense, flat single-canvas variant (camera with log-space zoom, hard-edge flood)'
keywords: timeline, seek, prng, mulberry32, bezier, spring, springSum, retarget, stagger, damping, overshoot, motion density, gesture, actor, css 3d, cube, preserve-3d, mask wipe, push, scale jump, canvas, camera, log zoom, flood
---

# Timeline / Seek Templates

The clock mechanics of a scene: `window.seek(t)` and its contract. **What** is on screen
and **when** comes from `motion-art-direction` first.

The scene is split into **classic scripts loaded in order**, because the hook caps a code
file at `FUSE_SOLID_MAX_LINES` (200). Top-level `const`/`function` names of a classic
script are visible to the scripts loaded after it, so every block keeps its names
unchanged. Never declare a name twice (it throws at load).

| Order | File | From | Declares |
|-------|------|------|----------|
| 1 | `scene/lib.js` | this file | `clamp01`, `prog`, `lerp`, `$`, `bezier`, `inOut`, `expoOut`, `spring`, `springUI/Box/Heavy`, `springSum`, `stagger`, `validateDensity`, `rand` |
| 2 | `scene/beats.js` | this file — or [cut-rhythm.md](../../../motion-art-direction/references/templates/cut-rhythm.md)'s `rhythm.js` for an ad | `FPS`, `onFrame`, `BEATS`, `DURATION`, `GESTURES`, `STILLS` |
| 3 | `scene/grid.js`, `scene/kinetic.js` | [composition-grid.md](../../../motion-art-direction/references/templates/composition-grid.md), [kinetic-type.md](../../../motion-art-direction/references/templates/kinetic-type.md) | camera + audit; letter/word behaviours |
| 3b | `scene/interact.js` (optional) | [interaction-kit.md](interaction-kit.md) | dual-edge springs, cursor drag, `swapBlur` |
| 4 | `scene/timeline.js` | this file | `REVEALS`, the gestures, `seek`, the contract |

**Tested** 2026-10-11, Chrome 154 (macOS), via the capture's CDP path: the DOM scene below
shot at 14 times, twice in fresh profiles → identical sha256 **with
`--disable-gpu-compositing`** (now a base flag of [capture-cdp.md](capture-cdp.md)).
Without it, the CSS 3D frames differed by 1 LSB (PSNR 111-116 dB) between runs, the same
class of drift as `will-change`. The canvas variant: 8 times, twice → identical. `node
--check` passes on the three scripts. Springs checked numerically (0.5 ms sampling):
320/31 → ζ 0.866, peak +0.43 %; 170/23 → 0.882, +0.28 %; 120/19 → 0.867, +0.42 %;
400/34 → ζ 0.85, +0.63 %; `spring(100, 10)` throws. `springSum` with steps 0→18 @2.0 s,
→42 @2.5 s gives 0 / 17.72 / 18.02 / 41.62 / 42 at 1.9 / 2.25 / 2.5 / 2.75 / 3.5 s.
`validateDensity` rejects, with the message shown, a 0.9 s gap, a 1.5 s final still, the same
kind twice, two overlapping primaries and a 1.0 per s plan. All six scene scripts (`lib`,
cut-rhythm's `rhythm`, `grid`, `kinetic`, `interact`, `timeline`) load together in one
global scope with no duplicate name.

| Piece | Rule it enforces |
|-------|------------------|
| `validateDensity` at load | No gesture-free span > 0.75 s, final CTA still ≤ 1.2 s, one primary gesture at a time, never the same primary twice in a row, ≥ 1 primary gesture/s (`motion-review` F6, F11) |
| `BEATS` → `DURATION` | Duration is the end of the last state, never a guess |
| First state is a hard cut from 0 | Frame 0 shows the opening statement at full value |
| `REVEAL` + load check | 3 entrances, never the same on consecutive states; none touches `opacity` |
| `spring(k, c)` throws below ζ 0.85 | Overshoot ≤ 3 % (the presets peak at +0.28-0.43 %), one visible swing at most |
| `springSum` | A value retargeted many times stays a pure function of `t` |
| `mulberry32(SEED)`, drawn at load | No unseeded randomness, no PRNG call inside `seek` |
| Hard cuts by `visibility` | A state exists only inside `[from, to)` — no crossfade |

---

## File: `.motion/scene/lib.js`

```javascript
/**
 * Scene mechanics (fuse-motion): pure helpers shared by every scene script. Classic
 * script, loaded FIRST; its top-level names are visible to the later scripts
 * (beats.js, art-direction blocks, timeline.js). Nothing here reads the clock.
 */

/** Seeded PRNG (mulberry32): same seed, same sequence, every frame, every machine. */
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const SEED = 20261008;
/** Draw every random value at load, into constants — never call rand() in seek(). */
const rand = mulberry32(SEED);

const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** Progress of `t` through [a, b], clamped to [0, 1]. */
const prog = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const $ = (id) => document.getElementById(id);

/**
 * CSS-equivalent cubic-bezier easing (Newton steps, bisection fallback).
 *
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @returns {(x: number) => number} eased progress
 */
function bezier(x1, y1, x2, y2) {
	const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
	const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
	const sx = (s) => ((ax * s + bx) * s + cx) * s;
	const sy = (s) => ((ay * s + by) * s + cy) * s;
	const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
	return (x) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let s = x;
		for (let i = 0; i < 8; i++) {
			const e = sx(s) - x;
			if (Math.abs(e) < 1e-6) return sy(s);
			const d = dx(s);
			if (Math.abs(d) < 1e-6) break;
			s -= e / d;
		}
		let lo = 0, hi = 1;
		s = x;
		while (hi - lo > 1e-6) {
			if (sx(s) < x) lo = s; else hi = s;
			s = (lo + hi) / 2;
		}
		return sy(s);
	};
}
/** The two default curves: film in-out (pushes, camera), snappy expo-out (arrivals). */
const inOut = bezier(0.6, 0, 0.2, 1);
const expoOut = bezier(0.16, 1, 0.3, 1);

/**
 * Closed-form spring step from 0 to 1 (mass 1, starts at rest). ζ ≥ 0.85 only: the
 * peak passes 1 by exp(−ζπ/√(1−ζ²)) ≤ 0.63 % with one visible swing at most.
 * ζ < 0.85 throws (bouncy easing is banned, critic D9).
 *
 * @param {number} stiffness @param {number} damping
 * @returns {(sec: number) => number} position `sec` seconds after the step
 */
function spring(stiffness, damping) {
	const w0 = Math.sqrt(stiffness);
	const zeta = damping / (2 * w0);
	if (!(zeta >= 0.85)) throw new Error(`spring damping ratio ${zeta.toFixed(3)} < 0.85 (bouncy)`);
	if (zeta >= 1) {
		// Near ζ = 1 the overdamped form divides by r2 - r1 → 0: use the critical form.
		if (zeta - 1 < 1e-6) return (s) => (s <= 0 ? 0 : 1 - Math.exp(-w0 * s) * (1 + w0 * s));
		const r = Math.sqrt(zeta * zeta - 1);
		const r1 = -w0 * (zeta - r), r2 = -w0 * (zeta + r);
		return (s) => (s <= 0 ? 0 : 1 - (r2 * Math.exp(r1 * s) - r1 * Math.exp(r2 * s)) / (r2 - r1));
	}
	const wd = w0 * Math.sqrt(1 - zeta * zeta);
	return (s) => (s <= 0 ? 0 : 1 - Math.exp(-zeta * w0 * s) * (Math.cos(wd * s) + (zeta * w0 / wd) * Math.sin(wd * s)));
}
/** Presets (ζ): UI 320/31 (0.87), containers 170/23 (0.88), heavy type 120/19 (0.87). */
const springUI = spring(320, 31);
const springBox = spring(170, 23);
const springHeavy = spring(120, 19);

/**
 * Retargeting spring as a sum: a value that changes target many times is the sum of
 * one closed-form step per change, so it stays a pure function of `t`.
 *
 * @param {number} t - Film time (s)
 * @param {number} v0 - Value before the first step
 * @param {Array<{at:number, to:number}>} steps - Target changes, in time order
 * @param {(sec:number)=>number} step - A spring() step
 * @returns {number}
 */
function springSum(t, v0, steps, step) {
	let v = v0, prev = v0;
	for (const s of steps) {
		v += (s.to - prev) * step(t - s.at);
		prev = s.to;
	}
	return v;
}

/**
 * Per-item progress for a stagger (letters, words, rows): item i starts `gap` seconds
 * after item i−1 and runs `dur` on `curve`.
 *
 * @returns {number[]} progress in [0, 1] per item
 */
function stagger(t, at, count, gap, dur, curve = expoOut) {
	return Array.from({ length: count }, (_, i) => curve(prog(t, at + i * gap, at + i * gap + dur)));
}

/**
 * Throws at load when the gesture plan breaks the density contract (motion-review F6,
 * F11): a gesture-free span > gapMax, a final still > ctaStill, two primary gestures
 * at once, the same primary kind twice in a row, or a primary rate < rateMin.
 *
 * @param {Array<{kind:string, role:"primary"|"secondary", at:number, dur:number}>} gestures
 * @param {number} duration @param {number} fps
 * @param {{gapMax?:number, ctaStill?:number, rateMin?:number}} [o]
 */
function validateDensity(gestures, duration, fps, o = {}) {
	const { gapMax = 0.75, ctaStill = 1.2, rateMin = 1 } = o;
	const fail = (m) => { throw new Error(`density: ${m}`); };
	const tol = 1 / fps;
	const all = [...gestures].sort((a, b) => a.at - b.at);
	let covered = 0;
	for (const g of all) {
		if (g.at - covered > gapMax + tol) fail(`no gesture ${covered.toFixed(2)}–${g.at.toFixed(2)} s (> ${gapMax} s)`);
		covered = Math.max(covered, g.at + g.dur);
	}
	if (duration - covered > ctaStill + tol) fail(`final still ${(duration - covered).toFixed(2)} s > ${ctaStill} s`);
	const primary = all.filter((g) => g.role === "primary");
	primary.forEach((g, i) => {
		const prev = primary[i - 1];
		if (prev && g.at < prev.at + prev.dur - tol) fail(`two primary gestures at ${g.at} s — one at a time`);
		if (prev && g.kind === prev.kind) fail(`"${g.kind}" twice in a row at ${g.at} s — rotate`);
	});
	const rate = primary.length / covered;
	if (rate < rateMin) fail(`${rate.toFixed(2)} primary gestures/s < ${rateMin}`);
	return rate;
}
```

---

## File: `.motion/scene/beats.js`

Pairs with [index-skeleton.md](index-skeleton.md) (shot ids `title`, `proof`, `turn`,
`end`; `#actor`, `#value`, `#rule`, `#cube`, words `w1-w4`, `d1-d2`).

```javascript
/**
 * Beat map + gesture plan (fuse-motion). Loaded after lib.js. For an ad, replace this
 * whole file with motion-art-direction cut-rhythm.md's rhythm.js (same names: FPS,
 * onFrame, BEATS, DURATION, GESTURES, STILLS).
 */
const FPS = 30;
/** Snap seconds to the frame grid: cuts and gesture starts land on a frame. */
const onFrame = (sec) => Math.round(sec * FPS) / FPS;
/** One state per shot, contiguous; the first starts at 0. */
const BEATS = [
	{ id: "title", from: 0, to: 1.5 },
	{ id: "proof", from: 1.5, to: 3 },
	{ id: "turn", from: 3, to: 4.5 },
	{ id: "end", from: 4.5, to: 6 }, // CTA: built by gestures, then a still ≤ 1.2 s
];
const DURATION = BEATS[BEATS.length - 1].to;
/**
 * Every gesture on the 120 BPM grid (0.5 s). role: primary (ONE at a time) | secondary
 * (smaller, subordinate, may run with the primary). d3: a 3D gesture (job in look.md).
 */
const GESTURES = [
	{ kind: "travel", role: "primary", at: 0, dur: 0.5 }, // the actor crosses under the word
	{ kind: "stagger", role: "primary", at: 0.5, dur: 0.5 }, // label words reveal one by one
	{ kind: "grow", role: "primary", at: 1, dur: 0.5 }, // the actor floods the frame → next state
	{ kind: "wipe", role: "primary", at: 1.5, dur: 0.5 }, // proof enters behind a hard edge
	{ kind: "count", role: "primary", at: 2, dur: 0.5 }, // counter springs 0 → 18
	{ kind: "draw", role: "primary", at: 2.5, dur: 0.5 }, // rule draws under the number
	{ kind: "count", role: "secondary", at: 2.5, dur: 0.5 }, // counter retargets 18 → 42 (springSum)
	{ kind: "push", role: "primary", at: 3, dur: 0.5 }, // turn pushes proof out
	{ kind: "flip", role: "primary", at: 3.5, dur: 0.5, d3: true }, // cube turns to its accent face (reveal)
	{ kind: "stagger", role: "primary", at: 4, dur: 0.5 }, // "one decision" words reveal
	{ kind: "scale", role: "primary", at: 4.5, dur: 0.5 }, // CTA lands at 3× and settles to set size
	{ kind: "draw", role: "secondary", at: 4.75, dur: 0.25 }, // the actor returns as the CTA band
];
/** Gate G1 stills: one per primary gesture (one frame per beat), near its landing. */
const STILLS = GESTURES.filter((g) => g.role === "primary").map((g) => onFrame(g.at + g.dur * 0.9));
validateDensity(GESTURES, DURATION, FPS);
```

Plan check: 10 primary gestures over the 5.0 s body = 2.0 per s; the longest gap is 0 s
(gestures chain on the grid); final CTA still 5.0-6.0 s = 1.0 s ≤ 1.2.

---

## File: `.motion/scene/timeline.js`

```javascript
/**
 * Master clock of the film (fuse-motion). Loaded LAST, after lib.js, beats.js and the
 * art-direction blocks. `window.seek(t)` draws the exact frame at `t` from `t` alone (no
 * wall clock, no unseeded randomness, no CSS animation).
 *
 * Contract read by the capture: window.seek, window.DURATION, window.FPS, window.STILLS,
 * window.ready (a Promise). `?t=4.5` holds one frame, `?capture` waits to be driven,
 * no query = self-play in a loop (preview only, never captured).
 */

/** Entrance per state id; an id not listed enters by hard cut. */
const REVEAL = { proof: "wipe", turn: "push", end: "scale" };
/** Entrance lengths (s) and the stage width (CSS px, = #stage width). */
const WIPE = 0.5, PUSH = 0.5, FRAME_W = 1080;

/**
 * Clears every style an entrance may set, then shows or hides the shot. Called on
 * every shot every frame, so nothing drawn earlier survives (any seek order is exact).
 */
function reset(el, shown) {
	el.style.visibility = shown ? "visible" : "hidden";
	el.style.clipPath = "none";
	el.style.transform = "none";
	el.style.transformOrigin = "0 50%";
}

/** Three shot entrances, none of them opacity: clip-path / transform / visibility only. */
const REVEALS = {
	/** Mask wipe: a hard 0 px clip edge sweeps left → right over the old shot. */
	wipe(inEl, outEl, t, at) {
		const p = expoOut(prog(t, at, at + WIPE));
		inEl.style.clipPath = `inset(0 ${(100 * (1 - p)).toFixed(3)}% 0 0)`;
		if (outEl && p < 1) outEl.style.visibility = "visible";
	},
	/** Push: the new shot drives the old one out, same curve, one hard edge between. */
	push(inEl, outEl, t, at) {
		const p = inOut(prog(t, at, at + PUSH));
		inEl.style.transform = `translateX(${(FRAME_W * (1 - p)).toFixed(2)}px)`;
		if (outEl && p < 1) {
			outEl.style.visibility = "visible";
			outEl.style.transform = `translateX(${(-FRAME_W * p).toFixed(2)}px)`;
		}
	},
	/** Scale jump on a hard cut: lands at 3× from the left edge, settles to set size. */
	scale(inEl, _outEl, t, at) {
		inEl.style.transform = `scale(${lerp(3, 1, springHeavy(t - at)).toFixed(4)})`;
	},
};

/** Fails at load: first state must be a cut, entrances must exist, fit and rotate. */
(function validateEntrances() {
	const fail = (m) => { throw new Error(`entrances: ${m}`); };
	if (REVEAL[BEATS[0].id]) fail(`first state "${BEATS[0].id}" must be a hard cut (frame 0 at full value)`);
	BEATS.forEach((b, i) => {
		if (!$(b.id)) fail(`no element #${b.id}`);
		const r = REVEAL[b.id];
		if (r && !REVEALS[r]) fail(`unknown entrance "${r}" on ${b.id}`);
		if (r && i > 0 && r === REVEAL[BEATS[i - 1].id]) fail(`${b.id} repeats "${r}" — rotate`);
		if ((r === "wipe" && WIPE > b.to - b.from) || (r === "push" && PUSH > b.to - b.from)) fail(`${b.id} is shorter than its entrance`);
	});
})();

/**
 * The recurring actor: one accent block that travels, floods the frame (the cut to the
 * next state) and returns as the CTA band. One rectangle morphing, never a fade.
 */
function actor(t) {
	const el = $("actor");
	const travel = expoOut(prog(t, 0, 0.5));
	const grow = inOut(prog(t, 1, 1.5));
	const band = expoOut(prog(t, 4.75, 5));
	// Visible until the proof wipe has landed (it sits under proof in the DOM), then back
	// above the end shot as the CTA band.
	el.style.visibility = t < 2 || t >= 4.75 ? "visible" : "hidden";
	el.style.zIndex = t >= 4.75 ? "1" : "auto";
	const r = t < 2
		? { x: lerp(-360, 0, travel), y: lerp(1500, 0, grow), w: lerp(lerp(0, 360, travel), 1080, grow), h: lerp(120, 1920, grow) }
		: { x: 0, y: 1260, w: lerp(0, 1080, band), h: 160 };
	el.style.transform = `translate(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px)`;
	el.style.width = `${r.w.toFixed(2)}px`;
	el.style.height = `${r.h.toFixed(2)}px`;
}

/** Words of a line revealed one by one behind hard-edged masks (no opacity). */
function words(ids, t, at, gap, dur) {
	stagger(t, at, ids.length, gap, dur).forEach((p, i) => {
		const el = $(ids[i]);
		el.style.clipPath = `inset(0 ${(100 * (1 - p)).toFixed(3)}% 0 0)`;
		el.style.visibility = p <= 0 ? "hidden" : "visible";
	});
}

/** Flat-shaded CSS 3D cube: a quarter turn reveals its accent face (one job, no spin). */
function cube(t, at) {
	$("cube").style.transform = `rotateX(-14deg) rotateY(${(-90 * springBox(t - at)).toFixed(3)}deg)`;
}

/**
 * Draws frame `t`. Pure function of `t`: the same value paints the same pixels,
 * whatever was drawn before (the capture may seek in any order, in parallel chunks).
 *
 * @param {number} t - Seconds, wrapped into [0, DURATION)
 */
function seek(t) {
	const time = ((t % DURATION) + DURATION) % DURATION;
	const i = BEATS.findIndex((b) => time >= b.from && time < b.to);
	BEATS.forEach((b, j) => reset($(b.id), j === i));
	if (i < 0) return;
	const cur = BEATS[i];
	const enter = REVEALS[REVEAL[cur.id]];
	if (enter) enter($(cur.id), i > 0 ? $(BEATS[i - 1].id) : null, time, cur.from);
	actor(time);
	words(["w1", "w2", "w3", "w4"], time, 0.5, 0.1, 0.2);
	// Counter: 0 → 18 at 2.0 s, retargeted to 42 at 2.5 s (springSum), shown as whole values.
	$("value").textContent = String(Math.round(springSum(time, 0, [{ at: 2, to: 18 }, { at: 2.5, to: 42 }], springUI)));
	$("rule").style.transform = `scaleX(${expoOut(prog(time, 2.5, 3)).toFixed(4)})`;
	cube(time, 3.5);
	words(["d1", "d2"], time, 4, 0.25, 0.25);
	// Art-direction calls go here (kinetic-type, composition-grid applyCamera).
}

window.seek = seek;
window.DURATION = DURATION;
window.FPS = FPS;
window.STILLS = STILLS;
window.ready = Promise.all([
	document.fonts.ready,
	...[...document.images].map((img) => img.decode().catch(() => undefined)),
]).then(() => {
	for (const a of document.getAnimations()) a.pause();
	return true;
});

/** `?t=` holds a frame; `?capture` paints t=0 and waits; otherwise preview loop. */
window.ready.then(() => {
	const q = new URLSearchParams(location.search);
	if (q.has("t")) return seek(Number(q.get("t")));
	if (q.has("capture")) return seek(0);
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return seek(STILLS[1]);
	const start = performance.now();
	const tick = (now) => {
		seek((now - start) / 1000);
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
});
```

The cube is the one 3D gesture of this example: its job is a **reveal** (the paper face
leaves, the accent face lands under "Ship it."). Faces are flat palette values — paper,
accent, a darker accent step on top — with no light, no shadow. A lit three.js object
and its determinism path: [webgl-scene.md](webgl-scene.md).

### Porting GSAP or WAAPI into `seek`

```javascript
// GSAP: build the timeline paused at load, then inside seek(t):
tl.pause();
tl.totalTime(t + 0.001, true); // nudge so from-tweens render; `true` = suppressEvents (callbacks do NOT fire)
tl.totalTime(t, true);

// WAAPI: every animation paused at load, then inside seek(t):
for (const a of document.getAnimations()) a.currentTime = t * 1000;
```

A ported animation keeps its own entrances: check them against `motion-craft`
anti-slop-video.md (no opacity-only reveal, no crossfade) before porting, not after.

---

## File: `.motion/scene/index.html` — single-canvas variant

One world, a camera, everything recomputed from `t` (field template, ultimaxbt,
2026-10-07 — log-space zoom, side-by-side scenes, flood). Flat and hard-edged: no
`globalAlpha`, no canvas `filter`, no gradient, no shadow. Text is left-aligned on the
margin. Loads `lib.js` above; same contract, so `render.js` drives it unchanged.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Canvas film: one-sentence message here</title>
<style>
	html, body { margin: 0; background: #0b0c10; overflow: hidden; }
	canvas { display: block; width: 1080px; height: 1920px; }
</style>
</head>
<body>
<canvas id="film" aria-label="Canvas film"></canvas>
<script src="lib.js"></script>
<script>
/**
 * Single-canvas variant: one world, a camera, everything recomputed from `t` inside
 * seek(t). Uses lib.js (prog, lerp, inOut, expoOut, springHeavy, stagger,
 * validateDensity). Same contract as timeline.js. Frame 0 already shows the word.
 */
(() => {
	const W = 1080, H = 1920, MARGIN = 72;
	const DURATION = 6, FPS = 30;
	/** look.md tokens as hex (placeholders — copy the film's real ink / paper / accent). */
	const INK = "#0b0c10", PAPER = "#f6f4ee", ACCENT = "#f0a020";
	const FONT = "ui-sans-serif, system-ui, sans-serif";
	/** 120 BPM plan: one primary gesture per half-beat slot, a 1.0 s CTA still at the end. */
	const GESTURES = [
		{ kind: "settle", role: "primary", at: 0, dur: 0.5 }, // "Still" lands from 1.2× (full value at frame 0)
		{ kind: "stagger", role: "primary", at: 0.5, dur: 0.5 }, // label words
		{ kind: "grow", role: "primary", at: 1, dur: 0.5 }, // accent plane from the left edge
		{ kind: "draw", role: "primary", at: 1.5, dur: 0.5 }, // rule under the label
		{ kind: "pan", role: "primary", at: 2, dur: 0.5 }, // camera travels to scene 2
		{ kind: "travel", role: "primary", at: 2.5, dur: 0.5 }, // the causing block drops in
		{ kind: "flood", role: "primary", at: 3, dur: 0.4 }, // accent floods from the block
		{ kind: "mask", role: "primary", at: 3.5, dur: 0.5 }, // "Ship it." behind a hard edge
		{ kind: "zoom", role: "primary", at: 4, dur: 0.5 }, // camera enters the CTA (log space)
		{ kind: "stagger", role: "primary", at: 4.5, dur: 0.5 }, // URL words
	];
	validateDensity(GESTURES, DURATION, FPS);
	const STILLS = GESTURES.map((g) => Math.round((g.at + g.dur * 0.9) * FPS) / FPS);
	const canvas = document.getElementById("film");
	const dpr = window.devicePixelRatio || 1; // backing store at device pixels
	canvas.width = Math.round(W * dpr);
	canvas.height = Math.round(H * dpr);
	const ctx = canvas.getContext("2d");
	const SCENE2 = W; // scenes side by side on ONE world: scene k spans x ∈ [k·W, (k+1)·W]
	const CAUSE = { x: SCENE2 + MARGIN, y: 560, s: 160 };

	/** Camera: pan to scene 2, then zoom into the CTA word with zoom lerped in LOG space. */
	function camera(t) {
		const pan = inOut(prog(t, 2, 2.5));
		const zoom = inOut(prog(t, 4, 4.5));
		return {
			x: lerp(lerp(W / 2, SCENE2 + W / 2, pan), SCENE2 + 430, zoom),
			y: lerp(H / 2, 900, zoom),
			z: Math.exp(lerp(Math.log(1), Math.log(1.35), zoom)),
		};
	}
	function applyCamera(cam) {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.scale(cam.z * dpr, cam.z * dpr);
		ctx.translate(-cam.x, -cam.y);
	}
	const toScreen = (x, y, cam) => ({
		x: (x - cam.x) * cam.z * dpr + canvas.width / 2,
		y: (y - cam.y) * cam.z * dpr + canvas.height / 2,
	});

	/** Ground: ink, then a hard-edged accent circle grown to the FARTHEST corner. */
	function ground(t, at, dur, from) {
		const p = inOut(prog(t, at, at + dur));
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = p >= 1 ? ACCENT : INK;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if (p > 0 && p < 1) {
			const corners = [[0, 0], [canvas.width, 0], [0, canvas.height], [canvas.width, canvas.height]];
			const r = Math.max(...corners.map(([x, y]) => Math.hypot(x - from.x, y - from.y)));
			ctx.fillStyle = ACCENT;
			ctx.beginPath();
			ctx.arc(from.x, from.y, r * p, 0, Math.PI * 2);
			ctx.fill();
		}
		return p >= 1;
	}
	/** Left-aligned text; `reveal` < 1 clips it behind a hard vertical edge (no alpha). */
	function text(str, x, y, size, weight, color, reveal = 1) {
		if (reveal <= 0) return;
		ctx.save();
		ctx.font = `${weight} ${size}px ${FONT}`;
		ctx.textAlign = "left";
		ctx.beginPath();
		ctx.rect(x, y - size, ctx.measureText(str).width * reveal, size * 1.3);
		ctx.clip();
		ctx.fillStyle = color;
		ctx.fillText(str, x, y);
		ctx.restore();
	}
	/** Words revealed one by one; returns nothing, draws from `t` alone. */
	function words(list, x, y, size, color, t, at) {
		ctx.font = `400 ${size}px ${FONT}`;
		let cx = x;
		stagger(t, at, list.length, 0.1, 0.2).forEach((p, i) => {
			text(list[i], cx, y, size, 400, color, p);
			cx += ctx.measureText(`${list[i]} `).width;
		});
	}

	/** Draws frame `t` from `t` alone. */
	function seek(t) {
		const time = ((t % DURATION) + DURATION) % DURATION;
		const cam = camera(time);
		const drop = expoOut(prog(time, 2.5, 3));
		const cy = lerp(-200, CAUSE.y, drop);
		const flooded = ground(time, 3, 0.4, toScreen(CAUSE.x + CAUSE.s / 2, cy + CAUSE.s / 2, cam));
		const fg = flooded ? INK : PAPER;
		applyCamera(cam);
		// Scene 1 — the word at full value from frame 0, settling from 1.2× on the heavy spring.
		ctx.save();
		ctx.translate(-60, 1100);
		ctx.scale(lerp(1.2, 1, springHeavy(time)), lerp(1.2, 1, springHeavy(time)));
		text("Still", 0, 0, 400, 800, fg);
		ctx.restore();
		words(["waiting", "on", "your", "deploys"], MARGIN, 1260, 52, fg, time, 0.5);
		ctx.fillStyle = ACCENT;
		ctx.fillRect(0, 1400, W * expoOut(prog(time, 1, 1.5)), 520);
		ctx.fillStyle = fg;
		ctx.fillRect(MARGIN, 1300, 560 * expoOut(prog(time, 1.5, 2)), 10);
		// Scene 2 — the causing block, then the CTA on the margin.
		ctx.fillStyle = ACCENT;
		if (!flooded) ctx.fillRect(CAUSE.x, cy, CAUSE.s, CAUSE.s); // it became the ground: no seam
		text("Ship it.", SCENE2 + MARGIN, 960, 200, 800, fg, expoOut(prog(time, 3.5, 4)));
		words(["install", "command", "or", "URL"], SCENE2 + MARGIN, 1060, 44, fg, time, 4.5);
	}

	window.seek = seek;
	window.DURATION = DURATION;
	window.FPS = FPS;
	window.STILLS = STILLS;
	window.ready = document.fonts.ready.then(() => true);
	window.ready.then(() => {
		const q = new URLSearchParams(location.search);
		if (q.has("t")) return seek(Number(q.get("t")));
		if (q.has("capture")) return seek(0);
		const start = performance.now();
		const tick = (now) => { seek((now - start) / 1000); requestAnimationFrame(tick); };
		requestAnimationFrame(tick);
	});
})();
</script>
</body>
</html>
```

Density check (validated at load): 10 primary gestures over the 5.0 s body = 2.0 per s,
no gap over 0.1 s, final CTA still 5.0-6.0 s = 1.0 s ≤ 1.2.

## Adapting

| Change | Where |
|--------|-------|
| Real beat map (ad) | Replace `beats.js` by cut-rhythm.md's `rhythm.js`; add one `.shot` per state id |
| New gesture | Add it to `GESTURES` first (kind, role, at, dur); `validateDensity` rejects a plan that leaves a gap |
| New entrance | Add it to `REVEALS` (clip-path / transform / visibility only); the load check enforces rotation |
| Different spring | `spring(stiffness, damping)` — throws when ζ = damping / (2·√stiffness) < 0.85 |
| A value retargeted on several beats | `springSum(t, v0, [{at, to}, …], springUI)` |
| Letter / word kinetics | kinetic-type.md (`kinetic.js`): letter stagger, slam, scale jump, split |
| Dragged knob, stretching indicator, content swap | [interaction-kit.md](interaction-kit.md) |
| Lit 3D object | [webgl-scene.md](webgl-scene.md) (pinned local three, SwiftShader, sha256 twice) |
| Counter | Change displayed values on frame boundaries ([determinism.md](../determinism.md)) |
| Fast camera travel | A wider window, or master motion blur (`--subframes 12`, render-cli.md) |
| A file nearing 200 lines | Move a block into its own classic script between `beats.js` and `timeline.js` |
