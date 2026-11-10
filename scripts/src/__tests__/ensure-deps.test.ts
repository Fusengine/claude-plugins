/**
 * Tests for ensureDeps: wipe repair, nominal no-op, concurrency single-flight,
 * and fail-open on a throwing installer. The real `bun install` is never
 * invoked — every test injects a fake installer (DI), per ensureDeps' design.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DepsTarget } from "../interfaces/ensure-deps";
import { ensureDeps } from "../services/ensure-deps";
import { isolateTmp } from "./tmp-isolation";

const TEST_DIR = "/tmp/fusengine-test-ensure-deps";

function makeTarget(name: string): DepsTarget {
	const dir = join(TEST_DIR, name);
	return { dir, marker: join(dir, "node_modules/marker.txt"), label: name };
}

let restoreTmp = () => {};
beforeEach(() => {
	rmSync(TEST_DIR, { recursive: true, force: true });
	restoreTmp = isolateTmp("ensure-deps");
});

afterEach(() => {
	rmSync(TEST_DIR, { recursive: true, force: true });
	restoreTmp();
});

describe("ensureDeps", () => {
	test("nominal: marker already present → zero installs", async () => {
		const target = makeTarget("nominal");
		mkdirSync(join(target.dir, "node_modules"), { recursive: true });
		writeFileSync(target.marker, "ok");
		writeFileSync(join(target.dir, "package.json"), "{}");

		let calls = 0;
		await ensureDeps([target], async () => {
			calls++;
		});

		expect(calls).toBe(0);
	});

	test("wipe: marker missing → installer called once with the right cwd, marker repaired", async () => {
		const target = makeTarget("wiped");
		mkdirSync(target.dir, { recursive: true });
		writeFileSync(join(target.dir, "package.json"), "{}");

		const calls: string[] = [];
		await ensureDeps([target], async (dir) => {
			calls.push(dir);
			mkdirSync(join(target.dir, "node_modules"), { recursive: true });
			writeFileSync(target.marker, "installed");
		});

		expect(calls).toEqual([target.dir]);
	});

	test("no package.json → skipped, installer never called", async () => {
		const target = makeTarget("empty");
		mkdirSync(target.dir, { recursive: true });

		let calls = 0;
		await ensureDeps([target], async () => {
			calls++;
		});

		expect(calls).toBe(0);
	});

	test("concurrency: two racing ensureDeps calls install only once (single-flight)", async () => {
		const target = makeTarget("race");
		mkdirSync(target.dir, { recursive: true });
		writeFileSync(join(target.dir, "package.json"), "{}");

		let calls = 0;
		const slowInstall = async (dir: string) => {
			calls++;
			await new Promise((r) => setTimeout(r, 50));
			mkdirSync(join(dir, "node_modules"), { recursive: true });
			writeFileSync(target.marker, "installed");
		};

		await Promise.all([
			ensureDeps([target], slowInstall),
			ensureDeps([target], slowInstall),
		]);

		expect(calls).toBe(1);
	});

	test("fail-open: a throwing installer does not propagate", async () => {
		const target = makeTarget("throws");
		mkdirSync(target.dir, { recursive: true });
		writeFileSync(join(target.dir, "package.json"), "{}");

		await expect(
			ensureDeps([target], async () => {
				throw new Error("network down");
			}),
		).resolves.toBeUndefined();
	});

	describe("lockfile version drift (lockedPackage)", () => {
		const PKG = "@fusengine/harness";

		/** Build a target whose marker exists, with an installed version and an optional bun.lock. */
		function makeVersioned(name: string, installed: string | null, locked: string | null): DepsTarget {
			const target: DepsTarget = { ...makeTarget(name), lockedPackage: PKG };
			const pkgDir = join(target.dir, "node_modules", PKG);
			mkdirSync(pkgDir, { recursive: true });
			writeFileSync(target.marker, "ok");
			writeFileSync(join(target.dir, "package.json"), "{}");
			if (installed !== null) {
				writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ version: installed }));
			}
			if (locked !== null) {
				writeFileSync(
					join(target.dir, "bun.lock"),
					`{\n  "packages": {\n    "${PKG}": ["${PKG}@${locked}", "", { "dependencies": {} }, "sha512-x"],\n  }\n}\n`,
				);
			}
			return target;
		}

		async function countInstalls(target: DepsTarget): Promise<number> {
			let calls = 0;
			await ensureDeps(
				[target],
				async () => {
					calls++;
				},
				{ checkVersion: true },
			);
			return calls;
		}

		test("installed == locked → zero installs", async () => {
			expect(await countInstalls(makeVersioned("same", "0.1.115", "0.1.115"))).toBe(0);
		});

		test("installed != locked → installer called once with the right cwd", async () => {
			const target = makeVersioned("drift", "0.1.113", "0.1.115");
			const calls: string[] = [];
			await ensureDeps(
				[target],
				async (dir) => {
					calls.push(dir);
				},
				{ checkVersion: true },
			);
			expect(calls).toHaveLength(1);
			expect(calls[0]).toContain(join(target.dir, "node_modules/.fuse-versions")); // staged, never in the live tree
		});

		test("installed version unreadable → installer called once", async () => {
			expect(await countInstalls(makeVersioned("unreadable", null, "0.1.115"))).toBe(1);
		});

		test("no lockfile → marker-only behaviour (zero installs)", async () => {
			expect(await countInstalls(makeVersioned("nolock", "0.1.113", null))).toBe(0);
		});

		test("lockfile without the package entry → marker-only behaviour", async () => {
			const target = makeVersioned("noentry", "0.1.113", "0.1.115");
			writeFileSync(join(target.dir, "bun.lock"), '{ "packages": {} }');
			expect(await countInstalls(target)).toBe(0);
		});

		test("marker missing → installer called once (today's behaviour)", async () => {
			const target = makeVersioned("nomarker", "0.1.115", "0.1.115");
			rmSync(target.marker);
			expect(await countInstalls(target)).toBe(1);
		});

		test("target without lockedPackage ignores a drifting lockfile", async () => {
			const target = makeVersioned("undeclared", "0.1.113", "0.1.115");
			delete target.lockedPackage;
			expect(await countInstalls(target)).toBe(0);
		});

		test("throwing installer on drift does not propagate", async () => {
			const target = makeVersioned("driftthrows", "0.1.113", "0.1.115");
			await expect(
				ensureDeps(
					[target],
					async () => {
						throw new Error("boom");
					},
					{ checkVersion: true },
				),
			).resolves.toBeUndefined();
		});
	});
});
