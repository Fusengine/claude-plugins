import { barRuns } from "./bar-cells";
import { svgSize, svgSource } from "./bar-svg";
import type { BarItem, Item, Row, Span } from "./interfaces/card.interface";
import type { StatuslineElements, SvgElement } from "./interfaces/statusline-elements.interface";
import { CARD_GAP } from "./layout";
import { THEME } from "./theme";

/** Cells between two cards where the surface flows them (the desktop): wider than the terminal's. */
const FLOW_GAP = 1;

/** Inner padding and item gap of a card on the desktop, whose cells are wider than the text. */
const FLOW_PAD = 1;

/** One Text per span, in the color the card gave it. */
const spanText = (ui: StatuslineElements, spans: Span[], key: string) => {
	const { Text } = ui;
	return (
		<Text key={key}>
			{spans.map((s, i) => (
				<Text key={`${key}-${i}`} color={s.color} bold={s.bold} dimColor={s.dim}>
					{s.text}
				</Text>
			))}
		</Text>
	);
};

/** A bar: real rounded stripes where the surface has `Svg`, else cells of colored glyphs. */
const barElement = (ui: StatuslineElements, item: BarItem, key: string, Svg?: SvgElement) => {
	const { Text } = ui;
	if (Svg) return <Svg key={key} source={svgSource(item)} alt={item.label} {...svgSize(item)} />;
	return (
		<Text key={key}>
			{barRuns(item).map((r, i) => (
				<Text key={`${key}-${i}`} color={r.color} backgroundColor={r.bg}>
					{r.text}
				</Text>
			))}
		</Text>
	);
};

const itemElement = (ui: StatuslineElements, item: Item, key: string, Svg?: SvgElement) =>
	item.kind === "bar" ? barElement(ui, item, key, Svg) : spanText(ui, item.spans, key);

/**
 * Draws the laid-out cards: one row Box per row, one background-colored padded Box per
 * card, never shrunk, so a card is cut by nothing but the layout that sized it. Where the
 * surface flows the cards (desktop), each card gets a `round` border in its own background
 * color, so it reads as a rounded chip; the terminal keeps borderless cells.
 *
 * @param ui - The surface's element table, from `$.ui.resolve(e)`
 * @param rows - The rows from `layout`
 * @param Svg - The surface's `Svg`, when it has one (desktop): bars become rounded stripes
 * @returns The band's tree
 */
export function StatuslineView(ui: StatuslineElements, rows: Row[], Svg?: SvgElement) {
	const { Box } = ui;
	return (
		<Box flexDirection="column">
			{rows.map((row, r) => (
				<Box
					key={`r${r}`}
					flexDirection="row"
					flexWrap={Svg ? "wrap" : "nowrap"}
					columnGap={Svg ? FLOW_GAP : CARD_GAP}
					rowGap={Svg ? FLOW_GAP : 0}
				>
					{row.map((card) => (
						<Box
							key={`${r}-${card.id}`}
							flexShrink={0}
							alignItems="center"
							backgroundColor={THEME.card}
							borderStyle={Svg ? "round" : undefined}
							borderColor={Svg ? THEME.card : undefined}
							paddingX={Svg ? FLOW_PAD : card.pad}
							columnGap={Svg ? FLOW_PAD : card.gap}
						>
							{card.items.map((item, i) => itemElement(ui, item, `${card.id}-${i}`, Svg))}
						</Box>
					))}
				</Box>
			))}
		</Box>
	);
}
