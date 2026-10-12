---
name: capture-cdp
description: Complete zero-dependency frame capture (.motion/capture.js) — headless Chrome driven over the DevTools Protocol with Bun's fetch + WebSocket, seek-then-double-rAF screenshots, parallel frame ranges
keywords: capture, cdp, devtools protocol, chrome, headless, bun, websocket, screenshot, frames
---

# CDP Capture Template

Generalized from the proven `docs/demo/statusline-mod/motion-capture.js`: same Chrome
lookup, same `DevToolsActivePort` handshake, same minimal CDP session, same
seek → double `requestAnimationFrame` → `Page.captureScreenshot` loop. Added: a reusable
`withPage` (stills and frames share it), frame **ranges** for parallel chunks, a scene
contract check, page-error surfacing, and opt-in extra flags.

**Tested** (bun 1.4.2, Chrome 154, macOS): 6 times shot forward then in reverse →
byte-identical PNGs; `--jobs 4` over 1440 frame indices → one gap-free sequence.

## Why zero dependencies

| Choice | Reason |
|--------|--------|
| Bun `fetch` + `WebSocket` instead of Puppeteer/Playwright | Nothing to install, nothing to pin; the CDP surface used is 5 methods |
| `--remote-debugging-port=0` + `DevToolsActivePort` | Chrome picks a free port: parallel instances never collide |
| One profile per instance | Parallel chunks need separate `--user-data-dir` |
| Delete the stale port file first | A reused profile keeps the previous run's port |

## CDP methods used

| Method | Purpose |
|--------|---------|
| `PUT /json/new?about:blank` | Open a page target, get its WebSocket URL |
| `Page.enable` / `Page.loadEventFired` | Wait for the load event |
| `Emulation.setDeviceMetricsOverride` | Exact viewport + `deviceScaleFactor` (output px = CSS px x scale) |
| `Runtime.evaluate` (`awaitPromise`) | Call `seek`, await `ready` and the double rAF |
| `Page.captureScreenshot` (`png`) | Lossless frame |

---

## File: `.motion/capture.js`

