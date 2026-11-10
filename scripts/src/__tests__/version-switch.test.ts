/**
 * Tests for the atomic version switch (staging install + symlink switch).
 * Offline: a fake installer materializes `node_modules/<pkg>` for the version
 * found in the stage's bun.lock.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { InstallFn } from "../interfaces/ensure-deps";
import { switchToLockedVersion } from "../services/versioned-install";
import {
	fakeInstall,
	HASH_NEW,
	HASH_OLD,
	liveVersion,
	lockText,
	makeLive,
	PKG,
	ROOT,
	writePackage,
} from "./version-switch.helpers";

beforeEach(() => rmSync(ROOT, { recursive: true, force: true }));
afterEach(() => rmSync(ROOT, { recursive: true, force: true }));

const isLink = (dir: string): boolean => lstatSync(join(dir, "node_modules", PKG)).isSymbolicLink();

describe("switchToLockedVersion", () => {
	test("real dir → symlink into the store, new version live, old chunk still resolvable", async () => {
		const t = makeLive("convert", "0.1.113", "0.1.115");
		expect(await switchToLockedVersion(t, fakeInstall, 5_000)).toBe("switched");
		const live = join(t.dir, "node_modules", PKG);
		expect(isLink(t.dir)).toBe(true);
		expect(liveVersion(t)).toBe("0.1.115");
		expect(existsSync(t.marker)).toBe(true);
		expect(existsSync(join(live, "dist", HASH_OLD))).toBe(true); // overlay: pre-switch processes
		expect(existsSync(join(live, "dist", HASH_NEW))).toBe(true);
		expect(realpathSync(live)).toContain(".fuse-versions");
	});

	test("symlink → symlink keeps the previous version's files on disk", async () => {
		const t = makeLive("twice", "0.1.113", "0.1.115");
		await switchToLockedVersion(t, fakeInstall, 5_000);
		const firstReal = realpathSync(join(t.dir, "node_modules", PKG));
		writeFileSync(join(t.dir, "bun.lock"), lockText("0.1.116"));
		expect(await switchToLockedVersion(t, fakeInstall, 5_000)).toBe("switched");
		expect(liveVersion(t)).toBe("0.1.116");
		expect(existsSync(join(firstReal, "package.json"))).toBe(true);
		expect(existsSync(join(firstReal, "dist", HASH_NEW))).toBe(true);
	});

	test("path never disappears during the switch (polled from another process)", async () => {
		for (const mode of ["convert", "relink"] as const) {
			const t = makeLive(`poll-${mode}`, "0.1.113", "0.1.115");
			if (mode === "relink") {
				await switchToLockedVersion(t, fakeInstall, 5_000);
				writeFileSync(join(t.dir, "bun.lock"), lockText("0.1.116"));
			}
			const flag = join(t.dir, "stop.flag");
			const poller = Bun.spawn(
				[
					process.execPath,
					"-e",
					`const fs=require("fs");let bad=0,n=0;const p=${JSON.stringify(t.marker)};
					while(!fs.existsSync(${JSON.stringify(flag)})){n++;try{fs.readFileSync(p,"utf8")}catch{bad++}}
					console.log(JSON.stringify({bad,n}));`,
				],
				{ stdout: "pipe" },
			);
			await new Promise((r) => setTimeout(r, 150));
			await switchToLockedVersion(t, fakeInstall, 5_000);
			await new Promise((r) => setTimeout(r, 100));
			writeFileSync(flag, "x");
			const out = JSON.parse(await new Response(poller.stdout).text()) as { bad: number; n: number };
			expect(out.n).toBeGreaterThan(100);
			expect(out.bad).toBe(0);
		}
	});

	test("failing installer leaves the live tree untouched and no stage behind", async () => {
		const t = makeLive("fail", "0.1.113", "0.1.115");
		await expect(
			switchToLockedVersion(t, async () => { throw new Error("offline"); }, 5_000),
		).rejects.toThrow("offline");
		expect(isLink(t.dir)).toBe(false);
		expect(liveVersion(t)).toBe("0.1.113");
		const slugDir = join(t.dir, "node_modules/.fuse-versions/@fusengine__harness");
		const left = existsSync(slugDir) ? readdirSync(slugDir) : [];
		expect(left.filter((n) => n.startsWith(".stage-"))).toEqual([]);
	});

	test("staged version differing from the lock is never switched in", async () => {
		const t = makeLive("wrongver", "0.1.113", "0.1.115");
		const wrong: InstallFn = async (stage) => writePackage(stage, "0.1.114", HASH_NEW);
		await expect(switchToLockedVersion(t, wrong, 5_000)).rejects.toThrow();
		expect(liveVersion(t)).toBe("0.1.113");
		expect(isLink(t.dir)).toBe(false);
	});

	test("incomplete stage (marker missing) is never switched in", async () => {
		const t = makeLive("nomarker", "0.1.113", "0.1.115");
		const partial: InstallFn = async (stage) => {
			mkdirSync(join(stage, "node_modules", PKG), { recursive: true });
			writeFileSync(join(stage, "node_modules", PKG, "package.json"), JSON.stringify({ version: "0.1.115" }));
		};
		await expect(switchToLockedVersion(t, partial, 5_000)).rejects.toThrow();
		expect(liveVersion(t)).toBe("0.1.113");
	});

	test("a stage left by a killed install does not block the retry", async () => {
		const t = makeLive("killed", "0.1.113", "0.1.115");
		const dead = join(t.dir, "node_modules/.fuse-versions/@fusengine__harness/.stage-dead");
		mkdirSync(join(dead, "node_modules"), { recursive: true });
		writeFileSync(join(dead, "package.json"), "{");
		expect(await switchToLockedVersion(t, fakeInstall, 5_000)).toBe("switched");
		expect(liveVersion(t)).toBe("0.1.115");
	});

	test("atomic swap unavailable on a real dir → 'unsupported', live untouched, no temp link left", async () => {
		const t = makeLive("nosupport", "0.1.113", "0.1.115");
		expect(await switchToLockedVersion(t, fakeInstall, 5_000, () => false)).toBe("unsupported");
		expect(liveVersion(t)).toBe("0.1.113");
		expect(readdirSync(join(t.dir, "node_modules/@fusengine")).sort()).toEqual(["harness"]);
	});
});
