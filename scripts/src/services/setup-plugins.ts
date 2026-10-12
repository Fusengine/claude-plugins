/**
 * Plugin setup steps service
 * SRP: plugin scanning, dependency installation, statusline wiring and
 * CLAUDE.md sync.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import {
	filesAreEqual,
	installPluginDeps,
	makeScriptsExecutable,
} from "../utils/fs-helpers";
import { findPluginDepDirs } from "../utils/dep-scanner";
import { scanPlugins } from "./plugin-scanner";
import type { Settings } from "./settings-manager";
import { configureStatusLine } from "./settings-manager";

/** Scan plugins and make scripts executable */
export async function scanAndPrepare(pluginsDir: string): Promise<void> {
	const s = p.spinner();
	s.start("Scanning plugins...");
	const plugins = scanPlugins({ pluginsDir });
	const withHooks = plugins.filter((pl) => pl.hasHooks);
	s.stop(`${withHooks.length} plugins with hooks detected`);

	s.start("Making scripts executable...");
	const scriptCount = await makeScriptsExecutable(pluginsDir);
	s.stop(`${scriptCount} scripts made executable`);
}

/** Install CLAUDE.md if newer */
export async function installClaudeMd(
	src: string,
	dest: string,
): Promise<void> {
	if (!existsSync(src)) return;
	const same = await filesAreEqual(src, dest);
	if (!same) {
		await Bun.write(dest, await Bun.file(src).text());
		p.log.success("CLAUDE.md installed");
	} else {
		p.log.info("CLAUDE.md already up to date");
	}
}

/** Install dependencies for every plugin dir holding a package.json */
export async function installDeps(pluginsDir: string): Promise<void> {
	const s = p.spinner();
	s.start("Installing plugin dependencies...");
	const dirs = findPluginDepDirs(pluginsDir);
	let ok = 0;
	for (const dir of dirs) {
		try {
			if (await installPluginDeps(dir)) ok++;
		} catch {
			p.log.warn(`Dependency install failed: ${dir}`);
		}
	}
	s.stop(`${ok}/${dirs.length} plugin dep dirs installed`);
}

/**
 * Setup statusline if available. The engine deps are always installed (the
 * statusline mod relies on the engine); `statusLine` is only written when the
 * mod is not active, to avoid a double display.
 * @param pluginsDir - marketplace plugins directory
 * @param settings - current settings object
 * @param modActive - true when the statusline mod is enabled
 */
export async function setupStatusline(
	pluginsDir: string,
	settings: Settings,
	modActive = false,
): Promise<Settings> {
	const statuslineDir = join(pluginsDir, "core-guards/statusline");
	if (!existsSync(statuslineDir)) return settings;

	const s = p.spinner();
	s.start("Installing statusline...");
	try {
		await installPluginDeps(statuslineDir);
		if (modActive) {
			s.stop("Statusline engine ready (mod active, classic statusLine skipped)");
			return settings;
		}
		settings = configureStatusLine(settings, statuslineDir);
		s.stop("Statusline configured");
	} catch {
		s.stop("Statusline installation failed");
	}
	return settings;
}
