---
name: webgl-scene
description: Complete lit three.js beat for a film — three r186 pinned and bundled once to a local IIFE (never a CDN at render time), a hexagonal-prism brand mark turning on a lib.js spring under one ambient + one directional light (shading on the object's own faces only), the WebGL determinism recipe (SwiftShader/ANGLE flags, preserveDrawingBuffer, fixed DPR 1, no antialias, no cast-light maps, no tone mapping, gl.finish), and the twice-rendered sha256 proof with its CSS 3D fallback
keywords: webgl, three.js, three, r186, lit 3d, MeshLambertMaterial, flatShading, DirectionalLight, AmbientLight, swiftshader, angle, preserveDrawingBuffer, determinism, sha256, iife, bun build, vendor, css 3d fallback
---

# WebGL Scene Template (lit 3D)

Use it when the expert judges that a **lit** object serves the beat — the brand mark
turning into the CTA, a product object assembling — and says why in `look.md` and the
beat table ([objects.md](../../../motion-art-direction/references/objects.md)). Flat
faces are cheaper: CSS 3D in [timeline-seek.md](timeline-seek.md) (`#cube`).

**Tested** 2026-10-11, Chrome 154 (macOS), three 0.186.1, `MOTION_CHROME_FLAGS="--use-angle=swiftshader --enable-unsafe-swiftshader"`:
4 times shot twice in fresh profiles → identical sha256 (also with
`--disable-gpu-compositing` added). `node --check` passes on the script below.

| Rule | Why |
|------|-----|
| three pinned to an exact version, bundled to `scene/vendor/three-<ver>.iife.js` | No network at render time; `file://` blocks ES modules, so a classic-script global |
| `preserveDrawingBuffer: true` + `getContext().finish()` after `render` | The screenshot reads the frame just drawn, not a cleared buffer |
| `setPixelRatio(1)`, `antialias: false` | The GL raster never depends on the capture scale or MSAA hardware |
| SwiftShader (software GL) | GPU drivers differ; the software rasterizer gave identical bytes run to run |
| One ambient + one directional light, `MeshLambertMaterial` `flatShading` | Light shades only the object's own faces — the one exception to the gradient ban |
| No cast-light maps, env map, metalness, transmission, bloom/film/bokeh passes | Ground shadows, chrome, glass, glow, grain and depth of field stay banned (`motion-review` D1-D7) |
| Flat clear colour | No gradient background |
| Scene built once at load; `seek(t)` only sets transforms and renders | Pure function of `t`, any seek order |

**Proof or fallback:** render the stills twice (`bun .motion/render.js` ×2) and compare the
contact sha256. Different → the lit path is not deterministic on this machine: rebuild
the beat in CSS 3D. Never ship a lit beat without the proof (critic D7 c).

---

## Vendor the pinned three (once per film)

File `.motion/three-entry.mjs` (create it with the Write tool — a shell redirect into a
code file is blocked by the hook):

```javascript
import * as THREE from "three";
globalThis.THREE = THREE;
```

```bash
cd .motion || exit 1
bun add three@0.186.1            # exact version, recorded in .motion/package.json
bun build three-entry.mjs --format=iife --minify --outfile scene/vendor/three-0.186.1.iife.js
```

Checked 2026-10-11: the bundle is 0.75 MB and exposes `THREE.REVISION === "186"`,
`WebGLRenderer`, `MeshLambertMaterial`, `CylinderGeometry`, `DirectionalLight`. The bans
sweep skips `vendor/` (its source names features this scene never calls).

---

## File: `.motion/scene/index.html` (lit beat)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lit 3D beat: the hexagon mark turns into the CTA</title>
<style>
	*, *::before, *::after { animation: none !important; transition: none !important; }
	html, body { margin: 0; background: #0b0c10; overflow: hidden; }
	#gl { display: block; width: 1080px; height: 1920px; }
</style>
</head>
<body>
<canvas id="gl" width="1080" height="1920" aria-label="Lit 3D beat"></canvas>
<!-- three r186 bundled once to an IIFE global (see webgl-scene.md); never a CDN at render time. -->
<script src="vendor/three-0.186.1.iife.js"></script>
<script src="lib.js"></script>
<script>
/**
 * Lit three.js beat: a hexagonal prism (the brand mark) turns a third of a turn on a
 * spring to face the viewer, then holds as the CTA. Pure function of `t`: the scene is
 * built once at load, seek(t) only sets the rotation and renders one frame.
 * Determinism: fixed DPR 1, no antialias, no cast-light maps, no tone mapping, preserveDrawingBuffer,
 * gl.finish() after each render. Prove it: stills twice → identical sha256.
 */
(() => {
	const DURATION = 3, FPS = 30, STILLS = [0.2, 1.0, 2.5];
	const THREE = window.THREE;
	if (!THREE || THREE.REVISION !== "186") throw new Error("three r186 IIFE missing (vendor/three-0.186.1.iife.js)");
	const canvas = document.getElementById("gl");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "low-power" });
	renderer.setPixelRatio(1); // fixed DPR: the capture scale never changes the GL raster
	renderer.setSize(1080, 1920, false);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setClearColor(new THREE.Color("#0b0c10"), 1); // flat ink ground, no gradient background

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.1, 100);
	camera.position.set(0, 0, 22);
	// Light shades only the object's own faces (the one allowed gradient). No env map, no glow.
	scene.add(new THREE.AmbientLight(0xffffff, 0.55));
	const key = new THREE.DirectionalLight(0xffffff, 1.6);
	key.position.set(-4, 6, 8);
	scene.add(key);
	const prism = new THREE.Mesh(
		new THREE.CylinderGeometry(2, 2, 1.6, 6, 1, false), // hexagonal prism: the logo as an object
		new THREE.MeshLambertMaterial({ color: new THREE.Color("#f0a020"), flatShading: true }),
	);
	prism.rotation.x = Math.PI / 2; // hexagon face toward the camera at rest
	const mark = new THREE.Group(); // the turn is applied to the group, the face orientation to the mesh
	mark.add(prism);
	mark.position.set(-1.6, 2.4, 0); // flush-left, upper third: never a centered hero
	scene.add(mark);

	/** Draws frame `t` from `t` alone, then waits for the GPU to finish the frame. */
	function seek(t) {
		const time = clamp01(t / DURATION) * DURATION;
		const p = springHeavy(time - 0.3); // lib.js preset 120/19 (ζ 0.87); the turn starts on the beat
		mark.rotation.y = (-2 * Math.PI / 3) * (1 - p); // a third of a turn, lands face-on
		mark.rotation.x = 0.5 * (1 - p); // tilted while it turns, so the lit side faces read
		renderer.render(scene, camera);
		renderer.getContext().finish();
	}

	window.seek = seek;
	window.DURATION = DURATION;
	window.FPS = FPS;
	window.STILLS = STILLS;
	window.ready = document.fonts.ready.then(() => { seek(0); return true; });
	window.ready.then(() => {
		const q = new URLSearchParams(location.search);
		if (q.has("t")) return seek(Number(q.get("t")));
		if (q.has("capture")) return seek(0);
		const start = performance.now();
		const tick = (now) => { seek(((now - start) / 1000) % DURATION); requestAnimationFrame(tick); };
		requestAnimationFrame(tick);
	});
})();
</script>
</body>
</html>
```

The single beat above is a mechanics demo, not a whole film: in a film this canvas is one
layer of the DOM scene (a `.shot` holding the `<canvas>`), and its turn is one entry in
`GESTURES` (`kind: "turn", d3: true`, `validateDensity` in `lib.js`). Type stays in the
DOM above it (sharp, flush-left).

## Adapting

| Change | How |
|--------|-----|
| Another object | `BoxGeometry`, `ExtrudeGeometry` (extruded type or a logo path); keep `MeshLambertMaterial` + `flatShading` |
| Flat faces, no light | `MeshBasicMaterial` per face colour (ink / paper / accent / one accent step) — or the CSS 3D cube |
| Another three version | Change the pin, re-vendor, re-run the twice-rendered proof |
| A turn that lands as the CTA | Add the CTA type in the DOM, revealed on the beat the turn lands |
| Hashes differ | Fall back to CSS 3D; never ship an unproven lit beat |
