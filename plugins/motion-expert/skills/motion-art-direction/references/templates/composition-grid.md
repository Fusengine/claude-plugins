---
name: composition-grid
description: Complete composition template for a 1080×1920 scene, the SECOND block of the scene step — 6-col grid tokens (72 px margins, 24 px gutter, 160 px rows), flush-left placement, bleeding word-object, ink/accent planes, a 2D camera on one world canvas whose moves start on a cut and last ≤ 2 beats (no drift, no zoom in-then-out), and a per-frame audit (TYPE_SCALE, largest type px, centered, area-weighted VALUE_CONTRAST, full bleed, mid-tone fills) for stills
keywords: grid, 6 columns, margins, rows, safe zone, bleed, crop, word-object, plane, band, scale contrast, 2d camera, pan, zoom, log zoom, drift, world, audit, value contrast, full bleed, seek
---

# Composition Grid Template

Second block of the scene step: **rhythm.js → grid.js (this) → kinetic.js → timeline.js**,
each a classic script after `motion-render`'s `lib.js` (top-level names are shared, each
file within `FUSE_SOLID_MAX_LINES`). It needs `CUTS`, `BEAT`, `FPS` and `ground()` from
[cut-rhythm.md](cut-rhythm.md), plus `prog`, `lerp`, `inOut` and `$` from `lib.js`
(timeline-seek.md, mechanics only). A camera move is a primary gesture: list it in the
state's gestures so `validateDensity` counts it.
DOM variant, one `#world`; grid in CSS custom properties so look.md values map 1:1. All
px are at the 1080-wide output frame (render at scale 1: CSS px = output px).

| Piece | Rule enforced | Critic |
|-------|---------------|--------|
| `--col`, `--row` tokens | Every object sits on a col/row line, flush-left | F7 |
| `.plane` | Every field ≥ 20 % is a `.plane` in ink, paper or accent — no other fill | F2, F9 |
| `#world` + `camera(t)` | 2D only (translate + scale), one canvas, scenes side by side | D7 |
| `MOVES` guards | `why` mandatory; starts on a cut ±1 frame; ≤ 2 beats; no zoom in then straight back out | M2, M3 |
| `auditFrame()` | `typeScale` ≥ 4, `maxType` ≥ 180 px, `centered` empty, `valueContrast` ≥ 60, `fullBleed`, `midTone` | F2, F3, F7, F8, F9, F10 |

Untested as a whole film. The JS passed `node --check`. Shoot STILLS twice and compare
sha256 before G1.

---

## File: `.motion/scene/index.html` (stage, grid, world)

```html
<style>
	*, *::before, *::after { animation: none !important; transition: none !important; }
	:root {
		--W: 1080px; --H: 1920px;
		--margin: 72px; --gutter: 24px; --col: 136px; --row: 160px;   /* (1080-144-5*24)/6 */
		--ink: oklch(14% 0.01 260); --paper: oklch(97% 0.01 90); --accent: oklch(78% 0.17 65);
		--fg: var(--paper); --bg: var(--ink);
	}
	html, body { margin: 0; background: var(--bg); overflow: hidden; }
	#stage { position: relative; width: var(--W); height: var(--H); overflow: hidden; background: var(--bg); color: var(--fg); }
	/* One world; scenes are laid side by side on it so a pan really travels. */
	#world { position: absolute; left: 0; top: 0; width: 2160px; height: 3840px; transform-origin: 0 0; }
	.scene { position: absolute; width: var(--W); height: var(--H); }
	/* Placement on the grid: --c = column index 0..5, --r = row index 0..11. Always flush-left. */
	.at { position: absolute; left: calc(var(--margin) + var(--c) * (var(--col) + var(--gutter)));
		top: calc(var(--r) * var(--row)); text-align: left; }
	/* A plane is a flat field in one role colour: full-bleed or a band >= 20 % of the frame. */
	.plane { position: absolute; left: 0; width: var(--W); }
	.object { font-size: 400px; font-weight: 800; letter-spacing: -0.03em; line-height: 0.85; }
	.display { font-size: 200px; font-weight: 800; letter-spacing: -0.03em; line-height: 0.9; }
	.label { font-size: 52px; font-weight: 400; }
	/* Bleed: the word-object deliberately starts left of the frame. */
	.bleed-left { left: -60px; }
</style>
<main id="stage" aria-label="Film">
	<div id="world">
		<!-- hook: ink ground (cut-rhythm ground), visible at t = 0 at full value -->
		<section class="scene" style="left:0; top:0">
			<span class="at object bleed-left" style="--c:0; --r:6">still</span>
			<span class="at label" style="--c:0; --r:8">your deploys</span>
		</section>
		<!-- proof: ink ground, "0" word-object + display word on one baseline -->
		<section class="scene" style="left:1080px; top:0">
			<span class="at object" style="--c:0; --r:5">0</span>
			<span class="at display" style="--c:2; --r:6">failed</span>
			<span class="at label" style="--c:0; --r:9">deploy log, last 30 days</span>
		</section>
		<!-- CTA: ink ground + accent band rows 6-8 (480 px = 25 % of the frame) -->
		<section class="scene" style="left:0; top:1920px">
			<div class="plane" style="top:960px; height:480px; background:var(--accent)"></div>
			<span class="at object" style="--c:0; --r:6; color:var(--ink)">ship</span>
			<span class="at label" style="--c:0; --r:10">example.com</span>
		</section>
	</div>
</main>
```

