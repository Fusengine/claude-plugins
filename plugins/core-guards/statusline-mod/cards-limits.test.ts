import { describe, expect, test } from "claude-code/testing";
import { limitsCard } from "./cards-limits";
import { FACTS, NOW } from "./test-data";
import { limitColor, THEME } from "./theme";

const fillsAt = (five: number, seven: number): string[] => {
	const card = limitsCard(
		{ ...FACTS, fiveHour: { percent: five }, sevenDay: { percent: seven } },
		0,
		NOW,
	);
	const barItem = card?.items.find((i) => i.kind === "bar");
	return barItem?.kind === "bar" ? barItem.rows.map((r) => r.fill) : [];
};

describe("limits bar color follows the percentage", () => {
	test("2% is blue, 90% red, for 5h and 7d alike", () => {
		expect(fillsAt(2, 2)).toEqual([THEME.fiveFill, THEME.fiveFill]);
		expect(fillsAt(90, 90)).toEqual([THEME.bad, THEME.bad]);
	});

	test("the stops run blue, green, orange, red", () => {
		expect([10, 40, 75, 95].map(limitColor)).toEqual([
			THEME.fiveFill,
			THEME.ctxFill,
			THEME.sevenFill,
			THEME.bad,
		]);
	});
});
