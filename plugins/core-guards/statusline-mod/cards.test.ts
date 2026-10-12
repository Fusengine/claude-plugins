import { describe, expect, test } from "claude-code/testing";
import { barRuns, fillCells } from "./bar-cells";
import { svgSource } from "./bar-svg";
import { bar } from "./card";
import { cacheCard, hitColor } from "./cards-cache";
import { cacheFigures, toFacts } from "./facts";
import { formatLeft, formatTokens, modelLabel } from "./labels";
import { ENGINE, FACTS, rowText } from "./test-data";
import { THEME } from "./theme";

const usage = {
	input_tokens: 30,
	output_tokens: 5,
	cache_read_input_tokens: 370,
	cache_creation_input_tokens: 0,
};

describe("cache figures", () => {
	test("ratio is read / (input + read + written)", () => {
		expect(cacheFigures({ ...usage, cache_creation_input_tokens: 100 })).toEqual({
			ratio: 370 / 500,
			read: 370,
			written: 100,
		});
	});

	test("no usage, or no input counted: no figures", () => {
		expect(cacheFigures(undefined)).toBeNull();
		const zero = {
			input_tokens: 0,
			output_tokens: 0,
			cache_read_input_tokens: 0,
			cache_creation_input_tokens: 0,
		};
		expect(cacheFigures(zero)).toBeNull();
	});

	test("colors: green from 80%, amber from 50%, red below", () => {
		expect(hitColor(0.8)).toBe(THEME.reset5);
		expect(hitColor(0.79)).toBe(THEME.warn);
		expect(hitColor(0.5)).toBe(THEME.warn);
		expect(hitColor(0.49)).toBe(THEME.bad);
	});

	test("card: tokens at level 0, ratio only at 1, compact at 2, hidden without figures", () => {
		const text = (level: number) => rowText([cacheCard(FACTS, level)].filter((c) => c !== null));
		expect(text(0)).toBe("Hit 99% · R 370K · W 2K");
		expect(text(1)).toBe("Hit 99%");
		expect(text(2)).toBe("⚡99%");
		expect(cacheCard({ ...FACTS, cache: undefined }, 0)).toBeNull();
	});
});

describe("labels", () => {
	test("model names", () => {
		expect(modelLabel("claude-opus-5-5")).toBe("OPUS 5.5");
		expect(modelLabel("Opus 5.5[1m]")).toBe("OPUS 5.5");
		expect(modelLabel("claude-sonnet-4-5-20250929")).toBe("SONNET 4.5");
		expect(modelLabel("")).toBe("");
	});

	test("tokens and durations", () => {
		expect(formatTokens(0, true)).toBe("0.0K");
		expect(formatTokens(1_000_000, true)).toBe("1M");
		expect(formatTokens(1_500_000, true)).toBe("1.5M");
		expect(formatLeft((2 * 60 + 33) * 60_000)).toBe("2h33m");
		expect(formatLeft((6 * 24 + 16) * 3_600_000)).toBe("6d 16h");
		expect(formatLeft(-5)).toBe("0m");
	});
});

describe("toFacts: what the session does not have stays absent", () => {
	test("no rate limits, no cost, no percent", () => {
		const f = toFacts(ENGINE, {
			model: "m",
			effort: null,
			cache: null,
			usage: { startedAt: 0, context: { tokens: 500, window: 1000 }, rateLimits: [] },
		});
		expect(f.fiveHour).toBeUndefined();
		expect(f.costUsd).toBeUndefined();
		expect(f.cache).toBeUndefined();
		expect(f.contextPercent).toBe(50);
	});

	test("reads the five_hour and seven_day windows", () => {
		const f = toFacts(ENGINE, {
			model: "m",
			effort: "high",
			cache: null,
			usage: {
				startedAt: 0,
				context: { window: 1000 },
				rateLimits: [
					{ kind: "seven_day", percentUsed: 3, resetsAt: "2026-10-15T00:00:00Z" },
					{ kind: "five_hour", percentUsed: 10 },
				],
			},
		});
		expect(f.fiveHour).toEqual({ percent: 10, resetsAt: undefined });
		expect(f.sevenDay?.percent).toBe(3);
		expect(f.effort).toBe("high");
	});
});

describe("bars", () => {
	test("a window shows at least its first cell, never more than its width", () => {
		expect(fillCells(0, 8)).toBe(1);
		expect(fillCells(0.5, 8)).toBe(4);
		expect(fillCells(7, 8)).toBe(8);
		expect(fillCells(Number.NaN, 8)).toBe(1);
	});

	test("a single bar is thin lines with rounded stubs, one run per color", () => {
		const runs = barRuns(bar(8, "x", { ratio: 0.5, fill: "#22c55e" }));
		expect(runs.map((r) => r.text).join("")).toBe("╺━━━━━━╸");
		expect(runs.map((r) => r.color)).toEqual(["#22c55e", THEME.track]);
	});

	test("two stripes share one row: upper half blocks, top in the foreground", () => {
		const runs = barRuns(
			bar(4, "x", { ratio: 1, fill: THEME.fiveFill }, { ratio: 0, fill: THEME.sevenFill }),
		);
		expect(runs.map((r) => r.text).join("")).toBe("▀▀▀▀");
		expect(runs[0]).toMatchObject({ color: THEME.fiveFill, bg: THEME.sevenFill });
		expect(runs[1]).toMatchObject({ color: THEME.fiveFill, bg: THEME.track });
	});

	test("svg: rounded stripes, only numbers and theme colors", () => {
		const svg = svgSource(bar(8, "x", { ratio: 0.5, fill: THEME.fiveFill }));
		expect(svg).toContain('rx="4"');
		expect(svg).toContain(THEME.fiveFill);
		expect(svg).not.toContain("<script");
	});
});
