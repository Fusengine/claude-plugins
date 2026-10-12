import { describe, expect, test } from "claude-code/testing";
import type { SettingsLayer } from "./interfaces/reasoning.interface";
import { resolveReasoning } from "./reasoning";

const MODEL = "claude-mythos-5-1";
const layer = (settings: Record<string, unknown>, appliesToEveryModel = true): SettingsLayer => ({
	settings,
	appliesToEveryModel,
});
/** The owner's user file: a per-model level. */
const USER = layer({ effortLevel: "high", modelSettings: { [MODEL]: { effortLevel: "medium" } } }, false);

describe("effort", () => {
	test("the owner's settings: the model's saved level, not the older top-level key", () => {
		expect(resolveReasoning(MODEL, [USER], {}).effort).toBe("medium");
	});

	test("CLAUDE_CODE_EFFORT_LEVEL beats every file; auto and junk are ignored", () => {
		expect(resolveReasoning(MODEL, [USER], { effort: "xhigh" }).effort).toBe("xhigh");
		expect(resolveReasoning(MODEL, [USER], { effort: "auto" }).effort).toBe("medium");
		expect(resolveReasoning(MODEL, [USER], { effort: "loud" }).effort).toBe("medium");
	});

	test("layers: local over project over user, each resolving the model before its top-level key", () => {
		const local = layer({ effortLevel: "low" });
		const project = layer({ modelSettings: { [MODEL]: { effortLevel: "max" } } });
		expect(resolveReasoning(MODEL, [local, project, USER], {}).effort).toBe("low");
		expect(resolveReasoning(MODEL, [project, USER], {}).effort).toBe("max");
	});

	test("the user file's top-level key alone is not applied (newer models ignore it)", () => {
		expect(resolveReasoning(MODEL, [layer({ effortLevel: "high" }, false)], {}).effort).toBeUndefined();
	});

	test("a model spelled as its alias, date-suffixed or with [1m] matches its entry", () => {
		for (const spelled of ["Mythos 5.1", "claude-mythos-5-1-20261001", "claude-mythos-5-1[1m]"]) {
			expect(resolveReasoning(spelled, [USER], {}).effort).toBe("medium");
		}
	});

	test("nothing set: absent, never invented", () => {
		expect(resolveReasoning(MODEL, [], {}).effort).toBeUndefined();
		expect(resolveReasoning(MODEL, [layer({ modelSettings: { other: { effortLevel: "low" } } })], {}).effort)
			.toBeUndefined();
	});
});

describe("thinking", () => {
	test("on by default, as the docs say", () => {
		expect(resolveReasoning(MODEL, [], {}).thinking).toBe(true);
	});

	test("alwaysThinkingEnabled false turns it off; the highest layer decides", () => {
		const off = layer({ alwaysThinkingEnabled: false });
		expect(resolveReasoning(MODEL, [off], {}).thinking).toBe(false);
		expect(resolveReasoning(MODEL, [layer({ alwaysThinkingEnabled: true }), off], {}).thinking).toBe(true);
	});

	test("MAX_THINKING_TOKENS: 0 off, a positive number on even over the file", () => {
		const off = layer({ alwaysThinkingEnabled: false });
		expect(resolveReasoning(MODEL, [], { maxThinkingTokens: "0" }).thinking).toBe(false);
		expect(resolveReasoning(MODEL, [off], { maxThinkingTokens: "8000" }).thinking).toBe(true);
		expect(resolveReasoning(MODEL, [off], { maxThinkingTokens: "x" }).thinking).toBe(false);
	});
});

describe("fast mode", () => {
	const fast = layer({ fastMode: true });

	test("fastMode true on an Opus model", () => {
		expect(resolveReasoning("claude-opus-5-5", [fast], {}).fast).toBe(true);
	});

	test("off when unset, disabled by the variable, or on a model fast mode does not run on", () => {
		expect(resolveReasoning("claude-opus-5-5", [], {}).fast).toBe(false);
		expect(resolveReasoning("claude-opus-5-5", [fast], { disableFast: "1" }).fast).toBe(false);
		expect(resolveReasoning(MODEL, [fast], {}).fast).toBe(false);
	});
});
