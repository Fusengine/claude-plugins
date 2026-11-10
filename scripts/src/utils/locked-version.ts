/**
 * Installed-vs-locked version comparison — built-ins only (must run before
 * node_modules exists). Two cheap synchronous file reads, no process, no network.
 * @description SRP: detect that an installed package differs from its bun.lock entry.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Escape a package name for literal use inside a RegExp. */
function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Version `bun.lock` resolves for `pkg` (`"<pkg>": ["<pkg>@x.y.z"`), or null if unreadable/absent. */
export function readLockedVersion(dir: string, pkg: string): string | null {
	try {
		const lock = readFileSync(join(dir, "bun.lock"), "utf8");
		const entry = new RegExp(`"${escapeRegExp(pkg)}":\\s*\\["${escapeRegExp(pkg)}@([^"]+)"`);
		return entry.exec(lock)?.[1] ?? null;
	} catch {
		return null;
	}
}

/** Version in `<pkgRoot>/package.json`, or null if unreadable. */
export function readPackageVersion(pkgRoot: string): string | null {
	try {
		const { version } = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as { version?: unknown };
		return typeof version === "string" ? version : null;
	} catch {
		return null;
	}
}

/**
 * True only when the lockfile resolves a version for `pkg` AND the installed
 * version is different or unreadable. A missing lockfile or lock entry yields
 * false, so callers fall back to their marker-only check.
 *
 * @param dir - Directory holding `bun.lock` and `node_modules`
 * @param pkg - Package name, e.g. `@fusengine/harness`
 */
export function isInstalledVersionStale(dir: string, pkg: string): boolean {
	const locked = readLockedVersion(dir, pkg);
	if (locked === null) return false;
	return readPackageVersion(join(dir, "node_modules", pkg)) !== locked;
}
