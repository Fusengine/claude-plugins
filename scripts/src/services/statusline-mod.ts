/**
 * Statusline mod service
 * Single Responsibility: opt-in install of the `fuse-statusline` Claude Code
 * mod, and removal of our own classic `statusLine` once the mod is active
 * (otherwise the statusline is drawn twice).
 */
import * as p from "@clack/prompts";
import { $ } from "bun";
import type { ModInstaller } from "../interfaces/setup";
import type { Settings } from "./settings-manager";

/** Plugin id of the statusline mod in the Fusengine marketplace. */
export const STATUSLINE_MOD_ID = "fuse-statusline@fusengine-plugins";

/** Path fragment identifying the classic statusLine command we install. */
export const OWN_STATUSLINE_MARKER = "plugins/core-guards/statusline/src/index.ts";

/** Prompt shown to the user; the mod is the recommended option. */
export const STATUSLINE_MOD_PROMPT = {
	message:
		"Enable the responsive statusline mod (fuse-statusline)? (recommended — replaces the classic status line)",
	initialValue: true,
} as const;

/**
 * Whether the statusline mod is enabled in the given settings.
 * @param settings - current settings object
 */
export function isStatuslineModActive(settings: Settings): boolean {
	const enabled = settings.enabledPlugins as Record<string, unknown> | undefined;
	return enabled?.[STATUSLINE_MOD_ID] === true;
}

/**
 * Remove `settings.statusLine` only when it is the classic Fusengine one.
 * A user-customised statusLine is never touched.
 * @param settings - settings object (mutated + returned)
 */
export function removeOwnStatusLine(settings: Settings): Settings {
	const command = settings.statusLine?.command;
	if (typeof command === "string" && command.includes(OWN_STATUSLINE_MARKER)) {
		delete settings.statusLine;
	}
	return settings;
}

/**
 * Install the mod at user scope via the `claude` CLI. Never throws.
 * @returns true when the CLI exited successfully
 */
export const installStatuslineMod: ModInstaller = async () => {
	try {
		await $`claude plugin install ${STATUSLINE_MOD_ID}`.quiet();
		return true;
	} catch {
		return false;
	}
};

/** Mark the mod as enabled, preserving every other enabledPlugins key. */
function enableMod(settings: Settings): Settings {
	const enabled = (settings.enabledPlugins as Record<string, unknown> | undefined) ?? {};
	settings.enabledPlugins = { ...enabled, [STATUSLINE_MOD_ID]: true };
	return settings;
}

/**
 * Opt-in step for the statusline mod. Already active: no question, only the
 * duplicate-statusLine cleanup. With `skipEnv`: silent, cleanup only. Otherwise
 * asks (default yes), installs via the CLI (non-blocking on failure), records
 * `enabledPlugins` in memory (the CLI wrote it on disk, but the installer's
 * final save would otherwise overwrite it with a stale copy), then cleans up.
 * Answering no keeps the classic statusLine.
 * @param settings - current settings object (mutated + returned)
 * @param skipEnv - true for `--skip-env`: never prompt
 * @param install - installer, injectable for tests
 */
export async function promptStatuslineMod(
	settings: Settings,
	skipEnv: boolean,
	install: ModInstaller = installStatuslineMod,
): Promise<Settings> {
	if (isStatuslineModActive(settings)) return removeOwnStatusLine(settings);
	if (skipEnv) return settings;

	const enable = await p.confirm({ ...STATUSLINE_MOD_PROMPT });
	if (p.isCancel(enable) || !enable) return settings;

	if (!(await install())) {
		p.log.warn(
			`Could not install ${STATUSLINE_MOD_ID}. Add the marketplace first (claude plugin marketplace add fusengine/agents), then run: claude plugin install ${STATUSLINE_MOD_ID}`,
		);
		return settings;
	}
	p.log.success("Statusline mod installed");
	return removeOwnStatusLine(enableMod(settings));
}
