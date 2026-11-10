/**
 * Path layout of the versioned package store kept inside a managed dir's
 * node_modules (so it is gitignored and wiped together with it).
 * @description SRP: compute store paths, and resolve which store entry the live path points into.
 */
import { realpathSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import type { StorePaths } from "../interfaces/version-store";

const STORE_DIR = ".fuse-versions";

/**
 * @param dir - Managed dir containing `node_modules` and `bun.lock`
 * @param pkg - Package name, e.g. `@fusengine/harness`
 */
export function storePaths(dir: string, pkg: string): StorePaths {
	const live = join(dir, "node_modules", pkg);
	return {
		live,
		liveParent: dirname(live),
		slugDir: join(dir, "node_modules", STORE_DIR, pkg.replace("/", "__")),
		swapPrefix: `.swap-${basename(live)}-`,
	};
}

/** Directory of one stored version; the package lives in `<it>/node_modules/<pkg>`. */
export function versionDir(paths: StorePaths, version: string): string {
	return join(paths.slugDir, version);
}

/**
 * Name of the store entry (version dir) the live path currently resolves into, or null.
 * Both sides go through realpath: any component of the path may itself be a symlink
 * (e.g. `/tmp` on macOS, a dotfile-managed `~/.claude`), and comparing a resolved path
 * with an unresolved one would wrongly report "no current version".
 */
export function liveStoreEntry(paths: StorePaths): string | null {
	try {
		const first = relative(realpathSync(paths.slugDir), realpathSync(paths.live)).split(sep)[0];
		return first && first !== ".." ? first : null;
	} catch {
		return null;
	}
}
