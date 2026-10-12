import { describe, expect, test } from "claude-code/testing";
import { pillCells } from "./bar-pill";
import { svgSize, svgSource } from "./bar-svg";
import { bar } from "./card";
import { cardsAt } from "./cards";
import { FACTS, NOW } from "./test-data";
import { THEME } from "./theme";

const pill = { ...bar(16, "context 0%", { ratio: 0, fill: THEME.ctxFill }), overlay: "0.0K/1M" };

describe("model card: thick pill with the tokens centered over it (desktop)", () => {
	test("full-pill track and fill, bold white text centered, no script", () => {
		const svg = svgSource(pill);
		expect(svg).toContain('rx="10"');
		expect(svg).toContain('font-size="12"');
		expect(svg).toContain(`fill="${THEME.track}"`);
		expect(svg).toContain(`fill="${THEME.ctxFill}"`);
		expect(svg).toContain('text-anchor="middle"');
		expect(svg).toContain('dominant-baseline="central"');
		expect(svg).toContain('font-weight="700"');
		expect(svg).toContain(">0.0K/1M</text>");
		expect(svg).not.toContain("<script");
		expect(svgSize(pill)).toEqual({ width: 64, height: 20 });
	});

	test("the pill hugs its text: longer tokens, wider pill, never the old fixed 30 cells", () => {
		expect(pillCells("0.0K/1M")).toBe(19);
		expect(pillCells("492.8K/1M")).toBe(23);
		const model = cardsAt(FACTS, 0, NOW, true).find((c) => c.id === "model");
		const drawn = model?.items.find((i) => i.kind === "bar");
		expect(drawn?.kind === "bar" && drawn.width).toBe(
			pillCells(drawn?.kind === "bar" ? (drawn.overlay ?? "") : ""),
		);
	});

	test("the text is escaped", () => {
		expect(svgSource({ ...pill, overlay: "<b>&" })).toContain("&lt;b&gt;&amp;");
	});

	test("the desktop's model card has no side text; the terminal fallback keeps it", () => {
		const items = (overlay: boolean) =>
			cardsAt(FACTS, 0, NOW, overlay).find((c) => c.id === "model")?.items ?? [];
		expect(items(true).map((i) => i.kind)).toEqual(["text", "bar"]);
		expect(items(false).map((i) => i.kind)).toEqual(["text", "bar", "text"]);
	});
});
