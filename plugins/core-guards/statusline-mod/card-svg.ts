import { escapeXml, FONT, FONT_PX } from "./bar-pill";
import { svgSize, svgSource } from "./bar-svg";
import { glyphWidth } from "./glyph-widths";
import type { BarItem, Card, CardSvg, Item, Span, TextItem } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** Height of a card on the desktop, in CSS pixels: about one line of text. */
export const CARD_PX = 28;
/** Room left and right of a card's content, in CSS pixels. */
const PAD_PX = 10;
/** Corner radius of a card, in CSS pixels. */
const RX_PX = 8;
/** Room between two items of a card, in CSS pixels. */
const GAP_PX = 8;
/** A desktop card's deep black fill and its thin light-grey outline (inset, so the height holds). */
const CARD_FILL = "#000000";
const CARD_EDGE = "#4a4f58";
/** Opacity of a dim span. */
const DIM = 0.6;

/** Pixels a span takes in the card (the desktop font's measured widths); the text is never stretched to it. */
export const textPx = (text: string, bold = true): number => glyphWidth(text, bold);

const spanPx = (spans: Span[]): number =>
	spans.reduce((n, s) => n + textPx(s.text, s.bold === true), 0);

/** Pixels an item takes. */
const itemPx = (item: Item): number =>
	item.kind === "bar" ? svgSize(item).width : spanPx(item.spans);

/** One span as a `<tspan>`: its own color and weight, flowed after the one before it. */
const spanMarkup = (span: Span, gapBefore = false): string => {
	const dim = span.dim ? ` fill-opacity="${DIM}"` : "";
	const dx = gapBefore ? ` dx="${GAP_PX}"` : "";
	return `<tspan${dx} font-weight="${span.bold ? 700 : 400}" fill="${span.color ?? THEME.text}"${dim}>${escapeXml(span.text)}</tspan>`;
};

/** A bar's own drawing, nested at `x` and centred in the card's height. */
const barMarkup = (item: BarItem, x: number): string => {
	const y = (CARD_PX - svgSize(item).height) / 2;
	return svgSource(item).replace(/^<svg xmlns="[^"]*"/, `<svg x="${x}" y="${y}"`);
};

/**
 * A run of consecutive text items as ONE `<text>` at the font's natural widths: the items
 * are chained, `GAP_PX` apart by a `dx`, so a wrong width estimate leaves no hole between them.
 */
const runMarkup = (x: number, run: TextItem[]): string => {
	const spans = run.flatMap((item, i) =>
		item.spans.map((s, j) => spanMarkup(s, i > 0 && j === 0)),
	);
	return `<text x="${x}" y="${CARD_PX / 2}" xml:space="preserve" dominant-baseline="central" font-family="${FONT}" font-size="${FONT_PX}">${spans.join("")}</text>`;
};

/** What an item says in plain text, for a reader that cannot see the drawing. */
const plainOf = (item: Item): string =>
	item.kind === "bar" ? (item.overlay ?? item.label) : item.spans.map((s) => s.text).join("");

/**
 * A card as ONE SVG: a rounded rectangle in the card color, its texts in their own colors
 * and its bars nested, left to right. Only numbers, the theme's colors and escaped text
 * enter the markup.
 *
 * @param card - The card to draw
 * @returns The SVG document, its pixel size and its plain-text description
 */
export function cardSvg(card: Card): CardSvg {
	const widths = card.items.map(itemPx);
	const inner = widths.reduce((n, w) => n + w, 0) + GAP_PX * Math.max(0, widths.length - 1);
	const width = Math.ceil(inner + 2 * PAD_PX);
	let x = PAD_PX;
	let run: TextItem[] = [];
	let runX = x;
	const body: string[] = [];
	const flush = (): void => {
		if (run.length > 0) body.push(runMarkup(runX, run));
		run = [];
	};
	card.items.forEach((item, i) => {
		if (item.kind === "bar") {
			flush();
			body.push(barMarkup(item, x));
		} else {
			if (run.length === 0) runX = x;
			run.push(item);
		}
		x += (widths[i] ?? 0) + GAP_PX;
	});
	flush();
	const bg = `<rect x="0.5" y="0.5" width="${width - 1}" height="${CARD_PX - 1}" rx="${RX_PX}" fill="${CARD_FILL}" stroke="${CARD_EDGE}" stroke-width="1"/>`;
	return {
		source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${CARD_PX}" viewBox="0 0 ${width} ${CARD_PX}">${bg}${body.join("")}</svg>`,
		alt: card.items.map(plainOf).join(" "),
		width,
		height: CARD_PX,
	};
}
