/**
 * Tests for plugin-repair: reinstall only enabled plugins whose files are gone.
 * The `claude` CLI is never called: the installer is injected.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findMissingPlugins, repairMissingPlugins } from "../services/plugin-repair";
import { OWN_STATUSLINE_MARKER, STATUSLINE_MOD_ID, isStatuslineModActive, promptStatuslineMod } from "../services/statusline-mod";
import type { Settings } from "../services/settings-manager";

const PRESENT = "fuse-present@fusengine-plugins";
const GONE = "fuse-gone@fusengine-plugins";
const NOENTRY = "fuse-noentry@fusengine-plugins";
let dir: string;
let installedJson: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "plugin-repair-"));
	const presentPath = join(dir, "cache", "present");
	mkdirSync(presentPath, { recursive: true });
	installedJson = join(dir, "installed_plugins.json");
	writeFileSync(installedJson, JSON.stringify({
		version: 2,
		plugins: {
			[PRESENT]: [{ installPath: presentPath }],
			[GONE]: [{ installPath: join(dir, "cache", "gone") }],
			[STATUSLINE_MOD_ID]: [{ installPath: join(dir, "cache", "statusline-gone") }],
		},
	}));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const settings = (ids: Record<string, unknown>): Settings => ({ enabledPlugins: ids });

describe("plugin-repair", () => {
	test("installs exactly the missing enabled plugins", async () => {
		const calls: string[] = [];
		const failed = await repairMissingPlugins(
			settings({ [PRESENT]: true, [GONE]: true, [NOENTRY]: true, "x@other": true, "fuse-off@fusengine-plugins": false }),
			installedJson,
			async (id) => (calls.push(id), true),
		);
		expect(calls.sort()).toEqual([GONE, NOENTRY].sort());
		expect(failed).toEqual([]);
	});

	test("no call when every cache exists", async () => {
		const calls: string[] = [];
		await repairMissingPlugins(settings({ [PRESENT]: true }), installedJson, async (id) => (calls.push(id), true));
		expect(calls).toEqual([]);
	});

	test("missing installed_plugins.json counts as missing; failures are returned, not thrown", async () => {
		const failed = await repairMissingPlugins(settings({ [GONE]: true }), join(dir, "nope.json"), async () => false);
		expect(failed).toEqual([GONE]);
		expect(findMissingPlugins(settings({ [GONE]: true }), join(dir, "nope.json"))).toEqual([GONE]);
	});
});

describe("statusline-mod / files check", () => {
	const own = { type: "command", command: `bun /m/${OWN_STATUSLINE_MARKER}`, padding: 0 };

	test("enabled + files missing: not active, classic statusLine kept, no prompt", async () => {
		const s: Settings = { statusLine: own, enabledPlugins: { [STATUSLINE_MOD_ID]: true } };
		expect(isStatuslineModActive(s, installedJson)).toBe(false);
		const out = await promptStatuslineMod(s, false, async () => true, installedJson);
		expect(out.statusLine).toEqual(own);
	});

	test("enabled + files present: active, classic statusLine removed", async () => {
		const p2 = join(dir, "cache", "statusline");
		mkdirSync(p2, { recursive: true });
		writeFileSync(installedJson, JSON.stringify({ plugins: { [STATUSLINE_MOD_ID]: [{ installPath: p2 }] } }));
		const s: Settings = { statusLine: own, enabledPlugins: { [STATUSLINE_MOD_ID]: true } };
		expect(isStatuslineModActive(s, installedJson)).toBe(true);
		const out = await promptStatuslineMod(s, false, async () => true, installedJson);
		expect(out.statusLine).toBeUndefined();
	});
});
