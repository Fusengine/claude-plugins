/**
 * Plugin repair service
 * Single Responsibility: detect Fusengine plugins that are enabled in settings
 * but have no files on disk (Claude Code sweeps its plugin cache), and
 * reinstall them through the `claude` CLI.
 */
import * as p from "@clack/prompts";
import { $ } from "bun";
import { existsSync, readFileSync } from "node:fs";
import type { Settings } from "./settings-manager";

/** Marketplace suffix of every Fusengine plugin id. */
export const MARKETPLACE_SUFFIX = "@fusengine-plugins";

/** Installs one plugin id; resolves true on success, never throws. */
export type PluginInstaller = (id: string) => Promise<boolean>;

/**
 * Whether the plugin has at least one install directory on disk.
 * @param id - plugin id (`name@fusengine-plugins`)
 * @param installedJson - path to Claude Code's `installed_plugins.json`
 */
export function hasInstallFiles(id: string, installedJson: string): boolean {
	try {
		const data = JSON.parse(readFileSync(installedJson, "utf8")) as {
			plugins?: Record<string, Array<{ installPath?: unknown }>>;
		};
		const entries = data.plugins?.[id] ?? [];
		return entries.some((e) => typeof e.installPath === "string" && existsSync(e.installPath));
	} catch {
		return false;
	}
}

/**
 * Fusengine plugins enabled in settings whose files are missing on disk.
 * @param settings - current settings object
 * @param installedJson - path to `installed_plugins.json`
 */
export function findMissingPlugins(settings: Settings, installedJson: string): string[] {
	const enabled = (settings.enabledPlugins as Record<string, unknown> | undefined) ?? {};
	return Object.keys(enabled).filter(
		(id) => enabled[id] === true && id.endsWith(MARKETPLACE_SUFFIX) && !hasInstallFiles(id, installedJson),
	);
}

/** Default installer: user-scope `claude plugin install <id>`. Never throws. */
export const installPlugin: PluginInstaller = async (id) => {
	try {
		await $`claude plugin install ${id}`.quiet();
		return true;
	} catch {
		return false;
	}
};

/**
 * Reinstall every enabled-but-missing Fusengine plugin. Plugins whose files
 * exist are untouched. Failures never block the installer: they are reported
 * with the manual command.
 * @param settings - current settings object
 * @param installedJson - path to `installed_plugins.json`
 * @param install - installer, injectable for tests
 * @returns ids that failed to install
 */
export async function repairMissingPlugins(
	settings: Settings,
	installedJson: string,
	install: PluginInstaller = installPlugin,
): Promise<string[]> {
	const missing = findMissingPlugins(settings, installedJson);
	const failed: string[] = [];
	for (const id of missing) if (!(await install(id))) failed.push(id);
	if (missing.length > failed.length) p.log.success(`Reinstalled ${missing.length - failed.length} missing plugin(s)`);
	for (const id of failed) p.log.warn(`Could not install ${id}. Run: claude plugin install ${id}`);
	return failed;
}
