/**
 * Self-heal: reinstall missing node_modules for the loader's managed dirs, and
 * (SessionStart only) move a declared package to the version its bun.lock resolves.
 * Built-ins only (zero third-party import) — must survive running before
 * node_modules exists at all, since it is what repairs it.
 * @description SRP: orchestrate check → single-flight lock → fail-open install.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DepsTarget, EnsureDepsOptions, InstallFn } from "../interfaces/ensure-deps";
import { runBunInstall } from "../utils/bun-install-runner";
import { clearInstallFailed, isInBackoff, markInstallFailed } from "../utils/install-backoff";
import { isInstalledVersionStale, readLockedVersion, readPackageVersion } from "../utils/locked-version";
import { tryAcquireLock } from "../utils/single-flight-lock";
import { pruneVersionStore } from "./version-store-prune";
import { switchToLockedVersion } from "./versioned-install";

const INSTALL_TIMEOUT_MS = 60_000;

/**
 * Ensure every managed target's node_modules marker exists, reinstalling
 * in-place (single-flight, fail-open) when missing. With `checkVersion`, a
 * target declaring `lockedPackage` is also moved to the lockfile's version by an
 * atomic stage-and-switch (never in place; skipped with a warning where the switch
 * is unavailable), unless a recent failed attempt is still backing off.
 * Never throws and never blocks a caller longer than `INSTALL_TIMEOUT_MS` per
 * target — a skipped or failed install just leaves the state for a later call.
 *
 * @param targets - Directories to check/install, each with its presence marker
 * @param install - Installer to invoke (defaults to real `bun install`; tests inject a fake)
 * @param options - `checkVersion`: enable the version-driven repair (SessionStart only);
 *   `swap`: atomic exchange primitive for the switch (tests inject a failing one)
 */
export async function ensureDeps(
	targets: DepsTarget[],
	install: InstallFn = runBunInstall,
	options: EnsureDepsOptions = {},
): Promise<void> {
	for (const target of targets) {
		try {
			if (needsRepair(target, options)) await healOne(target, install, options);
			else if (options.checkVersion && target.lockedPackage) pruneLocked(target);
		} catch (error) {
			// last-resort guard: a self-heal problem must never take the hook loader down
			console.error(`[ensure-deps] ${target.label}:`, error);
		}
	}
}

/** True when the version-driven repair applies: opted in, declared, stale, and not backing off. */
function isVersionStale(target: DepsTarget, options: EnsureDepsOptions): boolean {
	if (!options.checkVersion || !target.lockedPackage) return false;
	return isInstalledVersionStale(target.dir, target.lockedPackage) && !isInBackoff(target.dir);
}

/** Marker missing (always repaired, as before) OR version-driven repair applies. */
function needsRepair(target: DepsTarget, options: EnsureDepsOptions): boolean {
	return !existsSync(target.marker) || isVersionStale(target, options);
}

/** Single-flight-locked repair of one target; a lost race or a bare dir is a no-op. */
async function healOne(
	target: DepsTarget,
	install: InstallFn,
	options: EnsureDepsOptions,
): Promise<void> {
	const release = tryAcquireLock(target.dir);
	if (!release) return; // another process is already installing — skip, fail-open

	try {
		if (!needsRepair(target, options)) return; // installed while we waited for the lock
		if (!existsSync(join(target.dir, "package.json"))) return; // nothing to install
		const versionDriven = existsSync(target.marker);
		await runInstall(target, install, versionDriven, options);
	} catch (error) {
		console.error(`[ensure-deps] install failed for ${target.label}:`, error);
	} finally {
		release();
	}
}

/**
 * Run the installer. The missing-marker path installs in place, as before.
 *
 * A version-driven upgrade (marker present) NEVER touches the live tree in place:
 * it stages, verifies, then switches atomically. The back-off stamp is written
 * BEFORE staging (a hook killed mid-install must not retry at every SessionStart)
 * and cleared only after a successful switch. Where the atomic switch is
 * unavailable it skips: live tree untouched, stamp kept, one warning.
 */
async function runInstall(
	target: DepsTarget,
	install: InstallFn,
	versionDriven: boolean,
	options: EnsureDepsOptions,
): Promise<void> {
	if (!versionDriven || !target.lockedPackage) {
		await install(target.dir, INSTALL_TIMEOUT_MS);
		return;
	}
	markInstallFailed(target.dir);
	const result = await switchToLockedVersion(target, install, INSTALL_TIMEOUT_MS, options.swap);
	if (result === "unsupported") {
		const installed = readPackageVersion(join(target.dir, "node_modules", target.lockedPackage));
		const locked = readLockedVersion(target.dir, target.lockedPackage);
		console.warn(
			`[ensure-deps] ${target.label}: cannot switch ${target.lockedPackage} atomically on this system; ` +
				`kept installed ${installed ?? "unknown"} (lockfile resolves ${locked ?? "unknown"}). Run /update-harness to upgrade.`,
		);
		return;
	}
	if (!isInstalledVersionStale(target.dir, target.lockedPackage)) clearInstallFailed(target.dir);
}

/** Prune the version store under the single-flight lock; skipped when another process holds it. */
function pruneLocked(target: DepsTarget): void {
	const release = tryAcquireLock(target.dir); // fail-open: null when held or unusable
	if (!release) return;
	try {
		pruneVersionStore(target);
	} finally {
		release();
	}
}
