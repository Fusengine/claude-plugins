import { cells } from "./format";
import type { BarItem, BarRow, Card, Item, Span, TextItem } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** Level from which the cards tighten their padding and gaps. */
const TIGHT_FROM = 2;

/** A bold span, white unless told: the primary text. */
export const strong = (text: string, color: string = THEME.text): Span => ({
	text,
	color,
	bold: true,
});

/** A regular span in the muted color. */
export const muted = (text: string): Span => ({ text, color: THEME.muted });

/** A text item. */
export const text = (...spans: Span[]): TextItem => ({ kind: "text", spans });

/** A bar item of `width` cells with one or two stripes. */
export const bar = (width: number, label: string, ...rows: BarRow[]): BarItem => ({
	kind: "bar",
	width,
	rows,
	label,
});

const widthOf = (item: Item): number =>
	item.kind === "bar" ? item.width : item.spans.reduce((n, s) => n + cells(s.text), 0);

/**
 * Wraps items in a card: padding and gaps tighten as the abbreviation level rises.
 *
 * @param id - The card's name
 * @param importance - Higher stays longer when the room runs out
 * @param level - 0 (everything) up to the most abbreviated
 * @param items - What the card holds, in order
 * @returns The card, or `null` when it holds nothing
 */
export function makeCard(
	id: string,
	importance: number,
	level: number,
	items: Item[],
): Card | null {
	if (items.length === 0) return null;
	const tight = level >= TIGHT_FROM;
	const pad = tight ? 1 : 2;
	const gap = tight ? 1 : 2;
	const inner = items.reduce((n, i) => n + widthOf(i), 0) + gap * (items.length - 1);
	return { id, importance, pad, gap, items, width: inner + 2 * pad };
}