---

## File: `.motion/scene/grid.js` (loaded after rhythm.js)

```javascript
	// ── 2D camera on one world — every move motivated, no drift ─────────────────────
	const STAGE = { w: 1080, h: 1920 };
	/** Start pose: the first scene, zoom 1. */
	const POSE0 = { x: 540, y: 960, z: 1 };
	/**
	 * Camera moves in time order. `dur: 0` = a camera cut. A move is an event between
	 * holds: it starts on a cut and lasts ≤ 2 beats. A slower move is drift (banned).
	 */
	const MOVES = [
		{ at: 6.0, dur: 0, to: { x: 1620, y: 960, z: 1 }, why: "hard cut from the turn to the proof scene" },
		{ at: 7.0, dur: 0.5, to: { x: 1300, y: 760, z: 2.2 }, why: "enter the 0 on the match cut — it is proof-2's scale gesture" },
		{ at: 11.0, dur: 0, to: { x: 540, y: 2880, z: 1 }, why: "hard cut to the CTA scene" },
	];
	(() => {
		const cutTimes = CUTS.map((c) => c.from);
		let pose = POSE0, before = null;
		for (const m of MOVES) {
			if (!m.why) throw new Error(`camera move at ${m.at}s has no why`);
			if (!cutTimes.some((c) => Math.abs(c - m.at) <= 1 / FPS)) throw new Error(`camera move at ${m.at}s is not on a cut`);
			if (m.dur > 2 * BEAT) throw new Error(`camera move at ${m.at}s lasts ${m.dur}s > 2 beats: drift`);
			const back = before && m.to.z < pose.z && Math.abs(m.to.x - before.x) < 1 && Math.abs(m.to.y - before.y) < 1;
			if (back) throw new Error(`camera move at ${m.at}s zooms straight back out`);
			before = m.to.z > pose.z ? pose : null;
			pose = m.to;
		}
	})();

	/**
	 * Camera pose at `t`: each move starts from the previous move's end pose. Position
	 * eased with the film in-out curve, zoom lerped in log space (1→2 as even as 2→4).
	 *
	 * @param {number} t - Film time (s)
	 * @returns {{x:number, y:number, z:number}} world point at frame centre + zoom
	 */
	function camera(t) {
		let pose = POSE0;
		for (const m of MOVES) {
			const p = m.dur === 0 ? (t >= m.at ? 1 : 0) : inOut(prog(t, m.at, m.at + m.dur));
			if (p <= 0) break;
			pose = {
				x: lerp(pose.x, m.to.x, p),
				y: lerp(pose.y, m.to.y, p),
				z: Math.exp(lerp(Math.log(pose.z), Math.log(m.to.z), p)),
			};
			if (p < 1) break;
		}
		return pose;
	}

	/** Applies the pose to #world: the world point (x, y) lands at the frame centre. */
	function applyCamera(t) {
		const { x, y, z } = camera(t);
		const tx = STAGE.w / 2 - x * z, ty = STAGE.h / 2 - y * z;
		$("world").style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(5)})`;
	}
	// In seek(t): window.__lastT = time; applyCamera(time); then the kinetic-type calls.

	// ── Per-frame audit (stills only, never inside seek) ────────────────────────────
	/**
	 * OKLCH lightness (0-100) and chroma of a computed CSS colour.
	 * Handles oklch(), rgb()/rgba() and color(srgb ...).
	 *
	 * @param {string} css - Computed colour string
	 * @returns {{L:number, C:number}}
	 */
	function oklchOf(css) {
		const n = (css.match(/-?[\d.]+%?/g) || []).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v)));
		if (css.startsWith("oklch(")) return { L: 100 * n[0], C: n[1] };
		const rgb = css.startsWith("color(srgb") ? n.slice(0, 3) : n.slice(0, 3).map((v) => v / 255);
		const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
		const [r, g, b] = rgb.map(lin);
		const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
		const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
		const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
		const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
		const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
		return { L: 100 * (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s), C: Math.hypot(A, B) };
	}
	/** Lightness of a look.md role, read from the :root custom property. */
	const roleL = (name) => {
		const probe = document.createElement("i");
		probe.style.color = `var(--${name})`;
		document.body.append(probe);
		const L = oklchOf(getComputedStyle(probe).color).L;
		probe.remove();
		return L;
	};

	/**
	 * Measures what look.md promises on the current frame: call after seek(t) via
	 * `?t=<s>&audit` and read the console. Planes are `.plane` elements (assumed not to
	 * overlap) plus the stage ground (frame minus planes).
	 *
	 * @returns {{typeScale:number, maxType:number, centered:string[], planes:Array,
	 *   valueContrast:number, fullBleed:boolean, midTone:boolean}}
	 */
	function auditFrame() {
		const frame = $("stage").getBoundingClientRect();
		const area = frame.width * frame.height;
		const z = camera(window.__lastT || 0).z;
		const visible = (el) => getComputedStyle(el).visibility !== "hidden";
		const inFrame = (r) => r.right > frame.left && r.left < frame.right && r.bottom > frame.top && r.top < frame.bottom;
		const texts = [...document.querySelectorAll("#world .at")].filter((el) => visible(el) && inFrame(el.getBoundingClientRect()));
		const sizes = texts.map((el) => parseFloat(getComputedStyle(el).fontSize) * z);
		const maxType = sizes.length ? Math.max(...sizes) : 0;
		const typeScale = sizes.length ? maxType / Math.min(...sizes) : 0;
		const centered = texts.filter((el) => {
			const r = el.getBoundingClientRect(), cs = getComputedStyle(el), ps = getComputedStyle(el.parentElement);
			const mid = Math.abs((r.left + r.right) / 2 - (frame.left + frame.right) / 2) < 0.02 * frame.width;
			const offMargin = r.left > frame.left + 72 + 2;
			return cs.textAlign === "center" || [ps.justifyContent, ps.placeContent, ps.justifyItems].includes("center") || (mid && offMargin);
		}).map((el) => el.textContent.trim());
		const clip = (r) => Math.max(0, Math.min(r.right, frame.right) - Math.max(r.left, frame.left)) *
			Math.max(0, Math.min(r.bottom, frame.bottom) - Math.max(r.top, frame.top));
		const planes = [...document.querySelectorAll("#world .plane")].filter(visible).map((el) => ({
			share: clip(el.getBoundingClientRect()) / area, ...oklchOf(getComputedStyle(el).backgroundColor),
		})).filter((p) => p.share > 0);
		const covered = planes.reduce((s, p) => s + p.share, 0);
		planes.push({ share: 1 - covered, ...oklchOf(getComputedStyle($("stage")).backgroundColor) });
		const big = planes.filter((p) => p.share >= 0.2).sort((a, b) => b.share - a.share);
		const dark = [roleL("ink"), roleL("accent")];
		const isDark = (p) => dark.some((L) => Math.abs(L - p.L) < 1);
		const typeGap = (p) => Math.min(...texts.map((el) => Math.abs(oklchOf(getComputedStyle(el).color).L - p.L)));
		let valueContrast = 0;
		if (big.length >= 2) valueContrast = Math.abs(big[0].L - big[1].L);
		else if (big.length === 1 && isDark(big[0])) valueContrast = texts.length ? typeGap(big[0]) : 0;
		const fullBleed = planes.some((p) => p.share >= 0.5 && isDark(p));
		const midTone = planes.some((p) => p.share > 0.05 && p.L >= 30 && p.L <= 85 && p.C < 0.03);
		const round = (v) => +v.toFixed(2);
		return {
			typeScale: round(typeScale), maxType: round(maxType), centered,
			planes: planes.map((p) => ({ share: round(p.share), L: round(p.L), C: +p.C.toFixed(3) })),
			valueContrast: round(valueContrast), fullBleed, midTone,
		};
	}
	window.auditFrame = auditFrame;
	// In the `?t=` branch of the contract: if (q.has("audit")) console.log(JSON.stringify(auditFrame()));
