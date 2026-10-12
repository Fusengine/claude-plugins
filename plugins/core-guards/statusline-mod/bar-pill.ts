import { fillCells } from "./bar-cells";
import type { BarItem } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** CSS pixels one cell stands for (the same scale as the slim bars). */
const CELL_PX = 4;
/** Height of the pill: about a line of text. */
const PILL_PX = 20;
/** Font size of the text centered over the pill, in CSS pixels. */
const FONT_PX = 12;
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
/** Average advance of one bold character at `FONT_PX` (SF Pro Bold, digits ~0.63em), in CSS pixels. */
const CHAR_PX = 7.3;
/** Room left and right of the text inside the pill, in CSS pixels. */
const PAD_PX = 12;

/**
 * Cells a pill needs to hold its text with a little room on each side: the pill
 * hugs the tokens instead of stretching past them.
 *
 * @param overlay - The text written over the pill
 * @returns The pill's width in cells
 */
export const pillCells = (overlay: string): number =>
	Math.ceil((overlay.length * CHAR_PX + 2 * PAD_PX) / CELL_PX);

/** The text safe inside markup. */
const escapeXml = (s: string): string =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Pixel size of a pill bar. */
export const pillSize = (item: BarItem): { width: number; height: number } => ({
	width: item.width * CELL_PX,
	height: PILL_PX,
});

/**
 * A thick pill bar with its text centered over it: a full-pill track, a full-pill fill on
 * the ratio (never thinner than a circle), the text in bold white. No script, only numbers,
 * the theme's colors and the escaped text enter the markup.
 *
 * @param item - The bar; its first row is drawn, `overlay` is the text
 * @returns An SVG document
 */
export function pillSource(item: BarItem): string {
	const { width, height } = pillSize(item);
	const row = item.rows[0];
	const fill = row
		? Math.max(height, (fillCells(row.ratio, item.width) / item.width) * width)
		: height;
	const rect = (w: number, color: string): string =>
		`<rect x="0" y="0" width="${w}" height="${height}" rx="${height / 2}" fill="${color}"/>`;
	const label = `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${FONT_PX}" font-weight="700" fill="${THEME.text}">${escapeXml(item.overlay ?? "")}</text>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rect(width, THEME.track)}${rect(fill, row?.fill ?? THEME.track)}${label}</svg>`;
}
