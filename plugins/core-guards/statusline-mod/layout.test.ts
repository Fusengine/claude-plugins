import { describe, expect, test } from "claude-code/testing";
import { cardsAt, MAX_LEVEL } from "./cards";
import type { Facts } from "./interfaces/card.interface";
import { CARD_GAP, layout } from "./layout";
import { ENGINE, FACTS, NOW, rowText, rowWidth } from "./test-data";

const MAX_ROWS = 3;
const WIDTHS = [200, 160, 120, 100, 80, 60, 40] as const;
const run = (width: number, f: Facts = FACTS, rows = MAX_ROWS) => layout(f, NOW, width, rows);
const names = (rows: ReturnType<typeof run>): string[] => rows.flat().map((c) => c.id);
const OFF = { show: false, reset: false } as const;
/** The target facts with some of the engine's switches replaced. */
const withFlags = (flags: Partial<Facts["engine"]["flags"]>): Facts => ({
	...FACTS,
	engine: { ...ENGINE, flags: { ...ENGINE.flags, ...flags } },
});

describe("layout: every width", () => {
	for (const width of WIDTHS) {
		test(`${width} columns: no row is wider than the room, at most ${MAX_ROWS} rows`, () => {
			const rows = run(width);
			expect(rows.length).toBeGreaterThan(0);
			expect(rows.length).toBeLessThanOrEqual(MAX_ROWS);
			for (const row of rows) expect(rowWidth(row, CARD_GAP)).toBeLessThanOrEqual(width);
		});

		test(`${width} columns: a card is never split, whole on one row at one level`, () => {
			const rows = run(width);
			const ids = names(rows);
			expect(new Set(ids).size).toBe(ids.length);
			const levels = Array.from({ length: MAX_LEVEL + 1 }, (_, l) => cardsAt(FACTS, l, NOW));
			for (const card of rows.flat()) {
				const whole = levels.some((cards) =>
					cards.some((c) => c.id === card.id && JSON.stringify(c) === JSON.stringify(card)),
				);
				expect(whole).toBe(true);
			}
		});

		test(`${width} columns: cards keep their reading order`, () => {
			const order = ["env", "cache", "model", "limits"];
			const ids = names(run(width));
			expect(ids).toEqual(order.filter((id) => ids.includes(id)));
		});
	}
});

describe("layout: the owner's target", () => {
	test("220 columns: the four cards on one row, nothing abbreviated", () => {
		const rows = run(220);
		expect(rows).toHaveLength(1);
		expect(rowText(rows[0] ?? [])).toBe(
			"08.10.26 - 11:26 ~/../elegancia-danceshoes main* ~73 | Hit 99% · R 370K · W 2K | OPUS 5.5 Medium ██████████ 0.0K/1M | 5h: 10% - 2h33m 7d: 3% 6d 16h ████████ D: 2552.96 $ | 58.00 $",
		);
	});

	// The full row takes 196 columns (`Hit` label, 8-cell limits bar): one column short of it must wrap.
	test("195 columns: the cards flow onto two rows rather than shrink", () => {
		expect(run(196)).toHaveLength(1);
		expect(run(195)).toHaveLength(2);
	});

	test("120 columns: cards wrap as whole units onto a second row", () => {
		const rows = run(120);
		expect(rows.length).toBe(2);
		expect(names(rows)).toEqual(["env", "cache", "model", "limits"]);
	});

	test("shrinks before dropping: 60 columns keeps all four cards abbreviated", () => {
		const rows = run(60);
		expect(names(rows)).toEqual(["env", "cache", "model", "limits"]);
		expect(rowText(rows.flat().length ? (rows[0] ?? []) : [])).not.toContain("~/../");
	});

	test("40 columns: the card that cannot fit abbreviated goes, the core stays", () => {
		const ids = names(run(40));
		expect(ids).toContain("model");
		expect(ids).toContain("limits");
	});

	test("a one-row budget shrinks first, then drops the least important cards", () => {
		expect(names(run(100, FACTS, 1))).toEqual(["env", "cache", "model", "limits"]);
		const rows = run(30, FACTS, 1);
		expect(rows).toHaveLength(1);
		expect(names(rows)).toContain("model");
		expect(names(rows)).not.toContain("cache");
	});
});

describe("layout: missing data and switched-off pieces", () => {
	test("no cache figure yet: no cache card, never a made-up percentage", () => {
		const ids = names(run(200, { ...FACTS, cache: undefined }));
		expect(ids).not.toContain("cache");
	});

	test("no rate limits (off a subscription): the usage card keeps spend and cost only", () => {
		const f = { ...FACTS, fiveHour: undefined, sevenDay: undefined };
		const text = rowText(
			run(200, f)
				.flat()
				.filter((c) => c.id === "limits"),
		);
		expect(text).not.toContain("5h");
		expect(text).toContain("D: 2552.96 $");
	});

	test("every piece of a card switched off: the card is gone", () => {
		const f = withFlags({
			dailySpend: false,
			cost: { enabled: false, decimals: 2 },
			limits: { five: OFF, seven: OFF, bar: false },
		});
		expect(names(run(200, f))).not.toEqual([]);
		expect(names(run(200, f))).not.toContain("limits");
	});

	test("a disabled segment hides its piece, not the card around it", () => {
		const f = withFlags({ effort: false, directory: { ...ENGINE.flags.directory, git: false } });
		const text = rowText(run(200, f).flat());
		expect(text).not.toContain("Medium");
		expect(text).not.toContain("main*");
		expect(text).toContain("OPUS 5.5");
	});

	test("nothing to show, no rows", () => {
		const f = withFlags({
			time: { enabled: false, date: false, clock: false },
			directory: { ...ENGINE.flags.directory, enabled: false },
			model: { ...ENGINE.flags.model, enabled: false },
			effort: false,
			context: { enabled: false, bar: false },
			limits: { five: OFF, seven: OFF, bar: false },
			dailySpend: false,
			cost: { enabled: false, decimals: 2 },
		});
		expect(run(80, { ...f, cache: undefined })).toEqual([]);
	});
});
