import { cardsAt, MAX_LEVEL } from "./cards";
import type { Card, Facts, Row } from "./interfaces/card.interface";

/** Cells between two cards of a row. */
export const CARD_GAP = 1;

/** Cards flowed into rows, a card never split; `null` when one card alone is wider than `width`. */
function wrap(cards: Card[], width: number): Row[] | null {
	const rows: Row[] = [];
	let row: Card[] = [];
	let used = 0;
	for (const card of cards) {
		if (card.width > width) return null;
		const next = used + (row.length > 0 ? CARD_GAP : 0) + card.width;
		if (row.length > 0 && next > width) {
			rows.push(row);
			row = [];
			used = 0;
		}
		used += (row.length > 0 ? CARD_GAP : 0) + card.width;
		row.push(card);
	}
	if (row.length > 0) rows.push(row);
	return rows;
}

/**
 * Every card, whole, as one row for a surface that flows them itself (the desktop's
 * `flexWrap`): its cells are the code font's, not the proportional text's, so a width in
 * cells over-counts what the text takes and pre-wrapping would leave half the band empty.
 *
 * @param f - Everything the cards draw from
 * @param now - `$.clock.now()`
 * @returns One row of every card, or none when there is nothing to show
 */
export function flow(f: Facts, now: number): Row[] {
	const cards = cardsAt(f, 0, now, true);
	return cards.length > 0 ? [cards] : [];
}

/**
 * Lays the cards out for a width. Cards flow as whole units onto as many rows as
 * `maxRows` allows; short of room every card abbreviates, level by level (path to its
 * last directory, shorter bars, resets and counts dropped); only when the most
 * abbreviated cards still do not fit does the least important card go, and the
 * abbreviation starts over.
 *
 * @param f - Everything the cards draw from
 * @param now - `$.clock.now()`
 * @param width - Cells available; the band's `bodyColumns`
 * @param maxRows - Rows the layout may take
 * @returns The rows to draw; empty when there is nothing to show
 */
export function layout(f: Facts, now: number, width: number, maxRows: number): Row[] {
	const all = cardsAt(f, 0, now);
	const pool = new Set(all.map((c) => c.id));
	const rank = new Map(all.map((c) => [c.id, c.importance]));
	while (pool.size > 0) {
		for (let level = 0; level <= MAX_LEVEL; level++) {
			const cards = cardsAt(f, level, now).filter((c) => pool.has(c.id));
			const rows = wrap(cards, width);
			if (rows && rows.length > 0 && rows.length <= maxRows) return rows;
		}
		const lowest = [...pool].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))[0];
		if (lowest === undefined) break;
		pool.delete(lowest);
	}
	return [];
}
