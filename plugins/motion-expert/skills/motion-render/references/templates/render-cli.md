---
name: render-cli
description: Complete staged render CLI — .motion/render.js (--stage stills|draft|master, stills by default, --jobs, --subframes N for master motion blur, default 4 at master and 1 elsewhere; stills = one frame per beat) and .motion/encode.js (subframe blend with tmix, H.264 + GIF encoders, contact sheet, ffprobe, SSIM, budget log)
keywords: render, cli, stage, stills, draft, master, subframes, motion blur, tmix, ffmpeg, ffprobe, gif, mp4, budget, jobs
---

# Render CLI Template

Generalized from the proven `docs/demo/statusline-mod/motion-render.js` + `render.sh`
pipeline: same Chrome capture, same H.264 and palettegen/paletteuse graphs, plus stages,
gates output, parallel chunks and file verification. Stills and draft shoot one sample
per film frame. The master shoots `--subframes` samples per frame (4 by default; ≥ 12 when
any element moves > ~2 % of W per frame, rule in [encoding.md](../encoding.md)) inside `[f, f+1)` and averages them with `tmix`: motion blur that never
crosses a cut on a frame boundary. The draft the critic judges has none.

**Tested** (bun 1.4.2, ffmpeg 9.0.2, Chrome 154, macOS) on a 12 s scene:
stills twice → identical contact sha256; draft 360 frames 540p; master `--jobs 3`
→ h264 / yuv420p / 1600x900 / 30 fps / 360 frames exactly,
bt709 tags x4, SSIM vs stills ≥ 0.998; `--stage final` → exit 2. That run used the
former 1280x720 @1.25 `VIEW`; the 1080x1920 @1 default below is only a constant change.

## Layout

```
.motion/
├── render.js          ← this template
├── encode.js          ← this template
├── capture.js         ← capture-cdp.md
├── scene/index.html   ← index-skeleton.md
├── scene/timeline.js  ← timeline-seek.md
├── stills/            (generated) still-1..N.png + contact.png
├── out/               (generated) draft.mp4, master.mp4, master.gif
├── work/              (generated, gitignore) frames + Chrome profiles
└── budget.json        (generated) renders per stage + wall time
```

## Usage

```bash
bun .motion/render.js                       # stills (default) → STOP, gate G1
bun .motion/render.js --stage draft         # 540p draft → critic → STOP, gate G2
bun .motion/render.js --stage master                     # master, 4 subframes, 1 Chrome instance
bun .motion/render.js --stage master --jobs 4             # master, 4 Chrome instances
bun .motion/render.js --stage master --subframes 12       # any move > ~2 % W/frame (slam, flip, fast push)
bun .motion/render.js --stage master --subframes 1        # no motion blur
```

Edit the three constants at the top (`VIEW`, `BUDGET_MB`, `GIF`) from `.motion/brief.md`.
`MOTION_CHROME_FLAGS="--font-render-hinting=none"` passes extra (reported, verify) Chrome flags.

---

## File: `.motion/render.js`

```javascript
/**
 * Staged render of the film in `.motion/scene/index.html`.
 *
 *   bun .motion/render.js [--stage stills|draft|master] [--jobs N] [--subframes N]
 *
 * --stage defaults to `stills` when omitted: forgetting the flag can only produce the
 * cheapest, gate-G1 output, never a draft or a master.
 *   stills → .motion/stills/still-1..N.png (one per beat, window.STILLS) + contact.png, then STOP (G1)
 *   draft  → .motion/out/draft.mp4 (540p, no motion blur), then STOP (critic, gate G2)
 *   master → .motion/out/master.mp4 + master.gif, then verifies the FILES
 * --jobs N       captures in N parallel Chrome instances (worth it past ~25 s of film).
 * --subframes N  master only: N samples per frame averaged by tmix (default 4; ≥ 12 if
 *                anything moves > ~2 % of W per frame, else stepped ghost copies; 1 = none). Stills and draft always use 1.
 * Needs: bun, ffmpeg + ffprobe, Chrome or Chromium (CHROME_BIN overrides the lookup).
 */
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { captureRange, sceneClock, withPage } from "./capture.js";
import { blendSubframes, contactSheet, encodeGif, encodeMp4, logBudget, mb, probe, sha256, ssimAt } from "./encode.js";

const HERE = import.meta.dir;
const SCENE = `file://${join(HERE, "scene/index.html")}?capture`;
const STILLS_DIR = join(HERE, "stills");
const OUT = join(HERE, "out");
const WORK = join(HERE, "work"); // frames + Chrome profiles: gitignore it
const BUDGET_LOG = join(HERE, "budget.json");

