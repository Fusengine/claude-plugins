/**
 * Tests for statusline-mod: opt-in install, enabledPlugins, duplicate cleanup.
 * The `claude` CLI is never called: the installer is injected.
 */
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import * as p from "@clack/prompts";
import {
	OWN_STATUSLINE_MARKER,
	STATUSLINE_MOD_ID,
	STATUSLINE_MOD_PROMPT,
	isStatuslineModActive,
	promptStatuslineMod,
	removeOwnStatusLine,
} from "../services/statusline-mod";
import { configureStatusLine, type Settings } from "../services/settings-manager";

const OWN = {
	type: "command",
	command: `bun /m/${OWN_STATUSLINE_MARKER}`,
	padding: 0,
};
const CUSTOM = { type: "command", command: "my-own-statusline.sh", padding: 0 };

const okInstall = () => Promise.resolve(true);
const failInstall = () => Promise.resolve(false);

afterEach(() => {
	spyOn(p, "confirm").mockRestore();
});

function answer(value: boolean | symbol) {
	return spyOn(p, "confirm").mockResolvedValue(value as boolean);
}

describe("statusline-mod / prompt default", () => {
	test("question defaults to true and is marked recommended", async () => {
		expect(STATUSLINE_MOD_PROMPT.initialValue).toBe(true);
		const spy = answer(false);
		await promptStatuslineMod({}, false, okInstall);
		const arg = spy.mock.calls[0]?.[0] as { initialValue: boolean; message: string };
		expect(arg.initialValue).toBe(true);
		expect(arg.message).toContain("recommended");
	});
});

describe("statusline-mod / install flow", () => {
	test("yes: installs, sets enabledPlugins, removes our statusLine, keeps other plugins", async () => {
		answer(true);
		const settings: Settings = { statusLine: OWN, enabledPlugins: { "other@mk": true } };
		const out = await promptStatuslineMod(settings, false, okInstall);
		expect(out.enabledPlugins).toEqual({ "other@mk": true, [STATUSLINE_MOD_ID]: true });
		expect(out.statusLine).toBeUndefined();
	});

	test("no: nothing changes, classic statusLine kept", async () => {
		answer(false);
		const out = await promptStatuslineMod({ statusLine: OWN }, false, okInstall);
		expect(out.enabledPlugins).toBeUndefined();
		expect(out.statusLine).toEqual(OWN);
	});

	test("cancel behaves like no", async () => {
		answer(Symbol("clack:cancel"));
		const cancel = spyOn(p, "isCancel").mockReturnValue(true);
		const out = await promptStatuslineMod({ statusLine: OWN }, false, okInstall);
		cancel.mockRestore();
		expect(out.enabledPlugins).toBeUndefined();
	});

	test("install failure is non-blocking and leaves settings untouched", async () => {
		answer(true);
		const out = await promptStatuslineMod({ statusLine: OWN }, false, failInstall);
		expect(out.enabledPlugins).toBeUndefined();
		expect(out.statusLine).toEqual(OWN);
	});

	test("custom user statusLine is preserved after install", async () => {
		answer(true);
		const out = await promptStatuslineMod({ statusLine: CUSTOM }, false, okInstall);
		expect(out.statusLine).toEqual(CUSTOM);
		expect(isStatuslineModActive(out)).toBe(true);
	});
});

describe("statusline-mod / already active and idempotence", () => {
	test("already active: no question, no install, our statusLine removed", async () => {
		const spy = answer(true);
		let installs = 0;
		const install = () => {
			installs++;
			return Promise.resolve(true);
		};
		const settings: Settings = {
			statusLine: OWN,
			enabledPlugins: { [STATUSLINE_MOD_ID]: true, "other@mk": true },
		};
		const out = await promptStatuslineMod(settings, false, install);
		expect(spy).not.toHaveBeenCalled();
		expect(installs).toBe(0);
		expect(out.statusLine).toBeUndefined();
		expect(out.enabledPlugins).toEqual({ [STATUSLINE_MOD_ID]: true, "other@mk": true });
	});

	test("running twice yields the same settings", async () => {
		answer(true);
		const once = await promptStatuslineMod({ statusLine: OWN }, false, okInstall);
		const snapshot = JSON.stringify(once);
		const twice = await promptStatuslineMod(once, false, okInstall);
		expect(JSON.stringify(twice)).toBe(snapshot);
	});

	test("already active: custom statusLine untouched", async () => {
		const settings: Settings = {
			statusLine: CUSTOM,
			enabledPlugins: { [STATUSLINE_MOD_ID]: true },
		};
		const out = await promptStatuslineMod(settings, false, okInstall);
		expect(out.statusLine).toEqual(CUSTOM);
	});
});

describe("statusline-mod / --skip-env", () => {
	test("silent when mod not active: no question, no install, no change", async () => {
		const spy = answer(true);
		let installs = 0;
		const install = () => {
			installs++;
			return Promise.resolve(true);
		};
		const out = await promptStatuslineMod({ statusLine: OWN }, true, install);
		expect(spy).not.toHaveBeenCalled();
		expect(installs).toBe(0);
		expect(out.statusLine).toEqual(OWN);
	});

	test("silent cleanup when mod already active", async () => {
		const spy = answer(true);
		const settings: Settings = { statusLine: OWN, enabledPlugins: { [STATUSLINE_MOD_ID]: true } };
		const out = await promptStatuslineMod(settings, true, okInstall);
		expect(spy).not.toHaveBeenCalled();
		expect(out.statusLine).toBeUndefined();
	});
});

describe("statusline-mod / statusLine wiring", () => {
	test("statusLine is posed when the mod is not active", () => {
		const out = configureStatusLine({}, "/m/plugins/core-guards/statusline");
		expect(out.statusLine?.command).toContain(OWN_STATUSLINE_MARKER);
		expect(isStatuslineModActive(out)).toBe(false);
	});

	test("removeOwnStatusLine ignores absent statusLine", () => {
		expect(removeOwnStatusLine({})).toEqual({});
	});
});
