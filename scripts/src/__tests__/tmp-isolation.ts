/**
 * Test helper: point TMPDIR at a private directory so lock files and back-off
 * stamps never touch (or delete) the real shared `fusengine-ensure-deps` dir that
 * live sessions use.
 */
import { mkdirSync, rmSync } from "node:fs";

/**
 * Create a private temp dir, set `TMPDIR` to it and return a restore function that
 * removes it and puts the previous `TMPDIR` back.
 *
 * @param name - Unique suffix for the private dir
 */
export function isolateTmp(name: string): () => void {
	const previous = process.env.TMPDIR;
	const dir = `/tmp/fusengine-test-tmp-${name}`;
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });
	process.env.TMPDIR = dir;
	return () => {
		rmSync(dir, { recursive: true, force: true });
		if (previous === undefined) delete process.env.TMPDIR;
		else process.env.TMPDIR = previous;
	};
}
