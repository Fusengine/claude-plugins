---
name: index-skeleton
description: Mechanics-only DOM scene shell (.motion/scene/index.html) — fixed stage equal to the capture VIEW, CSS animation kill-switch, local fonts, look.md tokens, full-bleed shots hidden until seek draws them, the recurring actor, a drawn rule, a flat-shaded CSS 3D cube, word spans for staggers, and the ordered classic scripts (lib → beats → art-direction blocks → timeline); flush-left layout and type sizes come from motion-art-direction
keywords: index, html, scene, stage, mechanics, kill-switch, local fonts, shots, visibility, actor, rule, css 3d, cube, preserve-3d, script order, example data
---

# Scene Shell Template

Mechanics only: the stage the capture drives, the CSS clock kill-switch, local fonts,
one full-bleed `<section class="shot">` per state, hidden until `window.seek(t)` in
[timeline-seek.md](timeline-seek.md) shows it, and the elements its gestures move.
**Composition is not decided here.** Build order (after `look.md` and the key frames
exist): `motion-art-direction` templates first —
[cut-rhythm.md](../../../motion-art-direction/references/templates/cut-rhythm.md)
(beat map + gesture plan),
[composition-grid.md](../../../motion-art-direction/references/templates/composition-grid.md)
(grid, bleed, camera), [kinetic-type.md](../../../motion-art-direction/references/templates/kinetic-type.md)
(letter/word behaviours), [objects.md](../../../motion-art-direction/references/objects.md)
(the actor and objects) — then this shell wraps them for capture.

The layout block reuses composition-grid's tokens and the type ramp of
[composition.md](../../../motion-art-direction/references/composition.md) §Scale contrast,
so the example shots are already flush-left, edge-anchored, TYPE_SCALE ≥ 4. When you paste
composition-grid's `<style>`, delete the marked block — one layout, not two.

| Rule | Where in the file |
|------|-------------------|
| No CSS clock | `animation: none !important; transition: none !important` on everything |
| Fixed stage | `#stage` = `VIEW` in `render.js` (1080x1920 CSS px at scale 1 → px = output px) |
| Local fonts | `@font-face` from a file next to the scene; never a network font |
| Tokens from look.md | `--ink`, `--paper`, ONE `--accent` (+ one darker step for a 3D face); no neutral mid-tone fill |
| Full-bleed shots | Every `.shot` paints its own ground (ink / paper / accent plane) |
| Hidden until drawn | `.shot { visibility: hidden }` — no `opacity` anywhere; seek(0) shows the first shot fully |
| No `will-change` | Promoted layers made master frames history-dependent (1-LSB diffs between runs and `--jobs` chunks) |
| CSS 3D faces flat | Each face one palette value, `backface-visibility: hidden`; captured with `--disable-gpu-compositing` ([determinism.md](../determinism.md)) |
| Script order | `lib.js` → `beats.js` (or `rhythm.js`) → art-direction blocks → `timeline.js`, classic scripts (no `type="module"`: `file://` blocks modules) |
| Facts from a file | Numbers from `.motion/facts.md`, labelled "Example data" |

---

