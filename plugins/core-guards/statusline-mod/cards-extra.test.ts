import { describe, expect, test } from "claude-code/testing";
import { extraCard, isEngaged } from "./cards-extra";
import { CARD_GAP, layout } from "./layout";
import { ENGAGED, ENGINE, FACTS, NOW, rowText, rowWidth, withCredits } from "./test-data";
import { THEME } from "./theme";

const shown = (level: number, f = withCredits(ENGAGED)) => {
	const card = extraCard(f, level);
	return card ? rowText([card]) : null;
};
const fill = (f = withCredits(ENGAGED)) => {
	const item = extraCard(f, 0)?.items.at(-1);
	return item?.kind === "bar" ? item.rows[0]?.fill : undefined;
};
const ids = (f: ReturnType<typeof withCredits>, w: number) =>
	layout(f, NOW, w, 3)
		.flat()
		.map((c) => c.id);

describe("credit usage: engaged means enabled AND spending", () => {
	test("enabled with credits used: engaged", () => {
		expect(isEngaged(ENGAGED)).toBe(true);
	});

	test("enabled but nothing spent: not engaged", () => {
		expect(isEngaged({ ...ENGAGED, usedUsd: 0, percent: 0 })).toBe(false);
	});

	test("spent but disabled (the owner's cache today, out_of_credits): not engaged", () => {
		expect(isEngaged({ ...ENGAGED, enabled: false })).toBe(false);
	});

	test("no data: not engaged", () => {
		expect(isEngaged(null)).toBe(false);
		expect(isEngaged(undefined)).toBe(false);
	});
});

describe("credit usage card", () => {
	test("hidden when not engaged, switched off in config, or without data", () => {
		expect(extraCard(FACTS, 0)).toBeNull();
		expect(extraCard(withCredits({ ...ENGAGED, enabled: false }), 0)).toBeNull();
		const flags = { ...ENGINE.flags, extra: { ...ENGINE.flags.extra, enabled: false } };
		expect(extraCard({ ...FACTS, engine: { ...ENGINE, flags, extra: ENGAGED } }, 0)).toBeNull();
	});

	test("spend, percentage and bar, then compact", () => {
		expect(shown(0)).toContain("$75.50 / $100.00");
		expect(shown(0)).toContain("76%");
		expect(shown(0)).toContain("█");
		expect(shown(2)).not.toContain("█");
		expect(shown(3)).toBe("$75.50/$100 76%");
		expect(shown(4)).toBe("76%");
	});

	test("amber below 80%, red from 80%", () => {
		expect(fill()).toBe(THEME.warn);
		expect(fill(withCredits({ ...ENGAGED, usedUsd: 90, percent: 90 }))).toBe(THEME.bad);
	});

	test("the config's spending, percentage and bar switches hide their piece", () => {
		const extra = { enabled: true, percent: false, spending: false, bar: false };
		const flags = { ...ENGINE.flags, extra };
		const f = { ...FACTS, engine: { ...ENGINE, extra: ENGAGED, flags } };
		expect(shown(0, f)?.trim()).toBe("Credits");
	});
});

describe("credit usage in the layout", () => {
	test("absent from every layout while not engaged", () => {
		for (const w of [200, 120, 60, 40]) expect(ids(FACTS, w)).not.toContain("extra");
	});

	test("engaged: shown at 200 columns, never wider than the room at any width", () => {
		const f = withCredits(ENGAGED);
		expect(ids(f, 200)).toContain("extra");
		for (const w of [200, 160, 120, 100, 80, 60, 40]) {
			const rows = layout(f, NOW, w, 3);
			expect(rows.length).toBeLessThanOrEqual(3);
			for (const row of rows) expect(rowWidth(row, CARD_GAP)).toBeLessThanOrEqual(w);
		}
	});
});
