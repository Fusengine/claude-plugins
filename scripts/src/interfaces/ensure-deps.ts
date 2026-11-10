/**
 * Self-heal deps interfaces.
 * @description SRP: types for the ensure-deps self-heal feature only.
 */

/** One node_modules-backed directory the self-heal loop can reinstall. */
export interface DepsTarget {
	/** Absolute directory containing the package.json to `bun install`. */
	dir: string;
	/** Absolute path whose existence proves deps are already installed. */
	marker: string;
	/** Optional package whose installed version must match this dir's `bun.lock` entry. */
	lockedPackage?: string;
	/** Human label used in fail-open error logs. */
	label: string;
}

/** Per-call options for `ensureDeps`. */
export interface EnsureDepsOptions {
	/**
	 * Also repair a target whose installed version differs from its lockfile
	 * (only `lockedPackage` targets). Callers pass true on SessionStart only, so no
	 * guard-bearing hook runs while the package is being swapped.
	 */
	checkVersion?: boolean;
	/** Atomic path-exchange primitive for the version switch; defaults to the real one (tests inject a failing one). */
	swap?: (a: string, b: string) => boolean;
}

/** Outcome of an atomic version switch (`unsupported`: live tree left untouched). */
export type SwitchResult = "switched" | "unsupported";

/** Injectable installer signature — lets tests fake `bun install` (no network). */
export type InstallFn = (dir: string, timeoutMs: number) => Promise<void>;
