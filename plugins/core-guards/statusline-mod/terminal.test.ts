import { describe, expect, test } from "claude-code/testing";
import { limitsOf } from "./emit-limits";
import { toFacts } from "./facts";
import { terminalLayout } from "./layout-terminal";
import { parseData } from "./parse-data";
import { termSegments, widthOf } from "./segments-terminal";
import { decode } from "./sgr";
import { ENGINE, FACTS, NOW, TERMINAL, USAGE, withTerminal } from "./test-data";

const F = withTerminal(FACTS);
const textOf = (rows: ReturnType<typeof terminalLayout>["rows"]): string[] =>
	rows.map((r) => r.map((s) => s.spans.map((p) => p.text).join("")).join(" · "));

describe("sgr: the old engine's colors", () => {
	test("named, 256-color and bold runs; a reset ends the style", () => {
		const spans = decode("\x1b[0;34m◆\x1b[0m 2.1\x1b[38;5;208mX\x1b[0m\x1b[1mB\x1b[0m");
		expect(spans.map((s) => [s.text, s.color, s.bold])).toEqual([
			["◆", "blue", undefined],
			[" 2.1", undefined, undefined],
			["X", "#ff8700", undefined],
			["B", undefined, true],
		]);
	});

	test("a background operand never leaks into the foreground", () => {
		const [s] = decode("\x1b[48;5;31;1mA\x1b[0m");
		expect(s).toMatchObject({ text: "A", bold: true });
		expect(s?.color).toBeUndefined();
	});

	test("the directory's file link is removed, not printed", () => {
		const spans = decode("\x1b]8;;file:///a/b\x07\x1b[1m~/b\x1b[0m\x1b]8;;\x07");
		expect(spans.map((s) => s.text).join("")).toBe("~/b");
	});
});

describe("terminal layout", () => {
	test("wide: the engine's two lines, segments in its order, cache among them", () => {
		const { rows } = terminalLayout(F, 220, 3);
		expect(textOf(rows)).toEqual([
			"08.10.26 - 12:27 · ◆ 2.1.294 · ⌂ ~/../elegancia-danceshoes · ⚙ Mythos 5.1 [0.0K/1M] · ◐ medium · Hit 99% · R 370K · W 2K",
			"$0.00 · 5h: 19% █░░░ (1h - 32m) · $ D: $2754.00",
		]);
	});

	test("cache is green from 80%, and abbreviates before anything is dropped", () => {
		const cache = termSegments(F, 0).find((s) => s.id === "cache");
		expect(cache?.spans[1]?.color).toBe("#7ed321");
		const short = termSegments(F, 2).find((s) => s.id === "cache");
		expect(short?.spans.map((s) => s.text).join("")).toBe("⚡99%");
	});

	for (const width of [200, 140, 100, 80, 60, 40] as const) {
		test(`${width} columns: no row wider than the room, no segment cut`, () => {
			const { rows, separator } = terminalLayout(F, width, 3);
			const gap = widthOf(separator);
			const names = termSegments(F, 2).map((s) => s.id);
			expect(rows.length).toBeLessThanOrEqual(3);
			for (const row of rows) {
				const used = row.reduce((n, s) => n + s.width, 0) + gap * (row.length - 1);
				expect(used).toBeLessThanOrEqual(width);
				for (const s of row) expect(names).toContain(s.id);
			}
		});
	}

	test("short of rows the least important segment goes, never half of one", () => {
		const ids = terminalLayout(F, 60, 2).rows.flat().map((s) => s.id);
		expect(ids).toContain("model");
		expect(ids).not.toContain("dailySpend");
	});

	test("an older emitter gives no segments: nothing to draw", () => {
		expect(terminalLayout(FACTS, 200, 3).rows).toEqual([]);
		expect(TERMINAL.segments.length).toBeGreaterThan(0);
	});
});

describe("5h / 7d: the session first, the engine's cache as the fallback", () => {
	const engine = {
		...ENGINE,
		limits: { fiveHour: { percent: 19, resetsAt: "2026-10-08T14:00:00Z" }, sevenDay: { percent: 5 } },
	};
	const bare = { ...USAGE, rateLimits: [] };

	test("no session windows: the engine's fill in", () => {
		const f = toFacts(engine, { model: "m", effort: null, cache: null, usage: bare });
		expect(f.fiveHour).toEqual({ percent: 19, resetsAt: "2026-10-08T14:00:00Z" });
		expect(f.sevenDay).toEqual({ percent: 5 });
	});

	test("session windows win over the engine's", () => {
		const f = toFacts(engine, { model: "m", effort: null, cache: null, usage: USAGE });
		expect(f.fiveHour?.percent).toBe(10);
		expect(f.sevenDay?.percent).toBe(3);
	});

	test("neither has them: absent, never zeroed", () => {
		const f = toFacts(ENGINE, { model: "m", effort: null, cache: null, usage: bare });
		expect(f.fiveHour).toBeUndefined();
		expect(NOW).toBeGreaterThan(0);
	});

	test("the OAuth answer maps to windows, percent as given", () => {
		const out = limitsOf({
			five_hour: { utilization: 19, resets_at: "2026-10-08T12:00:00+00:00" },
			seven_day: { utilization: 5, resets_at: null },
		});
		expect(out).toEqual({
			fiveHour: { percent: 19, resetsAt: "2026-10-08T12:00:00+00:00" },
			sevenDay: { percent: 5 },
		});
		expect(limitsOf(null)).toBeNull();
		expect(limitsOf({ five_hour: { utilization: Number.NaN, resets_at: null } })).toBeNull();
	});

	test("parseData keeps well-formed windows and segments, drops the rest", () => {
		const payload = { ...engine, terminal: F.engine.terminal };
		expect(parseData(JSON.stringify(payload))).toEqual(payload);
		const bad = { ...ENGINE, limits: { fiveHour: { percent: "x" } }, terminal: { segments: 3 } };
		const parsed = parseData(JSON.stringify(bad));
		expect(parsed?.limits).toBeNull();
		expect(parsed?.terminal).toBeNull();
	});
});