## File: `.motion/scene/index.html`

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Product film: one-sentence message here</title>
<style>
	/* Time is owned by the scene scripts: no CSS animation or transition may run on its own. */
	*, *::before, *::after { animation: none !important; transition: none !important; }
	/* Local font file only: a network font can miss the capture's fonts.ready. */
	@font-face { font-family: "Film"; src: url("fonts/film-variable.woff2") format("woff2"); font-weight: 300 900; }
	/* Tokens: copy the values from .motion/look.md (ink / paper / ONE accent + its darker step). */
	:root {
		--ink: oklch(14% 0.01 260); --paper: oklch(97% 0.01 90); --accent: oklch(78% 0.17 65);
		--accent-dark: oklch(62% 0.15 60);
		font-family: "Film", ui-sans-serif, system-ui, sans-serif;
	}
	html, body { margin: 0; background: var(--ink); overflow: hidden; }
	/* Fixed stage: the capture sets the viewport to exactly this size (VIEW in render.js). */
	#stage { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
	/* No will-change: a promoted layer keeps a raster from earlier frames. */
	.shot { position: absolute; inset: 0; visibility: hidden; }
	.ink { background: var(--ink); color: var(--paper); }
	.paper { background: var(--paper); color: var(--ink); }
	.accent { background: var(--accent); color: var(--ink); }

	/* ── Layout block: composition-grid.md tokens + composition.md ramp.
	      Delete it when you paste composition-grid's own <style>. ─────────────── */
	:root { --margin: 72px; --gutter: 24px; --col: 136px; --row: 160px; }
	.at { position: absolute; left: calc(var(--margin) + var(--c) * (var(--col) + var(--gutter)));
		top: calc(var(--r) * var(--row)); text-align: left; white-space: nowrap; margin: 0; }
	.object { font-size: 400px; font-weight: 800; letter-spacing: -0.03em; line-height: 0.85; }
	.display { font-size: 200px; font-weight: 800; letter-spacing: -0.03em; line-height: 0.9; }
	.label { font-size: 52px; font-weight: 400; }
	.example { font-size: 44px; font-weight: 400; }
	.bleed-left { left: -60px; }
	.word { display: inline-block; }
	#value { font-variant-numeric: tabular-nums; }
	/* ── End of layout block ─────────────────────────────────────────────────── */

	/* The recurring actor: one accent rectangle, positioned by seek(t) only. */
	#actor { position: absolute; left: 0; top: 0; background: var(--accent); visibility: hidden; transform-origin: 0 0; }
	/* Drawn rule: a hard-edged line scaled from its left end. */
	.rule { position: absolute; height: 12px; background: var(--ink); transform-origin: 0 50%; transform: scaleX(0); }
	/* Flat-shaded CSS 3D cube: every face one palette value, no light, no shadow. */
	.scene3d { position: absolute; left: 72px; top: 1120px; width: 360px; height: 360px; perspective: 1400px; }
	#cube { position: absolute; inset: 0; transform-style: preserve-3d; }
	#cube > i { position: absolute; inset: 0; backface-visibility: hidden; }
	#cube > .f { background: var(--paper); transform: translateZ(180px); }
	#cube > .r { background: var(--accent); transform: rotateY(90deg) translateZ(180px); }
	#cube > .t { background: var(--accent-dark); transform: rotateX(90deg) translateZ(180px); }
</style>
</head>
<body>
<!--
	Static structure only: every moving part is drawn by window.seek(t).
	One .shot per state id in BEATS; later shots stack above earlier ones (wipes/pushes).
	?t=4.5 holds a frame · ?capture waits for the capture · no query = preview loop.
-->
<main id="stage" aria-label="Product film">
	<section id="title" class="shot ink">
		<p class="at object bleed-left" style="--c:0; --r:6">Still</p>
		<p class="at label" style="--c:0; --r:9"><span id="w1" class="word">waiting</span> <span id="w2" class="word">on</span> <span id="w3" class="word">your</span> <span id="w4" class="word">deploys</span></p>
	</section>
	<div id="actor"></div>

	<section id="proof" class="shot paper">
		<p class="at label" style="--c:0; --r:2">checks passed</p>
		<p id="value" class="at object" style="--c:0; --r:4">0</p>
		<i id="rule" class="rule" style="left:72px; top:1100px; width:620px"></i>
		<p class="at example" style="--c:0; --r:10">Example data</p>
	</section>

	<section id="turn" class="shot ink">
		<p class="at display" style="--c:0; --r:3">Ship it.</p>
		<div class="scene3d"><div id="cube"><i class="f"></i><i class="r"></i><i class="t"></i></div></div>
		<p class="at label" style="--c:3; --r:8"><span id="d1" class="word">one</span> <span id="d2" class="word">decision</span></p>
	</section>

	<section id="end" class="shot ink">
		<p class="at display" style="--c:0; --r:5">Try it</p>
		<p class="at example" style="--c:0; --r:9">install command or URL</p>
	</section>
</main>
<script src="lib.js"></script>
<script src="beats.js"></script>
<!-- art-direction blocks here, each its own file: grid.js, kinetic.js (interact.js if used) -->
<script src="timeline.js"></script>
</body>
</html>
```

`#actor` sits between `title` and `proof` in the DOM: it floods the title shot, and the
proof wipe then covers it. For the CTA band it is lifted above the end shot by
`zIndex` in `actor(t)`.

## Adapting

| Change | How |
|--------|-----|
| Composition | Paste composition-grid's `<style>` + `#world`; drop the layout block above |
| Real product UI | `<img>` of a real, masked screenshot (`motion-assets`), decoded in `window.ready` |
| Objects that stand for the product | Flat DOM blocks or SVG shapes in the palette ([objects.md](../../../motion-art-direction/references/objects.md)) |
| Reuse product code | Bundle the product's real formatting/drawing functions (`Bun.build` → IIFE) |
| 16:9 film | `#stage { width: 1920px; height: 1080px }` + the same `VIEW` in `render.js`; grid per composition-grid's 16:9 row |
| TYPE_SCALE | Largest / smallest px per hero shot ≥ 4: title 400/52, proof 400/44, turn and end 200/44 |
| Phone legibility | Smallest type 44 px at the 1080-wide frame (composition.md ramp) |
| Brand font | Ship its file under `scene/fonts/`; keep ≤ 2 weights (type-as-image.md) |