/**
 * Stage geometry = `#stage` in scene/index.html: 1080x1920 CSS px at scale 1, so CSS px
 * equal output px (the unit of the art-direction grid and the critic floors).
 */
const VIEW = { width: 1080, height: 1920, scale: 1 };
/** Byte budgets per surface, copied from .motion/brief.md (placeholders, not targets). */
const BUDGET_MB = { mp4: 8, gif: 10 };
const GIF = { width: 540, gifFps: 15, colors: 96 };
const STAGES = ["stills", "draft", "master"];

/** Parses `--stage x` / `--stage=x`, `--jobs N`; unknown stage exits 2. */
function args(argv) {
	const get = (name) => {
		const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
		if (i < 0) return undefined;
		return argv[i].includes("=") ? argv[i].split("=")[1] : argv[i + 1];
	};
	const stage = get("stage") ?? "stills";
	if (!STAGES.includes(stage)) {
		console.error(`unknown --stage "${stage}" (expected ${STAGES.join("|")})`);
		process.exit(2);
	}
	const int = (v, d) => Math.max(1, Math.round(Number(v ?? d)) || d);
	const sub = int(get("subframes"), stage === "master" ? 4 : 1);
	if (stage !== "master" && sub !== 1) {
		console.error("--subframes applies to --stage master only (stills and draft carry no motion blur)");
		process.exit(2);
	}
	return { stage, jobs: int(get("jobs"), 1), sub };
}

/**
 * Captures every film frame into `dir` (`sub` samples per frame inside [f, f+1)), split
 * over `jobs` Chrome instances; files keep a global index across chunks.
 */
async function captureAll(dir, view, jobs, sub = 1) {
	rmSync(dir, { recursive: true, force: true });
	const clock = await withPage({ url: SCENE, profile: join(WORK, "chrome-0"), ...view }, sceneClock);
	const total = Math.round(clock.duration * clock.fps);
	const size = Math.ceil(total / jobs);
	const ranges = Array.from({ length: jobs }, (_, i) => [i * size, Math.min(total, (i + 1) * size)])
		.filter(([a, b]) => b > a);
	await Promise.all(ranges.map(([from, to], i) =>
		captureRange({ url: SCENE, outDir: dir, profile: join(WORK, `chrome-${i}`), fps: clock.fps, from, to, sub, ...view })));
	const raw = join(dir, "frame_%06d.png");
	if (sub === 1) return { ...clock, total, pattern: raw, sharp: (t) => join(dir, `frame_${String(Math.round(t * clock.fps)).padStart(6, "0")}.png`) };
	const blended = `${dir}-blend`;
	blendSubframes({ frames: raw, fps: clock.fps, sub, outDir: blended });
	// Sample 0 of each frame is the exact frame time: compare THAT to the approved stills.
	const sharp = (t) => join(dir, `frame_${String(Math.round(t * clock.fps) * sub).padStart(6, "0")}.png`);
	return { ...clock, total, pattern: join(blended, "frame_%06d.png"), sharp };
}