```

---

## Reading the audit

Run it on every still. The thresholds are the dials ([../dials.md](../dials.md)) and equal
the critic floors.

| Field | Pass on a hero frame | Critic |
|-------|----------------------|--------|
| `typeScale` | ≥ 4 (ideal ~8); a one-size frame passes when `maxType` ≥ 180 | F8 |
| `maxType` | ≥ 180 px | F3 |
| `centered` | `[]`, always (no centered exception, CTA included) | F7 |
| `valueContrast` | ≥ 60 (two largest planes ≥ 20 %; a lone plane must be ink/accent) | F2 |
| `fullBleed` | `true` on ≥ ⌈N/3⌉ states (cut-rhythm validator plans it) | F10 |
| `midTone` | `false` | F9 |

The ≥ 40 % empty check and the bleed count stay visual: on the still, the glyph-free area is
≥ 40 %, and a glyph is cut by the frame edge in at least one scene.

## Adapting

| Change | How |
|--------|-----|
| More scenes | Extend `#world` and place each `.scene` at a new `left`/`top`; reach it with a move or a `dur: 0` camera cut on a state cut |
| Paper state | Add a `.plane` in ink or accent ≥ 20 % (a band, a split); a lone paper ground fails |
| Inversion cut | `ground()` from cut-rhythm sets `--bg`/`--fg` on `#stage` |
| 16:9 | `--W:1920px; --H:1080px`, 12 cols, `--margin: 96px`; recompute `--col` and the audit margin |
| Canvas scene | Use the single-canvas variant in `motion-render` timeline-seek.md for the mechanics; keep `MOVES` guards and port `auditFrame` |
