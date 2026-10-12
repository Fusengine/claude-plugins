/**
 * Frame-by-frame capture of the demo page through the Chrome DevTools Protocol, with no
 * dependency: headless Chrome + Bun's own fetch and WebSocket. Each frame is drawn by the
 * page's `window.seek(t)`, so the capture is deterministic and never wall-clock bound.
 */
import { mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const CHROME_CANDIDATES = [
	process.env.CHROME_BIN,
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/Applications/Chromium.app/Contents/MacOS/Chromium",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium",
].filter(Boolean);

/** The first Chrome binary on disk. */
export function findChrome() {
	const bin = CHROME_CANDIDATES.find((p) => existsSync(p));
	if (!bin) throw new Error("No Chrome/Chromium found; set CHROME_BIN.");
	return bin;
}

/** Waits until Chrome writes its DevTools port, then returns it. */
async function devtoolsPort(profile) {
	const file = join(profile, "DevToolsActivePort");
	for (let i = 0; i < 100; i++) {
		if (existsSync(file)) return readFileSync(file, "utf8").split("\n")[0];
		await Bun.sleep(100);
	}
	throw new Error("Chrome did not expose a DevTools port.");
}

/** A minimal CDP session over one page target. */
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
 * Captures every frame of the page into `outDir/frame_0000.png`…
 *
 * @param {{url: string, outDir: string, profile: string, width: number, height: number, scale: number, fps: number}} o
 * @returns {Promise<number>} Frames written
 */
export async function capture(o) {
	mkdirSync(o.outDir, { recursive: true });
	// A profile reused from a previous run keeps its old port file: never trust it.
	rmSync(join(o.profile, "DevToolsActivePort"), { force: true });
	const chrome = Bun.spawn(
		[findChrome(), "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${o.profile}`,
			"--hide-scrollbars", "--force-color-profile=srgb", "--no-first-run", "about:blank"],
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
		const evalAwait = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
		await evalAwait("document.fonts.ready.then(() => true)");
		const total = Math.round((await evalAwait("window.DURATION")).result.value * o.fps);
		for (let f = 0; f < total; f++) {
			await evalAwait(`seek(${f / o.fps}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
			const shot = await send("Page.captureScreenshot", { format: "png" });
			await Bun.write(join(o.outDir, `frame_${String(f).padStart(4, "0")}.png`), Buffer.from(shot.data, "base64"));
			if (f % 60 === 0) console.log(`  frame ${f}/${total}`);
		}
		ws.close();
		return total;
	} finally {
		chrome.kill();
	}
}
