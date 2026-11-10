/**
 * Tests for pruneVersionStore: superseded versions and stale stages are removed
 * only past a safe age; the current version and young entries are never touched.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pruneVersionStore } from "../services/version-store-prune";
import { switchToLockedVersion } from "../services/versioned-install";
import { fakeInstall, lockText, makeLive, ROOT } from "./version-switch.helpers";

const DAY = 86_400_000;

beforeEach(() => rmSync(ROOT, { recursive: true, force: true }));
afterEach(() => rmSync(ROOT, { recursive: true, force: true }));

function age(path: string, ms: number): void {
	const t = (Date.now() - ms) / 1000;
	utimesSync(path, t, t);
}

/** Two successive switches: 0.1.113 (real dir) → 0.1.115 → 0.1.116 (current). */
async function twoSwitches(name: string) {
	const t = makeLive(name, "0.1.113", "0.1.115");
	await switchToLockedVersion(t, fakeInstall, 5_000);
	writeFileSync(join(t.dir, "bun.lock"), lockText("0.1.116"));
	await switchToLockedVersion(t, fakeInstall, 5_000);
	return { t, slugDir: join(t.dir, "node_modules/.fuse-versions/@fusengine__harness") };
}

describe("pruneVersionStore", () => {
	test("removes superseded versions and stale stages past their age, keeps current and young ones", async () => {
		const { t, slugDir } = await twoSwitches("prune");
		mkdirSync(join(slugDir, ".stage-old"));
		mkdirSync(join(slugDir, ".stage-young"));
		age(join(slugDir, ".stage-old"), 2 * 3_600_000);
		age(join(slugDir, "0.1.115"), 8 * DAY);
		pruneVersionStore(t);
		const left = readdirSync(slugDir);
		expect(left).toContain("0.1.116");
		expect(left).toContain(".stage-young");
		expect(left).not.toContain(".stage-old");
		expect(left).not.toContain("0.1.115");
	});

	test("keeps a superseded version younger than the safe age", async () => {
		const { t, slugDir } = await twoSwitches("prune-young");
		pruneVersionStore(t);
		expect(readdirSync(slugDir)).toContain("0.1.115");
	});

	test("removes the old real directory left by the conversion once past the safe age", async () => {
		const { t } = await twoSwitches("prune-swap");
		const scopeDir = join(t.dir, "node_modules/@fusengine");
		const leftover = readdirSync(scopeDir).find((n) => n.startsWith(".swap-")) as string;
		expect(leftover).toBeDefined();
		pruneVersionStore(t);
		expect(readdirSync(scopeDir)).toContain(leftover);
		age(join(scopeDir, leftover), 8 * DAY);
		pruneVersionStore(t);
		expect(readdirSync(scopeDir)).not.toContain(leftover);
	});

	test("never removes the CURRENT version, however old (path under a symlinked component: /tmp on macOS)", async () => {
		const { t, slugDir } = await twoSwitches("prune-current");
		age(join(slugDir, "0.1.116"), 30 * DAY);
		pruneVersionStore(t);
		expect(readdirSync(slugDir)).toContain("0.1.116");
		expect(existsSync(t.marker)).toBe(true);
	});

	test("a version aged before it was superseded keeps a fresh clock from the supersede", async () => {
		const t = makeLive("prune-superseded-stamp", "0.1.113", "0.1.115");
		await switchToLockedVersion(t, fakeInstall, 5_000);
		const slugDir = join(t.dir, "node_modules/.fuse-versions/@fusengine__harness");
		age(join(slugDir, "0.1.115"), 30 * DAY); // old by creation, still live
		writeFileSync(join(t.dir, "bun.lock"), lockText("0.1.116"));
		await switchToLockedVersion(t, fakeInstall, 5_000); // supersedes 0.1.115 now
		pruneVersionStore(t);
		expect(readdirSync(slugDir)).toContain("0.1.115");
	});

	test("no store → no-op, never throws", () => {
		const t = makeLive("prune-none", "0.1.113", "0.1.113");
		expect(() => pruneVersionStore(t)).not.toThrow();
	});
});
