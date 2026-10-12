import type { TreeNode } from "./interfaces/tree.interface";

/** Cells one desktop SVG pixel-column group stands for (see `bar-svg.ts`). */
const CELL_PX = 8;

/** The children of a node, whatever shape they were drawn in. */
export const kids = (n: TreeNode): unknown[] =>
	Array.isArray(n.children) ? n.children : n.children === undefined ? [] : [n.children];

/** Whether a drawn value is an element. */
export const isNode = (v: unknown): v is TreeNode => typeof v === "object" && v !== null;

/** Every element of a tree, depth first. */
export const walk = (n: unknown): TreeNode[] =>
	isNode(n) ? [n, ...kids(n).flatMap((c) => walk(c))] : [];

/** The text under a node. */
export const texts = (n: unknown): string =>
	typeof n === "string" ? n : isNode(n) ? kids(n).map(texts).join("") : "";

/** Cells an item of a card takes: its text, or an Svg's pixels over the cell size. */
const cellsOf = (i: TreeNode): number =>
	i.type === "Svg" ? Number(i.props?.width ?? 0) / CELL_PX : [...texts(i)].length;

/**
 * Cells a drawn row takes: padding, gaps and items of each card, and the gaps between cards.
 *
 * @param row - A row Box
 * @param cardGap - Cells between two cards
 * @returns The width the row asks for
 */
export function drawnRowWidth(row: TreeNode, cardGap: number): number {
	const cards = kids(row).filter(isNode);
	const inner = cards.reduce((n, card) => {
		const items = kids(card).filter(isNode);
		const gaps = Number(card.props?.columnGap ?? 0) * Math.max(0, items.length - 1);
		const pad = 2 * Number(card.props?.paddingX ?? 0);
		return n + pad + gaps + items.reduce((m, i) => m + cellsOf(i), 0);
	}, 0);
	return inner + cardGap * Math.max(0, cards.length - 1);
}
