/**
 * Tests for the version-driven repair of ensureDeps: it only runs when the caller
 * opts in (SessionStart), and a failed attempt backs off so an offline user pays
 * the install timeout once per window. The real `bun install` is never invoked.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DepsTarget } from "../interfaces/ensure-deps";
import { ensureDeps } from "../services/ensure-deps";
import { backoffStampPath } from "../utils/install-backoff";
import { lockDir } from "../utils/single-flight-lock";
import { isolateTmp } from "./tmp-isolation";

const TEST_DIR = "/tmp/fusengine-test-ensure-deps-ss";
const PKG = "@fusengine/harness";
const ENV_KEY = "FUSE_ENSURE_DEPS_BACKOFF_MIN";
const SESSION_START = { checkVersion: true };

/** Target with marker + installed `installed` version + lockfile resolving `locked`. */
function makeTarget(name: string, installed: string, locked: string): DepsTarget {
	const dir = join(TEST_DIR, name);
	const pkgDir = join(dir, "node_modules", PKG);
	mkdirSync(pkgDir, { recursive: true });
	writeFileSync(join(dir, "node_modules/marker.txt"), "ok");
	writeFileSync(join(dir, "package.json"), "{}");
	writeInstalled(dir, installed);
	writeFileSync(join(dir, "bun.lock"), `{ "packages": { "${PKG}": ["${PKG}@${locked}", ""], } }`);
	return { dir, marker: join(dir, "node_modules/marker.txt"), lockedPackage: PKG, label: name };
}

function writeInstalled(dir: string, version: string): void {
	mkdirSync(join(dir, "node_modules", PKG), { recursive: true });
	writeFileSync(join(dir, "node_modules", PKG, "package.json"), JSON.stringify({ version }));
}

/**
 * Installer that materializes version `to` (and the marker) in the dir it is given —
 * the staging dir, since the live tree is never installed into — counting calls.
 */
function upgrader(_target: DepsTarget, to: string, counter: { n: number }) {
	return async (dir: string) => {
		counter.n++;
		writeInstalled(dir, to);
		writeFileSync(join(dir, "node_modules/marker.txt"), "ok");
	};
}

let restoreTmp = () => {};
beforeEach(() => {
	delete process.env[ENV_KEY];
	rmSync(TEST_DIR, { recursive: true, force: true });
	restoreTmp = isolateTmp("sessionstart");
});

afterEach(() => {
	delete process.env[ENV_KEY];
	rmSync(TEST_DIR, { recursive: true, force: true });
	restoreTmp();
});

describe("ensureDeps version-driven repair gating", () => {
	test("non-SessionStart (no opt-in) + stale version → no install", async () => {
		const target = makeTarget("other-event", "0.1.113", "0.1.115");
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c));
		expect(c.n).toBe(0);
	});

	test("SessionStart + stale version → installs once and upgrades", async () => {
		const target = makeTarget("ss-stale", "0.1.113", "0.1.115");
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c), SESSION_START);
		expect(c.n).toBe(1);
		expect(existsSync(backoffStampPath(target.dir))).toBe(false);
	});

	test("SessionStart + version equal → no install", async () => {
		const target = makeTarget("ss-equal", "0.1.115", "0.1.115");
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c), SESSION_START);
		expect(c.n).toBe(0);
	});

	test("marker missing on a non-SessionStart event → installs (today's behaviour)", async () => {
		const target = makeTarget("nomarker", "0.1.115", "0.1.115");
		rmSync(target.marker);
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c));
		expect(c.n).toBe(1);
	});

	test("marker missing ignores an active back-off stamp", async () => {
		const target = makeTarget("nomarker-backoff", "0.1.113", "0.1.115");
		mkdirSync(lockDir(), { recursive: true });
		writeFileSync(backoffStampPath(target.dir), JSON.stringify({ ts: Date.now() }));
		rmSync(target.marker);
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c), SESSION_START);
		expect(c.n).toBe(1);
	});
});

describe("ensureDeps back-off after a failed version-driven install", () => {
	test("throwing installer → stamp written; next SessionStart within back-off → no install", async () => {
		const target = makeTarget("fail-throw", "0.1.113", "0.1.115");
		let calls = 0;
		const failing = async () => {
			calls++;
			throw new Error("offline");
		};
		await ensureDeps([target], failing, SESSION_START);
		expect(calls).toBe(1);
		expect(existsSync(backoffStampPath(target.dir))).toBe(true);

		await ensureDeps([target], failing, SESSION_START);
		expect(calls).toBe(1);
	});

	test("silent failure (installer returns, version still stale) → stamp written", async () => {
		const target = makeTarget("fail-silent", "0.1.113", "0.1.115");
		let calls = 0;
		await ensureDeps([target], async () => { calls++; }, SESSION_START);
		await ensureDeps([target], async () => { calls++; }, SESSION_START);
		expect(calls).toBe(1);
		expect(existsSync(backoffStampPath(target.dir))).toBe(true);
	});

	test("after the back-off window → install runs again", async () => {
		const target = makeTarget("expired", "0.1.113", "0.1.115");
		mkdirSync(lockDir(), { recursive: true });
		const thirtyOneMinAgo = Date.now() - 31 * 60_000;
		writeFileSync(backoffStampPath(target.dir), JSON.stringify({ ts: thirtyOneMinAgo }));
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c), SESSION_START);
		expect(c.n).toBe(1);
	});

	test("env var overrides the window (minutes)", async () => {
		const target = makeTarget("env", "0.1.113", "0.1.115");
		mkdirSync(lockDir(), { recursive: true });
		writeFileSync(backoffStampPath(target.dir), JSON.stringify({ ts: Date.now() - 5 * 60_000 }));
		process.env[ENV_KEY] = "1";
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c), SESSION_START);
		expect(c.n).toBe(1);
	});

	test("success clears a previous stamp", async () => {
		const target = makeTarget("clears", "0.1.113", "0.1.115");
		mkdirSync(lockDir(), { recursive: true });
		writeFileSync(backoffStampPath(target.dir), JSON.stringify({ ts: Date.now() - 31 * 60_000 }));
		const c = { n: 0 };
		await ensureDeps([target], upgrader(target, "0.1.115", c), SESSION_START);
		expect(existsSync(backoffStampPath(target.dir))).toBe(false);
	});
});