/** G1: one still per beat (window.STILLS) + a contact sheet, nothing else. */
async function stills() {
	rmSync(STILLS_DIR, { recursive: true, force: true });
	mkdirSync(STILLS_DIR, { recursive: true });
	const times = await withPage({ url: SCENE, profile: join(WORK, "chrome-0"), ...VIEW }, async (page) => {
		const { stills: t } = await sceneClock(page);
		if (t.length < 1) throw new Error("window.STILLS is empty — one time per beat");
		for (const [i, s] of t.entries()) await page.shoot(s, join(STILLS_DIR, `still-${i + 1}.png`));
		return t;
	});
	const contact = join(STILLS_DIR, "contact.png");
	contactSheet(join(STILLS_DIR, "still-%d.png"), times.length, contact);
	return { outputs: { [contact]: statSync(contact).size }, times, sha256: sha256(contact), gate: "G1" };
}

/** G2: a cheap 540p draft for the critic and the owner. */
async function draft(jobs) {
	mkdirSync(OUT, { recursive: true });
	const c = await captureAll(join(WORK, "frames-draft"), { ...VIEW, scale: 1 }, jobs);
	const out = join(OUT, "draft.mp4");
	encodeMp4({ frames: c.pattern, fps: c.fps, out, scale: "scale=-2:540", crf: 23, preset: "veryfast" });
	return { outputs: { [out]: statSync(out).size }, frames: c.total, sha256: sha256(out), gate: "G2" };
}

/** Master: final encodes (motion blur from `sub` subframes), then verification of the files. */
async function master(jobs, sub) {
	mkdirSync(OUT, { recursive: true });
	const c = await captureAll(join(WORK, "frames-master"), VIEW, jobs, sub);
	const mp4 = join(OUT, "master.mp4");
	const gif = join(OUT, "master.gif");
	const W = Math.round(VIEW.width * VIEW.scale);
	const H = Math.round(VIEW.height * VIEW.scale);
	encodeMp4({ frames: c.pattern, fps: c.fps, out: mp4, scale: `scale=${W}:-2`, crf: 18, preset: "slow" });
	encodeGif({ frames: c.pattern, fps: c.fps, out: gif, ...GIF });
	const p = probe(mp4);
	const problems = [];
	if (p.codec !== "h264") problems.push(`codec ${p.codec} != h264`);
	if (p.pixFmt !== "yuv420p") problems.push(`pix_fmt ${p.pixFmt} != yuv420p`);
	if (p.frames !== c.total) problems.push(`frames ${p.frames} != DURATION x FPS = ${c.total}`);
	if (mb(mp4) > BUDGET_MB.mp4) problems.push(`mp4 ${mb(mp4).toFixed(2)} MB > ${BUDGET_MB.mp4} MB`);
	if (mb(gif) > BUDGET_MB.gif) problems.push(`gif ${mb(gif).toFixed(2)} MB > ${BUDGET_MB.gif} MB`);
	// The scene since G1: the unblurred sample at each still time vs the approved still.
	const ssim = c.stills.map((t, i) => ssimAt(c.sharp(t), 0, join(STILLS_DIR, `still-${i + 1}.png`), { width: W, height: H }));
	ssim.forEach((s, i) => !(s >= 0.95) && problems.push(`still-${i + 1} SSIM ${s} < 0.95 (scene changed since G1?)`));
	return { outputs: { [mp4]: statSync(mp4).size, [gif]: statSync(gif).size }, probe: p, subframes: sub, ssim, problems };
}

