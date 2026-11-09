/**
 * Hook migration service
 * @description SRP: remove the fusengine hooks-loader from hook events it no
 * longer routes (REMOVED_HOOK_TYPES), leaving every user-authored entry intact.
 */
import { REMOVED_HOOK_TYPES } from "../interfaces/hook-types";
import { type HookEntry, isLoaderEntry } from "./hook-merge";
import { backupSettings, type Settings } from "./settings-manager";

/**
 * Drop the fusengine loader entries from every removed hook event. User entries
 * are kept; the event key is deleted only when it ends up empty. A settings
 * backup is taken first, and only when there is something to migrate.
 * Idempotent: a second run finds nothing to drop.
 *
 * @param settings - Settings object to mutate.
 * @param settingsPath - Path of the settings file on disk (backup source).
 * @returns The same settings object with the stale loader routes removed.
 */
export function migrateRemovedHookTypes(
	settings: Settings,
	settingsPath: string,
): Settings {
	const hooks = settings.hooks;
	if (!hooks) return settings;

	const stale = REMOVED_HOOK_TYPES.filter((t) =>
		(hooks[t] ?? []).some((e) => isLoaderEntry(e as HookEntry)),
	);
	if (stale.length === 0) return settings;

	backupSettings(settingsPath);
	for (const type of stale) {
		const kept = (hooks[type] ?? []).filter((e) => !isLoaderEntry(e as HookEntry));
		if (kept.length === 0) delete hooks[type];
		else hooks[type] = kept;
	}
	return settings;
}
