/**
 * Versioned package store interfaces.
 * @description SRP: types for the versioned store layout only.
 */

/** Paths for one `<dir>/node_modules/<pkg>` live package. */
export interface StorePaths {
	/** Live path `hooks.json` resolves: `<dir>/node_modules/<pkg>` (real dir or symlink). */
	live: string;
	/** Directory holding the live path (`<dir>/node_modules/@scope`). */
	liveParent: string;
	/** `<dir>/node_modules/.fuse-versions/<slug>` — versions and stages of this package. */
	slugDir: string;
	/** Name prefix of leftover swap entries next to the live path. */
	swapPrefix: string;
}
