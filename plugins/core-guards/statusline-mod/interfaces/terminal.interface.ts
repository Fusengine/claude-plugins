import type { Span } from "../types";

/** One statusline segment of the terminal: styled text that is never split across rows. */
export interface TermSegment {
	id: string;
	/** The engine's ordering key: lower comes first and stays longer. */
	priority: number;
	/** The line the engine puts it on; a line wraps on its own. */
	line: 1 | 2;
	spans: Span[];
	/** Cells the text takes. */
	width: number;
}

/** One drawn row of segments, joined by the separator. */
export type TermRow = TermSegment[];

/** What the terminal draws: the rows and the separator between two segments of a row. */
export interface TermLayout {
	rows: TermRow[];
	separator: Span[];
}
