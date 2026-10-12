import { describe, expect, test } from "claude-code/testing";
import { BAND, type Mounter, world } from "./band-world";
import { DESKTOP_TREE } from "./desktop-snapshot";
import { ENGINE, TERMINAL } from "./test-data";
import { THEME } from "./theme";
import { isNode, kids, texts, walk } from "./tree-walk";
import { TERM_INDENT } from "./view-terminal";

const WITH_TERMINAL = {
	...ENGINE,
	terminal: { separator: TERMINAL.separator, segments: [...TERMINAL.segments] },
};

const drawn = async ($: Mounter, surface: "terminal" | "desktop", columns: number) => {
	const ui = await $.ui.mount({
		plugin: "fuse-statusline",
		surface,
		component: "AbovePrompt",
		props: { ...BAND, bodyColumns: columns },
	});
	const tree = await ui.drawn();
	await ui.unmount();
	return tree;
};

const baseline = (): string => JSON.stringify(DESKTOP_TREE);

describe("desktop: the validated tree, byte for byte (1.0.6 but for the model card's pill)", () => {
	for (const columns of [40, 120, 220] as const) {
		test(`${columns} columns: identical to the 1.0.6 snapshot`, async ($, on) => {
			world(on);
			expect(JSON.stringify(await drawn($, "desktop", columns))).toBe(baseline());
		});

		test(`${columns} columns: the engine's terminal segments change nothing`, async ($, on) => {
			world(on, WITH_TERMINAL);
			expect(JSON.stringify(await drawn($, "desktop", columns))).toBe(baseline());
		});
	}
});

describe("one data set, two designs", () => {
	test("desktop: round borders and Svg bars, no end caps", async ($, on) => {
		world(on, WITH_TERMINAL);
		const nodes = walk(await drawn($, "desktop", 200));
		expect(nodes.some((n) => n.type === "Svg")).toBe(true);
		expect(nodes.some((n) => n.props?.borderStyle === "round")).toBe(true);
		expect(JSON.stringify(nodes)).not.toMatch(/[◖◗]/);
	});

	test("terminal: the old statusline's text, no Svg, no border, no chip background", async ($, on) => {
		world(on, WITH_TERMINAL);
		const nodes = walk(await drawn($, "terminal", 200));
		expect(nodes.some((n) => n.type === "Svg")).toBe(false);
		expect(nodes.some((n) => n.props?.borderStyle !== undefined)).toBe(false);
		expect(nodes.some((n) => n.props?.backgroundColor === THEME.card)).toBe(false);
		const text = JSON.stringify(nodes);
		for (const glyph of ["◆", "⌂", "⚙", "◐", "5h:", "$ D:"]) expect(text).toContain(glyph);
		expect(text).not.toMatch(/[◖◗]/);
	});

	// 94 and 58: a row fills the whole width when laid out without the inset, so these two catch a dropped `- TERM_INDENT`.
	for (const columns of [220, 120, 94, 80, 60, 58, 40] as const) {
		test(`terminal ${columns} columns: inset like Claude Code's status line, rows still fit`, async ($, on) => {
			world(on, WITH_TERMINAL);
			const tree = await drawn($, "terminal", columns);
			expect(isNode(tree) && tree.props?.paddingLeft).toBe(TERM_INDENT);
			for (const row of isNode(tree) ? kids(tree) : []) {
				expect([...texts(row)].length + TERM_INDENT).toBeLessThanOrEqual(columns);
			}
		});
	}

	test("terminal: without the engine's segments it falls back to the cards", async ($, on) => {
		world(on);
		const nodes = walk(await drawn($, "terminal", 200));
		expect(nodes.some((n) => n.props?.backgroundColor === THEME.card)).toBe(true);
	});
});
