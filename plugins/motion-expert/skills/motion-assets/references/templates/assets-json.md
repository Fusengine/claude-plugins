---
name: assets-json
description: Complete `.motion/assets.json` provenance file, a filled example, and a Node check script that verifies files, hashes, DPR consistency, masks, and banned literals
keywords: assets.json, provenance, sha256, check script, masking, dpr, banned list
---

# assets.json Template

## Overview

Copy into `<project>/.motion/assets.json` at stage 3 and run the check script before stills. Field meanings and rules: [provenance.md](../provenance.md); masking methods: [data-masking.md](../data-masking.md).

---

## File: .motion/assets.json

```json
{
  "film": "<film working title>",
  "brief": ".motion/brief.md",
  "assets": [
    {
      "id": "<stable-id>",
      "file": ".motion/assets/<name>@2x.png",
      "kind": "screenshot",
      "source": "<url, route, or command>",
      "capturedAt": "YYYY-MM-DD",
      "capture": { "tool": "browser_shots_batch", "viewport": "1440x900", "dpr": 2, "colorScheme": "dark" },
      "masks": [{ "category": "customer names", "method": "dom-replace" }],
      "reviewed": true,
      "exampleDataLabel": true,
      "license": null,
      "sha256": "<filled by the check script with --write>"
    }
  ]
}
```

---

## Example Filled (fictional product, neutral data)

```json
{
  "film": "CLI launch loop",
  "brief": ".motion/brief.md",
  "assets": [
    {
      "id": "dashboard-issues",
      "file": ".motion/assets/dashboard-issues@2x.png",
      "kind": "screenshot",
      "source": "http://localhost:4321/issues?seed=demo",
      "capturedAt": "2026-10-08",
      "capture": { "tool": "browser_shots_batch", "viewport": "1440x900", "dpr": 2, "colorScheme": "dark" },
      "masks": [
        { "category": "customer names", "method": "seeded-demo-data" },
        { "category": "account ids", "method": "dom-replace" }
      ],
      "reviewed": true,
      "exampleDataLabel": true,
      "license": null,
      "sha256": "<filled by --write>"
    },
    {
      "id": "terminal-run",
      "file": ".motion/assets/terminal-run.mp4",
      "kind": "recording",
      "source": "vhs .motion/terminal.tape",
      "capturedAt": "2026-10-08",
      "capture": { "tool": "vhs", "viewport": "1200x600", "dpr": 1, "colorScheme": "dark" },
      "masks": [],
      "reviewed": true,
      "exampleDataLabel": false,
      "license": null,
      "sha256": "<filled by --write>"
    },
    {
      "id": "pointer-arrow",
      "file": ".motion/assets/pointer-arrow@2x.png",
      "kind": "pointer",
      "source": "screencapture -C (macOS), pointer cut from a real capture",
      "capturedAt": "2026-10-08",
      "capture": { "tool": "screencapture", "viewport": "n/a", "dpr": 2, "colorScheme": "n/a" },
      "hotspot": [2, 2],
      "masks": [],
      "reviewed": true,
      "exampleDataLabel": false,
      "license": "OS system asset, used unmodified",
      "sha256": "<filled by --write>"
    }
  ]
}
```

---

## File: .motion/scripts/assets-check.mjs

```javascript
/**
 * Verify .motion/assets.json against the files on disk.
 * Usage:
 *   node .motion/scripts/assets-check.mjs          # check only, exit 1 on any error
 *   node .motion/scripts/assets-check.mjs --write  # (re)compute sha256 for every entry, then check
 * Banned literals are read from ~/.fuse-harness/video-motion/banned.txt (one per line, never in git);
 * the legacy ~/.fuse-harness/motion/banned.txt is used only if the new file does not exist.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";

const MANIFEST = ".motion/assets.json";
const ASSET_DIR = ".motion/assets";
const RAW_DIR = join(ASSET_DIR, "raw"); // pre-mask captures: never listed, never committed
const BANNED_NEW = join(homedir(), ".fuse-harness/video-motion/banned.txt");
const BANNED_LEGACY = join(homedir(), ".fuse-harness/motion/banned.txt"); // pre-0.1.112 location
// Prefer the new path; fall back to the legacy file only when the new one does not exist yet.
const BANNED = existsSync(BANNED_NEW) || !existsSync(BANNED_LEGACY) ? BANNED_NEW : BANNED_LEGACY;

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** Recursively list files under dir, skipping the raw (pre-mask) folder. */
function listFiles(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		if (p === RAW_DIR) return [];
		return statSync(p).isDirectory() ? listFiles(p) : [p];
	});
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const write = process.argv.includes("--write");
const errors = [];

for (const a of manifest.assets) {
	if (!existsSync(a.file)) { errors.push(`${a.id}: file missing (${a.file})`); continue; }
	const hash = sha256(a.file);
	if (write) a.sha256 = hash;
	else if (a.sha256 !== hash) errors.push(`${a.id}: sha256 mismatch — asset changed since it was recorded`);
	if (!a.source) errors.push(`${a.id}: no source`);
	if (!Array.isArray(a.masks)) errors.push(`${a.id}: masks must be an array`);
	else if (a.masks.length === 0 && a.reviewed !== true) errors.push(`${a.id}: masking never reviewed`);
	if (a.masks?.some((m) => m.method === "blur" || m.method === "pixelate")) errors.push(`${a.id}: blur/pixelate is not masking`);
	if (a.kind === "pointer" && !(Array.isArray(a.hotspot) && a.hotspot.length === 2)) errors.push(`${a.id}: pointer needs hotspot [x, y]`);
}

const dprs = new Set(manifest.assets.filter((a) => a.kind === "screenshot").map((a) => a.capture?.dpr));
if (dprs.size > 1) errors.push(`mixed screenshot DPRs: ${[...dprs].join(", ")}`);

const listed = new Set(manifest.assets.map((a) => relative(".", a.file)));
for (const f of listFiles(ASSET_DIR)) {
	if (!listed.has(relative(".", f))) errors.push(`unlisted asset (treated as invented): ${f}`);
}

if (existsSync(BANNED)) {
	const banned = readFileSync(BANNED, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
	const text = JSON.stringify(manifest).toLowerCase();
	// Report only a count: never echo a banned literal into logs.
	const hits = banned.filter((b) => text.includes(b.toLowerCase())).length;
	if (hits) errors.push(`${hits} banned literal(s) found in assets.json`);
} else {
	console.warn(`note: ${BANNED} not found — banned-literal check skipped`);
}

if (write) writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`assets ok: ${manifest.assets.length} entries, dpr=${[...dprs].join(",") || "n/a"}`);
```

---

## .gitignore addition

```gitignore
# Pre-mask captures must never be committed
.motion/assets/raw/
```

---

## Notes

- `--write` refreshes hashes; run it only right after a deliberate asset edit, then re-run without it.
- The banned-literal check reports a count, never the matched value, so logs stay clean.
- `kind: pointer` entries need a `hotspot`; the example value is a placeholder — read the real one from the capture (or the cursor's `info.plist` when it ships one). See [pointer-and-brands.md](../pointer-and-brands.md).
- `kind: diagram` entries use `source: "drawn for this film"` and must never be styled as the product's UI.
