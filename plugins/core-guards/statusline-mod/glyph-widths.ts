/**
 * Advance of each printable ASCII character (space to `~`) of the system UI font at 12 px,
 * measured on the desktop's font with `getComputedTextLength`: one list for the regular weight
 * and one for bold. A whole string measures a few percent under the sum (kerning, contextual
 * digits); `GLYPH_FIT` takes that back, kept a hair generous: on the owner's four reference
 * strings it lands within +2 px / -1 px of the measured width.
 */
const REGULAR =
	"3.7,3.7,5.7,7.6,7.6,11.1,8.5,3.6,4.6,4.6,5.7,7.6,3.6,5.7,3.6,3.7,7.6,5.6,7.3,7.5,7.7,7.4,7.6,6.8,7.7,7.6,3.6,3.6,7.6,7.6,7.6,6.2,11.0,8.1,7.9,8.6,8.7,7.2,6.9,9.0,8.9,3.2,6.5,7.9,6.8,10.5,8.9,9.3,7.6,9.3,7.8,7.7,7.6,8.9,8.1,11.6,8.2,7.9,8.0,4.6,3.7,4.6,7.6,7.0,6.0,6.6,7.4,6.7,7.4,6.9,4.3,7.3,7.1,3.0,3.0,6.5,3.0,10.5,7.0,7.1,7.3,7.3,4.6,6.3,4.4,7.0,6.5,9.3,6.3,6.5,6.5,4.6,3.1,4.6,7.6";
const BOLD =
	"4.3,4.3,6.8,8.1,8.1,12.4,8.9,4.2,5.2,5.2,5.8,8.1,4.2,5.8,4.2,4.0,8.2,6.1,7.7,8.0,8.3,8.0,8.2,7.3,8.3,8.2,4.2,4.2,8.1,8.1,8.1,6.7,11.1,8.8,8.3,8.9,9.0,7.5,7.2,9.1,9.4,3.8,7.2,8.5,7.1,10.9,9.2,9.5,8.1,9.5,8.3,8.1,7.9,9.1,8.7,12.1,8.8,8.5,8.1,5.2,4.0,5.2,8.1,7.5,6.0,7.1,7.8,7.1,7.8,7.2,4.9,7.8,7.6,3.5,3.5,7.2,3.5,11.2,7.5,7.4,7.8,7.8,5.2,6.8,5.0,7.5,7.0,10.2,7.0,7.2,6.8,5.2,3.6,5.2,8.1";

const TABLES = { regular: REGULAR.split(",").map(Number), bold: BOLD.split(",").map(Number) };

/** Factor from the sum of the glyphs to a whole string's measured width. */
const GLYPH_FIT = 0.98;
/** Advance of a character outside the table (a symbol, an emoji): wide on purpose. */
const WIDE_PX = 12;
/** The few non-ASCII characters the cards use as separators, as narrow as a period. */
const NARROW_EXTRA: Record<string, number> = { "·": 4.2 };

/**
 * The width a text takes in the desktop font at 12 px, a little generous for the glyphs
 * it does not know.
 *
 * @param text - Any text
 * @param bold - Whether it is drawn bold
 * @returns CSS pixels
 */
export function glyphWidth(text: string, bold: boolean): number {
	const table = bold ? TABLES.bold : TABLES.regular;
	const advance = (c: string): number =>
		table[c.charCodeAt(0) - 32] ?? NARROW_EXTRA[c] ?? WIDE_PX;
	const sum = [...text].reduce((n, c) => n + advance(c), 0);
	return sum * GLYPH_FIT;
}
