/**
 * Prune leftovers of the versioned store once they are safely old: superseded
 * versions and swapped-out real directories (7 days after being superseded),
 * abandoned stages (1 hour). The current version is never removed. Built-ins only.
 * @description SRP: age-based cleanup, best effort, never throws.
 */
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import type { DepsTarget } from "../interfaces/ensure-deps";
import { liveStoreEntry, storePaths } from "../utils/version-store-paths";

const SUPERSEDED_MAX_AGE_MS = 7 * 86_400_000;
const STAGE_MAX_AGE_MS = 3_600_000;

/** Remove `path` when its mtime is older than `maxAgeMs`; ignores any error. */
function removeIfOlder(path: string, maxAgeMs: number, now: number): void {
	try {
		if (now - statSync(path).mtimeMs > maxAgeMs) rmSync(path, { recursive: true, force: true });
	} catch {
		// vanished or unreadable: nothing to prune
	}
}

/** Names inside `dir`, or [] when unreadable. */
function list(dir: string): string[] {
	try {
		return readdirSync(dir);
	} catch {
		return [];
	}
}

/**
 * Prune old store entries and swap leftovers for a target. No-op without a store.
 *
 * @param target - Managed target declaring `lockedPackage`
 * @param now - Clock (ms), injectable for tests
 */
export function pruneVersionStore(target: DepsTarget, now = Date.now()): void {
	if (!target.lockedPackage) return;
	const paths = storePaths(target.dir, target.lockedPackage);
	const current = liveStoreEntry(paths);
	for (const name of list(paths.slugDir)) {
		if (name.startsWith(".stage-")) removeIfOlder(join(paths.slugDir, name), STAGE_MAX_AGE_MS, now);
		else if (name !== current) removeIfOlder(join(paths.slugDir, name), SUPERSEDED_MAX_AGE_MS, now);
	}
	for (const name of list(paths.liveParent)) {
		if (name.startsWith(paths.swapPrefix)) removeIfOlder(join(paths.liveParent, name), SUPERSEDED_MAX_AGE_MS, now);
	}
}
