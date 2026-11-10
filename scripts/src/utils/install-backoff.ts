/**
 * Back-off stamp for failed version-driven installs — built-ins only.
 * The stamp lives next to the single-flight lock (same dir, same key slug) and
 * stops an offline user from paying the install timeout on every SessionStart.
 * @description SRP: read/write/clear one timestamp file per managed dir.
 */
import { readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { lockDir, lockSlug } from "./single-flight-lock";

const DEFAULT_BACKOFF_MIN = 30;
const BACKOFF_ENV = "FUSE_ENSURE_DEPS_BACKOFF_MIN";

/** Absolute path of the back-off stamp for a managed dir. */
export function backoffStampPath(dir: string): string {
	return join(lockDir(), `${lockSlug(dir)}.failed`);
}

/** Back-off window in ms: `FUSE_ENSURE_DEPS_BACKOFF_MIN` minutes (default 30); invalid → default. */
function backoffMs(): number {
	const raw = process.env[BACKOFF_ENV];
	const minutes = raw ? Number(raw) : Number.NaN;
	return (Number.isFinite(minutes) && minutes >= 0 ? minutes : DEFAULT_BACKOFF_MIN) * 60_000;
}

/** True when a failed version-driven install for `dir` happened less than the window ago. */
export function isInBackoff(dir: string, now = Date.now()): boolean {
	try {
		const { ts } = JSON.parse(readFileSync(backoffStampPath(dir), "utf8")) as { ts: number };
		return typeof ts === "number" && now - ts < backoffMs();
	} catch {
		return false;
	}
}

/**
 * Stamp a version-driven install attempt: written BEFORE staging and cleared
 * only on success, so a failed, skipped or killed attempt backs off (best effort, never throws).
 */
export function markInstallFailed(dir: string): void {
	try {
		mkdirSync(lockDir(), { recursive: true });
		writeFileSync(backoffStampPath(dir), JSON.stringify({ ts: Date.now() }));
	} catch {
		// best effort: without a stamp we merely retry next SessionStart
	}
}

/** Drop the stamp after a successful install (best effort, never throws). */
export function clearInstallFailed(dir: string): void {
	try {
		rmSync(backoffStampPath(dir), { force: true });
	} catch {
		// best effort: a leftover stamp only delays the next version check
	}
}
