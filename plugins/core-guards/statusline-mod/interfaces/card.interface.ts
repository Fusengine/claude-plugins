import type { Span } from "../types";

export type {
	CacheFigures,
	EngineFacts,
	EngineLimits,
	ExtraCredits,
	Facts,
	Flags,
	RateWindow,
	Span,
} from "../types";

/** One stripe of a bar: how full it is and the color of its fill. */
export interface BarRow {
	ratio: number;
	fill: string;
}

/** Text in one or more styles. */
export interface TextItem {
	kind: "text";
	spans: Span[];
}

/** A slim bar of `width` cells; two rows are stacked in the height of one. */
export interface BarItem {
	kind: "bar";
	width: number;
	rows: BarRow[];
	/** What the bar says, for a reader that cannot see it. */
	label: string;
	/** Text centered over a thick pill bar (desktop): the bar then has one row and no side text. */
	overlay?: string;
}

/** Anything a card holds. */
export type Item = TextItem | BarItem;

/** One run of identical bar cells: its glyphs, foreground and, for stacked bars, background. */
export interface BarRun {
	text: string;
	color: string;
	bg?: string;
}

/** One chip on the bar: its items, drawn side by side, are never split across rows. */
export interface Card {
	id: string;
	/** Higher stays longer when the room runs out. */
	importance: number;
	/** Cells of padding on each side. */
	pad: number;
	/** Cells between two items. */
	gap: number;
	items: Item[];
	/** Cells the card takes, padding included. */
	width: number;
}

/** One drawn row of cards. */
export type Row = Card[];