async function main() {
	const { stage, jobs, sub } = args(process.argv.slice(2));
	const started = Date.now();
	console.log(`› stage ${stage}${jobs > 1 ? ` · ${jobs} jobs` : ""}${sub > 1 ? ` · ${sub} subframes` : ""}`);
	const result = stage === "stills" ? await stills() : stage === "draft" ? await draft(jobs) : await master(jobs, sub);
	const seconds = +((Date.now() - started) / 1000).toFixed(1);
	const count = logBudget(BUDGET_LOG, { stage, at: new Date(started).toISOString(), seconds, outputs: result.outputs, sha256: result.sha256 });
	console.log(JSON.stringify({ stage, seconds, renders: count, ...result }, null, 2));
	if (result.gate) {
		console.log(`\nSTOP — owner gate ${result.gate}. Approve artifact sha256 ${result.sha256} before the next stage.`);
	}
	if (result.problems?.length) {
		console.error(`\n✗ master verification failed:\n  - ${result.problems.join("\n  - ")}`);
		process.exit(1);
	}
}

await main();
```

---

## File: `.motion/encode.js`

```javascript
/**
 * ffmpeg / ffprobe side of the render: encoders, contact sheet, file verification,
 * hashing and the budget log. No dependency beyond ffmpeg + ffprobe on PATH.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Runs a command, failing loudly with the command line. */
export function run(cmd) {
	const p = Bun.spawnSync(cmd, { stdout: "inherit", stderr: "inherit" });
	if (p.exitCode !== 0) throw new Error(`failed: ${cmd.join(" ")}`);
}

/** Runs a command and returns its stdout as text. */
export function capture(cmd) {
	const p = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" });
	if (p.exitCode !== 0) throw new Error(`failed: ${cmd.join(" ")}\n${p.stderr.toString()}`);
	return p.stdout.toString();
}

/** @returns {string} sha256 hex of a file (the gate keys approvals on it). */
export const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** @returns {number} File size in MB. */
export const mb = (file) => statSync(file).size / 1024 / 1024;

/**
 * RGB→YUV with the BT.709 matrix in limited (tv) range, then tag the frames so players
 * do not guess (untagged HD is often decoded as BT.601 → visible color shift).
 * Output flags alone (-color_primaries/-color_trc) left primaries/trc "unknown" with
 * libx264 on ffmpeg 9; setparams on the frames tags all four.
 */
const TO_709 = "out_color_matrix=bt709:out_range=tv";
const TAG_709 = "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv";

/**
 * H.264 mp4 from a PNG sequence (yuv420p, faststart, BT.709 tagged).
 *
 * @param {{frames: string, fps: number, out: string, scale: string, crf: number, preset: string}} o
 */
export function encodeMp4(o) {
	run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", String(o.fps), "-i", o.frames,
		"-vf", `${o.scale}:flags=lanczos:${TO_709},format=yuv420p,${TAG_709}`, "-r", String(o.fps),
		"-c:v", "libx264", "-preset", o.preset, "-crf", String(o.crf), "-tune", "animation",
		"-pix_fmt", "yuv420p", "-movflags", "+faststart", o.out]);
}

/**
 * Master motion blur: averages each group of `sub` subframes (shot at (f + s/sub)/fps,
 * all inside [f, f+1)) into one frame with tmix, then keeps the last frame of each group
 * — the one whose window covers exactly that group. A cut on a frame boundary is never
 * mixed with the next shot. Output: `outDir/frame_000000.png`… one PNG per film frame.
 *
 * @param {{frames: string, fps: number, sub: number, outDir: string}} o
 */
export function blendSubframes(o) {
	rmSync(o.outDir, { recursive: true, force: true });
	mkdirSync(o.outDir, { recursive: true });
	run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", String(o.fps * o.sub), "-start_number", "0", "-i", o.frames,
		"-vf", `tmix=frames=${o.sub},select='eq(mod(n\\,${o.sub})\\,${o.sub - 1})'`, "-fps_mode", "passthrough",
		"-start_number", "0", join(o.outDir, "frame_%06d.png")]);
}

/**
 * Two-pass-quality GIF in one graph: palettegen (diff stats) → paletteuse (bayer).
 *
 * @param {{frames: string, fps: number, out: string, width: number, gifFps: number, colors: number}} o
 */
