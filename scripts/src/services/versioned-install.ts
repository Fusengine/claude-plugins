/**
 * Atomic package upgrade: install the lockfile version into a staging dir beside
 * the live tree, verify it, then repoint the live path with one atomic operation.
 * The previous version's files are never touched, so a process that started
 * before the switch keeps working. Built-ins only.
 * @description SRP: stage → verify → switch; pruning lives in version-store-prune.
 */
import {
	copyFileSync,
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	renameSync,
	rmSync,
	symlinkSync,
	utimesSync,
} from "node:fs";
import { join, relative } from "node:path";
import type { DepsTarget, InstallFn, SwitchResult } from "../interfaces/ensure-deps";
import type { StorePaths } from "../interfaces/version-store";
import { swapPaths } from "../utils/atomic-rename";
import { readLockedVersion, readPackageVersion } from "../utils/locked-version";
import { liveStoreEntry, storePaths, versionDir } from "../utils/version-store-paths";

/** A staged tree is complete when its version matches the lock and the marker file exists. */
function isComplete(root: string, target: DepsTarget, pkg: string, locked: string): boolean {
	const markerRel = relative(target.dir, target.marker);
	return readPackageVersion(join(root, "node_modules", pkg)) === locked && existsSync(join(root, markerRel));
}

/** Install `locked` into `<slugDir>/<locked>` via a stage dir; reuses an already complete version dir. */
async function ensureStaged(target: DepsTarget, paths: StorePaths, pkg: string, locked: string, install: InstallFn, timeoutMs: number): Promise<string> {
	const finalDir = versionDir(paths, locked);
	if (isComplete(finalDir, target, pkg, locked)) return finalDir;

	const stage = join(paths.slugDir, `.stage-${uniqueSuffix()}`);
	mkdirSync(stage, { recursive: true });
	try {
		copyFileSync(join(target.dir, "package.json"), join(stage, "package.json"));
		copyFileSync(join(target.dir, "bun.lock"), join(stage, "bun.lock"));
		await install(stage, timeoutMs);
		if (!isComplete(stage, target, pkg, locked)) throw new Error(`staged ${pkg} is not ${locked} or is incomplete`);
		rmSync(finalDir, { recursive: true, force: true }); // a broken leftover, never a live version
		renameSync(stage, finalDir);
		return finalDir;
	} catch (error) {
		rmSync(stage, { recursive: true, force: true });
		throw error;
	}
}

/** Stamp the version dir `live` currently points into as superseded now (starts its prune clock). */
function markSuperseded(paths: StorePaths): void {
	const entry = liveStoreEntry(paths);
	if (!entry) return;
	try {
		utimesSync(join(paths.slugDir, entry), new Date(), new Date());
	} catch {
		// best effort: a missing stamp only means the entry keeps its creation age
	}
}

/**
 * Point `live` at `finalPkg`. Symlink → atomic rename of a temp link over it.
 * Real directory → atomic exchange with a temp link (the old directory ends up at the temp path).
 */
function publish(paths: StorePaths, finalPkg: string, swap: (a: string, b: string) => boolean): boolean {
	const tmp = join(paths.liveParent, `${paths.swapPrefix}${uniqueSuffix()}`);
	try {
		symlinkSync(relative(paths.liveParent, finalPkg), tmp); // may be refused (e.g. Windows without privilege)
		if (lstatSync(paths.live).isSymbolicLink()) {
			markSuperseded(paths);
			renameSync(tmp, paths.live);
			return true;
		}
		if (!swap(paths.live, tmp)) throw new Error("atomic exchange unavailable");
	} catch {
		removeIfSymlink(tmp); // only ever our own temp link, never a directory left by an earlier switch
		return false;
	}
	touch(tmp); // tmp is now the old real directory: start its prune clock
	return true;
}

/** Unique name part: pid + time + random, so two switches in one process and millisecond never collide. */
function uniqueSuffix(): string {
	return `${process.pid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Remove `path` only when it is a symlink; never throws. */
function removeIfSymlink(path: string): void {
	try {
		if (lstatSync(path).isSymbolicLink()) rmSync(path, { force: true });
	} catch {
		// already gone
	}
}

/** Best-effort mtime bump; never throws (a failure only delays pruning). */
function touch(path: string): void {
	try {
		utimesSync(path, new Date(), new Date());
	} catch {
		// ignore
	}
}

/**
 * Upgrade `target.lockedPackage` to the version its `bun.lock` resolves, without
 * ever leaving the live path missing or half-written.
 *
 * @param target - Managed target declaring `lockedPackage`
 * @param install - Installer, run in the staging dir (never in the live tree)
 * @param timeoutMs - Installer timeout
 * @param swap - Atomic exchange primitive (injectable for tests)
 * @returns "switched", or "unsupported" when a real directory cannot be exchanged atomically (live untouched)
 * @throws when staging fails or yields a wrong/incomplete version (live untouched)
 */
export async function switchToLockedVersion(
	target: DepsTarget,
	install: InstallFn,
	timeoutMs: number,
	swap: (a: string, b: string) => boolean = swapPaths,
): Promise<SwitchResult> {
	const pkg = target.lockedPackage;
	const locked = pkg ? readLockedVersion(target.dir, pkg) : null;
	if (!pkg || !locked) throw new Error("no locked version to switch to");

	const paths = storePaths(target.dir, pkg);
	const finalDir = await ensureStaged(target, paths, pkg, locked, install, timeoutMs);
	const finalPkg = join(finalDir, "node_modules", pkg);

	const liveIsDir = existsSync(paths.live) && !lstatSync(paths.live).isSymbolicLink();
	// Pre-switch processes resolve lazy imports through the live path: keep their (hashed) files reachable.
	if (liveIsDir) cpSync(paths.live, finalPkg, { recursive: true, force: false, errorOnExist: false });
	return publish(paths, finalPkg, swap) ? "switched" : "unsupported";
}