```javascript
/**
 * Zero-dependency frame capture through the Chrome DevTools Protocol: headless Chrome +
 * Bun's own fetch and WebSocket. Every frame is painted by the page's `window.seek(t)`,
 * so the capture is deterministic and never bound to the wall clock.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const CHROME_CANDIDATES = [
	process.env.CHROME_BIN,
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/Applications/Chromium.app/Contents/MacOS/Chromium",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium",
].filter(Boolean);

/**
 * Flags proven by the reference pipeline. --disable-gpu-compositing: CSS 3D
 * (preserve-3d) frames differed by 1 LSB between runs without it; identical with it
 * (Chrome 154, 2026-10-11, 14 times x 2 runs).
 */
const BASE_FLAGS = ["--headless=new", "--remote-debugging-port=0", "--hide-scrollbars",
	"--force-color-profile=srgb", "--no-first-run", "--disable-gpu-compositing"];

/**
 * Extra flags from MOTION_CHROME_FLAGS (space-separated), for the field-reported
 * determinism flags. Reported, verify on your Chromium before relying on them.
 */
const EXTRA_FLAGS = (process.env.MOTION_CHROME_FLAGS ?? "").split(/\s+/).filter(Boolean);

/** @returns {string} The first Chrome/Chromium binary on disk. */
export function findChrome() {
	const bin = CHROME_CANDIDATES.find((p) => existsSync(p));
	if (!bin) throw new Error("No Chrome/Chromium found; set CHROME_BIN.");
	return bin;
}

/** Waits until Chrome writes its DevTools port into the profile, then returns it. */
async function devtoolsPort(profile) {
	const file = join(profile, "DevToolsActivePort");
	for (let i = 0; i < 100; i++) {
		if (existsSync(file)) return readFileSync(file, "utf8").split("\n")[0];
		await Bun.sleep(100);
	}
	throw new Error("Chrome did not expose a DevTools port.");
}

/** A minimal CDP session over one page target: `send` a command, wait `once` for an event. */
function session(ws) {
	let id = 0;
	const pending = new Map();
	const waiters = new Map();
	ws.onmessage = (ev) => {
		const msg = JSON.parse(ev.data);
		if (msg.id && pending.has(msg.id)) {
			const { ok, ko } = pending.get(msg.id);
			pending.delete(msg.id);
			msg.error ? ko(new Error(msg.error.message)) : ok(msg.result);
		} else if (msg.method && waiters.has(msg.method)) {
			waiters.get(msg.method)();
			waiters.delete(msg.method);
		}
	};
	const send = (method, params = {}) =>
		new Promise((ok, ko) => {
			pending.set(++id, { ok, ko });
			ws.send(JSON.stringify({ id, method, params }));
		});
	const once = (method) => new Promise((ok) => waiters.set(method, ok));
	return { send, once };
}

/**
 * Opens the page in a fresh headless Chrome, waits for the scene contract, runs `job`,
 * and always kills Chrome.
 *
 * @param {{url: string, profile: string, width: number, height: number, scale: number}} o
 * @param {(page: {evaluate: (expr: string) => Promise<any>, shoot: (t: number, file: string) => Promise<void>}) => Promise<any>} job
 * @returns {Promise<any>} Whatever `job` returns
 */
export async function withPage(o, job) {
	mkdirSync(o.profile, { recursive: true });
	// A profile reused from a previous run keeps its old port file: never trust it.
	rmSync(join(o.profile, "DevToolsActivePort"), { force: true });
	const chrome = Bun.spawn(
		[findChrome(), ...BASE_FLAGS, ...EXTRA_FLAGS, `--user-data-dir=${o.profile}`, "about:blank"],
		{ stdout: "ignore", stderr: "ignore" },
	);
	try {
		const port = await devtoolsPort(o.profile);
		const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
		const ws = new WebSocket(target.webSocketDebuggerUrl);
		await new Promise((ok) => (ws.onopen = ok));
		const { send, once } = session(ws);
		await send("Page.enable");
		await send("Emulation.setDeviceMetricsOverride", { width: o.width, height: o.height, deviceScaleFactor: o.scale, mobile: false });
		const loaded = once("Page.loadEventFired");
		await send("Page.navigate", { url: o.url });
		await loaded;
		const evaluate = async (expression) => {
			const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
			if (r.exceptionDetails) throw new Error(`page error: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
			return r.result.value;
		};
		const ok = await evaluate("typeof window.seek === 'function' && Promise.resolve(window.ready ?? document.fonts.ready).then(() => true)");
		if (!ok) throw new Error("Scene contract missing: window.seek(t) is not a function.");
		// Seek, then wait two animation frames so layout + paint are committed before the shot.
		const shoot = async (t, file) => {
			await evaluate(`seek(${t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
			const shot = await send("Page.captureScreenshot", { format: "png" });
			await Bun.write(file, Buffer.from(shot.data, "base64"));
		};
		const result = await job({ evaluate, shoot });
		ws.close();
		return result;
	} finally {
		chrome.kill();
	}
}

/**
 * Reads the scene's clock contract.
 *
 * @param {{evaluate: (expr: string) => Promise<any>}} page
 * @returns {Promise<{duration: number, fps: number, stills: number[]}>}
 */
export async function sceneClock(page) {
	return page.evaluate("({ duration: window.DURATION, fps: window.FPS ?? 30, stills: window.STILLS ?? [] })");
}

/**
 * Captures frames [from, to) into `outDir/frame_00000.png`… (global index, so parallel
 * chunks write disjoint files that ffmpeg reads as one sequence). With `sub` > 1, each
 * film frame f is shot `sub` times at t = (f + s/sub) / fps, s = 0..sub-1: the samples
 * stay inside [f, f+1), so a cut on a frame boundary never mixes two shots. File index =
 * f * sub + s; `encode.js` blendSubframes averages each group of `sub` (motion blur).
 *
 * @param {{url: string, outDir: string, profile: string, width: number, height: number, scale: number, fps: number, from: number, to: number, sub?: number}} o
 * @returns {Promise<number>} Frames written
 */
export async function captureRange(o) {
	mkdirSync(o.outDir, { recursive: true });
	const sub = o.sub ?? 1;
	return withPage(o, async (page) => {
		for (let f = o.from; f < o.to; f++) {
			for (let s = 0; s < sub; s++) {
				await page.shoot((f + s / sub) / o.fps, join(o.outDir, `frame_${String(f * sub + s).padStart(6, "0")}.png`));
			}
			if ((f - o.from) % 90 === 0) console.log(`  frame ${f} (${o.from}-${o.to - 1}) x${sub}`);
		}
		return o.to - o.from;
	});
}
```

---

## Using `withPage` for one-off shots

```javascript
// e.g. a determinism check: shoot the same times forward, then reversed, and compare bytes.
import { join } from "node:path";
import { withPage } from "./capture.js";

const url = `file://${join(import.meta.dir, "scene/index.html")}?capture`;
const view = { url, profile: join(import.meta.dir, "work/chrome-check"), width: 1080, height: 1920, scale: 1 };
await withPage(view, async (page) => {
	for (const t of [0.5, 4.2, 9.1]) await page.shoot(t, join(import.meta.dir, `work/a-${t}.png`));
	for (const t of [9.1, 4.2, 0.5]) await page.shoot(t, join(import.meta.dir, `work/b-${t}.png`));
});
// then: cmp work/a-4.2.png work/b-4.2.png  → no output = identical
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `No Chrome/Chromium found` | `CHROME_BIN=/path/to/chrome bun .motion/render.js` |
| `did not expose a DevTools port` | Another Chrome holds the profile; delete `.motion/work/chrome-*` |
| `Scene contract missing` | The page did not define `window.seek` — check the console via `?t=0` in a browser |
| `page error: …` | An exception thrown inside `seek(t)`; fix the scene, the message has the stack |