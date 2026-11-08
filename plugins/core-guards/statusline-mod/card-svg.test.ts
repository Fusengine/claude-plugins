import { describe, expect, test } from "claude-code/testing";
import { CARD_PX, cardSvg, textPx } from "./card-svg";
import { bar, makeCard, muted, strong, text } from "./card";
import { cardsAt } from "./cards";
import { ENGAGED, NOW, withCredits } from "./test-data";
import { THEME } from "./theme";

describe("cardSvg", () => {
	test("width is the text at a fixed advance plus the padding, height is the card's", () => {
		const card = makeCard("env", 1, 0, [text(strong("08.11.26 - 13:22")), text(strong("~/../personel"))]);
		const svg = cardSvg(card as NonNullable<typeof card>);
		const inner = textPx("08.11.26 - 13:22") + textPx("~/../personel") + 8;
		expect(svg.width).toBe(Math.ceil(inner + 20));
		expect(svg.height).toBe(CARD_PX);
	});

	test("the width estimate sits within +3/-1 px of the desktop font's measured width", () => {
		const measured: [string, number][] = [
			["08.11.26 - 13:49", 98.4],
			["~/../personel", 77],
			["OPUS 5.5 Medium", 108.3],
			["7d: 2% 6d 6h", 80.1],
		];
		for (const [s, real] of measured) {
			const diff = textPx(s) - real;
			expect(diff).toBeGreaterThan(-1.5);
			expect(diff).toBeLessThan(3);
		}
	});

	test("consecutive text items chain in ONE text with a dx gap; a bar splits the runs", () => {
		const card = makeCard("limits", 1, 0, [
			text(strong("7d: 2%")),
			text(strong("6d 6h")),
			bar(8, "usage 2%", { ratio: 0.02, fill: THEME.fiveFill }),
			text(strong("0.00 $")),
		]);
		const { source } = cardSvg(card as NonNullable<typeof card>);
		expect(source.match(/<text /g)).toHaveLength(2);
		expect(source.match(/ dx="8"/g)).toHaveLength(1);
	});

	test("one rounded rect, deep black with a thin outline; an item's spans flow in one text, never stretched", () => {
		const card = makeCard("limits", 1, 0, [text(strong("7d: 3%"), muted(" 6d 16h"))]);
		const { source } = cardSvg(card as NonNullable<typeof card>);
		expect(source).toContain('rx="8" fill="#000000" stroke="#4a4f58" stroke-width="1"');
		expect(source.match(/<text /g)).toHaveLength(1);
		expect(source.match(/<tspan /g)).toHaveLength(2);
		expect(source).not.toContain("textLength");
		expect(source).not.toContain("lengthAdjust");
		expect(source).toContain(`fill="${THEME.muted}"`);
	});

	test("every card that can appear (env, cache, model, limits with 5h, extra) gets the same pill", () => {
		const cards = cardsAt(withCredits(ENGAGED), 0, NOW, true);
		expect(cards.map((c) => c.id)).toEqual(["env", "cache", "model", "limits", "extra"]);
		for (const c of cards) {
			const { source } = cardSvg(c);
			expect(source).toContain('fill="#000000" stroke="#4a4f58"');
			expect(source).not.toContain(THEME.card);
		}
	});

	test("escapes <, > and & in the text and keeps the plain text as alt", () => {
		const card = makeCard("env", 1, 0, [text(strong("a<b & c>d"))]);
		const svg = cardSvg(card as NonNullable<typeof card>);
		expect(svg.source).toContain("a&lt;b &amp; c&gt;d");
		expect(svg.source).not.toContain("a<b");
		expect(svg.alt).toBe("a<b & c>d");
	});

	test("a bar is nested inside the card and named in the alt", () => {
		const card = makeCard("model", 1, 0, [
			text(strong("OPUS")),
			bar(8, "context 0%", { ratio: 0, fill: THEME.ctxFill }),
		]);
		const svg = cardSvg(card as NonNullable<typeof card>);
		expect(svg.source.match(/<svg /g)).toHaveLength(2);
		expect(svg.alt).toBe("OPUS context 0%");
	});
});
