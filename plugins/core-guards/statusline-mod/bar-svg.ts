import { fillCells } from "./bar-cells";
import { pillSize, pillSource } from "./bar-pill";
import type { BarItem } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** CSS pixels one cell stands for; the desktop draws the SVG in pixels, not cells. */
const CELL_PX = 4;
const STRIPE_PX = 8;
const GAP_PX = 3;

/** Pixel size of a bar's drawing. */
export function svgSize(item: BarItem): { width: number; height: number } {
	if (item.overlay !== undefined) return pillSize(item);
	const n = item.rows.length;
	return { width: item.width * CELL_PX, height: n * STRIPE_PX + (n - 1) * GAP_PX };
}

/**
 * The desktop's drawing of a bar: slim stripes with real rounded ends, a track under
 * each fill. Only numbers and the theme's own hex colors enter the markup.
 *
 * @param item - The bar
 * @returns An SVG document
 */
export function svgSource(item: BarItem): string {
	if (item.overlay !== undefined) return pillSource(item);
	const { width, height } = svgSize(item);
	const stripes = item.rows.map((row, i) => {
		const y = i * (STRIPE_PX + GAP_PX);
		const fill = Math.max(STRIPE_PX, (fillCells(row.ratio, item.width) / item.width) * width);
		const rect = (w: number, color: string): string =>
			`<rect x="0" y="${y}" width="${w}" height="${STRIPE_PX}" rx="${STRIPE_PX / 2}" fill="${color}"/>`;
		return rect(width, THEME.track) + rect(fill, row.fill);
	});
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${stripes.join("")}</svg>`;
}
