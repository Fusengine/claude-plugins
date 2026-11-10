/**
 * Acceptance stress for the atomic upgrade, through the REAL code path
 * (ensureDeps → staging `bun install` → atomic switch) on a scratch copy.
 * Needs network/bun cache, so it only runs with FUSE_STRESS=1:
 *   FUSE_STRESS=1 bun test scripts/src/__tests__/harness-upgrade-stress.test.ts
 * Precondition: `/tmp/fusengine-stress/new.lock` holds a bun.lock resolving the NEW version.
 * While a 0.1.113 → 0.1.115 upgrade runs: ≥2000 spawns of the live bin.mjs must
 * all succeed, processes started before the switch must finish their lazy imports,
 * and the final version must be 0.1.115.
 */
import { describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureDeps } from "../services/ensure-deps";
import { getManagedDepsTargets } from "../services/deps-targets";
import { runBunInstall } from "../utils/bun-install-runner";

const RUN = process.env.FUSE_STRESS === "1";
const BASE = "/tmp/fusengine-stress";
const PKG = "@fusengine/harness";
const OLD = "0.1.113";
const NEW = "0.1.115";
const MIN_SPAWNS = 2000;
const BAD_STDERR = /Cannot find|ERR_MODULE|ENOENT|error:|Unexpected/i;

const manifest = (v: string) => JSON.stringify({ name: "stress", private: true, dependencies: { [PKG]: v } });

/** Build (once) a plugins dir holding a REAL-directory install of OLD. */
async function oldInstall(): Promise<string> {
	const dir = join(BASE, "template");
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "package.json"), manifest(OLD));
	await runBunInstall(dir, 120_000);
	return dir;
}

/** One hook-shaped invocation of the live binary; resolves to an error string or null. */
async function spawnOnce(bin: string): Promise<string | null> {
	const p = Bun.spawn([process.execPath, bin, "hook", "claude-code", "carto"], {
		stdin: new Blob(["{}"]),
		stdout: "ignore",
		stderr: "pipe",
	});
	const [err, code] = await Promise.all([new Response(p.stderr).text(), p.exited]);
	return code !== 0 || BAD_STDERR.test(err) ? `exit=${code} ${err.slice(0, 200)}` : null;
}

/** Process started BEFORE the switch, stdin held open so its lazy imports run after it. */
function startLongLived(bin: string) {
	const p = Bun.spawn([process.execPath, bin, "hook", "claude-code", "carto"], {
		stdin: "pipe",
		stdout: "ignore",
		stderr: "pipe",
	});
	return p;
}

describe.skipIf(!RUN)("atomic upgrade under load (real bun install)", () => {
	for (let run = 1; run <= (Number(process.env.FUSE_STRESS_RUNS) || 1); run++) {
		test(`run ${run}: 0 failed spawn, 0 failed import, ends on ${NEW}`, async () => {
			const template = join(BASE, "template");
			if (run === 1) await oldInstall();
			const dir = join(BASE, `run-${run}`);
			rmSync(dir, { recursive: true, force: true });
			cpSync(template, dir, { recursive: true });
			const current = join(dir, "node_modules", PKG);
			const bin = join(current, "dist/cli/bin.mjs");
			const oldChunk = (await Array.fromAsync(new Bun.Glob("dist/hook-entry-*.mjs").scan({ cwd: current })))[0] as string;
			expect(readVersion(current)).toBe(OLD);

			const longLived = [1, 2, 3, 4].map(() => startLongLived(bin));
			await Bun.sleep(400);
			writeFileSync(join(dir, "package.json"), manifest(`^${NEW}`));
			writeFileSync(join(dir, "bun.lock"), readFileSync(join(BASE, "new.lock"), "utf8"));

			const failures: string[] = [];
			let spawns = 0;
			let upgraded = false;
			const target = getManagedDepsTargets("/unused", dir)[1];
			if (!target) throw new Error("no plugins target");
			const upgrade = ensureDeps([target], undefined, { checkVersion: true }).then(() => (upgraded = true));
			const workers = Array.from({ length: 12 }, async () => {
				while (!upgraded || spawns < MIN_SPAWNS) {
					spawns++;
					const err = await spawnOnce(bin);
					if (err) failures.push(err);
				}
			});
			await Promise.all([upgrade, ...workers]);

			for (const p of longLived) {
				p.stdin.write("{}");
				p.stdin.end();
				const [err, code] = await Promise.all([new Response(p.stderr).text(), p.exited]);
				if (code !== 0 || BAD_STDERR.test(err)) failures.push(`long-lived exit=${code} ${err.slice(0, 200)}`);
			}
			const lazy = await import(`${join(current, oldChunk)}?r=${run}`).then(() => null, (e: unknown) => String(e));
			if (lazy) failures.push(`old chunk import via live path: ${lazy}`);

			expect(spawns).toBeGreaterThanOrEqual(MIN_SPAWNS);
			expect(failures).toEqual([]);
			expect(readVersion(current)).toBe(NEW);
		}, 300_000);
	}
});

function readVersion(pkgDir: string): string {
	return (JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")) as { version: string }).version;
}
