import { pillCells } from "./bar-pill";
import { bar, makeCard, strong, text } from "./card";
import type { Card, Facts, Item, Span } from "./interfaces/card.interface";
import { capitalize, formatTokens, modelLabel } from "./labels";
import { contextColor, THEME } from "./theme";

/** Cells of the context bar at each level; 0 drops it. */
const BAR_AT = [10, 6, 4, 0, 0] as const;
/** Deepest level that still draws the pill bar carrying the tokens (desktop). */
const PILL_UNTIL = 2;

/** The model name and, while there is room, the effort level. */
function nameSpans(f: Facts, level: number): Span[] {
	const { flags } = f.engine;
	const spans: Span[] = [];
	const name = flags.model.enabled ? modelLabel(f.model) : "";
	if (name) spans.push(strong(name));
	if (level <= 2 && flags.effort && f.effort) {
		spans.push(strong(`${name ? " " : ""}${capitalize(f.effort)}`));
	}
	return spans;
}

/** `590.0K/1M`; the ceiling goes first when the room runs out. */
function tokensText(f: Facts, level: number): string {
	const { model } = f.engine.flags;
	const used = formatTokens(f.contextTokens, model.decimals);
	return model.maxTokens && level <= 1
		? `${used}/${formatTokens(f.contextWindow, model.decimals)}`
		: used;
}

/**
 * The model card: name, effort, context bar, tokens used over the window.
 *
 * @param f - Everything the cards draw from
 * @param level - Abbreviation level: the bar shortens, then the effort, ceiling and bar go
 * @param overlay - Desktop: the tokens are written over a thick pill bar, not beside a slim one
 * @returns The card, or `null` when model and context are switched off
 */
export function modelCard(f: Facts, level: number, overlay = false): Card | null {
	const { flags } = f.engine;
	const items: Item[] = [];
	const name = nameSpans(f, level);
	if (name.length > 0) items.push(text(...name));
	const tokens = flags.model.enabled && flags.model.tokens && level <= 3;
	const pill = overlay && tokens;
	const width = pill
		? level <= PILL_UNTIL
			? pillCells(tokensText(f, level))
			: 0
		: (BAR_AT[level] ?? 0);
	const shown = flags.context.enabled && flags.context.bar && width > 0;
	if (shown) {
		const pct = Math.round(f.contextPercent);
		const slim = bar(width, `context ${pct}%`, { ratio: pct / 100, fill: contextColor(pct) });
		items.push(pill ? { ...slim, overlay: tokensText(f, level) } : slim);
	}
	if (tokens && !(pill && shown)) {
		items.push(text({ text: tokensText(f, level), color: THEME.text, bold: pill && shown }));
	}
	return makeCard("model", 100, level, items);
}
