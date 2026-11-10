/**
 * Offline fixtures for the version-switch tests: a fake harness package, a live
 * dir that holds it as a real directory, and a fake installer.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DepsTarget, InstallFn } from "../interfaces/ensure-deps";

export const ROOT = "/tmp/fusengine-test-version-switch";
export const PKG = "@fusengine/harness";
export const HASH_OLD = "hook-entry-OLD.mjs";
export const HASH_NEW = "hook-entry-NEW.mjs";

/** Minimal bun.lock text resolving `PKG@version`. */
export function lockText(version: string): string {
	return `{ "packages": { "${PKG}": ["${PKG}@${version}", ""], } }`;
}

/** Write a fake harness package (package.json, bin.mjs, one hashed chunk) under `<root>/node_modules/<PKG>`. */
export function writePackage(root: string, version: string, chunk: string): void {
	const pkg = join(root, "node_modules", PKG);
	mkdirSync(join(pkg, "dist/cli"), { recursive: true });
	writeFileSync(join(pkg, "package.json"), JSON.stringify({ version }));
	writeFileSync(join(pkg, "dist/cli/bin.mjs"), `export const v = "${version}";\n`);
	writeFileSync(join(pkg, "dist", chunk), `export default "${version}";\n`);
}

/** A live dir at `installed` (real directory) whose lockfile resolves `locked`. */
export function makeLive(name: string, installed: string, locked: string): DepsTarget {
	const dir = join(ROOT, name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "package.json"), "{}");
	writeFileSync(join(dir, "bun.lock"), lockText(locked));
	writePackage(dir, installed, HASH_OLD);
	return {
		dir,
		marker: join(dir, "node_modules", PKG, "dist/cli/bin.mjs"),
		lockedPackage: PKG,
		label: name,
	};
}

/** Fake installer: materializes the version named in the stage's bun.lock. */
export const fakeInstall: InstallFn = async (stage) => {
	const version = /@(\d+\.\d+\.\d+)"/.exec(readFileSync(join(stage, "bun.lock"), "utf8"))?.[1] ?? "0.0.0";
	writePackage(stage, version, HASH_NEW);
};

/** Version read through the live path (follows the symlink). */
export function liveVersion(t: DepsTarget): string {
	const raw = readFileSync(join(t.dir, "node_modules", PKG, "package.json"), "utf8");
	return (JSON.parse(raw) as { version: string }).version;
}
