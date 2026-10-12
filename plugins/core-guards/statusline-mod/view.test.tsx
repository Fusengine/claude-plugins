import { describe, expect, test } from "claude-code/testing";
import { CARD_GAP } from "./layout";
import { ENGINE, NOW, USAGE } from "./test-data";
import { THEME } from "./theme";
import { drawnRowWidth, walk } from "./tree-walk";

const BAND = {
	hasSurvey: false,
	isWorking: false,
	maxRows: 12,
	scroll: { offset: 0, bodyRows: 11 },
	view: {},
} as const;
const WIDTHS = [200, 160, 120, 100, 80, 60, 40] as const;

/** What the engine draws when the mod leaves the band alone. */
const ENGINE_BAND = { type: "Text", children: ["engine"] } as const;

/** The world beneath the mod: stored engine facts, clock, model and the session's usage. */
const world = (on: Parameters<Parameters<typeof test>[1]>[1]): void => {
	on("state.get", (_$, e, next) =>
		e.plugin === "fuse-statusline" && e.key === "data"
			? { value: { value: ENGINE, version: 1 } }
			: next(e),
	);
	on("clock.now", () => ({ value: NOW }));
	on("env.get", () => ({ value: undefined }));
	on("session.model", () => ({ value: "claude-opus-5-5" }));
	on("session.usage", () => ({ value: USAGE }));
	on("ui.render", () => ENGINE_BAND);
};

describe("statusline band", () => {
	test("draws cards laid out for the band, on every surface, at every width", async ($, on) => {
		world(on);
		for (const surface of ["terminal", "desktop"] as const) {
			for (const columns of WIDTHS) {
				const ui = await $.ui.mount({
					plugin: "fuse-statusline",
					surface,
					component: "AbovePrompt",
					props: { ...BAND, bodyColumns: columns },
				});
				const nodes = walk(await ui.drawn());
				const cards = nodes.filter((n) => n.props?.backgroundColor === THEME.card);
				expect(cards.length).toBeGreaterThan(0);
				for (const row of nodes.filter((n) => n.props?.columnGap === CARD_GAP && n.props?.flexWrap === "nowrap")) {
					expect(drawnRowWidth(row, CARD_GAP)).toBeLessThanOrEqual(columns);
				}
				await ui.unmount();
			}
		}
	});

	test("the desktop draws bars as Svg, the terminal as glyphs", async ($, on) => {
		world(on);
		const types = async (surface: "terminal" | "desktop") => {
			const ui = await $.ui.mount({
				plugin: "fuse-statusline",
				surface,
				component: "AbovePrompt",
				props: { ...BAND, bodyColumns: 200 },
			});
			const found = walk(await ui.drawn()).map((n) => n.type);
			await ui.unmount();
			return found;
		};
		expect(await types("desktop")).toContain("Svg");
		expect(await types("terminal")).not.toContain("Svg");
	});

	test("the desktop flows every card in one wrapping row, whatever bodyColumns says", async ($, on) => {
		world(on);
		const ui = await $.ui.mount({
			plugin: "fuse-statusline",
			surface: "desktop",
			component: "AbovePrompt",
			props: { ...BAND, bodyColumns: 40 },
		});
		const nodes = walk(await ui.drawn());
		const rows = nodes.filter((n) => n.props?.flexWrap === "wrap");
		expect(rows).toHaveLength(1);
		const cards = nodes.filter((n) => n.props?.backgroundColor === THEME.card);
		expect(cards).toHaveLength(3);
		// Wrapped cards keep the same light gap between lines as between cards.
		expect(rows[0]?.props).toMatchObject({ columnGap: 1, rowGap: 1 });
		for (const card of cards) expect(card.props).toMatchObject({ flexShrink: 0, paddingX: 1 });
		await ui.unmount();
	});

	test("leaves the engine's band alone before the engine has reported", async ($, on) => {
		on("ui.render", () => ENGINE_BAND);
		const ui = await $.ui.mount({
			plugin: "fuse-statusline",
			surface: "terminal",
			component: "AbovePrompt",
			props: { ...BAND, bodyColumns: 80 },
		});
		expect(await ui.drawn()).toEqual(ENGINE_BAND);
		await ui.unmount();
	});
});
