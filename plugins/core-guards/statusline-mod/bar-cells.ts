import type { BarItem, BarRun } from "./interfaces/card.interface";
import { THEME } from "./theme";

/** Left and right stubs, so a single bar's ends read as rounded. */
const CAP = { left: "╺", right: "╸" } as const;
const LINE = "━";
/** Upper half block: its foreground is the top stripe, its background the bottom one. */
const HALF = "▀";

/**
 * Cells a bar fills: proportional, never fewer than one so an empty window still shows its start.
 *
 * @param ratio - 0 to 1
 * @param width - Cells of the bar
 * @returns 1 to `width`
 */
export function fillCells(ratio: number, width: number): number {
	const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
	return Math.min(width, Math.max(1, Math.round(clamped * width)));
}

/** Same-colored neighbours merged into one run. */
function merge(runs: BarRun[]): BarRun[] {
	return runs.reduce<BarRun[]>((out, r) => {
		const last = out.at(-1);
		if (last && last.color === r.color && last.bg === r.bg) last.text += r.text;
		else out.push({ ...r });
		return out;
	}, []);
}

/**
 * The terminal's drawing of a bar. One stripe is a thin line with rounded stubs at both
 * ends; two stripes share one row, each cell an upper half block (top stripe in the
 * foreground, bottom stripe in the background).
 *
 * @param item - The bar
 * @returns Runs of cells to draw as nested Text
 */
export function barRuns(item: BarItem): BarRun[] {
	const [top, bottom] = item.rows;
	if (!top) return [];
	const topFill = fillCells(top.ratio, item.width);
	const color = (i: number): string => (i < topFill ? top.fill : THEME.track);
	if (!bottom) {
		return merge(
			Array.from({ length: item.width }, (_, i) => ({
				text:
					item.width >= 3 && i === 0
						? CAP.left
						: item.width >= 3 && i === item.width - 1
							? CAP.right
							: LINE,
				color: color(i),
			})),
		);
	}
	const bottomFill = fillCells(bottom.ratio, item.width);
	return merge(
		Array.from({ length: item.width }, (_, i) => ({
			text: HALF,
			color: color(i),
			bg: i < bottomFill ? bottom.fill : THEME.track,
		})),
	);
}
