/**
 * Fail-open when the lock/stamp directory is unusable (TMPDIR points at a regular
 * file): ensureDeps must return normally, leave the live tree untouched and spawn
 * no install — otherwise the loader dies and drops every SessionStart hook.
 * Runs in a child process so the temp dir is the one the child resolves.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { liveVersion, makeLive, ROOT } from "./version-switch.helpers";

const ENSURE_DEPS = join(import.meta.dir, "../services/ensure-deps.ts");
const BAD_TMP = "/tmp/fusengine-test-unusable-tmp-file";

beforeEach(() => {
	rmSync(ROOT, { recursive: true, force: true });
	writeFileSync(BAD_TMP, "not a directory");
});
afterEach(() => {
	rmSync(ROOT, { recursive: true, force: true });
	rmSync(BAD_TMP, { force: true });
});

/** Run ensureDeps in a child whose TMPDIR is a regular file; returns its JSON report. */
async function runWithBadTmp(dir: string, checkVersion: boolean) {
	const code = `
		import { ensureDeps } from ${JSON.stringify(ENSURE_DEPS)};
		let installs = 0;
		const target = { dir: ${JSON.stringify(dir)}, marker: ${JSON.stringify(join(dir, "node_modules/@fusengine/harness/dist/cli/bin.mjs"))}, lockedPackage: "@fusengine/harness", label: "x" };
		try {
			await ensureDeps([target], async () => { installs++; }, { checkVersion: ${checkVersion} });
			console.log(JSON.stringify({ returned: true, installs }));
		} catch (e) {
			console.log(JSON.stringify({ returned: false, error: String(e), installs }));
		}`;
	const p = Bun.spawn([process.execPath, "-e", code], {
		env: { ...process.env, TMPDIR: BAD_TMP },
		stdout: "pipe",
		stderr: "pipe",
	});
	const out = await new Response(p.stdout).text();
	await p.exited;
	return JSON.parse(out.trim().split("\n").pop() ?? "{}") as { returned: boolean; installs: number; error?: string };
}

describe("unusable lock dir", () => {
	test.each([true, false])("stale harness, marker present, checkVersion=%p → returns normally, no install, live untouched", async (cv) => {
		const t = makeLive(`stale-${cv}`, "0.1.100", "0.1.115");
		const res = await runWithBadTmp(t.dir, cv);
		expect(res.error).toBeUndefined();
		expect(res.returned).toBe(true);
		expect(res.installs).toBe(0);
		expect(liveVersion(t)).toBe("0.1.100");
		expect(existsSync(t.marker)).toBe(true);
	});

	test("up-to-date harness on SessionStart (prune path) → returns normally", async () => {
		const t = makeLive("uptodate", "0.1.115", "0.1.115");
		const res = await runWithBadTmp(t.dir, true);
		expect(res.returned).toBe(true);
		expect(res.installs).toBe(0);
	});

	test("tryAcquireLock reports 'not acquired' instead of throwing", async () => {
		const p = Bun.spawn(
			[
				process.execPath,
				"-e",
				`import { tryAcquireLock } from ${JSON.stringify(join(import.meta.dir, "../utils/single-flight-lock.ts"))};
				 console.log(String(tryAcquireLock("k")));`,
			],
			{ env: { ...process.env, TMPDIR: BAD_TMP }, stdout: "pipe", stderr: "pipe" },
		);
		expect((await new Response(p.stdout).text()).trim()).toBe("null");
	});
});
