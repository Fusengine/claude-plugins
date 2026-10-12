import type { Facts } from "./interfaces/card.interface";
import type { TermLayout, TermRow, TermSegment } from "./interfaces/terminal.interface";
import { decode } from "./sgr";
import { termSegments, widthOf } from "./segments-terminal";

/** The cache segment's last abbreviation level. */
const MAX_LEVEL = 2;

/** One line's segments flowed into rows, a segment never split; `null` when one is too wide. */
function wrap(segments: TermSegment[], width: number, gap: number): TermRow[] | null {
	const rows: TermRow[] = [];
	let row: TermSegment[] = [];
	let used = 0;
	for (const s of segments) {
		if (s.width > width) return null;
		const next = used + (row.length > 0 ? gap : 0) + s.width;
		if (row.length > 0 && next > width) {
			rows.push(row);
			row = [];
			used = 0;
		}
		used += (row.length > 0 ? gap : 0) + s.width;
		row.push(s);
	}
	if (row.length > 0) rows.push(row);
	return rows;
}

/** Both lines wrapped on their own, line 1 first; `null` when a segment does not fit. */
function rowsOf(segments: TermSegment[], width: number, gap: number): TermRow[] | null {
	const lines = [1, 2].map((n) => wrap(segments.filter((s) => s.line === n), width, gap));
	return lines.some((l) => l === null) ? null : lines.flatMap((l) => l ?? []);
}

/**
 * Lays the old statusline's segments out for a width: they flow as whole units, line 1 then
 * line 2 as the engine splits them, onto at most `maxRows` rows. Short of room the cache
 * segment abbreviates; only then does the least important segment (the highest priority
 * number) go, and the abbreviation starts over.
 *
 * @param f - Everything the cards draw from
 * @param width - Cells available; the band's `bodyColumns`
 * @param maxRows - Rows the layout may take
 * @returns The rows and the separator; no rows when nothing fits or the engine gave no segments
 */
export function terminalLayout(f: Facts, width: number, maxRows: number): TermLayout {
	const separator = decode(f.engine.terminal?.separator ?? "");
	const gap = widthOf(separator);
	const dropped = new Set<string>();
	for (;;) {
		for (let level = 0; level <= MAX_LEVEL; level++) {
			const all = termSegments(f, level).filter((s) => !dropped.has(s.id));
			const rows = rowsOf(all, width, gap);
			if (all.length === 0) return { rows: [], separator };
			if (rows && rows.length > 0 && rows.length <= maxRows) return { rows, separator };
		}
		const last = termSegments(f, MAX_LEVEL)
			.filter((s) => !dropped.has(s.id))
			.at(-1);
		if (!last) return { rows: [], separator };
		dropped.add(last.id);
	}
}