export function encodeGif(o) {
	const graph = `fps=${o.gifFps},scale=${o.width}:-1:flags=lanczos,split[a][b];` +
		`[a]palettegen=max_colors=${o.colors}:stats_mode=diff[p];` +
		"[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle";
	run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", String(o.fps), "-i", o.frames,
		"-vf", graph, "-loop", "0", o.out]);
}

/**
 * Contact sheet of the G1 stills (still-1.png …, one per beat), in beat order: a grid of
 * ⌈√N⌉ columns; cells shrink as N grows so the sheet stays one image.
 *
 * @param {string} pattern - e.g. `.motion/stills/still-%d.png`
 * @param {number} count - Number of stills (one per beat)
 * @param {string} out - Sheet path (its sha256 keys the G1 approval)
 */
export function contactSheet(pattern, count, out) {
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);
	const cell = count <= 6 ? 800 : 360;
	run(["ffmpeg", "-y", "-loglevel", "error", "-start_number", "1", "-i", pattern,
		"-vf", `scale=${cell}:-2:flags=lanczos,tile=${cols}x${rows}:padding=8:color=0x111111`, "-frames:v", "1", out]);
}

/**
 * Probes the delivered FILE, not the frames: codec, pix_fmt, size, fps, counted frames.
 *
 * @param {string} file
 * @returns {{codec: string, pixFmt: string, width: number, height: number, fps: string, frames: number, duration: number}}
 */
export function probe(file) {
	const j = JSON.parse(capture(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
		"-show_entries", "stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames:format=duration",
		"-of", "json", file]));
	const s = j.streams[0];
	return { codec: s.codec_name, pixFmt: s.pix_fmt, width: s.width, height: s.height,
		fps: s.r_frame_rate, frames: Number(s.nb_read_frames), duration: Number(j.format.duration) };
}

/**
 * SSIM of the video frame at `t` against an approved still (1 = identical).
 *
 * @param {string} video @param {number} t @param {string} still
 * @param {{width: number, height: number}} size - The still's pixel size
 * @returns {number} SSIM "All" score, NaN when ffmpeg prints none
 */
export function ssimAt(video, t, still, size) {
	const wh = `${size.width}:${size.height}`;
	const p = Bun.spawnSync(["ffmpeg", "-hide_banner", "-ss", String(t), "-i", video, "-i", still,
		"-lavfi", `[0:v]scale=${wh}:flags=lanczos,format=rgb24[a];[1:v]scale=${wh},format=rgb24[b];[a][b]ssim`,
		"-frames:v", "1", "-f", "null", "-"], { stdout: "pipe", stderr: "pipe" });
	const m = /All:([0-9.]+)/.exec(p.stderr.toString());
	return m ? Number(m[1]) : Number.NaN;
}

/**
 * Appends one render to the budget log (renders per stage + wall time); no cap is
 * enforced here — the gate counts, the owner decides.
 *
 * @param {string} file @param {Record<string, unknown>} entry
 */
export function logBudget(file, entry) {
	const log = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { renders: [] };
	log.renders.push(entry);
	log.count = log.renders.reduce((c, r) => ({ ...c, [r.stage]: (c[r.stage] ?? 0) + 1 }), {});
	writeFileSync(file, `${JSON.stringify(log, null, "\t")}\n`);
	return log.count;
}
```

---

## `.gitignore` addition

```gitignore
.motion/work/
.motion/review/
```

## Adapting

| Change | Where |
|--------|-------|
| Landscape 16:9 | `VIEW = { width: 1920, height: 1080, scale: 1 }` (= `#stage`); GIF width 960 |
| 60 fps | `window.FPS = 60` in the scene; nothing here changes |
| Draft resolution | `scale=-2:540` in `draft()` |
| SSIM threshold | Keep 0.95; a lower score on a held frame means the content changed |
| Another output path | Copy the verified master to the docs path named by the brief — never re-encode on copy |
