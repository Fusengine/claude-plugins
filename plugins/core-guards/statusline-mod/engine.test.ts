import { describe, expect, test } from "claude-code/testing";
import { buildInput, engineArgv } from "./engine";
import { buildEngineFacts, flagsOf } from "./engine-facts";
import type { EngineConfig } from "./interfaces/engine.interface";
import type { SessionFacts } from "./interfaces/session-facts.interface";
import { parseData } from "./parse-data";
import { ENGINE } from "./test-data";

const facts: SessionFacts = {
	id: "s1",
	model: "claude-opus",
	cwd: "/work/repo",
	root: "/work",
	version: "2.1.293",
	now: 10_000,
	usage: {
		startedAt: 4_000,
		context: { tokens: 1_900, window: 2_000, percent: 95 },
		rateLimits: [],
		cost: { usd: 1.25 },
	},
};

/** The owner's `config.json`: `limits` on, `fiveHour` / `weekly` off. */
const config: EngineConfig = {
	time: { enabled: true, showDate: true, showTime: true },
	directory: {
		enabled: true,
		showGit: true,
		showBranch: true,
		showDirtyIndicator: true,
		showStagedCount: true,
		showUnstagedCount: true,
	},
	model: { enabled: true, showTokens: true, showMaxTokens: true, showDecimals: true },
	effort: { enabled: true, showLevel: true },
	context: { enabled: true, progressBar: { enabled: true } },
	cost: { enabled: true, decimals: 2 },
	fiveHour: { enabled: false, showTimeLeft: true, progressBar: { enabled: true } },
	weekly: { enabled: false, showTimeLeft: true, progressBar: { enabled: true } },
	limits: { enabled: true, show5h: true, show7d: false, showResetTime: true },
	dailySpend: { enabled: true },
};

describe("buildInput", () => {
	test("maps the session usage to context_window and cost", () => {
		const input = buildInput(facts);
		expect(input.session_id).toBe("s1");
		expect(input.workspace).toEqual({ current_dir: "/work/repo", project_dir: "/work" });
		expect(input.context_window).toMatchObject({ total_input_tokens: 1_900, used_percentage: 95 });
		expect(input.cost).toMatchObject({ total_cost_usd: 1.25, total_duration_ms: 6_000 });
	});

	test("leaves cost out when the session has none", () => {
		const input = buildInput({ ...facts, usage: { ...facts.usage, cost: undefined } });
		expect(input.cost).toBeUndefined();
	});
});

describe("engineArgv", () => {
	test("runs the marketplace copy of the emitter under bun", () => {
		const [bin, script] = engineArgv("/home/me");
		expect(bin).toBe("bun");
		expect(script).toContain("/home/me/.claude/plugins/marketplaces/");
		expect(script).toContain("statusline-mod/emit-data.ts");
	});
});

describe("flagsOf: the owner's config says what shows", () => {
	test("limits on: its own show5h / show7d / reset flags", () => {
		const { limits } = flagsOf(config);
		expect(limits.five).toEqual({ show: true, reset: true });
		expect(limits.seven.show).toBe(false);
	});

	test("limits off: the engine's fiveHour / weekly segments decide", () => {
		const c = {
			...config,
			limits: { enabled: false },
			weekly: { ...config.weekly, enabled: true },
		};
		const { limits } = flagsOf(c);
		expect(limits.five.show).toBe(false);
		expect(limits.seven.show).toBe(true);
	});

	test("a disabled segment is a disabled flag", () => {
		const flags = flagsOf({ ...config, effort: { enabled: false, showLevel: true } });
		expect(flags.effort).toBe(false);
	});
});

describe("buildEngineFacts", () => {
	const got = {
		now: new Date(2026, 9, 8, 11, 26),
		path: { styled: "~/../app", base: "app" },
		git: { branch: "main", isDirty: true, staged: 0, unstaged: 73 },
	};

	test("formats the clock as the engine does and keeps the git figures", () => {
		const f = buildEngineFacts(config, { ...got, dailyUsd: 12.5 });
		expect(f.time).toEqual({ date: "08.10.26", clock: "11:26" });
		expect(f.git).toEqual({ branch: "main", dirty: true, staged: 0, unstaged: 73 });
		expect(f.dailyUsd).toBe(12.5);
	});

	test("no branch means no git, no tracker means no daily spend", () => {
		const f = buildEngineFacts(config, { ...got, git: { ...got.git, branch: null } });
		expect(f.git).toBeNull();
		expect(f.dailyUsd).toBeNull();
	});
});

describe("parseData", () => {
	test("accepts the emitter's payload", () => {
		expect(parseData(JSON.stringify(ENGINE))).toEqual(ENGINE);
	});

	test("rejects anything else", () => {
		expect(parseData("")).toBeNull();
		expect(parseData("not json")).toBeNull();
		expect(parseData("[1]")).toBeNull();
		expect(parseData('{"model":"x"}')).toBeNull();
	});
});
