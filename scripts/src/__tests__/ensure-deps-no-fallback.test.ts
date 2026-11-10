/**
 * Version-driven repair when the atomic swap is unavailable: the live tree is left
 * untouched (no in-place install, ever), a back-off is written and one warning is
 * emitted. Also: the back-off precedes the staging install (a killed hook does not
 * retry at every SessionStart) and prune never races a held single-flight lock.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DepsTarget } from "../interfaces/ensure-deps";
import { ensureDeps } from "../services/ensure-deps";
import { switchToLockedVersion } from "../services/versioned-install";
import { backoffStampPath, markInstallFailed } from "../utils/install-backoff";
import { tryAcquireLock } from "../utils/single-flight-lock";
import { isolateTmp } from "./tmp-isolation";
import { fakeInstall, lockText, makeLive, PKG, ROOT } from "./version-switch.helpers";

const SESSION_START = { checkVersion: true };
const NO_SWAP = { checkVersion: true, swap: () => false };

let restoreTmp = () => {};
beforeEach(() => {
	rmSync(ROOT, { recursive: true, force: true });
	restoreTmp = isolateTmp("no-fallback");
});
afterEach(() => {
	rmSync(ROOT, { recursive: true, force: true });
	restoreTmp();
});

/** Every file under the live package as `relative path → content`. */
function snapshotLive(t: DepsTarget): Record<string, string> {
	const root = join(t.dir, "node_modules", PKG);
	const out: Record<string, string> = {};
	for (const rel of readdirSync(root, { recursive: true, encoding: "utf8" }).sort()) {
		try {
			out[rel] = readFileSync(join(root, rel), "utf8");
		} catch {
			out[rel] = "<dir>";
		}
	}
	return out;
}

/** Run `fn` capturing console.warn messages. */
async function captureWarnings(fn: () => Promise<void>): Promise<string[]> {
	const seen: string[] = [];
	const original = console.warn;
	console.warn = (...args: unknown[]) => void seen.push(args.join(" "));
	try {
		await fn();
	} finally {
		console.warn = original;
	}
	return seen;
}

describe("swap unavailable → skip, never an in-place install", () => {
	test("live tree identical, no in-place install, back-off written, one warning", async () => {
		const t = makeLive("noswap", "0.1.113", "0.1.115");
		const before = snapshotLive(t);
		const installDirs: string[] = [];
		const warnings = await captureWarnings(() =>
			ensureDeps([t], async (dir, ms) => {
				installDirs.push(dir);
				await fakeInstall(dir, ms);
			}, NO_SWAP),
		);
		expect(snapshotLive(t)).toEqual(before);
		expect(existsSync(t.marker)).toBe(true);
		expect(installDirs.every((d) => d !== t.dir)).toBe(true); // staged only, never in the live dir
		expect(existsSync(backoffStampPath(t.dir))).toBe(true);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("0.1.113");
		expect(warnings[0]).toContain("0.1.115");
		expect(warnings[0]).toContain("/update-harness");
	});

	test("next SessionStart within the back-off does not retry", async () => {
		const t = makeLive("noswap-retry", "0.1.113", "0.1.115");
		await captureWarnings(() => ensureDeps([t], fakeInstall, NO_SWAP));
		let calls = 0;
		await ensureDeps([t], async () => { calls++; }, NO_SWAP);
		expect(calls).toBe(0);
	});
});

describe("back-off precedes the staging install", () => {
	test("the stamp already exists when the installer starts (a killed hook cannot loop)", async () => {
		const t = makeLive("stamp-first", "0.1.113", "0.1.115");
		let stampSeen = false;
		await ensureDeps([t], async (dir, ms) => {
			stampSeen = existsSync(backoffStampPath(t.dir));
			await fakeInstall(dir, ms);
		}, SESSION_START);
		expect(stampSeen).toBe(true);
		expect(existsSync(backoffStampPath(t.dir))).toBe(false); // success clears it
	});

	test("a stamp left by a killed hook blocks the next SessionStart", async () => {
		const t = makeLive("killed-stamp", "0.1.113", "0.1.115");
		markInstallFailed(t.dir); // what a hook killed mid-staging leaves behind
		let calls = 0;
		await ensureDeps([t], async () => { calls++; }, SESSION_START);
		expect(calls).toBe(0);
	});
});

describe("prune and the single-flight lock", () => {
	async function twoSwitchesAged(name: string) {
		const t = makeLive(name, "0.1.113", "0.1.115");
		await switchToLockedVersion(t, fakeInstall, 5_000);
		writeFileSync(join(t.dir, "bun.lock"), lockText("0.1.116"));
		await switchToLockedVersion(t, fakeInstall, 5_000);
		const old = join(t.dir, "node_modules/.fuse-versions/@fusengine__harness/0.1.115");
		const past = (Date.now() - 8 * 86_400_000) / 1000;
		utimesSync(old, past, past);
		return { t, old };
	}

	test("prune is skipped while another process holds the lock", async () => {
		const { t, old } = await twoSwitchesAged("prune-locked");
		const release = tryAcquireLock(t.dir);
		expect(release).not.toBeNull();
		await ensureDeps([t], fakeInstall, SESSION_START);
		release?.();
		expect(existsSync(old)).toBe(true);
	});

	test("prune runs when the lock is free", async () => {
		const { t, old } = await twoSwitchesAged("prune-free");
		await ensureDeps([t], fakeInstall, SESSION_START);
		expect(existsSync(old)).toBe(false);
	});
});
