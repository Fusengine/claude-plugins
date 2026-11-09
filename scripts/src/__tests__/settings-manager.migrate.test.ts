/**
 * Tests for the removed-hook-type migration (WorktreeCreate & co).
 * Temp dirs only — the real ~/.claude/settings.json is never touched.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HOOK_TYPES, REMOVED_HOOK_TYPES } from "../interfaces/hooks";
import { migrateRemovedHookTypes } from "../services/hook-migration";
import { configureHooks, saveSettings } from "../services/settings-manager";
import type { Settings } from "../services/settings-manager";

const LOADER = "/m/scripts/hooks-loader.ts";
const userEntry = { matcher: "", hooks: [{ type: "command", command: "my-own-worktree.sh" }] };
const loader = (t: string) => ({
	matcher: "",
	hooks: [{ type: "command", command: `bun ${LOADER} ${t}` }],
});

let dir: string;
let path: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "fusengine-migrate-"));
	path = join(dir, "settings.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const backups = () => readdirSync(dir).filter((f) => f.includes(".backup."));

describe("HOOK_TYPES", () => {
	test("the four unhandled events are not routed", () => {
		for (const t of ["WorktreeCreate", "WorktreeRemove", "ConfigChange", "Setup"]) {
			expect(HOOK_TYPES as string[]).not.toContain(t);
			expect([...REMOVED_HOOK_TYPES] as string[]).toContain(t);
		}
		expect(HOOK_TYPES as string[]).toContain("TeammateIdle");
		expect(HOOK_TYPES as string[]).toContain("TaskCompleted");
	});
});

describe("migrateRemovedHookTypes", () => {
	test("[user, loader] -> [user]", async () => {
		const s: Settings = { hooks: { WorktreeCreate: [userEntry, loader("WorktreeCreate")] } };
		await saveSettings(path, s);
		migrateRemovedHookTypes(s, path);
		expect(s.hooks?.WorktreeCreate).toEqual([userEntry]);
	});

	test("[loader] only -> key removed", async () => {
		const s: Settings = {
			hooks: { WorktreeCreate: [loader("WorktreeCreate")], Setup: [loader("Setup")], Stop: [userEntry] },
		};
		await saveSettings(path, s);
		migrateRemovedHookTypes(s, path);
		expect(s.hooks).toEqual({ Stop: [userEntry] });
	});

	test("backup is taken before the settings are mutated", async () => {
		const s: Settings = { hooks: { ConfigChange: [loader("ConfigChange")] } };
		await saveSettings(path, s);
		migrateRemovedHookTypes(s, path);
		const [b] = backups();
		expect(b).toBeDefined();
		const saved = JSON.parse(readFileSync(join(dir, b as string), "utf8"));
		expect(saved.hooks.ConfigChange).toHaveLength(1);
	});

	test("no loader entry -> no backup, user entries untouched", async () => {
		const s: Settings = { hooks: { WorktreeRemove: [userEntry] } };
		await saveSettings(path, s);
		migrateRemovedHookTypes(s, path);
		expect(backups()).toHaveLength(0);
		expect(s.hooks?.WorktreeRemove).toEqual([userEntry]);
	});

	test("configureHooks never re-adds the removed types", () => {
		const s = configureHooks({}, LOADER);
		for (const t of REMOVED_HOOK_TYPES) expect(s.hooks?.[t]).toBeUndefined();
	});
});
