/**
 * Display width of a text in terminal cells (one cell per code point).
 *
 * @param text - Any text
 * @returns Its width
 */
export function cells(text: string): number {
	return [...text].length;
}

/**
 * Cuts a text to `max` cells with a trailing ellipsis.
 *
 * @param text - Any text
 * @param max - Cells allowed
 * @returns The text, unchanged when it fits
 */
export function ellipsize(text: string, max: number): string {
	const chars = [...text];
	if (chars.length <= max) return text;
	if (max <= 0) return "";
	return max === 1 ? "…" : `${chars.slice(0, max - 1).join("")}…`;
}
